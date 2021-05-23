import { Proof } from '../../core/snark-proof-generator/models/proof';

export interface RelayerRequest {
    method: 'swap' | 'withdraw' | 'dropWallet';
    proof: Proof;
    publicSignals: string[];
}
