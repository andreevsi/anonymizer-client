import Web3 from 'web3';
import { ProviderData } from './models/provider-data';
import { Provider } from './models/provider';
import { ANONYMIZER_ABI, UNISWAP_ABI } from './models/abi/index';

const provider: Provider = {
    web3: null,
    defaultGasLimit: null,
    contract: null,
    chainId: null,
    address: null,
    uniswap: null,
    async init(providerData: ProviderData): Promise<void> {
        const { rpc } = providerData;
        this.web3 = new Web3(rpc);
        this.defaultGasLimit = providerData.defaultGasLimit;
        this.chainId = await this.web3.eth.getChainId();
        this.contract = {
            address: providerData.contractAddress,
            abi: ANONYMIZER_ABI,
            commitmentEventName: 'Commitment'
        };
        this.uniswap = {
            address: providerData.uniswapAddress,
            abi: UNISWAP_ABI
        };
        const account = await this.web3.eth.accounts.wallet.add(providerData.privateKey);
        this.address = account.address;
    }
};

export default provider;
