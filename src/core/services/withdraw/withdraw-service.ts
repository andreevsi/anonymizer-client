import BigNumber from 'bignumber.js';
import { OperationService } from '../operation-service';
import { IWalletStorage } from '../../../cli/models/i-wallet-storage';
import { KeysGenerator } from '../../snark-proof-generator/keys-generator';
import { SnarkProofGenerator } from '../../snark-proof-generator/snark-proof-generator';
import { Web3Service } from '../../../crypto/web3-service';
import { Wallet } from '../../../cli/models/wallet';
import { WithdrawArguments } from './withdraw-arguments';
import { WithdrawInput } from './withdraw-input';
import MerkleTree from '../../merkle-tree/merkle-tree';
import { RelayersRouter } from '../../../relayer-api/relayers-router';
import { HttpClient } from '../../../relayer-api/http-client';
import { EventsListener } from '../../../crypto/events-listener';

export class WithdrawService extends OperationService {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    private static maxBlockScanningCount = 200;

    private static wasmSubPath = '/withdraw/withdraw.wasm';

    private static zkeySubPath = '/withdraw/withdraw.zkey';

    protected snarkProofGenerator: SnarkProofGenerator;

    private relayersRouter: RelayersRouter;

    constructor(
        protected walletStorage: IWalletStorage,
        private web3Service: Web3Service,
        private tree: MerkleTree,
        protected keysGenerator: KeysGenerator = new KeysGenerator(),
        snarkProofGenerator?: SnarkProofGenerator,
        relayersRouter?: RelayersRouter
    ) {
        super();
        this.snarkProofGenerator =
            snarkProofGenerator ||
            new SnarkProofGenerator(
                OperationService.circuitsDistPath + WithdrawService.wasmSubPath,
                OperationService.circuitsDistPath + WithdrawService.zkeySubPath
            );
        this.relayersRouter = relayersRouter || new RelayersRouter(new HttpClient());
    }

