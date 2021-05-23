import { Subscription } from 'web3-core-subscriptions';
import { Log } from 'web3-core';
import web3Utils from 'web3-utils';
import BigNumber from 'bignumber.js';
import { Web3Service } from './web3-service';

export class EventsListener {
    private subscription: Subscription<Log>;

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    private static checkTimeout = 20000;

    private blockNumberCheckInterval: NodeJS.Timeout;

    constructor(private maxBlocksCount: number, private web3Service: Web3Service) {}

    public async startScan(
        commitmentsToFind: string[],
        callbacks: {
            onCommitmentFind: (commitment: string, txHash: string) => void;
            onTimeoutEnd: () => void;
        }
    ): Promise<void> {
        const startBlockNumber = await this.web3Service.getBlockNumber();

        const callback = (log: Log) => {
            const commitment = log.topics[1].toLowerCase();
            if (commitmentsToFind.some(elem => new BigNumber(elem.toLowerCase()).eq(commitment))) {
                callbacks.onCommitmentFind(log.topics[1], log.transactionHash);
            }
        };

        const eventSignatureHash = web3Utils.keccak256('Commitment(bytes32,uint32,uint256)');

        this.subscription = await this.web3Service.subscribeToLogs(callback, {
            fromBlock: startBlockNumber,
            topics: [eventSignatureHash]
        });

        this.blockNumberCheckInterval = setInterval(async () => {
            const blockNumber = await this.web3Service.getBlockNumber();
            if (blockNumber - startBlockNumber >= this.maxBlocksCount) {
                callbacks.onTimeoutEnd();
                clearInterval(this.blockNumberCheckInterval);
                this.subscription.unsubscribe();
            }
        }, EventsListener.checkTimeout);
    }

    public stopScan(): Promise<boolean> {
        clearInterval(this.blockNumberCheckInterval);
        return this.subscription.unsubscribe();
    }
}
