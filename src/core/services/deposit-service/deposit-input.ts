import { OperationInput } from '../models/operation-input';
import bit from '../../models/bit';

export interface DepositInput extends OperationInput {
    root: string;
    concealer_old: string;
    ai_deltas: string[];
    ai_list_old: string[];
    ai_list_new: string[];
    secret_old: string;
    secret_new: string;
    concealer_new: string;
    pathElements: string[];
    pathIndices: bit[];
}
