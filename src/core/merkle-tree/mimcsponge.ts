// @ts-ignore
import circomlib from 'circomlib';

const { mimcsponge } = circomlib;

const mimcSpongeHasher = {
    hash(left: string, right: string): string {
        return mimcsponge.multiHash([left, right]).toString();
    }
};

export default mimcSpongeHasher;
