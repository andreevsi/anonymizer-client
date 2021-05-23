import { OperationArguments } from '../models/operation-arguments';
import { Token } from '../../models/token';

export interface SwapArguments extends OperationArguments {
    fromToken: Token;
    toToken: Token;
    fromAmount: string;
}
