import { Wallet } from '../../cli/models/wallet';
import { IWalletStorage } from '../../cli/models/i-wallet-storage';
import { OperationArguments } from './models/operation-arguments';
import { KeysGenerator } from '../snark-proof-generator/keys-generator';
import { SnarkProofGenerator } from '../snark-proof-generator/snark-proof-generator';
import { OperationInput } from './models/operation-input';

export abstract class OperationService {
    protected static circuitsDistPath = `${process.cwd()}/resources/circuits-dist`;

    protected abstract walletStorage: IWalletStorage;

    protected abstract keysGenerator: KeysGenerator;

    protected abstract snarkProofGenerator: SnarkProofGenerator;

    public abstract executeOperation(
        operationInput: OperationArguments,
        wallet: Wallet
    ): Promise<void | string | { txHash: string; success: boolean }>;

    protected logOperationStart(
        operationName: string,
        operationInput: OperationInput,
        publicSignals: string[]
    ): Promise<void> {
        return this.walletStorage.logHistory(
            `
${new Date(Date.now()).toISOString()} - [start] - ${operationName}
    operation input: ${JSON.stringify(operationInput)}                
    public signals: ${JSON.stringify(publicSignals)}

`
        );
    }

    protected logOperationEnd(
        operationName: string,
        success: boolean,
        commitment?: string,
        transactionHash?: string,
        message?: string
    ): Promise<void> {
        return this.walletStorage.logHistory(
            `
${new Date(Date.now()).toISOString()} - [end] - ${operationName}
    success: ${success}
    ${commitment ? `commitment: ${commitment}` : ''}
    ${transactionHash ? `transaction hash: ${transactionHash}` : ''}
    ${message || ''}
`
        );
    }
}
