/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TokenAmount } from '../src/core/models/token-amount';

export const TEST_TOKENS = {
    ETH: {
        name: 'Ether',
        symbol: 'ETH',
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18
    },
    WEENUS: {
        name: 'Weenus',
        symbol: 'WEENUS',
        address: '0xaff4481d10270f50f203e0763e2597776068cbc5',
        decimals: 18
    },
    YEENUS: {
        name: 'Yeenus',
        symbol: 'YEENUS',
        address: '0xc6fde3fd2cc2b173aec24cc3f267cb3cd78a26b7',
        decimals: 8
    },
    XEENUS: {
        name: 'Xeenus',
        symbol: 'XEENUS',
        address: '0x022e292b44b5a146f2e8ee36ff44d3dd863c915c',
        decimals: 18
    },
    RBC: {
        name: 'Rubic',
        symbol: 'RBC',
        address: '0xc5228008c89dfb03937ff5ff9124f0d7bd2028f9',
        decimals: 18
    }
};

export function buildTestTokenAmountsArray(tokensValues: (number | string)[]): TokenAmount[] {
    const tokensNumber = Number(process.env.TOKENS_NUMBER);
    const testTokensArray = Object.values(TEST_TOKENS);

    const emptyToken = {
        name: 'None',
        symbol: '',
        address: '',
        decimals: 18
    };
    const emptyTokens = Array(tokensNumber - testTokensArray.length).fill(emptyToken);

    const tokens = testTokensArray.concat(emptyTokens);
    const values = tokensValues.concat(Array(tokens.length - tokensValues.length).fill(0));
    return tokens.map((token, index) => ({
        token,
        amount: values[index].toString()
    }));
}
