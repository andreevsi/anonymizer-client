import provider from '../../src/crypto/provider';
import { Provider } from '../../src/crypto/models/provider';
import { ProviderData } from '../../src/crypto/models/provider-data';

const providerData: ProviderData = {
    rpc: process.env.RPC_LINK,
    defaultGasLimit: Number(process.env.DEFAULT_GAS_LIMIT),
    contractAddress: process.env.CONTRACT_ADDRESS,
    uniswapAddress: process.env.UNISWAP_ADDRESS,
    privateKey: process.env.PRIVATE_KEY
};
export const providerStub: Provider = { ...provider };
providerStub.init = () => provider.init.call(providerStub, providerData);
