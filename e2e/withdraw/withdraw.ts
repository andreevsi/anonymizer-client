/* eslint-disable @typescript-eslint/no-magic-numbers */
import BigNumber from 'bignumber.js';
import { clearData, getWallet } from '../helpers/storage';
import { Web3Helper } from '../helpers/web3-helper';
import { providerStub } from '../../test/stub/provider.stub';
import { execute } from '../helpers/execute';

describe('withdraw', () => {
    let web3Helper: Web3Helper;

    beforeEach(async () => {
        web3Helper = new Web3Helper();
        await web3Helper.init();
    });

    beforeAll(async () => {
        await providerStub.init();
        jest.setTimeout(60000);
    });

    afterAll(() => {
        jest.setTimeout(5000);
    });

    it('should withdraw', async () => {
        const ethAmount = '30000000001';
        const weenusAmount = '1';
        await web3Helper.init();

        await web3Helper.fixStartBlockNumber();

        const stdout = await execute(`node dist/src/index withdraw [${ethAmount},${weenusAmount}]`);
        const txHashRegex = /Successfully withdraw in (0x[0-9a-zA-Z]{64})/;
        const matches = stdout.match(txHashRegex);
        const txHash = matches?.[1];

        expect(Array.isArray(matches)).toBeTruthy();
        expect(txHash).toBeTruthy();

        const result = await web3Helper.decodeTx(txHash);
        const wallet = await getWallet();
        const expectedTokensAmounts = [
            ethAmount,
            weenusAmount,
            ...Array(Number(process.env.TOKENS_NUMBER) - 2).fill('0')
        ];
        expect(result.status).toBeTruthy();
        expect(result.parameters.slice(1)).toEqual(expectedTokensAmounts);
        expect(wallet.commitment).toEqual(result.parameters[0]);
        expect(wallet.nullifier).toBeTruthy();
        expect(wallet.tokensAmounts.map(tokenaAmount => tokenaAmount.amount)).toEqual(
            expectedTokensAmounts
        );
    });
});
