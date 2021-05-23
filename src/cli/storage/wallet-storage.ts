import fs from 'fs';
import { IWalletStorage } from '../models/i-wallet-storage';
import { Wallet } from '../models/wallet';
import provider from '../../crypto/provider';
import { debug } from '../stdout';
import { Token } from '../../core/models/token';

export class WalletStorage implements IWalletStorage {
    private storageDir = `${process.cwd()}/.data`;

    private resourcesDir = `${process.cwd()}/resources`;

    constructor() {
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir);
        }
    }

    public async loadWallet(): Promise<Wallet> {
        try {
            const walletRaw: Buffer = await fs.promises.readFile(this.getWalletFileName(), {
                flag: 'a+'
            });
            const wallet: Wallet = JSON.parse(walletRaw.toString()) as Wallet;

            if (!wallet?.nullifier || !Array.isArray(wallet?.tokensAmounts) || !wallet?.secret) {
                return await this.buildEmptyWallet();
            }
            return wallet;
        } catch (e) {
            debug(e);
            return this.buildEmptyWallet();
        }
    }

    public async logHistory(data: any): Promise<void> {
        return fs.promises.appendFile(this.getLogFileName(), data);
    }

    public async saveWallet(wallet: Wallet): Promise<void> {
        return fs.promises.writeFile(this.getWalletFileName(), JSON.stringify(wallet), {
            flag: 'w+'
        });
    }

    public async getAllTokens(): Promise<Token[]> {
        const tokensRaw: Buffer = await fs.promises.readFile(`${this.resourcesDir}/tokens.json`);
        return JSON.parse(tokensRaw.toString()) as Token[];
    }

    private async buildEmptyWallet(): Promise<Wallet> {
        const tokens = await this.getAllTokens();
        return {
            secret: null,
            nullifier: null,
            commitment: null,
            tokensAmounts: tokens.map(token => ({
                token,
                amount: '0'
            }))
        };
    }

    private getWalletFileName(
        options: {
            contractAddress: string;
            chainId: number;
        } = {
            contractAddress: provider.contract.address,
            chainId: provider.chainId
        }
    ): string {
        return `${this.storageDir}/.wallet-${options.contractAddress}-${options.chainId}.json`;
    }

    private getLogFileName(
        options: {
            contractAddress: string;
            chainId: number;
        } = {
            contractAddress: provider.contract.address,
            chainId: provider.chainId
        }
    ): string {
        return `${this.storageDir}/.log-${options.contractAddress}-${options.chainId}.log`;
    }
}
