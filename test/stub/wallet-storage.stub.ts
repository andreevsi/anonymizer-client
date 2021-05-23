/* eslint-disable @typescript-eslint/no-unused-vars */
import { Wallet } from '../../src/cli/models/wallet';
import { IWalletStorage } from '../../src/cli/models/i-wallet-storage';

export type MockIWalletStorage = {
    [key in keyof IWalletStorage]: jest.Mock<ReturnType<IWalletStorage[key]>>;
};

export function mockWalletStorageStub(returnedWallet?: Wallet): MockIWalletStorage {
    return {
        loadWallet: jest.fn(
            (): Promise<Wallet> => {
                return Promise.resolve(returnedWallet);
            }
        ),
        saveWallet: jest.fn(async (wallet: Wallet): Promise<void> => Promise.resolve()),
        logHistory: jest.fn(async (data: any): Promise<void> => Promise.resolve())
    };
}
