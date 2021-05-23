import { Command } from 'commander';
import { AnonymizeManager } from '../core/anonymize-manager';
import { Storage } from './storage/storage';
import { error } from './stdout';
import { TokenAmount } from '../core/models/token-amount';
import provider from '../crypto/provider';

export class Cli {
    private readonly manager: AnonymizeManager;

    private readonly storage: Storage;

    private readonly program: Command;

    constructor() {
        // @ts-ignore
        this.program = new Command('anon');
        this.storage = new Storage();
        this.manager = new AnonymizeManager(this.storage);
        this.init();
    }

    private async init() {
        await provider.init({
            rpc: process.env.RPC_LINK,
            defaultGasLimit: Number(process.env.DEFAULT_GAS_LIMIT),
            contractAddress: process.env.CONTRACT_ADDRESS,
            uniswapAddress: process.env.UNISWAP_ADDRESS,
            privateKey: process.env.PRIVATE_KEY
        });
        await this.manager.init(provider);

        this.setGetBalanceCommand();
        this.setGetMerklePathAndRootCommand();
        this.setCreateWalletCommand();
        this.setDepositCommand();
        this.setSwapCommand();
        this.setWithdrawCommand();
        try {
            await this.program.parseAsync(process.argv);
            process.exit(0);
        } catch (e) {
            error(`Error:${e}`);
            process.exit(1);
        }
    }

    private setGetMerklePathAndRootCommand(): void {
        this.program
            .command('tree <commitment>')
            .description('Get pathElements and pathIndices for snark proof')
            .action(this.manager.getMerklePathAndRoot);
    }

    private setGetBalanceCommand(): void {
        this.program
            .command('balance')
            .description('Get pathElements and pathIndices for snark proof')
            .action(this.manager.getBalance);
    }

    private setCreateWalletCommand(): void {
        this.program
            .command('create <tokensValues>')
            .description('Create wallet operation')
            .action(async (tokensValuesString: string) => {
                const totalTokenNumbers = Number(process.env.TOKENS_NUMBER);
                try {
                    const tokensValues = JSON.parse(tokensValuesString);
                    if (
                        !Array.isArray(tokensValues) ||
                        tokensValues.length === 0 ||
                        tokensValues.length > totalTokenNumbers
                    ) {
                        throw new Error('Invalid tokens values array input.');
                    }
                    const tokensAmounts = await this.buildTokenAmountsArray(tokensValues);
                    await this.manager.createWallet(tokensAmounts);
                    process.exit(0);
                } catch (e) {
                    error(`Error:${e}`);
                    process.exit(1);
                }
            });
    }

    private setDepositCommand(): void {
        this.program
            .command('deposit <tokensValues>')
            .description('Deposit operation')
            .action(async (tokensValuesString: string) => {
                const totalTokenNumbers = Number(process.env.TOKENS_NUMBER);
                try {
                    const tokensValues = JSON.parse(tokensValuesString);
                    if (
                        !Array.isArray(tokensValues) ||
                        tokensValues.length === 0 ||
                        tokensValues.length > totalTokenNumbers
                    ) {
                        throw new Error('Invalid tokens values array input.');
                    }
                    const tokensAmounts = await this.buildTokenAmountsArray(tokensValues);
                    await this.manager.deposit(tokensAmounts);
                    process.exit(0);
                } catch (e) {
                    error(`Error:${e}`);
                    process.exit(1);
                }
            });
    }

    private setSwapCommand(): void {
        this.program
            .command('swap <pairRaw>')
            .description('Swap operation')
            .action(async (pairRaw: string) => {
                try {
                    const tokens = await this.storage.wallet.getAllTokens();
                    const pair = pairRaw.split('-');
                    const fromToken = tokens.find(token => token.symbol === pair?.[0]);
                    const toToken = tokens.find(token => token.symbol === pair?.[1]);
                    const amount = this.program.args[2];

                    if (pair?.length !== 2 || !fromToken || !toToken || !amount) {
                        throw new Error('Invalid tokens values array input.');
                    }
                    await this.manager.swap(fromToken, toToken, amount);
                    process.exit(0);
                } catch (e) {
                    error(`Error:${e}`);
                    process.exit(1);
                }
            });
    }

    private setWithdrawCommand(): void {
        this.program
            .command('withdraw <tokensValues>')
            .description('Withdraw operation')
            .action(async (tokensValuesString: string) => {
                const totalTokenNumbers = Number(process.env.TOKENS_NUMBER);
                try {
                    const tokensValues = JSON.parse(tokensValuesString);
                    if (
                        !Array.isArray(tokensValues) ||
                        tokensValues.length === 0 ||
                        tokensValues.length > totalTokenNumbers
                    ) {
                        throw new Error('Invalid tokens values array input.');
                    }
                    const tokensAmounts = await this.buildTokenAmountsArray(tokensValues);
                    const recipient = this.program.args[2]?.toLowerCase?.();
                    if (!recipient) {
                        throw new Error('Invalid recipient.');
                    }
                    await this.manager.withdraw(tokensAmounts, recipient);
                    process.exit(0);
                } catch (e) {
                    error(`Error:${e}`);
                    process.exit(1);
                }
            });
    }

    private async buildTokenAmountsArray(tokensValues: number[]): Promise<TokenAmount[]> {
        const tokens = await this.storage.wallet.getAllTokens();
        const values = tokensValues.concat(Array(tokens.length - tokensValues.length).fill(0));
        return tokens.map((token, index) => ({
            token,
            amount: values[index].toString()
        }));
    }
}
