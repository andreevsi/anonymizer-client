import { ITreeStorage } from './i-tree-storage';
import { IWalletStorage } from './i-wallet-storage';

export interface IStorage {
    tree: ITreeStorage;
    wallet: IWalletStorage;
}
