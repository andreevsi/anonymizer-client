/* eslint-disable @typescript-eslint/no-unused-vars,@typescript-eslint/no-magic-numbers */
import { TransactionReceipt } from 'web3-eth';
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
import { DepositService } from '../../../src/core/services/deposit-service/deposit-service';
import MerkleTree from '../../../src/core/merkle-tree/merkle-tree';
import { Wallet } from '../../../src/cli/models/wallet';

describe('deposit', () => {
    const ethBalance = 10;

    const balances = {
        [TEST_TOKENS.WEENUS.address]: 15,
        [TEST_TOKENS.YEENUS.address]: 25
    };

    const allowances = {
        [TEST_TOKENS.WEENUS.address]: 17,
        [TEST_TOKENS.YEENUS.address]: 3
    };

    const receipt: TransactionReceipt = ({
        transactionHash: 'transactionHash',
        events: {
            Commitment: {
                returnValues: {
                    commitment: ''
                }
            }
        }
    } as unknown) as TransactionReceipt;

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
        tokensAmounts: buildTestTokenAmountsArray([3, 2])
    };

    const secretSuccess = 'secretSuccess';
    const nullifierSuccess = 'nullifierSuccess';
    const secretFail = 'secretFail';
    const nullifierFail = 'nullifierFail';

    let depositService: DepositService;

    let web3Service: MockWeb3ServiceStub;

    let snarkProofGenerator: MockSnarkProofGeneratorStub;

    let walletStorageStub: MockIWalletStorage;

    let treeStub: MockMerkleTreeStub;

    let keysGeneratorStub: KeysGenerator;

    beforeAll(async () => {
        await providerStub.init();
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
        web3Service = mockWeb3ServiceStub(ethBalance, balances, allowances, receipt, ['root']);
        snarkProofGenerator = mockSnarkProofGeneratorStub(snarkProofReturns);
        depositService = new DepositService(
            walletStorageStub,
            <Web3Service>(web3Service as Web3ServiceStub),
            <MerkleTree>(treeStub as MerkleTreeStub),
            keysGeneratorStub,
            <SnarkProofGenerator>(snarkProofGenerator as SnarkProofGeneratorStub)
        );
    });

    it('should successful deposit with 5 wei and 4 weenus', async () => {
        const newCommitmentSuccess = '1234567890';
        const newCommitmentFail = '9234567890';

        const tokensValues = ['5', '4'];
        const tokensAmounts = buildTestTokenAmountsArray(tokensValues);

        snarkProofReturns.snarkjsOutput.publicSignals[0] = newCommitmentSuccess;
        snarkProofReturns.snarkjsOutput.publicSignals[1] = newCommitmentFail;
        receipt.events.Commitment.returnValues.commitment = newCommitmentSuccess;

        const operationInput = {
            root: treeReturns.root,
            concealer_old: wallet.nullifier,
            ai_deltas: tokensAmounts.map(elem => elem.amount),
            ai_list_old: wallet.tokensAmounts.map(elem => elem.amount),
            ai_list_new_success: wallet.tokensAmounts.map((elem, index) =>
                (Number(elem.amount) + Number(tokensAmounts[index].amount)).toString()
            ),
            old_secret: wallet.secret,
            new_secret_success: secretSuccess,
            new_secret_fail: secretFail,
            new_concealer_success: nullifierSuccess,
            new_concealer_fail: nullifierFail,
            pathElements: treeReturns.path.pathElements,
            pathIndices: treeReturns.path.pathIndexes
        };

        await depositService.executeOperation({ tokensAmounts });

        expect(treeStub.updateAndGetPath.mock.calls.length).toBe(1);

        expect(snarkProofGenerator.generateProof.mock.calls.length).toBe(1);
        expect(snarkProofGenerator.generateProof.mock.calls[0][0]).toEqual(operationInput);
        expect(snarkProofGenerator.generateSolidityParameters.mock.calls.length).toBe(1);
        expect(snarkProofGenerator.generateSolidityParameters.mock.calls[0][0]).toEqual(
            snarkProofReturns.snarkjsOutput
        );

        expect(web3Service.executeContractMethod.mock.calls.length).toBe(1);
        expect(web3Service.executeContractMethod.mock.calls[0]).toEqual([
            'deposit',
            snarkProofReturns.solidityParameters,
            {
                value: tokensValues[0]
            }
        ]);
        expect(web3Service.getCommitmentFromReceipt.mock.calls.length).toBe(1);
        expect(web3Service.getCommitmentFromReceipt.mock.calls[0][0]).toEqual(receipt);
        expect(web3Service.checkRoot.mock.calls.length).toBe(1);
        expect(web3Service.checkRoot.mock.calls[0][0]).toBe(treeReturns.root);

        expect(walletStorageStub.loadWallet.mock.calls.length).toBe(1);
        expect(walletStorageStub.saveWallet.mock.calls.length).toBe(1);
        expect(walletStorageStub.saveWallet.mock.calls[0][0]).toEqual({
            secret: secretSuccess,
            nullifier: nullifierSuccess,
            commitment: newCommitmentSuccess,
            tokensAmounts: tokensAmounts.map((elem, index) => ({
                ...elem,
                amount: operationInput.ai_list_new_success[index]
            }))
        });

        expect(walletStorageStub.logHistory.mock.calls.length).toBe(2);
        expect(walletStorageStub.logHistory.mock.calls[0][0].slice(26)).toEqual(
            `- [start] - Deposit
    operation input: ${JSON.stringify(operationInput)}                
    public signals: ${JSON.stringify(snarkProofReturns.snarkjsOutput.publicSignals)}

`
        );
        expect(walletStorageStub.logHistory.mock.calls[1][0].slice(26)).toEqual(
            `- [end] - Deposit
    success: true
    commitment: ${newCommitmentSuccess}
    transaction hash: ${receipt.transactionHash}

`
        );
    });

    it('should fail deposit', async () => {
        const newCommitmentSuccess = '1234567890';
        const newCommitmentFail = '9234567890';

        const tokensValues = ['5', '4'];
        const tokensAmounts = buildTestTokenAmountsArray(tokensValues);

        snarkProofReturns.snarkjsOutput.publicSignals[0] = newCommitmentSuccess;
        snarkProofReturns.snarkjsOutput.publicSignals[1] = newCommitmentFail;
        receipt.events.Commitment.returnValues.commitment = newCommitmentFail; // operations failed

        const operationInput = {
            root: treeReturns.root,
            concealer_old: wallet.nullifier,
            ai_deltas: tokensAmounts.map(elem => elem.amount),
            ai_list_old: wallet.tokensAmounts.map(elem => elem.amount),
            ai_list_new_success: wallet.tokensAmounts.map((elem, index) =>
                (Number(elem.amount) + Number(tokensAmounts[index].amount)).toString()
            ),
            old_secret: wallet.secret,
            new_secret_success: secretSuccess,
            new_secret_fail: secretFail,
            new_concealer_success: nullifierSuccess,
            new_concealer_fail: nullifierFail,
            pathElements: treeReturns.path.pathElements,
            pathIndices: treeReturns.path.pathIndexes
        };

        await depositService.executeOperation({ tokensAmounts });

        expect(treeStub.updateAndGetPath.mock.calls.length).toBe(1);
        expect(snarkProofGenerator.generateProof.mock.calls.length).toBe(1);
        expect(snarkProofGenerator.generateSolidityParameters.mock.calls.length).toBe(1);
        expect(web3Service.executeContractMethod.mock.calls.length).toBe(1);
        expect(web3Service.getCommitmentFromReceipt.mock.calls.length).toBe(1);
        expect(web3Service.checkRoot.mock.calls.length).toBe(1);

        expect(walletStorageStub.loadWallet.mock.calls.length).toBe(1);
        expect(walletStorageStub.saveWallet.mock.calls.length).toBe(1);
        expect(walletStorageStub.saveWallet.mock.calls[0][0]).toEqual({
            secret: secretFail,
            nullifier: nullifierFail,
            commitment: newCommitmentFail,
            tokensAmounts: wallet.tokensAmounts
        });

        expect(walletStorageStub.logHistory.mock.calls.length).toBe(2);
        expect(walletStorageStub.logHistory.mock.calls[0][0].slice(26)).toEqual(
            `- [start] - Deposit
    operation input: ${JSON.stringify(operationInput)}                
    public signals: ${JSON.stringify(snarkProofReturns.snarkjsOutput.publicSignals)}

`
        );
        expect(walletStorageStub.logHistory.mock.calls[1][0].slice(26)).toEqual(
            `- [end] - Deposit
    success: false
    commitment: ${newCommitmentFail}
    transaction hash: ${receipt.transactionHash}

`
        );
    });

    it('should throw insufficient funds error', async () => {
        const tokensValues = ['1', '30000'];
        const tokensAmounts = buildTestTokenAmountsArray(tokensValues);

        await expect(() => depositService.executeOperation({ tokensAmounts })).rejects.toThrow(
            `Insufficient ${TEST_TOKENS.WEENUS.symbol} funds`
        );

        expect(treeStub.updateAndGetPath.mock.calls.length).toBe(0);
        expect(snarkProofGenerator.generateProof.mock.calls.length).toBe(0);
        expect(snarkProofGenerator.generateSolidityParameters.mock.calls.length).toBe(0);

        expect(web3Service.executeContractMethod.mock.calls.length).toBe(0);
        expect(web3Service.getCommitmentFromReceipt.mock.calls.length).toBe(0);
        expect(web3Service.checkRoot.mock.calls.length).toBe(0);

        expect(walletStorageStub.loadWallet.mock.calls.length).toBe(0);
        expect(walletStorageStub.saveWallet.mock.calls.length).toBe(0);

        expect(walletStorageStub.logHistory.mock.calls.length).toBe(0);
    });

    it('should throw invalid root error', async () => {
        const tokensValues = ['5', '4'];
        treeReturns.root = 'incorrectRoot';
        treeStub = mockMerkleTree(treeReturns);
        depositService = new DepositService(
            walletStorageStub,
            <Web3Service>(web3Service as Web3ServiceStub),
            <MerkleTree>(treeStub as MerkleTreeStub),
            keysGeneratorStub,
            <SnarkProofGenerator>(snarkProofGenerator as SnarkProofGeneratorStub)
        );

        const tokensAmounts = buildTestTokenAmountsArray(tokensValues);

        await expect(() => depositService.executeOperation({ tokensAmounts })).rejects.toThrow(
            `Root ${treeReturns.root} is not correct`
        );

        expect(treeStub.updateAndGetPath.mock.calls.length).toBe(1);
        expect(snarkProofGenerator.generateProof.mock.calls.length).toBe(1);
        expect(snarkProofGenerator.generateSolidityParameters.mock.calls.length).toBe(0);

        expect(web3Service.executeContractMethod.mock.calls.length).toBe(0);
        expect(web3Service.getCommitmentFromReceipt.mock.calls.length).toBe(0);

        expect(walletStorageStub.loadWallet.mock.calls.length).toBe(1);
        expect(walletStorageStub.saveWallet.mock.calls.length).toBe(0);
        expect(walletStorageStub.logHistory.mock.calls.length).toBe(0);
    });
});
