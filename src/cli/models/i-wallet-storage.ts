import { Wallet } from './wallet';

export interface IWalletStorage {
    loadWallet(): Promise<Wallet>;
    saveWallet(wallet: Wallet): Promise<void>;
    logHistory(data: any): Promise<void>;
}
