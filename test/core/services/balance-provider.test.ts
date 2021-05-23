/* eslint-disable @typescript-eslint/no-magic-numbers,@typescript-eslint/no-unused-vars */
import BigNumber from 'bignumber.js';
import { TransactionReceipt } from 'web3-eth';
import { BalanceProvider } from '../../../src/core/services/balance-provider';
import { Web3Service } from '../../../src/crypto/web3-service';
import { buildTestTokenAmountsArray, TEST_TOKENS } from '../../tokens';
import {
    mockWeb3ServiceStub,
    MockWeb3ServiceStub,
    Web3ServiceStub
} from '../../stub/web3-service.stub';

describe('check balance and allowance', () => {
    let balanceProvider: BalanceProvider;

    const ethBalance = 10;

    const balances = {
        [TEST_TOKENS.WEENUS.address]: 15,
        [TEST_TOKENS.YEENUS.address]: 25
    };

    const allowances = {
        [TEST_TOKENS.WEENUS.address]: 17,
        [TEST_TOKENS.YEENUS.address]: 3
    };

    let web3ServiceStub: MockWeb3ServiceStub;

    beforeEach(() => {
        web3ServiceStub = mockWeb3ServiceStub(ethBalance, balances, allowances);
        balanceProvider = new BalanceProvider(<Web3Service>(web3ServiceStub as Web3ServiceStub));
    });

    it('should only check balance when no tokens in trade', async () => {
        const tokensValues = [7];
        const tokensAmounts = buildTestTokenAmountsArray(tokensValues);
        await balanceProvider.checkBalanceAndProvideAllowance(tokensAmounts);

        expect(web3ServiceStub.getBalance.mock.calls.length).toBe(1);
        expect(web3ServiceStub.getTokenBalance.mock.calls.length).toBe(0);
        expect(web3ServiceStub.getAllowance.mock.calls.length).toBe(0);
        expect(web3ServiceStub.approveTokensToInfinity.mock.calls.length).toBe(0);
    });

    it('should throw error if not enough ether', async () => {
        const tokensValues = [1000];
        const tokensAmounts = buildTestTokenAmountsArray(tokensValues);

        await expect(() =>
            balanceProvider.checkBalanceAndProvideAllowance(tokensAmounts)
        ).rejects.toThrow('Insufficient native coin funds');
    });

    it('should check balance and not call approve if allowance exists', async () => {
        const tokensValues = [7, 13, 2];
        const tokensAmounts = buildTestTokenAmountsArray(tokensValues);
        await balanceProvider.checkBalanceAndProvideAllowance(tokensAmounts);

        expect(web3ServiceStub.getBalance.mock.calls.length).toBe(1);
        expect(web3ServiceStub.getTokenBalance.mock.calls.length).toBe(2);
        expect(web3ServiceStub.getAllowance.mock.calls.length).toBe(2);
        expect(web3ServiceStub.approveTokensToInfinity.mock.calls.length).toBe(0);
    });

    it('should throw error if not enough tokens', async () => {
        const tokensValues = [7, 1000, 2];
        const tokensAmounts = buildTestTokenAmountsArray(tokensValues);

        await expect(() =>
            balanceProvider.checkBalanceAndProvideAllowance(tokensAmounts)
        ).rejects.toThrow(`Insufficient ${TEST_TOKENS.WEENUS.symbol} funds`);
    });

    it('should call approve if allowance not exists', async () => {
        const tokensValues = [7, 13, 15];
        const tokensAmounts = buildTestTokenAmountsArray(tokensValues);
        await balanceProvider.checkBalanceAndProvideAllowance(tokensAmounts);

        expect(web3ServiceStub.getBalance.mock.calls.length).toBe(1);
        expect(web3ServiceStub.getTokenBalance.mock.calls.length).toBe(2);
        expect(web3ServiceStub.getAllowance.mock.calls.length).toBe(2);
        expect(web3ServiceStub.approveTokensToInfinity.mock.calls.length).toBe(1);
        expect(web3ServiceStub.approveTokensToInfinity.mock.calls[0][0]).toBe(
            TEST_TOKENS.YEENUS.address
        );
    });
});
