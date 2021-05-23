/* eslint-disable @typescript-eslint/no-magic-numbers */
import BigNumber from 'bignumber.js';
import { providerStub } from '../stub/provider.stub';
import { Web3Service } from '../../src/crypto/web3-service';
import { TEST_TOKENS } from '../tokens';

describe('web3 service', () => {
    let web3Service: Web3Service;

    beforeAll(async () => {
        await providerStub.init();
        jest.setTimeout(60000);
    });

    afterAll(() => {
        jest.setTimeout(5000);
    });

    beforeEach(() => {
        web3Service = new Web3Service(providerStub);
    });

    it('get correct balance', async () => {
        const balance = await web3Service.getBalance();
        const realBalance = await providerStub.web3.eth.getBalance(providerStub.address);

        expect(balance.isEqualTo(realBalance)).toBeTruthy();
        expect(balance.isGreaterThan(0)).toBeTruthy();
    });

    it('get tokens balance', async () => {
        const tokenAddress = TEST_TOKENS.RBC.address;
        const tokenDecimals = 18;
        const realBalance = new BigNumber(239).multipliedBy(10 ** tokenDecimals);
        const balance = await web3Service.getTokenBalance(tokenAddress);

        expect(realBalance.isEqualTo(balance)).toBeTruthy();
    });

    it('get allowance', async () => {
        const tokenAddress = TEST_TOKENS.RBC.address;
        const allowance = await web3Service.getAllowance(tokenAddress);

        expect(allowance).not.toBe(undefined);
        expect(allowance.isGreaterThanOrEqualTo(0)).toBeTruthy();
    });

    it('calculate uniswap trade', async () => {
        const amountOut = await web3Service.getUniwapOutput(
            TEST_TOKENS.ETH.address,
            TEST_TOKENS.WEENUS.address,
            '3000000000'
        );

        expect(amountOut).not.toBe(undefined);
        expect(amountOut.isGreaterThan(0)).toBeTruthy();
    });

    it('should validate correct root in decimal format', async () => {
        const root = '9963436399685110527748796971679325277564542445582481882008266758373487601507';
        const rootCorrectness = await web3Service.checkRoot(root);

        expect(rootCorrectness).toBeTruthy();
    });

    it('should validate correct root in hex format', async () => {
        const root = '0x16071aebc1c77124b4f2a167a40a27c51d147d597eaa26559365e0ba3bf6e763';
        const rootCorrectness = await web3Service.checkRoot(root);

        expect(rootCorrectness).toBeTruthy();
    });

    it('should reject incorrect root', async () => {
        const root = '1234567890';
        const rootCorrectness = await web3Service.checkRoot(root);

        expect(rootCorrectness).not.toBeTruthy();
    });

    it('approve should works', async () => {
        await web3Service.unApprove(TEST_TOKENS.XEENUS.address);
        const allowance = await web3Service.getAllowance(TEST_TOKENS.XEENUS.address);

        expect(allowance.isEqualTo(0)).toBeTruthy();

        const amountToApprove = new BigNumber(123456789);
        await web3Service.approveTokens(TEST_TOKENS.XEENUS.address, amountToApprove);
        const newAllowance = await web3Service.getAllowance(TEST_TOKENS.XEENUS.address);

        expect(newAllowance.isEqualTo(amountToApprove)).toBeTruthy();
    });

    it('approve to infinity should works', async () => {
        await web3Service.unApprove(TEST_TOKENS.XEENUS.address);
        const allowance = await web3Service.getAllowance(TEST_TOKENS.XEENUS.address);

        expect(allowance.isEqualTo(0)).toBeTruthy();

        await web3Service.approveTokensToInfinity(TEST_TOKENS.XEENUS.address);
        const newAllowance = await web3Service.getAllowance(TEST_TOKENS.XEENUS.address);
        const infinity = new BigNumber(2).pow(256).minus(1);

        expect(newAllowance.isEqualTo(infinity)).toBeTruthy();
    });
});
