// @ts-ignore
import { groth16 } from 'snarkjs';
import BigNumber from 'bignumber.js';
import { OperationInput } from '../services/models/operation-input';
import { SnarkjsOutput } from './models/snarkjs-output';
import { Proof } from './models/proof';
import { RecStringArray } from './models/rec-string-array';

export class SnarkProofGenerator {
    private maxUint256 = new BigNumber(2).pow(256).minus(1);

    constructor(private wasmPath: string, private zkeyPath: string) {}

    public async generateProof(operationInput: OperationInput): Promise<SnarkjsOutput> {
        return groth16.fullProve(operationInput, this.wasmPath, this.zkeyPath);
    }

    public generateSolidityParameters(snarkjsOutput: SnarkjsOutput): RecStringArray[] {
        const values = ['pi_a', 'pi_b', 'pi_c'].map((key: keyof Omit<Proof, 'protocol'>) => {
            const subArray = snarkjsOutput.proof[key].slice(0, -1);
            if (key === 'pi_b') {
                return (subArray as string[]).map(([a, b]) => [b, a]);
            }
            return subArray;
        });
        values.push(snarkjsOutput.publicSignals);
        return this.recEncoder(values);
    }

    private recEncoder(values: RecStringArray[]): RecStringArray[] {
        return values.map(elem => {
            if (Array.isArray(elem)) {
                return this.recEncoder(elem);
            }
            const hexValue = (Number(elem) < 0
                ? this.maxUint256.plus(elem)
                : new BigNumber(elem)
            ).toString(16);
            return `0x${hexValue.padStart(64, '0')}`;
        });
    }
}
