import { OperationInput } from '../models/operation-input';

export interface CreateWalletInput extends OperationInput {
    secret: string;
    concealer: string;
    ai_list: string[];
}
