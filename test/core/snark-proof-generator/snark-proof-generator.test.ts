/* eslint-disable @typescript-eslint/no-magic-numbers */
// @ts-ignore
import { groth16 } from 'snarkjs';
import fs from 'fs';
import BigNumber from 'bignumber.js';
import { SnarkProofGenerator } from '../../../src/core/snark-proof-generator/snark-proof-generator';
import { Wallet } from '../../../src/cli/models/wallet';

describe('snark proof generator', () => {
    const baseDirectory = `${process.cwd()}/test/core/snark-proof-generator/circuits`;

    let snarkProofGenerator: SnarkProofGenerator;

    beforeEach(() => {
        snarkProofGenerator = new SnarkProofGenerator(
            `${baseDirectory}/create-wallet.wasm`,
            `${baseDirectory}/create-wallet.zkey`
        );
    });

    beforeAll(() => {
        jest.setTimeout(30000);
    });

    afterAll(() => {
        jest.setTimeout(5000);
    });

    it('should create correct proof', async () => {
        const operationInput = {
            secret: '1097960736851745550612267157572001968046033229221515168044208032394520776',
            concealer: '46196577931206311728473227015595847553136674693909529482659791242804802620',
            // eslint-disable-next-line prettier/prettier
            ai_list: ['5', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
        };
        const snarkjsOutput = await snarkProofGenerator.generateProof(operationInput);

        const verificationKeyBuffer: Buffer = await fs.promises.readFile(
            `${baseDirectory}/create-wallet_verification_key.json`
        );
        const verificationKey = JSON.parse(verificationKeyBuffer.toString()) as Wallet;

        const proofCorrectness = await groth16.verify(
            verificationKey,
            snarkjsOutput.publicSignals,
            snarkjsOutput.proof
        );

        expect(proofCorrectness).toBeTruthy();
    });

    it('should not accept broken proof', async () => {
        const operationInput = {
            secret: '1097960736851745550612267157572001968046033229221515168044208032394520776',
            concealer: '46196577931206311728473227015595847553136674693909529482659791242804802620',
            // eslint-disable-next-line prettier/prettier
            ai_list: ['5', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
        };
        const snarkjsOutput = await snarkProofGenerator.generateProof(operationInput);

        const verificationKeyBuffer: Buffer = await fs.promises.readFile(
            `${baseDirectory}/create-wallet_verification_key.json`
        );
        const verificationKey = JSON.parse(verificationKeyBuffer.toString()) as Wallet;

        snarkjsOutput.proof.pi_a[0] = new BigNumber(snarkjsOutput.proof.pi_a[0])
            .minus(1)
            .toFixed(0);

        const proofCorrectness = await groth16.verify(
            verificationKey,
            snarkjsOutput.publicSignals,
            snarkjsOutput.proof
        );

        expect(proofCorrectness).not.toBeTruthy();
    });

    it('should correctly generate sol parameters', async () => {
        const operationInput = {
            secret: '1097960736851745550612267157572001968046033229221515168044208032394520776',
            concealer: '46196577931206311728473227015595847553136674693909529482659791242804802620',
            // eslint-disable-next-line prettier/prettier
            ai_list: ['5', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
        };
        const snarkjsOutput = await snarkProofGenerator.generateProof(operationInput);

        const solidityParameters: string[] = snarkProofGenerator
            .generateSolidityParameters(snarkjsOutput)
            .flat(Infinity);

        const sourceParameters: string[] = [
            ...snarkjsOutput.proof.pi_a.slice(0, -1),
            ...snarkjsOutput.proof.pi_b.slice(0, -1).flatMap(elem => elem.reverse()),
            ...snarkjsOutput.proof.pi_c.slice(0, -1),
            ...snarkjsOutput.publicSignals
        ];

        solidityParameters.forEach((parameter, index) => {
            expect(new BigNumber(parameter).isEqualTo(sourceParameters[index])).toBeTruthy();
            expect(parameter.length).toBe(64 + 2);
        });
    });
});
