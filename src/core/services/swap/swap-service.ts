import BigNumber from 'bignumber.js';
import { OperationService } from '../operation-service';
import { IWalletStorage } from '../../../cli/models/i-wallet-storage';
import { KeysGenerator } from '../../snark-proof-generator/keys-generator';
import { SnarkProofGenerator } from '../../snark-proof-generator/snark-proof-generator';
import { Web3Service } from '../../../crypto/web3-service';
import { Wallet } from '../../../cli/models/wallet';
import { SwapArguments } from './swap-arguments';
import { SwapInput } from './swap-input';
import MerkleTree from '../../merkle-tree/merkle-tree';
import { RelayersRouter } from '../../../relayer-api/relayers-router';
import { HttpClient } from '../../../relayer-api/http-client';
import { EventsListener } from '../../../crypto/events-listener';
import { TokenAmount } from '../../models/token-amount';

export class SwapService extends OperationService {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    public static maxBlockScanningCount = 200;

    private static slippagePercent = 2;

    private static wasmSubPath = '/swap/swap.wasm';

    private static zkeySubPath = '/swap/swap.zkey';

    protected snarkProofGenerator: SnarkProofGenerator;

    private relayersRouter: RelayersRouter;

    private eventsListener: EventsListener;

    constructor(
        protected walletStorage: IWalletStorage,
        private web3Service: Web3Service,
        private tree: MerkleTree,
        protected keysGenerator: KeysGenerator = new KeysGenerator(),
        snarkProofGenerator?: SnarkProofGenerator,
        relayersRouter?: RelayersRouter,
        eventsListener?: EventsListener
    ) {
        super();
        this.snarkProofGenerator =
            snarkProofGenerator ||
            new SnarkProofGenerator(
                OperationService.circuitsDistPath + SwapService.wasmSubPath,
                OperationService.circuitsDistPath + SwapService.zkeySubPath
            );
        this.relayersRouter = relayersRouter || new RelayersRouter(new HttpClient());
        this.eventsListener =
            eventsListener ||
            new EventsListener(SwapService.maxBlockScanningCount, this.web3Service);
    }

