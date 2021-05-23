import { OperationInput } from '../models/operation-input';
import bit from '../../models/bit';

export interface WithdrawInput extends OperationInput {
    root: string;
    concealer_old: string;
    fee: string;
    recipient: string;
    relayer: string;
    ai_deltas: string[];
    ai_list_old: string[];
    ai_list_new_success: string[];
    ai_list_new_fail: string[];
    old_secret: string;
    new_secret_success: string;
    new_secret_fail: string;
    new_concealer_success: string;
    new_concealer_fail: string;
    pathElements: string[];
    pathIndices: bit[];
}
