import { Web3Service } from '../../crypto/web3-service';
import { TokenAmount } from '../models/token-amount';

export class BalanceProvider {
    constructor(private web3Service: Web3Service) {}

    public async checkBalanceAndProvideAllowance(tokensAmounts: TokenAmount[]): Promise<void> {
        const nonZeroErcTokens = tokensAmounts.filter(
            tokenAmount =>
                Number(tokenAmount.amount) !== 0 &&
                !this.web3Service.isNativeCoin(tokenAmount.token.address)
        );
        const nativeCoin = tokensAmounts.find(tokenAmount =>
            this.web3Service.isNativeCoin(tokenAmount.token.address)
        );

        if (nativeCoin) {
            const balance = await this.web3Service.getBalance();
            if (balance.lte(nativeCoin.amount)) {
                throw Error('Insufficient native coin funds');
            }
        }

        const balances = await Promise.all(
            nonZeroErcTokens.map(elem => this.web3Service.getTokenBalance(elem.token.address))
        );
        const allowances = await Promise.all(
            nonZeroErcTokens.map(elem => this.web3Service.getAllowance(elem.token.address))
        );

        nonZeroErcTokens.forEach((elem, index) => {
            if (balances[index].lt(elem.amount)) {
                throw Error(`Insufficient ${elem.token.symbol} funds`);
            }
        });

        let index = 0;
        for (const tokenAmount of nonZeroErcTokens) {
            if (allowances[index].lt(tokenAmount.amount)) {
                // no parallel approvals because of tx nonce
                // eslint-disable-next-line no-await-in-loop
                await this.web3Service.approveTokensToInfinity(tokenAmount.token.address);
            }
            index++;
        }
    }
}
