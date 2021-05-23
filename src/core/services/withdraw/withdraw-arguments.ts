import { OperationArguments } from '../models/operation-arguments';
import { TokenAmount } from '../../models/token-amount';

export interface WithdrawArguments extends OperationArguments {
    tokensAmounts: TokenAmount[];
    recipient: string;
}
