import Web3 from 'web3';
import { ProviderData } from './provider-data';

export interface Provider {
    web3: Web3;
    defaultGasLimit: number;
    chainId: number;
    contract: {
        address: string;
        abi: any[];
        commitmentEventName: string;
    };
    uniswap: {
        address: string;
        abi: any[];
    };
    address: string;
    init: (providerData?: ProviderData) => Promise<void>;
}
