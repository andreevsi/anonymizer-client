import { OperationArguments } from '../models/operation-arguments';
import { TokenAmount } from '../../models/token-amount';

export interface CreateWalletArguments extends OperationArguments {
    tokensAmounts: TokenAmount[];
}
