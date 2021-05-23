import crypto from 'crypto';
import BigNumber from 'bignumber.js';
import { KeysPair } from './models/keys-pair';

export class KeysGenerator {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    static keyBytesNumber = 31;

    public generateRandomKey(): string {
        const keyBuffer = crypto.randomBytes(KeysGenerator.keyBytesNumber);
        const hexKey = `0x${keyBuffer.toString('hex')}`;
        return hexKey.length === KeysGenerator.keyBytesNumber * 2 + 2
            ? new BigNumber(`0x${keyBuffer.toString('hex')}`).toFixed()
            : this.generateRandomKey();
    }

    public generateKeysPair(): KeysPair {
        return {
            secret: this.generateRandomKey(),
            nullifier: this.generateRandomKey()
        };
    }
}
