import mimcSpongeHasher from './mimcsponge';
import Path from './models/path';
import bit from '../models/bit';
import { SerializedTree } from './models/serialized-tree';
import TreeFetcher from '../../crypto/tree-fetcher';
import { info } from '../../cli/stdout';

class MerkleTree {
    private static zeroValue =
        '21663839004416932945382355908790599225266501822907911457504978515578255421292';

    private readonly _layersStorage: string[][] = [];

    private root: string;

    private readonly treeLevels: number;

    private readonly layers: string[][];

    private latestBlockNumber: number;

    get currentRoot() {
        return this.root;
    }

    constructor(
        tree: SerializedTree,
        private treeFetcher: TreeFetcher,
        private saveTree: (tree: SerializedTree) => void
    ) {
        this.treeLevels = tree.treeLevels;
        this._layersStorage = tree.layers.map(it => it.concat());
        this.root = tree.root;
        this.latestBlockNumber = tree.latestBlockNumber;

        const zeros: string[] = [MerkleTree.zeroValue];
        for (let i = 0; i < this.treeLevels; i++) {
            const lastZero = zeros[zeros.length - 1];
            zeros.push(this.hashLeftRight(lastZero, lastZero));
        }

        this.layers = [...Array(this.treeLevels)].map(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            (elem, index) =>
                new Proxy(this._layersStorage[index], {
                    get: (target: string[], key: number) => target[key] || zeros[index]
                })
        );
    }

    public async updateAndGetPath(commitment: string): Promise<Path> {
        const commitmentsHistory = await this.treeFetcher.fetchCommitments(
            this.latestBlockNumber + 1
        );
        this.latestBlockNumber = commitmentsHistory.latestBlockNumber;

        if (commitmentsHistory.commitments.length) {
            info(`Inserting ${commitmentsHistory.commitments.length} commitments into tree...`);
            const firstZeroLeafIndex = this._layersStorage[0].length;
            this.insertLeaves(commitmentsHistory.commitments, firstZeroLeafIndex);
        } else {
            info('There are no new commitments');
        }
        this.saveTree(this.getSerializedTree());

        const targetLeafIndex = this.layers[0].indexOf(commitment);
        if (targetLeafIndex === -1) {
            throw new Error('Commitment not found');
        }
        return this.getPath(targetLeafIndex);
    }

    private getPath(leafIndex: number): Path {
        info('Calculating path...');
        const pathIndexes: bit[] = [];
        const pathElements = [];

        let currentLeafIndex = leafIndex;

        for (let i = 0; i < this.treeLevels; i++) {
            const neighbourIndex =
                currentLeafIndex % 2 ? currentLeafIndex - 1 : currentLeafIndex + 1;
            pathIndexes.push((currentLeafIndex % 2) as bit);
            pathElements.push(this.layers[i][neighbourIndex]);

            currentLeafIndex = Math.floor(leafIndex / 2 ** (i + 1));
        }

        return {
            pathElements,
            pathIndexes
        };
    }

    private insertLeaves(leaves: string[], indexFrom: number): void {
        for (let k = indexFrom; k < indexFrom + leaves.length; k++) {
            this.layers[0][k] = leaves[k - indexFrom];
        }

        let layerStartIndex = indexFrom;
        let layerEndIndex = indexFrom + leaves.length - 1;
        for (let i = 1; i < this.treeLevels; i++) {
            layerStartIndex = Math.floor(layerStartIndex / 2);
            layerEndIndex = Math.floor(layerEndIndex / 2);

            for (let k = layerStartIndex; k <= layerEndIndex; k++) {
                const child1 = this.layers[i - 1][k * 2];
                const child2 = this.layers[i - 1][k * 2 + 1];
                this.layers[i][k] = this.hashLeftRight(child1, child2);
            }
        }

        const lastLayer = this.layers[this.treeLevels - 1];
        this.root = this.hashLeftRight(lastLayer[0], lastLayer[1]);
    }

    private hashLeftRight(left: string, right: string): string {
        return mimcSpongeHasher.hash(left, right);
    }

    private getSerializedTree(): SerializedTree {
        return {
            root: this.root,
            layers: this.layers.map(it => it.concat()),
            treeLevels: this.treeLevels,
            latestBlockNumber: this.latestBlockNumber
        };
    }
}

export default MerkleTree;
