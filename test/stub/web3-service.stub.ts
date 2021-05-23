/* eslint-disable @typescript-eslint/no-unused-vars */
import BigNumber from 'bignumber.js';
import { TransactionReceipt } from 'web3-eth';
import { methods } from '../../src/crypto/models/methods';
import { Web3Service } from '../../src/crypto/web3-service';

export interface Web3ServiceStub {
    isNativeCoin(address: string): boolean;
    getBalance(): Promise<BigNumber>;
    getTokenBalance(tokenAddress: string): Promise<BigNumber>;
    getAllowance(tokenAddress: string): Promise<BigNumber>;
    approveTokensToInfinity(tokenAddress: string): Promise<TransactionReceipt>;
    executeContractMethod(
        methodName: methods,
        methodArguments: any[],
        options: {
            onTransactionHash?: (hash: string) => void;
            value?: BigNumber | string;
        }
    ): Promise<TransactionReceipt>;
    getCommitmentFromReceipt(receipt: TransactionReceipt): BigNumber;
    checkRoot(root: string): Promise<boolean>;
    getUniwapOutput(
        fromTokenAddress: string,
        toTokenAddress: string,
        fromAmount: string
    ): Promise<BigNumber>;
}

export type MockWeb3ServiceStub = {
    [key in keyof Web3ServiceStub]: jest.Mock<ReturnType<Web3Service[key]>>;
};

export function mockWeb3ServiceStub(
    ethBalance: number,
    balances: { [key: string]: number },
    allowances: { [key: string]: number },
    fakeReceipt?: TransactionReceipt,
    correctRoots?: string[],
    uniswapOutput?: { toAmount: number }
): MockWeb3ServiceStub {
    return {
        isNativeCoin: jest.fn((address: string): boolean => {
            return address === '0x0000000000000000000000000000000000000000';
        }),
        getBalance: jest.fn(
            (): Promise<BigNumber> => {
                return Promise.resolve(new BigNumber(ethBalance));
            }
        ),
        getTokenBalance: jest.fn(
            (tokenAddress: string): Promise<BigNumber> => {
                return Promise.resolve(new BigNumber(balances[tokenAddress]));
            }
        ),
        getAllowance: jest.fn(
            (tokenAddress: string): Promise<BigNumber> => {
                return Promise.resolve(new BigNumber(allowances[tokenAddress]));
            }
        ),
        approveTokensToInfinity: jest.fn(
            (tokenAddress: string): Promise<TransactionReceipt> => {
                return Promise.resolve(null);
            }
        ),
        executeContractMethod: jest.fn(
            (
                methodName: methods,
                methodArguments: any[],
                options: {
                    onTransactionHash?: (hash: string) => void;
                    value?: BigNumber | string;
                } = {}
            ): Promise<TransactionReceipt> => {
                return Promise.resolve(fakeReceipt);
            }
        ),
        getCommitmentFromReceipt: jest.fn(
            (receipt: TransactionReceipt): BigNumber => {
                return new BigNumber(receipt.events.Commitment.returnValues.commitment);
            }
        ),
        checkRoot: jest.fn(
            (root: string): Promise<boolean> => {
                if (!correctRoots || correctRoots.includes(root)) {
                    return Promise.resolve(true);
                }
                return Promise.resolve(false);
            }
        ),
        getUniwapOutput: jest.fn(
            (
                fromTokenAddress: string,
                toTokenAddress: string,
                fromAmount: string
            ): Promise<BigNumber> => {
                return Promise.resolve(new BigNumber(uniswapOutput.toAmount));
            }
        )
    };
}
