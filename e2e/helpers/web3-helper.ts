/* eslint-disable no-await-in-loop,no-async-promise-executor */
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import Decoder from 'ethereum-input-data-decoder';
import { Log } from 'web3-core';
import { Subscription } from 'web3-core-subscriptions';
import { ANONYMIZER_ABI } from '../../src/crypto/models/abi';

export class Web3Helper {
    private web3: Web3;

    public address: string;

    private anonymizerAddress: string;

    private anonymizerContract: Contract;

    private decoder = new Decoder(ANONYMIZER_ABI);

    private fixedBlockNumber: number;

    constructor() {
        const rpc = process.env.WSS_LINK;
        this.web3 = new Web3(rpc);
        this.anonymizerAddress = process.env.CONTRACT_ADDRESS;
        this.anonymizerContract = new this.web3.eth.Contract(
            ANONYMIZER_ABI as any[],
            this.anonymizerAddress
        );
    }

    async init() {
        const account = await this.web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
        this.address = account.address;
    }

    public awaitForTransactionToAnonymizer(
        afterSubscriptionInited: () => void
    ): Promise<{ status: boolean; parameters: string[] }> {
        let subscribtion: Subscription<Log>;

        return new Promise(async resolve => {
            const onTxToAnonymizer = async (log: Log) => {
                const txHash = log.transactionHash;
                const tx = await this.web3.eth.getTransaction(txHash);

                if (tx.from.toLowerCase() === this.address.toLowerCase()) {
                    const receipt = await this.web3.eth.getTransactionReceipt(txHash);
                    const decoded = this.decoder.decodeData(tx.input);
                    const parameters = decoded.inputs[3].map((e: any) => e.toString());

                    subscribtion.unsubscribe();
                    resolve({ status: receipt.status, parameters });
                }
            };

            const fromBlock = await this.web3.eth.getBlockNumber();
            subscribtion = this.web3.eth
                .subscribe(
                    'logs',
                    {
                        fromBlock,
                        address: this.anonymizerAddress
                    },
                    err => err && console.log(err)
                )
                .on('data', onTxToAnonymizer);

            afterSubscriptionInited();
        });
    }

    public async fixStartBlockNumber(): Promise<void> {
        this.fixedBlockNumber = await this.web3.eth.getBlockNumber();
    }

    public async decodeTx(
        txHash: string,
        origin: string = this.address
    ): Promise<{ status: boolean; parameters: string[] }> {
        const tx = await this.web3.eth.getTransaction(txHash);

        if (!tx) {
            throw new Error('Transaction not found');
        }

        if (tx.blockNumber < this.fixedBlockNumber) {
            throw new Error('Transaction was mined before test started');
        }

        if (tx.to.toLowerCase() !== this.anonymizerAddress.toLowerCase()) {
            throw new Error('Transaction destination does not much anonymizer address');
        }

        if (tx.from.toLowerCase() !== origin.toLowerCase()) {
            throw new Error('Transaction origin does not much passed origin value');
        }

        const receipt = await this.web3.eth.getTransactionReceipt(txHash);
        const decoded = this.decoder.decodeData(tx.input);
        const parameters = decoded.inputs[3].map((e: any) => e.toString());

        return { status: receipt.status, parameters };
    }
}
