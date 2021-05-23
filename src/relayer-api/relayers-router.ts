import BigNumber from 'bignumber.js';
import { HttpClient } from './http-client';
import { Relayer } from './models/relayer';
import { RelayerRequest } from './models/relayer-request';

export class RelayersRouter {
    private relayersManagerUrl = process.env.RELAYERS_MANAGER_URL;

    private relayersUrlsList: string[];

    constructor(private httpClient: HttpClient) {}

    public async relay(relayer: Relayer, relayerRequest: RelayerRequest): Promise<void> {
        await this.httpClient.post(`${relayer.url}/relay`, relayerRequest);
    }

    private async updateRelayersList(): Promise<void> {
        // this.relayersUrlsList = await this.httpClient.get(`${this.relayersManagerUrl}/relayers`);
        this.relayersUrlsList = ['http://localhost:53000'];
    }

    public async getMostRelevantRelayer(): Promise<Relayer> {
        await this.updateRelayersList();
        const relayersRequests = this.relayersUrlsList.map(async relayerUrl => {
            const relayerInfo: Omit<Relayer, 'url'> = await this.httpClient.get(
                `${relayerUrl}/relay`
            );
            return {
                ...relayerInfo,
                url: relayerUrl
            };
        });
        const relayers = (await Promise.allSettled(relayersRequests))
            .filter(result => result.status === 'fulfilled')
            .map((result: PromiseFulfilledResult<Relayer>) => result.value);

        relayers.sort((a, b) => (new BigNumber(b.fee).minus(a.fee).gt(0) ? 1 : -1));
        return relayers[0];
    }
}
