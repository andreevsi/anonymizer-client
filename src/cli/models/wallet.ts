import { TokenAmount } from '../../core/models/token-amount';

export interface Wallet {
    tokensAmounts: TokenAmount[];
    secret: string;
    nullifier: string;
    commitment: string;
}
