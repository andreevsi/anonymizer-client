import { SerializedTree } from '../../core/merkle-tree/models/serialized-tree';

export interface ITreeStorage {
    loadMerkleTree(): Promise<SerializedTree>;
    saveMerkleTree(tree: SerializedTree): Promise<void>;
}
