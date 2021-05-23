import BigNumber from 'bignumber.js';
import CommitmentsHistory from './models/commitments-history';
import { info } from '../cli/stdout';
import { Provider } from './models/provider';

export default class TreeFetcher {
    constructor(private provider: Provider) {}

    private eventName = this.provider.contract.commitmentEventName;

    private web3 = this.provider.web3;

    public async fetchCommitments(
        fromBlockNumber: number,
        toBlockNumber?: number
    ): Promise<CommitmentsHistory> {
        const latestBlockNumber = toBlockNumber || (await this.web3.eth.getBlockNumber());
        info(
            `Start fetching commitments from ${fromBlockNumber} block to ${latestBlockNumber} block...`
        );

        const events = await this.recursiveFetchCommitments(fromBlockNumber, latestBlockNumber);

        const commitments = events
            .sort((a, b) => a.returnValues.leafIndex - b.returnValues.leafIndex)
            .map(e => new BigNumber(e.returnValues.commitment).toFixed(0));

        return {
            commitments,
            latestBlockNumber
        };
    }

    private async recursiveFetchCommitments(
        startBlockNumber: number,
        endBlockNumber: number
    ): Promise<any[]> {
        const contract = new this.web3.eth.Contract(
            this.provider.contract.abi,
            this.provider.contract.address
        );

        return new Promise(resolve => {
            contract.getPastEvents(
                this.eventName,
                {
                    fromBlock: startBlockNumber,
                    toBlock: endBlockNumber
                },
                (error: Error, events: any) => {
                    if (!error) {
                        resolve(events);
                    } else if (
                        error.message === 'Returned error: query returned more than 10000 results'
                    ) {
                        const middle = Math.round((startBlockNumber + endBlockNumber) / 2);
                        const requestPromises = [
                            this.recursiveFetchCommitments(startBlockNumber, middle),
                            this.recursiveFetchCommitments(middle + 1, endBlockNumber)
                        ];
                        Promise.all(requestPromises).then(responses => resolve(responses.flat()));
                    }
                }
            );
        });
    }
}
