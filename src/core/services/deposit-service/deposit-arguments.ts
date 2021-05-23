import { OperationArguments } from '../models/operation-arguments';
import { TokenAmount } from '../../models/token-amount';

export interface DepositArguments extends OperationArguments {
    tokensAmounts: TokenAmount[];
}
