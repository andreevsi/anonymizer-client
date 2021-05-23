import { Proof } from './proof';

export interface SnarkjsOutput {
    proof: Proof;
    publicSignals: string[];
}
