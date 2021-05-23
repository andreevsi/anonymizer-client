import { OperationService } from '../operation-service';
import { IWalletStorage } from '../../../cli/models/i-wallet-storage';
import { CreateWalletArguments } from './create-wallet-arguments';
import { CreateWalletInput } from './create-wallet-input';
import { KeysGenerator } from '../../snark-proof-generator/keys-generator';
import { SnarkProofGenerator } from '../../snark-proof-generator/snark-proof-generator';
import { Web3Service } from '../../../crypto/web3-service';
import { BalanceProvider } from '../balance-provider';
import { Wallet } from '../../../cli/models/wallet';

export class CreateWalletService extends OperationService {
    private static wasmSubPath = '/create-wallet/create-wallet.wasm';

    private static zkeySubPath = '/create-wallet/create-wallet.zkey';

    private balanceProvider: BalanceProvider;

    protected snarkProofGenerator: SnarkProofGenerator;

    constructor(
        protected walletStorage: IWalletStorage,
        private web3Service: Web3Service,
        protected keysGenerator: KeysGenerator = new KeysGenerator(),
        snarkProofGenerator?: SnarkProofGenerator
    ) {
        super();
        this.snarkProofGenerator =
            snarkProofGenerator ||
            new SnarkProofGenerator(
                OperationService.circuitsDistPath + CreateWalletService.wasmSubPath,
                OperationService.circuitsDistPath + CreateWalletService.zkeySubPath
            );
        this.balanceProvider = new BalanceProvider(this.web3Service);
    }

    public async executeOperation(operationArguments: CreateWalletArguments): Promise<string> {
        await this.balanceProvider.checkBalanceAndProvideAllowance(
            operationArguments.tokensAmounts
        );

        const { secret, nullifier } = this.keysGenerator.generateKeysPair();
        const operationInput: CreateWalletInput = {
            secret,
            concealer: nullifier,
            ai_list: operationArguments.tokensAmounts.map(tokenAmount => tokenAmount.amount)
        };
        const snarkjsOutput = await this.snarkProofGenerator.generateProof(operationInput);

        const solidityParameters = this.snarkProofGenerator.generateSolidityParameters(
            snarkjsOutput
        );

        await this.logOperationStart('Create wallet', operationInput, snarkjsOutput.publicSignals);

        const receipt = await this.web3Service.executeContractMethod(
            'createWallet',
            solidityParameters,
            {
                value: operationArguments.tokensAmounts[0].amount
            }
        );

        const commitment = this.web3Service.getCommitmentFromReceipt(receipt);
        const commitmentsEquality = commitment.isEqualTo(snarkjsOutput.publicSignals[0]);
        await this.logOperationEnd(
            'Create wallet',
            commitmentsEquality,
            commitment.toFixed(0),
            receipt.transactionHash
        );

        if (!commitmentsEquality) {
            throw Error(`Error while creating wallet. Commitments are not equal:
                expected: ${snarkjsOutput.publicSignals[0]},
                but was ${commitment.toFixed(0)}`);
        }
        const wallet: Wallet = {
            secret,
            nullifier,
            commitment: commitment.toFixed(0),
            tokensAmounts: operationArguments.tokensAmounts
        };
        await this.walletStorage.saveWallet(wallet);
        return receipt.transactionHash;
    }
}
