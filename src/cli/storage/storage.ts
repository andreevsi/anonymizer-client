import { IStorage } from '../models/i-storage';
import { TreeStorage } from './tree-storage';
import { WalletStorage } from './wallet-storage';

export class Storage implements IStorage {
    public tree: TreeStorage;

    public wallet: WalletStorage;

    constructor() {
        this.tree = new TreeStorage();
        this.wallet = new WalletStorage();
    }
}