    public async executeOperation(
        operationArguments: SwapArguments
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

        this.checkWalletBalance(walletOld, relayer.fee, {
            token: operationArguments.fromToken,
            amount: operationArguments.fromAmount
        });

        const outputAmount = await this.web3Service.getUniwapOutput(
            operationArguments.fromToken.address,
            operationArguments.toToken.address,
            operationArguments.fromAmount
        );
        const outputMinimumAmount = outputAmount
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            .multipliedBy(1 - 0.01 * SwapService.slippagePercent)
            .toFixed(0);

        const path = await this.tree.updateAndGetPath(walletOld.commitment);
        const {
            ai_deltas,
            ai_list_old,
            ai_list_new_success,
            ai_list_new_fail
        } = this.getSignalsTokensLists(
            operationArguments,
            walletOld,
            outputMinimumAmount,
            relayer.fee
        );

        if (!walletOld.commitment || !walletOld.secret || !walletOld.nullifier) {
            throw new Error('Wallet is empty. You should firstly create wallet.');
        }

        const operationInput: SwapInput = {
            root: this.tree.currentRoot,
            concealer_old: walletOld.nullifier,
            fee: relayer.fee,
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

        await this.logOperationStart('Swap', operationInput, snarkjsOutput.publicSignals);

        return new Promise((resolve, reject) => {
            const onCommitmentFind = async (commitment: string, txHash: string) => {
                const bnCommitment = new BigNumber(commitment.toLowerCase());
                const commitmentSuccess = snarkjsOutput.publicSignals[0].toLowerCase();
                const commitmentFail = snarkjsOutput.publicSignals[1].toLowerCase();

                if (!bnCommitment.eq(commitmentSuccess) && !bnCommitment.eq(commitmentFail)) {
                    await this.logOperationEnd(
                        'Swap',
                        false,
                        commitment,
                        null,
                        'Error while swap: commitment not match neither commitment success nor commitment fail.'
                    );
                    reject(
                        new Error(
                            `Error while swap: commitment not match neither commitment success nor commitment fail ${commitment}`
                        )
                    );
                }

                const operationsSuccess = bnCommitment.eq(commitmentSuccess);
                await this.logOperationEnd(
                    'Swap',
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
                    `No commitment event in ${SwapService.maxBlockScanningCount} blocks.
                     Wallet not modified, please check ${snarkjsOutput.publicSignals[0]} (commitment success) or ${snarkjsOutput.publicSignals[1]} (commitment fail) manually and update wallet.`
                );
                reject(
                    new Error(
                        `No commitment event in ${SwapService.maxBlockScanningCount} blocks.
                         Wallet not modified, please check ${snarkjsOutput.publicSignals[0]} (commitment success) or ${snarkjsOutput.publicSignals[1]} (commitment fail) manually and update wallet.`
                    )
                );
            };

            this.eventsListener
                .startScan(snarkjsOutput.publicSignals.slice(0, 2), {
                    onCommitmentFind,
                    onTimeoutEnd
                })
                .then(() =>
                    this.relayersRouter
                        .relay(relayer, { method: 'swap', ...snarkjsOutput })
                        .catch(async e => {
                            await this.eventsListener.stopScan();
                            await this.logOperationEnd('Swap', false, null, e);
                            reject(Error(`Error while swap: ${e}`));
                        })
                );
        });
    }

    private getSignalsTokensLists(
        operationArguments: SwapArguments,
        wallet: Wallet,
        outputMinimumAmount: string,
        fee: string
    ): {
        ai_deltas: string[];
        ai_list_old: string[];
        ai_list_new_success: string[];
        ai_list_new_fail: string[];
    } {
        const ai_deltas = Array(wallet.tokensAmounts.length).fill('0');
        const fromTokenIndex = wallet.tokensAmounts.findIndex(
            elem => elem.token.address === operationArguments.fromToken.address
        );
        const toTokenIndex = wallet.tokensAmounts.findIndex(
            elem => elem.token.address === operationArguments.toToken.address
        );

        if (fromTokenIndex === -1 || toTokenIndex === -1) {
            throw new Error(
                `Token ${operationArguments.fromToken.symbol} or ${operationArguments.toToken.symbol} not found`
            );
        }
        ai_deltas[fromTokenIndex] = `-${operationArguments.fromAmount}`;
        ai_deltas[toTokenIndex] = outputMinimumAmount;

        const ai_list_old = wallet.tokensAmounts.map(tokenAmount => tokenAmount.amount);
        const ai_list_new_success: string[] = [];
        const ai_list_new_fail: string[] = [];
        wallet.tokensAmounts.forEach((tokenAmount, index) => {
            if (index === 0) {
                ai_list_new_success[index] = new BigNumber(tokenAmount.amount)
                    .plus(ai_deltas[index])
                    .minus(fee)
                    .toFixed(0);
                ai_list_new_fail[index] = new BigNumber(tokenAmount.amount).minus(fee).toFixed(0);
                return;
            }
            ai_list_new_success[index] = new BigNumber(tokenAmount.amount)
                .plus(ai_deltas[index])
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

    private checkWalletBalance(wallet: Wallet, fee: string, fromTokenAmount: TokenAmount): void {
        const fromTokenIndex = wallet.tokensAmounts.findIndex(
            tokenAmount => tokenAmount.token.address === fromTokenAmount.token.address
        );

        const fromTokenAmountCorrectness =
            Number(fromTokenAmount.amount) && new BigNumber(fromTokenAmount.amount).gt(0);

        if (fromTokenIndex === 0) {
            const hasEnoughFunds =
                fromTokenAmountCorrectness &&
                new BigNumber(wallet.tokensAmounts[0].amount)
                    .minus(fee)
                    .minus(fromTokenAmount.amount)
                    .gte(0);

            if (!hasEnoughFunds) {
                throw new Error(
                    `Insufficient ${wallet.tokensAmounts[0].token.symbol} funds to pay fee and swap`
                );
            }
        } else {
            const hasEnoughFunds =
                fromTokenAmountCorrectness &&
                new BigNumber(wallet.tokensAmounts[0].amount).minus(fee).gte(0) &&
                new BigNumber(wallet.tokensAmounts[fromTokenIndex].amount)
                    .minus(fromTokenAmount.amount)
                    .gte(0);
            if (!hasEnoughFunds) {
                throw new Error(
                    `Insufficient ${wallet.tokensAmounts[0].token.symbol} funds to pay fee or Insufficient ${wallet.tokensAmounts[fromTokenIndex].token.symbol} funds to swap`
                );
            }
        }
    }
}
