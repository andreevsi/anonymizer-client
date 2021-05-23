import BigNumber from 'bignumber.js';
import { OperationService } from '../operation-service';
import { IWalletStorage } from '../../../cli/models/i-wallet-storage';
import { KeysGenerator } from '../../snark-proof-generator/keys-generator';
import { SnarkProofGenerator } from '../../snark-proof-generator/snark-proof-generator';
import { Web3Service } from '../../../crypto/web3-service';
import { BalanceProvider } from '../balance-provider';
import { Wallet } from '../../../cli/models/wallet';
import { DepositArguments } from './deposit-arguments';
import { DepositInput } from './deposit-input';
import MerkleTree from '../../merkle-tree/merkle-tree';

export class DepositService extends OperationService {
    private static wasmSubPath = '/deposit/deposit.wasm';

    private static zkeySubPath = '/deposit/deposit.zkey';

    private balanceProvider: BalanceProvider;

    protected snarkProofGenerator: SnarkProofGenerator;

    constructor(
        protected walletStorage: IWalletStorage,
        private web3Service: Web3Service,
        private tree: MerkleTree,
        protected keysGenerator: KeysGenerator = new KeysGenerator(),
        snarkProofGenerator?: SnarkProofGenerator
    ) {
        super();
        this.snarkProofGenerator =
            snarkProofGenerator ||
            new SnarkProofGenerator(
                OperationService.circuitsDistPath + DepositService.wasmSubPath,
                OperationService.circuitsDistPath + DepositService.zkeySubPath
            );
        this.balanceProvider = new BalanceProvider(this.web3Service);
    }

    public async executeOperation(operationArguments: DepositArguments): Promise<string> {
        await this.balanceProvider.checkBalanceAndProvideAllowance(
            operationArguments.tokensAmounts
        );

        const {
            secret: secretNew,
            nullifier: nullifierNew
        } = this.keysGenerator.generateKeysPair();
        const walletOld = await this.walletStorage.loadWallet();
        const path = await this.tree.updateAndGetPath(walletOld.commitment);
        const ai_deltas = operationArguments.tokensAmounts.map(tokenAmount => tokenAmount.amount);
        const ai_list_old = walletOld.tokensAmounts.map(tokenAmount => tokenAmount.amount);
        const ai_list_new = walletOld.tokensAmounts.map((tokenAmount, index) =>
            new BigNumber(tokenAmount.amount)
                .plus(operationArguments.tokensAmounts[index].amount)
                .toFixed(0)
        );

        if (!walletOld.commitment || !walletOld.secret || !walletOld.nullifier) {
            throw new Error('Wallet is empty. You should firstly create wallet.');
        }

        const operationInput: DepositInput = {
            root: this.tree.currentRoot,
            concealer_old: walletOld.nullifier,
            ai_deltas,
            ai_list_old,
            ai_list_new,
            secret_old: walletOld.secret,
            secret_new: secretNew,
            concealer_new: nullifierNew,
            pathElements: path.pathElements,
            pathIndices: path.pathIndexes
        };
        const snarkjsOutput = await this.snarkProofGenerator.generateProof(operationInput);

        const rootCorrectness = await this.web3Service.checkRoot(operationInput.root);
        if (!rootCorrectness) {
            throw new Error(`Root ${operationInput.root} is not correct`);
        }

        await this.logOperationStart('Deposit', operationInput, snarkjsOutput.publicSignals);
        const solidityParameters = this.snarkProofGenerator.generateSolidityParameters(
            snarkjsOutput
        );

        const receipt = await this.web3Service.executeContractMethod(
            'deposit',
            solidityParameters,
            {
                value: operationArguments.tokensAmounts[0].amount
            }
        );

        const commitment = this.web3Service.getCommitmentFromReceipt(receipt);
        const operationsSuccess = receipt.status;
        await this.logOperationEnd(
            'Deposit',
            operationsSuccess,
            commitment.toFixed(0),
            receipt.transactionHash
        );

        if (!operationsSuccess && !commitment.isEqualTo(snarkjsOutput.publicSignals[1])) {
            throw Error(`Error while deposit. Commitments are not equal: 
                expected: ${snarkjsOutput.publicSignals[0]},
                but was ${commitment.toFixed(0)}
            `);
        }
        const wallet: Wallet = {
            secret: secretNew,
            nullifier: nullifierNew,
            commitment: commitment.toFixed(0),
            tokensAmounts: operationArguments.tokensAmounts.map((elem, index) => ({
                token: elem.token,
                amount: ai_list_new[index]
            }))
        };
        await this.walletStorage.saveWallet(wallet);
        return receipt.transactionHash;
    }
}
