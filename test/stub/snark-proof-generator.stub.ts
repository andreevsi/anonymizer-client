/* eslint-disable @typescript-eslint/no-unused-vars */
import { SnarkjsOutput } from '../../src/core/snark-proof-generator/models/snarkjs-output';
import { RecStringArray } from '../../src/core/snark-proof-generator/models/rec-string-array';
import { OperationInput } from '../../src/core/services/models/operation-input';
import { SnarkProofGenerator } from '../../src/core/snark-proof-generator/snark-proof-generator';

export interface SnarkProofGeneratorStub {
    generateProof(operationInput: OperationInput): Promise<SnarkjsOutput>;
    generateSolidityParameters(snarkjsOutput: SnarkjsOutput): RecStringArray[];
}

export type MockSnarkProofGeneratorStub = {
    [key in keyof SnarkProofGeneratorStub]: jest.Mock<ReturnType<SnarkProofGenerator[key]>>;
};

export function mockSnarkProofGeneratorStub(returns: {
    snarkjsOutput: SnarkjsOutput;
    solidityParameters: RecStringArray[];
}): MockSnarkProofGeneratorStub {
    return {
        generateProof: jest.fn(
            (operationInput: OperationInput): Promise<SnarkjsOutput> => {
                return Promise.resolve(returns.snarkjsOutput);
            }
        ),
        generateSolidityParameters: jest.fn((snarkjsOutput: SnarkjsOutput): RecStringArray[] => {
            return returns.solidityParameters;
        })
    };
}