    public async executeOperation(
        operationArguments: WithdrawArguments
    ): Promise<{ txHash: string; success: boolean }> {
        const {
            secret: secretNewSuccess,
            nullifier: nullifierNewSuccess
        } = this.keysGenerator.generateKeysPair();
        const {
            secret: secretNewFail,
            nullifier: nullifierNewFail
        } = this.keysGenerator.generateKeysPair();

        const relayer = await this.relayersRouter.getMostRelevantRelayer();

        const walletOld = await this.walletStorage.loadWallet();
        const path = await this.tree.updateAndGetPath(walletOld.commitment);

        const {
            ai_deltas,
            ai_list_old,
            ai_list_new_success,
            ai_list_new_fail
        } = this.getSignalsTokensLists(operationArguments, walletOld, relayer.fee);

        if (!walletOld.commitment || !walletOld.secret || !walletOld.nullifier) {
            throw new Error('Wallet is empty. You should firstly create wallet.');
        }

        const operationInput: WithdrawInput = {
            root: this.tree.currentRoot,
            concealer_old: walletOld.nullifier,
            fee: relayer.fee,
            recipient: operationArguments.recipient,
            relayer: relayer.address,
            ai_deltas,
            ai_list_old,
            ai_list_new_success,
            ai_list_new_fail,
            old_secret: walletOld.secret,
            new_secret_success: secretNewSuccess,
            new_secret_fail: secretNewFail,
            new_concealer_success: nullifierNewSuccess,
            new_concealer_fail: nullifierNewFail,
            pathElements: path.pathElements,
            pathIndices: path.pathIndexes
        };
        const snarkjsOutput = await this.snarkProofGenerator.generateProof(operationInput);

        await this.logOperationStart('Withdraw', operationInput, snarkjsOutput.publicSignals);

        const eventsListener = new EventsListener(
            WithdrawService.maxBlockScanningCount,
            this.web3Service
        );

        return new Promise((resolve, reject) => {
            const onCommitmentFind = async (commitment: string, txHash: string) => {
                const bnCommitment = new BigNumber(commitment.toLowerCase());
                const commitmentSuccess = snarkjsOutput.publicSignals[0].toLowerCase();
                const commitmentFail = snarkjsOutput.publicSignals[1].toLowerCase();

                if (!bnCommitment.eq(commitmentSuccess) && !bnCommitment.eq(commitmentFail)) {
                    await this.logOperationEnd(
                        'Withdraw',
                        false,
                        commitment,
                        null,
                        'Error while withdraw: commitment not match neither commitment success nor commitment fail.'
                    );
                    reject(
                        new Error(
                            `Error while withdraw: commitment not match neither commitment success nor commitment fail ${commitment}`
                        )
                    );
                }

                const operationsSuccess = bnCommitment.eq(commitmentSuccess);
                await this.logOperationEnd(
                    'Withdraw',
                    operationsSuccess,
                    bnCommitment.toFixed(0),
                    txHash
                );

                const wallet: Wallet = {
                    secret: operationsSuccess ? secretNewSuccess : secretNewFail,
                    nullifier: operationsSuccess ? nullifierNewSuccess : nullifierNewFail,
                    commitment: bnCommitment.toFixed(0),
                    tokensAmounts: walletOld.tokensAmounts.map((elem, index) => ({
                        token: elem.token,
                        amount: operationsSuccess
                            ? ai_list_new_success[index]
                            : ai_list_new_fail[index]
                    }))
                };
                await this.walletStorage.saveWallet(wallet);
                resolve({ txHash, success: operationsSuccess });
            };

            const onTimeoutEnd = async () => {
                await this.logOperationEnd(
                    'Swap',
                    false,
                    null,
                    null,
                    `No commitment event in ${WithdrawService.maxBlockScanningCount} blocks.
                     Wallet not modified, please check ${snarkjsOutput.publicSignals[0]} (commitment success) or ${snarkjsOutput.publicSignals[1]} (commitment fail) manually and update wallet.`
                );
                reject(
                    new Error(
                        `No commitment event in ${WithdrawService.maxBlockScanningCount} blocks.
                         Wallet not modified, please check ${snarkjsOutput.publicSignals[0]} (commitment success) or ${snarkjsOutput.publicSignals[1]} (commitment fail) manually and update wallet.`
                    )
                );
            };

            eventsListener
                .startScan(snarkjsOutput.publicSignals.slice(0, 2), {
                    onCommitmentFind,
                    onTimeoutEnd
                })
                .then(() =>
                    this.relayersRouter
                        .relay(relayer, { method: 'withdraw', ...snarkjsOutput })
                        .catch(async e => {
                            await eventsListener.stopScan();
                            await this.logOperationEnd('Withdraw', false, null, e);
                            reject(Error(`Error while withdraw: ${e}`));
                        })
                );
        });
    }

    private getSignalsTokensLists(
        operationArguments: WithdrawArguments,
        wallet: Wallet,
        fee: string
    ): {
        ai_deltas: string[];
        ai_list_old: string[];
        ai_list_new_success: string[];
        ai_list_new_fail: string[];
    } {
        const ai_deltas = operationArguments.tokensAmounts.map(tokenAmount => tokenAmount.amount);
        const ai_list_old = wallet.tokensAmounts.map(tokenAmount => tokenAmount.amount);
        const ai_list_new_success: string[] = [];
        const ai_list_new_fail: string[] = [];
        wallet.tokensAmounts.forEach((tokenAmount, index) => {
            if (index === 0) {
                ai_list_new_success[index] = new BigNumber(tokenAmount.amount)
                    .minus(ai_deltas[index])
                    .minus(fee)
                    .toFixed(0);
                ai_list_new_fail[index] = new BigNumber(tokenAmount.amount).minus(fee).toFixed(0);
                return;
            }
            ai_list_new_success[index] = new BigNumber(tokenAmount.amount)
                .minus(ai_deltas[index])
                .toFixed(0);
            ai_list_new_fail[index] = tokenAmount.amount;
        });

        return {
            ai_deltas,
            ai_list_old,
            ai_list_new_success,
            ai_list_new_fail
        };
    }
}
