import Web3 from 'web3';
import { TransactionReceipt } from 'web3-eth';
import { Subscription } from 'web3-core-subscriptions';
import { Log } from 'web3-core';
import { Contract } from 'web3-eth-contract';
import BigNumber from 'bignumber.js';
import { error } from '../cli/stdout';
import { ERC20_ABI } from './models/abi/index';
import { Provider } from './models/provider';
import { methods } from './models/methods';

export class Web3Service {
    private readonly web3: Web3;

    private readonly address: string;

    private readonly anonymizerContract: Contract;

    private readonly uniswapContract: Contract;

    private readonly anonymizerContractAddress: string;

    private readonly defaultGasLimit: number;

    get nativeAddress(): string {
        return '0x0000000000000000000000000000000000000000';
    }

    constructor(provider: Provider) {
        this.web3 = provider.web3;
        this.address = provider.address;
        this.anonymizerContract = new this.web3.eth.Contract(
            provider.contract.abi,
            provider.contract.address
        );
        this.uniswapContract = new this.web3.eth.Contract(
            provider.uniswap.abi,
            provider.uniswap.address
        );
        this.anonymizerContractAddress = provider.contract.address;
        this.defaultGasLimit = provider.defaultGasLimit;
    }

    public isNativeCoin(address: string): boolean {
        return address === this.nativeAddress;
    }

    public getCommitmentFromReceipt(receipt: TransactionReceipt): BigNumber {
        return new BigNumber(receipt.events.Commitment.returnValues.commitment);
    }

    public getBlockNumber(): Promise<number> {
        return this.web3.eth.getBlockNumber();
    }

    public subscribeToLogs(
        callback: (log: Log) => void,
        options: { topics?: string[]; fromBlock?: number } = {}
    ): Promise<Subscription<Log>> {
        const subscribtion = this.web3.eth
            .subscribe(
                'logs',
                {
                    ...options,
                    address: this.anonymizerContractAddress
                },
                err => err && error(err)
            )
            .on('data', callback);

        return new Promise(resolve => {
            subscribtion.on('connected', () => resolve(subscribtion));
        });
    }

    /**
     * @description gets account balance in Wei units
     * @return account balance in Wei
     */
    public async getBalance(): Promise<BigNumber> {
        const balance = await this.web3.eth.getBalance(this.address);
        return new BigNumber(balance);
    }

    /**
     * @description gets ERC-20 tokens balance as integer (multiplied to 10 ** decimals)
     * @param tokenAddress address of the smart-contract corresponding to the token
     * @return account tokens balance as integer (multiplied to 10 ** decimals)
     */
    public async getTokenBalance(tokenAddress: string): Promise<BigNumber> {
        const contract = new this.web3.eth.Contract(ERC20_ABI as any[], tokenAddress);

        const balance = await contract.methods.balanceOf(this.address).call();
        return new BigNumber(balance);
    }

    /**
     * @description executes allowance method in ERC-20 token contract
     * @param tokenAddress address of the smart-contract corresponding to the token
     * @return tokens amount, allowed to be spent
     */
    public async getAllowance(tokenAddress: string): Promise<BigNumber> {
        const contract = new this.web3.eth.Contract(ERC20_ABI as any[], tokenAddress);

        const allowance = await contract.methods
            .allowance(this.address, this.anonymizerContractAddress)
            .call({ from: this.address });
        return new BigNumber(allowance);
    }

    /**
     * @description calculates output amount for trade
     * @param fromTokenAddress base trade token address
     * @param toTokenAddress quote trade token address
     * @param fromAmount base trade amount
     * @return quote trade amount
     */
    public async getUniwapOutput(
        fromTokenAddress: string,
        toTokenAddress: string,
        fromAmount: string
    ): Promise<BigNumber> {
        const wethAddress = await this.getUniwapWethAddress();
        fromTokenAddress = this.isNativeCoin(fromTokenAddress) ? wethAddress : fromTokenAddress;
        toTokenAddress = this.isNativeCoin(toTokenAddress) ? wethAddress : toTokenAddress;

        const result = await this.uniswapContract.methods
            .getAmountsOut(fromAmount, [fromTokenAddress, toTokenAddress])
            .call({ from: this.address });
        return new BigNumber(result[1]);
    }

