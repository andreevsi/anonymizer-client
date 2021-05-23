/* eslint-disable @typescript-eslint/no-unused-vars,@typescript-eslint/no-magic-numbers */
import { Web3Service } from '../../../src/crypto/web3-service';
import { providerStub } from '../../stub/provider.stub';
import { buildTestTokenAmountsArray, TEST_TOKENS } from '../../tokens';
import {
    mockWeb3ServiceStub,
    MockWeb3ServiceStub,
    Web3ServiceStub
} from '../../stub/web3-service.stub';
import { SnarkjsOutput } from '../../../src/core/snark-proof-generator/models/snarkjs-output';
import { RecStringArray } from '../../../src/core/snark-proof-generator/models/rec-string-array';
import { Proof } from '../../../src/core/snark-proof-generator/models/proof';
import { KeysGenerator } from '../../../src/core/snark-proof-generator/keys-generator';
import {
    mockSnarkProofGeneratorStub,
    MockSnarkProofGeneratorStub,
    SnarkProofGeneratorStub
} from '../../stub/snark-proof-generator.stub';
import { SnarkProofGenerator } from '../../../src/core/snark-proof-generator/snark-proof-generator';
import { KeysPair } from '../../../src/core/snark-proof-generator/models/keys-pair';
import { mockWalletStorageStub, MockIWalletStorage } from '../../stub/wallet-storage.stub';
import Path from '../../../src/core/merkle-tree/models/path';
import { MerkleTreeStub, mockMerkleTree, MockMerkleTreeStub } from '../../stub/merkle-tree.stub';
import MerkleTree from '../../../src/core/merkle-tree/merkle-tree';
import { Wallet } from '../../../src/cli/models/wallet';
import { SwapService } from '../../../src/core/services/swap/swap-service';
import {
    mockRelayersRouterStub,
    MockRelayersRouterStub,
    RelayersRouterStub
} from '../../stub/relayers-router.stub';
import { RelayersRouter } from '../../../src/relayer-api/relayers-router';
import { EventsListener } from '../../../src/crypto/events-listener';
import {
    EventsListenerStub,
    mockEventsListenerStub,
    MockEventsListenerStub
} from '../../stub/events-listener.stub';
import { SwapInput } from '../../../src/core/services/swap/swap-input';

