/* eslint-disable @typescript-eslint/no-unused-vars */
import { Relayer } from '../../src/relayer-api/models/relayer';
import { RelayerRequest } from '../../src/relayer-api/models/relayer-request';

export interface RelayersRouterStub {
    getMostRelevantRelayer(): Promise<Relayer>;
    relay(relayer: Relayer, relayerRequest: RelayerRequest): Promise<void>;
}

export type MockRelayersRouterStub = {
    [key in keyof RelayersRouterStub]: jest.Mock<ReturnType<RelayersRouterStub[key]>>;
};

export function mockRelayersRouterStub(relevantRelayerStub: {
    relayer: Relayer;
}): MockRelayersRouterStub {
    return {
        getMostRelevantRelayer: jest.fn(
            (): Promise<Relayer> => Promise.resolve(relevantRelayerStub.relayer)
        ),
        relay: jest.fn(
            (relayer: Relayer, relayerRequest: RelayerRequest): Promise<void> => Promise.resolve()
        )
    };
}
