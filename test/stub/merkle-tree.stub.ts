/* eslint-disable @typescript-eslint/no-unused-vars */
import Path from '../../src/core/merkle-tree/models/path';

export interface MerkleTreeStub {
    currentRoot: string;
    updateAndGetPath(commitment: string): Promise<Path>;
}

export type MockMerkleTreeStub = {
    currentRoot: string;
    updateAndGetPath: jest.Mock<Promise<Path>>;
};

export function mockMerkleTree(treeReturns: { path: Path; root: string }): MockMerkleTreeStub {
    return {
        currentRoot: treeReturns.root,
        updateAndGetPath: jest.fn(
            (commitment: string): Promise<Path> => {
                return Promise.resolve(treeReturns.path);
            }
        )
    };
}