    /**
     * @description calculates output amount for trade
     * @return weth address
     */
    public async getUniwapWethAddress(): Promise<string> {
        return this.uniswapContract.methods.WETH().call({ from: this.address });
    }

    /**
     * @description check if merkle root is valid
     * @param root hex (with 0x prefix) or decimal value of root to check
     * @return correctness of the root
     */
    public async checkRoot(root: string): Promise<boolean> {
        const bnRoot = new BigNumber(root);
        const hexRoot = `0x${bnRoot.toString(16).padStart(64, '0')}`;
        return this.anonymizerContract.methods.isKnownRoot(hexRoot).call({ from: this.address });
    }

    /**
     * @description executes method of smart-contract and resolve the promise when the transaction is included in the block
     * @param methodName executing method name
     * @param methodArguments executing method arguments
     * @param [options] additional options
     * @param [options.onTransactionHash] callback to execute when transaction enters the mempool
     * @param [options.value] amount in Wei amount to be attached to the transaction
     * @return smart-contract method returned value
     */
    public async executeContractMethod(
        methodName: methods,
        methodArguments: any[],
        options: {
            onTransactionHash?: (hash: string) => void;
            value?: BigNumber | string;
        } = {}
    ): Promise<TransactionReceipt> {
        return new Promise((resolve, reject) => {
            this.anonymizerContract.methods[methodName](...methodArguments)
                .send({
                    from: this.address,
                    gas: this.defaultGasLimit,
                    ...(options.value && { value: options.value })
                })
                .on('transactionHash', options.onTransactionHash || (() => {}))
                .on('receipt', resolve)
                .on('error', (err: any) => {
                    console.error(`Method execution error. ${err}`);
                    reject(err);
                });
        });
    }

    /**
     * @description executes approve method in ERC-20 token contract
     * @param tokenAddress address of the smart-contract corresponding to the token
     * @param value integer value to approve (pre-multiplied by 10 ** decimals)
     * @param [options] additional options
     * @param [options.onTransactionHash] callback to execute when transaction enters the mempool
     * @return approval transaction receipt
     */
    public async approveTokens(
        tokenAddress: string,
        value: BigNumber,
        options: {
            onTransactionHash?: (hash: string) => void;
            gas?: number;
        } = {}
    ): Promise<TransactionReceipt> {
        const contract = new this.web3.eth.Contract(ERC20_ABI as any[], tokenAddress);

        return new Promise((resolve, reject) => {
            contract.methods
                .approve(this.anonymizerContractAddress, value.toFixed(0))
                .send({
                    from: this.address,
                    gas: options.gas || 200000
                })
                .on('transactionHash', options.onTransactionHash || (() => {}))
                .on('receipt', resolve)
                .on('error', (err: any) => {
                    error(`Tokens approve error. ${err}`);
                    reject(err);
                });
        });
    }

    /**
     * @description executes approve method in ERC-20 token contract
     * @param tokenAddress address of the smart-contract corresponding to the token
     * @param [options] additional options
     * @param [options.onTransactionHash] callback to execute when transaction enters the mempool
     * @return approval transaction receipt
     */
    public async approveTokensToInfinity(
        tokenAddress: string,
        options: {
            onTransactionHash?: (hash: string) => void;
            gas?: number;
        } = {}
    ): Promise<TransactionReceipt> {
        const value = new BigNumber(2).pow(256).minus(1);
        return this.approveTokens(tokenAddress, value, options);
    }

    /**
     * @description removes approval for token use
     * @param tokenAddress tokenAddress address of the smart-contract corresponding to the token
     */
    public async unApprove(tokenAddress: string): Promise<TransactionReceipt> {
        return this.approveTokens(tokenAddress, new BigNumber(0));
    }
}