describe('withdraw', () => {
    const balances = {
        [TEST_TOKENS.ETH.address]: 20,
        [TEST_TOKENS.WEENUS.address]: 15,
        [TEST_TOKENS.YEENUS.address]: 25
    };

    const toAmountStub = {
        toAmount: 0
    };

    const snarkProofReturns: {
        snarkjsOutput: SnarkjsOutput;
        solidityParameters: RecStringArray[];
    } = {
        snarkjsOutput: {
            publicSignals: [],
            proof: {} as Proof
        },
        solidityParameters: [...Array(12 + Number(process.env.TOKENS_NUMBER))].map(
            (elem, index) => `param${index}`
        )
    };

    const treeReturns: {
        root: string;
        path: Path;
    } = {
        root: 'root',
        path: {
            pathElements: ['1', '2', '3', '4'],
            pathIndexes: [1, 0, 1, 0]
        }
    };

    const wallet: Wallet = {
        secret: 'secret',
        nullifier: 'nullifier',
        commitment: '4321',
        tokensAmounts: buildTestTokenAmountsArray(Object.values(balances))
    };

    const relevantRelayerStub = {
        relayer: {
            url: 'url',
            address: '0x123',
            fee: '1'
        }
    };

    const eventDataStub = {
        timeout: 1000,
        commitment: '',
        txHash: '',
        callOnTimeoutEnd: false
    };

    const secretSuccess = 'secretSuccess';
    const nullifierSuccess = 'nullifierSuccess';
    const secretFail = 'secretFail';
    const nullifierFail = 'nullifierFail';

    let swapService: SwapService;

    let web3Service: MockWeb3ServiceStub;

    let snarkProofGenerator: MockSnarkProofGeneratorStub;

    let walletStorageStub: MockIWalletStorage;

    let treeStub: MockMerkleTreeStub;

    let keysGeneratorStub: KeysGenerator;

    let relayersRouterStub: MockRelayersRouterStub;

    let eventsListenerStub: MockEventsListenerStub;

    beforeAll(async () => {
        await providerStub.init();
        jest.setTimeout(60000);
    });

    afterAll(() => {
        jest.setTimeout(5000);
    });

    beforeEach(() => {
        let firstKeysGeneration = true;
        keysGeneratorStub = {
            generateKeysPair(): KeysPair {
                if (firstKeysGeneration) {
                    firstKeysGeneration = false;
                    return { secret: secretSuccess, nullifier: nullifierSuccess };
                }
                return { secret: secretFail, nullifier: nullifierFail };
            }
        } as KeysGenerator;

        treeStub = mockMerkleTree(treeReturns);
        walletStorageStub = mockWalletStorageStub(wallet);
        web3Service = mockWeb3ServiceStub(null, null, null, null, ['root'], toAmountStub);
        snarkProofGenerator = mockSnarkProofGeneratorStub(snarkProofReturns);
        relayersRouterStub = mockRelayersRouterStub(relevantRelayerStub);
        eventsListenerStub = mockEventsListenerStub(eventDataStub);
        swapService = new SwapService(
            walletStorageStub,
            <Web3Service>(web3Service as Web3ServiceStub),
            <MerkleTree>(treeStub as MerkleTreeStub),
            keysGeneratorStub,
            <SnarkProofGenerator>(snarkProofGenerator as SnarkProofGeneratorStub),
            <RelayersRouter>(relayersRouterStub as RelayersRouterStub),
            <EventsListener>(eventsListenerStub as EventsListenerStub)
        );
    });

    it('should withdraw 5 wei and 3 weenus', async () => {
        const newCommitmentSuccess = '1234567890';
        const newCommitmentFail = '9234567890';

        const fromToken = TEST_TOKENS.ETH;
        const toToken = TEST_TOKENS.WEENUS;
        const amount = 5;
        toAmountStub.toAmount = 3;
        const ai_deltas = [-amount, toAmountStub.toAmount]
            .concat(Array(98).fill(0))
            .map(x => x.toString());

        snarkProofReturns.snarkjsOutput.publicSignals[0] = newCommitmentSuccess;
        snarkProofReturns.snarkjsOutput.publicSignals[1] = newCommitmentFail;

        const txHash = '0x123456789';

        const operationInput: SwapInput = {
            root: treeReturns.root,
            concealer_old: wallet.nullifier,
            fee: relevantRelayerStub.relayer.fee,
            relayer: relevantRelayerStub.relayer.address,
            ai_deltas,
            ai_list_old: wallet.tokensAmounts.map(elem => elem.amount),
            ai_list_new_success: wallet.tokensAmounts.map((elem, index) => {
                if (index === 0) {
                    return (
                        Number(elem.amount) +
                        Number(ai_deltas[index]) -
                        Number(relevantRelayerStub.relayer.fee)
                    ).toString();
                }
                return (Number(elem.amount) + Number(ai_deltas[index])).toString();
            }),
            ai_list_new_fail: wallet.tokensAmounts.map((elem, index) =>
                index === 0
                    ? (Number(elem.amount) - Number(relevantRelayerStub.relayer.fee)).toString()
                    : elem.amount
            ),
            old_secret: wallet.secret,
            new_secret_success: secretSuccess,
            new_secret_fail: secretFail,
            new_concealer_success: nullifierSuccess,
            new_concealer_fail: nullifierFail,
            pathElements: treeReturns.path.pathElements,
            pathIndices: treeReturns.path.pathIndexes
        };

        eventDataStub.commitment = newCommitmentSuccess;
        eventDataStub.txHash = txHash;

        await swapService.executeOperation({ fromToken, toToken, fromAmount: amount.toString() });

        expect(treeStub.updateAndGetPath.mock.calls.length).toBe(1);

        expect(snarkProofGenerator.generateProof.mock.calls.length).toBe(1);
        expect(snarkProofGenerator.generateProof.mock.calls[0][0]).toEqual(operationInput);
        expect(snarkProofGenerator.generateSolidityParameters.mock.calls.length).toBe(0);

        expect(web3Service.getUniwapOutput.mock.calls.length).toBe(1);
        expect(web3Service.getUniwapOutput.mock.calls[0]).toEqual([
            fromToken.address,
            toToken.address,
            amount.toString()
        ]);
        expect(web3Service.executeContractMethod.mock.calls.length).toBe(0);
        expect(web3Service.checkRoot.mock.calls.length).toBe(0);

        expect(relayersRouterStub.getMostRelevantRelayer.mock.calls.length).toBe(1);
        expect(relayersRouterStub.relay.mock.calls.length).toBe(1);
        expect(relayersRouterStub.relay.mock.calls[0]).toEqual([
            relevantRelayerStub.relayer,
            {
                method: 'swap',
                proof: snarkProofReturns.snarkjsOutput.proof,
                publicSignals: snarkProofReturns.snarkjsOutput.publicSignals
            }
        ]);

        expect(eventsListenerStub.startScan.mock.calls.length).toBe(1);
        expect(eventsListenerStub.startScan.mock.calls[0][0]).toEqual([
            newCommitmentSuccess,
            newCommitmentFail
        ]);
        expect(eventsListenerStub.stopScan.mock.calls.length).toBe(0);

        expect(walletStorageStub.loadWallet.mock.calls.length).toBe(1);
        expect(walletStorageStub.saveWallet.mock.calls.length).toBe(1);
        expect(walletStorageStub.saveWallet.mock.calls[0][0]).toEqual({
            secret: secretSuccess,
            nullifier: nullifierSuccess,
            commitment: newCommitmentSuccess,
            tokensAmounts: wallet.tokensAmounts.map((elem, index) => ({
                ...elem,
                amount: operationInput.ai_list_new_success[index]
            }))
        });

        expect(walletStorageStub.logHistory.mock.calls.length).toBe(2);
        expect(walletStorageStub.logHistory.mock.calls[0][0].slice(26)).toEqual(
            `- [start] - Swap
    operation input: ${JSON.stringify(operationInput)}                
    public signals: ${JSON.stringify(snarkProofReturns.snarkjsOutput.publicSignals)}

`
        );
        expect(walletStorageStub.logHistory.mock.calls[1][0].slice(26)).toEqual(
            `- [end] - Swap
    success: true
    commitment: ${newCommitmentSuccess}
    transaction hash: ${txHash}
    
`
        );
    });

    it('should handle failed withdraw', async () => {
        const newCommitmentSuccess = '1234567890';
        const newCommitmentFail = '9234567890';

        const fromToken = TEST_TOKENS.ETH;
        const toToken = TEST_TOKENS.WEENUS;
        const amount = 5;
        toAmountStub.toAmount = 3;
        const ai_deltas = [-amount, toAmountStub.toAmount]
            .concat(Array(98).fill(0))
            .map(x => x.toString());

        snarkProofReturns.snarkjsOutput.publicSignals[0] = newCommitmentSuccess;
        snarkProofReturns.snarkjsOutput.publicSignals[1] = newCommitmentFail;

        const txHash = '0x123456789';

        const operationInput: SwapInput = {
            root: treeReturns.root,
            concealer_old: wallet.nullifier,
            fee: relevantRelayerStub.relayer.fee,
            relayer: relevantRelayerStub.relayer.address,
            ai_deltas,
            ai_list_old: wallet.tokensAmounts.map(elem => elem.amount),
            ai_list_new_success: wallet.tokensAmounts.map((elem, index) => {
                if (index === 0) {
                    return (
                        Number(elem.amount) +
                        Number(ai_deltas[index]) -
                        Number(relevantRelayerStub.relayer.fee)
                    ).toString();
                }
                return (Number(elem.amount) + Number(ai_deltas[index])).toString();
            }),
            ai_list_new_fail: wallet.tokensAmounts.map((elem, index) =>
                index === 0
                    ? (Number(elem.amount) - Number(relevantRelayerStub.relayer.fee)).toString()
                    : elem.amount
            ),
            old_secret: wallet.secret,
            new_secret_success: secretSuccess,
            new_secret_fail: secretFail,
            new_concealer_success: nullifierSuccess,
            new_concealer_fail: nullifierFail,
            pathElements: treeReturns.path.pathElements,
            pathIndices: treeReturns.path.pathIndexes
        };

        eventDataStub.commitment = newCommitmentFail; // failed swap
        eventDataStub.txHash = txHash;

        await swapService.executeOperation({ fromToken, toToken, fromAmount: amount.toString() });

        expect(treeStub.updateAndGetPath.mock.calls.length).toBe(1);

        expect(snarkProofGenerator.generateProof.mock.calls.length).toBe(1);
        expect(snarkProofGenerator.generateProof.mock.calls[0][0]).toEqual(operationInput);
        expect(snarkProofGenerator.generateSolidityParameters.mock.calls.length).toBe(0);

        expect(web3Service.getUniwapOutput.mock.calls.length).toBe(1);
        expect(web3Service.getUniwapOutput.mock.calls[0]).toEqual([
            fromToken.address,
            toToken.address,
            amount.toString()
        ]);
        expect(web3Service.executeContractMethod.mock.calls.length).toBe(0);
        expect(web3Service.checkRoot.mock.calls.length).toBe(0);

        expect(relayersRouterStub.getMostRelevantRelayer.mock.calls.length).toBe(1);
        expect(relayersRouterStub.relay.mock.calls.length).toBe(1);
        expect(relayersRouterStub.relay.mock.calls[0]).toEqual([
            relevantRelayerStub.relayer,
            {
                method: 'swap',
                proof: snarkProofReturns.snarkjsOutput.proof,
                publicSignals: snarkProofReturns.snarkjsOutput.publicSignals
            }
        ]);

        expect(eventsListenerStub.startScan.mock.calls.length).toBe(1);
        expect(eventsListenerStub.startScan.mock.calls[0][0]).toEqual([
            newCommitmentSuccess,
            newCommitmentFail
        ]);
        expect(eventsListenerStub.stopScan.mock.calls.length).toBe(0);

        expect(walletStorageStub.loadWallet.mock.calls.length).toBe(1);
        expect(walletStorageStub.saveWallet.mock.calls.length).toBe(1);
        expect(walletStorageStub.saveWallet.mock.calls[0][0]).toEqual({
            secret: secretFail,
            nullifier: nullifierFail,
            commitment: newCommitmentFail,
            tokensAmounts: wallet.tokensAmounts.map((elem, index) => ({
                ...elem,
                amount: operationInput.ai_list_new_fail[index]
            }))
        });

        expect(walletStorageStub.logHistory.mock.calls.length).toBe(2);
        expect(walletStorageStub.logHistory.mock.calls[0][0].slice(26)).toEqual(
            `- [start] - Swap
    operation input: ${JSON.stringify(operationInput)}                
    public signals: ${JSON.stringify(snarkProofReturns.snarkjsOutput.publicSignals)}

`
        );
        expect(walletStorageStub.logHistory.mock.calls[1][0].slice(26)).toEqual(
            `- [end] - Swap
    success: false
    commitment: ${newCommitmentFail}
    transaction hash: ${txHash}
    
`
        );
    });

    it('should throw insufficient funds error when has no ETH to pay fee', async () => {
        const amount = +wallet.tokensAmounts[0].amount;
        relevantRelayerStub.relayer.fee = '1';

        const fromToken = TEST_TOKENS.ETH;
        const toToken = TEST_TOKENS.WEENUS;

        await expect(() =>
            swapService.executeOperation({ fromToken, toToken, fromAmount: amount.toString() })
        ).rejects.toThrow(`Insufficient ${fromToken.symbol} funds to pay fee and swap`);

        expect(treeStub.updateAndGetPath.mock.calls.length).toBe(0);
        expect(snarkProofGenerator.generateProof.mock.calls.length).toBe(0);

        expect(web3Service.getUniwapOutput.mock.calls.length).toBe(0);

        expect(relayersRouterStub.getMostRelevantRelayer.mock.calls.length).toBe(1);
        expect(relayersRouterStub.relay.mock.calls.length).toBe(0);

        expect(eventsListenerStub.startScan.mock.calls.length).toBe(0);
        expect(eventsListenerStub.stopScan.mock.calls.length).toBe(0);

        expect(walletStorageStub.loadWallet.mock.calls.length).toBe(1);
        expect(walletStorageStub.saveWallet.mock.calls.length).toBe(0);

        expect(walletStorageStub.logHistory.mock.calls.length).toBe(0);
    });

    it('should throw insufficient funds error when has not enough tokens to withdraw', async () => {
        const fromToken = TEST_TOKENS.WEENUS;
        const toToken = TEST_TOKENS.ETH;

        const amount =
            +wallet.tokensAmounts.find(
                tokenAmount => tokenAmount.token.address === fromToken.address
            ).amount + 1;

        await expect(() =>
            swapService.executeOperation({ fromToken, toToken, fromAmount: amount.toString() })
        ).rejects.toThrow(
            `Insufficient ${TEST_TOKENS.ETH.symbol} funds to pay fee or Insufficient ${fromToken.symbol} funds to swap`
        );

        expect(treeStub.updateAndGetPath.mock.calls.length).toBe(0);
        expect(snarkProofGenerator.generateProof.mock.calls.length).toBe(0);

        expect(web3Service.getUniwapOutput.mock.calls.length).toBe(0);

        expect(relayersRouterStub.getMostRelevantRelayer.mock.calls.length).toBe(1);
        expect(relayersRouterStub.relay.mock.calls.length).toBe(0);

        expect(eventsListenerStub.startScan.mock.calls.length).toBe(0);
        expect(eventsListenerStub.stopScan.mock.calls.length).toBe(0);

        expect(walletStorageStub.loadWallet.mock.calls.length).toBe(1);
        expect(walletStorageStub.saveWallet.mock.calls.length).toBe(0);

        expect(walletStorageStub.logHistory.mock.calls.length).toBe(0);
    });

    it('should throw insufficient funds error when has enough tokens to withdraw but not enough ETH to pay fee', async () => {
        const fromToken = TEST_TOKENS.WEENUS;
        const toToken = TEST_TOKENS.ETH;

        const amount = +wallet.tokensAmounts.find(
            tokenAmount => tokenAmount.token.address === fromToken.address
        ).amount;
        relevantRelayerStub.relayer.fee = (Number(wallet.tokensAmounts[0].amount) + 1).toString();

        await expect(() =>
            swapService.executeOperation({ fromToken, toToken, fromAmount: amount.toString() })
        ).rejects.toThrow(
            `Insufficient ${TEST_TOKENS.ETH.symbol} funds to pay fee or Insufficient ${fromToken.symbol} funds to swap`
        );

        expect(treeStub.updateAndGetPath.mock.calls.length).toBe(0);
        expect(snarkProofGenerator.generateProof.mock.calls.length).toBe(0);

        expect(web3Service.getUniwapOutput.mock.calls.length).toBe(0);

        expect(relayersRouterStub.getMostRelevantRelayer.mock.calls.length).toBe(1);
        expect(relayersRouterStub.relay.mock.calls.length).toBe(0);

        expect(eventsListenerStub.startScan.mock.calls.length).toBe(0);
        expect(eventsListenerStub.stopScan.mock.calls.length).toBe(0);

        expect(walletStorageStub.loadWallet.mock.calls.length).toBe(1);
        expect(walletStorageStub.saveWallet.mock.calls.length).toBe(0);

        expect(walletStorageStub.logHistory.mock.calls.length).toBe(0);

        relevantRelayerStub.relayer.fee = '1';
    });

    it('should handle timeout end error', async () => {
        const newCommitmentSuccess = '1234567890';
        const newCommitmentFail = '9234567890';

        const fromToken = TEST_TOKENS.ETH;
        const toToken = TEST_TOKENS.WEENUS;
        const amount = 5;
        toAmountStub.toAmount = 3;
        const ai_deltas = [-amount, toAmountStub.toAmount]
            .concat(Array(98).fill(0))
            .map(x => x.toString());

        snarkProofReturns.snarkjsOutput.publicSignals[0] = newCommitmentSuccess;
        snarkProofReturns.snarkjsOutput.publicSignals[1] = newCommitmentFail;

        const txHash = '0x123456789';

        const operationInput: SwapInput = {
            root: treeReturns.root,
            concealer_old: wallet.nullifier,
            fee: relevantRelayerStub.relayer.fee,
            relayer: relevantRelayerStub.relayer.address,
            ai_deltas,
            ai_list_old: wallet.tokensAmounts.map(elem => elem.amount),
            ai_list_new_success: wallet.tokensAmounts.map((elem, index) => {
                if (index === 0) {
                    return (
                        Number(elem.amount) +
                        Number(ai_deltas[index]) -
                        Number(relevantRelayerStub.relayer.fee)
                    ).toString();
                }
                return (Number(elem.amount) + Number(ai_deltas[index])).toString();
            }),
            ai_list_new_fail: wallet.tokensAmounts.map((elem, index) =>
                index === 0
                    ? (Number(elem.amount) - Number(relevantRelayerStub.relayer.fee)).toString()
                    : elem.amount
            ),
            old_secret: wallet.secret,
            new_secret_success: secretSuccess,
            new_secret_fail: secretFail,
            new_concealer_success: nullifierSuccess,
            new_concealer_fail: nullifierFail,
            pathElements: treeReturns.path.pathElements,
            pathIndices: treeReturns.path.pathIndexes
        };

        eventDataStub.callOnTimeoutEnd = true;

        await expect(() =>
            swapService.executeOperation({ fromToken, toToken, fromAmount: amount.toString() })
        ).rejects.toThrow(
            `No commitment event in ${SwapService.maxBlockScanningCount} blocks.
                         Wallet not modified, please check ${newCommitmentSuccess} (commitment success) or ${newCommitmentFail} (commitment fail) manually and update wallet.`
        );

        expect(treeStub.updateAndGetPath.mock.calls.length).toBe(1);

        expect(snarkProofGenerator.generateProof.mock.calls.length).toBe(1);
        expect(snarkProofGenerator.generateProof.mock.calls[0][0]).toEqual(operationInput);
        expect(snarkProofGenerator.generateSolidityParameters.mock.calls.length).toBe(0);

        expect(web3Service.getUniwapOutput.mock.calls.length).toBe(1);
        expect(web3Service.getUniwapOutput.mock.calls[0]).toEqual([
            fromToken.address,
            toToken.address,
            amount.toString()
        ]);
        expect(web3Service.executeContractMethod.mock.calls.length).toBe(0);
        expect(web3Service.checkRoot.mock.calls.length).toBe(0);

        expect(relayersRouterStub.getMostRelevantRelayer.mock.calls.length).toBe(1);
        expect(relayersRouterStub.relay.mock.calls.length).toBe(1);
        expect(relayersRouterStub.relay.mock.calls[0]).toEqual([
            relevantRelayerStub.relayer,
            {
                method: 'swap',
                proof: snarkProofReturns.snarkjsOutput.proof,
                publicSignals: snarkProofReturns.snarkjsOutput.publicSignals
            }
        ]);

        expect(eventsListenerStub.startScan.mock.calls.length).toBe(1);
        expect(eventsListenerStub.startScan.mock.calls[0][0]).toEqual([
            newCommitmentSuccess,
            newCommitmentFail
        ]);
        expect(eventsListenerStub.stopScan.mock.calls.length).toBe(0);

        expect(walletStorageStub.loadWallet.mock.calls.length).toBe(1);
        expect(walletStorageStub.saveWallet.mock.calls.length).toBe(0);

        expect(walletStorageStub.logHistory.mock.calls.length).toBe(2);
        expect(walletStorageStub.logHistory.mock.calls[0][0].slice(26)).toEqual(
            `- [start] - Swap
    operation input: ${JSON.stringify(operationInput)}                
    public signals: ${JSON.stringify(snarkProofReturns.snarkjsOutput.publicSignals)}

`
        );
        expect(walletStorageStub.logHistory.mock.calls[1][0].slice(26)).toEqual(
            `- [end] - Swap
    success: false
    
    
    No commitment event in ${SwapService.maxBlockScanningCount} blocks.
                     Wallet not modified, please check ${newCommitmentSuccess} (commitment success) or ${newCommitmentFail} (commitment fail) manually and update wallet.
`
        );
    });
});
