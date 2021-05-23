import MerkleTree from './merkle-tree/merkle-tree';
import TreeFetcher from '../crypto/tree-fetcher';
import { IStorage } from '../cli/models/i-storage';
import Path from './merkle-tree/models/path';
import { stdout } from '../cli/stdout';
import { CreateWalletService } from './services/create-wallet-service/create-wallet-service';
import { TokenAmount } from './models/token-amount';
import { Web3Service } from '../crypto/web3-service';
import { Provider } from '../crypto/models/provider';
import { DepositService } from './services/deposit-service/deposit-service';
import { SwapService } from './services/swap/swap-service';
import { Token } from './models/token';
import { WithdrawService } from './services/withdraw/withdraw-service';

export class AnonymizeManager {
    private tree: MerkleTree;

    private web3Service: Web3Service;

    constructor(private storage: IStorage) {}

    public async init(provider: Provider) {
        const treeFetcher = new TreeFetcher(provider);
        const tree = await this.storage.tree.loadMerkleTree();
        this.tree = new MerkleTree(
            tree,
            treeFetcher,
            this.storage.tree.saveMerkleTree.bind(this.storage.tree)
        );
        this.web3Service = new Web3Service(provider);
    }

    public getBalance = async (): Promise<void> => {
        const wallet = await this.storage.wallet.loadWallet();
        if (!wallet.commitment) {
            stdout('Wallet not exists');
        }
        stdout(JSON.stringify(wallet.tokensAmounts.filter(elem => elem.amount !== '0')));
    };

    public getMerklePathAndRoot = async (commitment: string) => {
        const path: Path = await this.tree.updateAndGetPath(commitment);
        const root = this.tree.currentRoot;
        const result = {
            ...path,
            root
        };
        stdout(JSON.stringify(result));
    };

    public createWallet = async (tokensAmounts: TokenAmount[]) => {
        const createWalletService = new CreateWalletService(this.storage.wallet, this.web3Service);
        const txHash = await createWalletService.executeOperation({ tokensAmounts });
        stdout(`Wallet successfully created in ${txHash}`);
    };

    public deposit = async (tokensAmounts: TokenAmount[]) => {
        const depositService = new DepositService(this.storage.wallet, this.web3Service, this.tree);
        const txHash = await depositService.executeOperation({ tokensAmounts });
        stdout(`Successfully deposit in ${txHash}`);
    };

    public swap = async (fromToken: Token, toToken: Token, fromAmount: string) => {
        const swapService = new SwapService(this.storage.wallet, this.web3Service, this.tree);
        const { txHash, success } = await swapService.executeOperation({
            fromToken,
            toToken,
            fromAmount
        });
        stdout(`${success ? 'Successfully' : 'Failed'} swap in: ${txHash}`);
    };

    public withdraw = async (tokensAmounts: TokenAmount[], recipient: string) => {
        const withdrawService = new WithdrawService(
            this.storage.wallet,
            this.web3Service,
            this.tree
        );
        const { txHash, success } = await withdrawService.executeOperation({
            tokensAmounts,
            recipient
        });
        stdout(`${success ? 'Successfully' : 'Failed'} withdraw in: ${txHash}`);
    };
}
