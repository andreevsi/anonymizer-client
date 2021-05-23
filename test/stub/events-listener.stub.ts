/* eslint-disable @typescript-eslint/no-unused-vars */
import EventEmitter from 'events';

export interface EventsListenerStub {
    startScan(
        commitmentsToFind: string[],
        callbacks: {
            onCommitmentFind: (commitment: string, txHash: string) => void;
            onTimeoutEnd: () => void;
        }
    ): Promise<void>;
    stopScan(): Promise<boolean>;
}

export type MockEventsListenerStub = {
    [key in keyof EventsListenerStub]: jest.Mock<ReturnType<EventsListenerStub[key]>>;
};

export function mockEventsListenerStub(eventDataStub: {
    timeout: number;
    commitment: string;
    txHash: string;
    callOnTimeoutEnd: boolean;
}): MockEventsListenerStub {
    return {
        startScan: jest.fn(
            (
                commitmentsToFind: string[],
                callbacks: {
                    onCommitmentFind: (commitment: string, txHash: string) => void;
                    onTimeoutEnd: () => void;
                }
            ): Promise<void> => {
                setTimeout(
                    () =>
                        eventDataStub.callOnTimeoutEnd
                            ? callbacks.onTimeoutEnd()
                            : callbacks.onCommitmentFind(
                                  eventDataStub.commitment,
                                  eventDataStub.txHash
                              ),
                    eventDataStub.timeout
                );
                return Promise.resolve();
            }
        ),
        stopScan: jest.fn((): Promise<boolean> => Promise.resolve(true))
    };
}
