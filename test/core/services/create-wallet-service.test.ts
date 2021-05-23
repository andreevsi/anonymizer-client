/* eslint-disable @typescript-eslint/no-unused-vars,@typescript-eslint/no-magic-numbers */
import { TransactionReceipt } from 'web3-eth';
import { CreateWalletService } from '../../../src/core/services/create-wallet-service/create-wallet-service';
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

describe('create wallet', () => {
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
        solidityParameters: []
    };

    const { secret, nullifier } = { secret: 'secret', nullifier: 'nullifier' };

    let createWalletService: CreateWalletService;

    let web3Service: MockWeb3ServiceStub;

    let snarkProofGenerator: MockSnarkProofGeneratorStub;

    let walletStorageStub: MockIWalletStorage;

    beforeAll(async () => {
        await providerStub.init();
    });

    beforeEach(() => {
        const keysGeneratorStub: KeysGenerator = {
            generateKeysPair(): KeysPair {
                return { secret, nullifier };
            }
        } as KeysGenerator;

        walletStorageStub = mockWalletStorageStub();
        web3Service = mockWeb3ServiceStub(ethBalance, balances, allowances, receipt);
        snarkProofGenerator = mockSnarkProofGeneratorStub(snarkProofReturns);
        createWalletService = new CreateWalletService(
            walletStorageStub,
            <Web3Service>(web3Service as Web3ServiceStub),
            keysGeneratorStub,
            <SnarkProofGenerator>(snarkProofGenerator as SnarkProofGeneratorStub)
        );
    });

    it('should create wallet with 3 wei and 2 weenus', async () => {
        const fakeCommitment = '1234567890';
        const fakeSolidityParameters = [...Array(9 + Number(process.env.TOKENS_NUMBER))].map(
            (elem, index) => `param${index}`
        );
        const tokensValues = ['3', '2'];
        const tokensAmounts = buildTestTokenAmountsArray(tokensValues);
        snarkProofReturns.snarkjsOutput.publicSignals[0] = fakeCommitment;
        snarkProofReturns.solidityParameters = fakeSolidityParameters;
        receipt.events.Commitment.returnValues.commitment = fakeCommitment;
        const operationInput = {
            secret,
            concealer: nullifier,
            ai_list: tokensAmounts.map(elem => elem.amount)
        };

        await createWalletService.executeOperation({ tokensAmounts });

        expect(snarkProofGenerator.generateProof.mock.calls.length).toBe(1);
        expect(snarkProofGenerator.generateProof.mock.calls[0][0]).toEqual(operationInput);
        expect(snarkProofGenerator.generateSolidityParameters.mock.calls.length).toBe(1);
        expect(snarkProofGenerator.generateSolidityParameters.mock.calls[0][0]).toEqual(
            snarkProofReturns.snarkjsOutput
        );

        expect(web3Service.executeContractMethod.mock.calls.length).toBe(1);
        expect(web3Service.executeContractMethod.mock.calls[0]).toEqual([
            'createWallet',
            fakeSolidityParameters,
            {
                value: tokensValues[0]
            }
        ]);
        expect(web3Service.getCommitmentFromReceipt.mock.calls.length).toBe(1);
        expect(web3Service.getCommitmentFromReceipt.mock.calls[0][0]).toEqual(receipt);

        expect(walletStorageStub.loadWallet.mock.calls.length).toBe(0);
        expect(walletStorageStub.saveWallet.mock.calls.length).toBe(1);
        expect(walletStorageStub.saveWallet.mock.calls[0][0]).toEqual({
            secret,
            nullifier,
            commitment: fakeCommitment,
            tokensAmounts
        });
        expect(walletStorageStub.logHistory.mock.calls.length).toBe(2);
        expect(walletStorageStub.logHistory.mock.calls[0][0].slice(26)).toEqual(
            `- [start] - Create wallet
    operation input: ${JSON.stringify(operationInput)}                
    public signals: ${JSON.stringify(snarkProofReturns.snarkjsOutput.publicSignals)}

`
        );
        expect(walletStorageStub.logHistory.mock.calls[1][0].slice(26)).toEqual(
            `- [end] - Create wallet
    success: true
    commitment: ${fakeCommitment}
    transaction hash: ${receipt.transactionHash}

`
        );
    });

    it('should throw insufficient funds error', async () => {
        const tokensValues = ['30000', '2'];
        const tokensAmounts = buildTestTokenAmountsArray(tokensValues);

        await expect(() => createWalletService.executeOperation({ tokensAmounts })).rejects.toThrow(
            'Insufficient native coin funds'
        );

        expect(snarkProofGenerator.generateProof.mock.calls.length).toBe(0);
        expect(snarkProofGenerator.generateSolidityParameters.mock.calls.length).toBe(0);

        expect(web3Service.executeContractMethod.mock.calls.length).toBe(0);
        expect(web3Service.getCommitmentFromReceipt.mock.calls.length).toBe(0);

        expect(walletStorageStub.loadWallet.mock.calls.length).toBe(0);
        expect(walletStorageStub.saveWallet.mock.calls.length).toBe(0);

        expect(walletStorageStub.logHistory.mock.calls.length).toBe(0);
    });

    it('should log info but not update wallet if something went wrong', async () => {
        const correctCommitment = '1234567890';
        const wrongCommitment = '9876543210';
        const tokensValues = ['3', '2'];
        const tokensAmounts = buildTestTokenAmountsArray(tokensValues);
        snarkProofReturns.snarkjsOutput.publicSignals[0] = correctCommitment;
        receipt.events.Commitment.returnValues.commitment = wrongCommitment;

        await expect(() => createWalletService.executeOperation({ tokensAmounts })).rejects.toThrow(
            `Error while creating wallet. Commitments are not equal:
                expected: ${correctCommitment},
                but was ${wrongCommitment}`
        );

        expect(snarkProofGenerator.generateProof.mock.calls.length).toBe(1);
        expect(snarkProofGenerator.generateSolidityParameters.mock.calls.length).toBe(1);

        expect(web3Service.executeContractMethod.mock.calls.length).toBe(1);
        expect(web3Service.getCommitmentFromReceipt.mock.calls.length).toBe(1);

        expect(walletStorageStub.loadWallet.mock.calls.length).toBe(0);
        expect(walletStorageStub.saveWallet.mock.calls.length).toBe(0);

        expect(walletStorageStub.logHistory.mock.calls.length).toBe(2);
        expect(walletStorageStub.logHistory.mock.calls[1][0].slice(26)).toEqual(
            `- [end] - Create wallet
    success: false
    commitment: ${wrongCommitment}
    transaction hash: ${receipt.transactionHash}

`
        );
    });
});
