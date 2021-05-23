/* eslint-disable @typescript-eslint/no-magic-numbers */
import BigNumber from 'bignumber.js';
import { KeysGenerator } from '../../../src/core/snark-proof-generator/keys-generator';

describe('keys generator', () => {
    it('should return correct length keys', () => {
        const keysGenerator = new KeysGenerator();
        const { secret, nullifier } = keysGenerator.generateKeysPair();
        expect(new BigNumber(secret).toString(16).length).toBe(62);
        expect(new BigNumber(nullifier).toString(16).length).toBe(62);
        expect(secret).not.toBe(nullifier);
    });

    it('should return different keys', () => {
        const keysGenerator = new KeysGenerator();
        const { secret: secret1, nullifier: nullifier1 } = keysGenerator.generateKeysPair();
        const { secret: secret2, nullifier: nullifier2 } = keysGenerator.generateKeysPair();

        expect(secret1).not.toBe(secret2);
        expect(nullifier1).not.toBe(nullifier2);
    });
});
