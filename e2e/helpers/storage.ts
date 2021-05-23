import fs from 'fs';
import { Wallet } from '../../src/cli/models/wallet';

export async function clearData() {
    const dir = `${process.cwd()}/.data`;
    return fs.promises.rmdir(dir, { recursive: true });
}

export async function getWallet() {
    const fileName = `${process.cwd()}/.data/.wallet-${process.env.CONTRACT_ADDRESS}-${
        process.env.CHAIN_ID
    }.json`;
    const walletRaw: Buffer = await fs.promises.readFile(fileName);
    return JSON.parse(walletRaw.toString()) as Wallet;
}
