import fs from 'fs';
import * as process from 'process';
import { SerializedTree } from '../../core/merkle-tree/models/serialized-tree';
import provider from '../../crypto/provider';
import { ITreeStorage } from '../models/i-tree-storage';
import { debug } from '../stdout';

export class TreeStorage implements ITreeStorage {
    private dir = `${process.cwd()}/.data`;

    constructor() {
        if (!fs.existsSync(this.dir)) {
            fs.mkdirSync(this.dir);
        }
    }

    public async saveMerkleTree(tree: SerializedTree): Promise<void> {
        return fs.promises.writeFile(this.getFileName(), JSON.stringify(tree), { flag: 'w+' });
    }

    public async loadMerkleTree(): Promise<SerializedTree> {
        try {
            const treeRaw: Buffer = await fs.promises.readFile(this.getFileName(), { flag: 'a+' });
            const tree: SerializedTree = JSON.parse(treeRaw.toString()) as SerializedTree;

            if (!tree?.treeLevels || !Array.isArray(tree?.layers?.[0]) || !tree?.root) {
                return this.buildEmptyTree();
            }
            return tree;
        } catch (e) {
            debug(e);
            return this.buildEmptyTree();
        }
    }

    private buildEmptyTree(): SerializedTree {
        const treeLevels = Number(process.env.TREE_LEVELS);
        const layers = [...Array(treeLevels)].map(() => []);

        return {
            treeLevels,
            layers,
            root: '',
            latestBlockNumber: -1
        };
    }

    private getFileName(
        options: {
            contractAddress: string;
            chainId: number;
        } = {
            contractAddress: provider.contract.address,
            chainId: provider.chainId
        }
    ): string {
        return `${this.dir}/.tree-${options.contractAddress}-${options.chainId}.json`;
    }
}
