/* eslint-disable @typescript-eslint/no-magic-numbers */
import TreeFetcher from '../../src/crypto/tree-fetcher';
import { providerStub } from '../stub/provider.stub';

describe('tree fetcher', () => {
    beforeAll(async () => {
        await providerStub.init();
        jest.setTimeout(30000);
    });

    afterAll(() => {
        jest.setTimeout(5000);
    });

    it('should load commitments from creation block to fixed block', async () => {
        const treeFetcher = new TreeFetcher(providerStub);
        const contractCreationBlockNumber = 24524949;
        const toBlockNumber = 24647094;
        const commitmentsHistory = await treeFetcher.fetchCommitments(
            contractCreationBlockNumber,
            toBlockNumber
        );

        expect(commitmentsHistory.latestBlockNumber).toBe(toBlockNumber);
        expect(commitmentsHistory.commitments).toEqual([
            '10700254109011470054397954147660446662782195007514041273199618928801488693503',
            '11487105961056909028512289822586091876413458832114889091201828517344458100441',
            '18888802250979148816720313136824631587365825312470030189691753083384398362306'
        ]);
    });

    it('should load commitments from creation block to latest block', async () => {
        const treeFetcher = new TreeFetcher(providerStub);
        const contractCreationBlockNumber = 24524949;
        const latestBlockNumber = await providerStub.web3.eth.getBlockNumber();
        const commitmentsHistory = await treeFetcher.fetchCommitments(contractCreationBlockNumber);

        expect(commitmentsHistory.latestBlockNumber).toBeGreaterThanOrEqual(latestBlockNumber);
        expect(commitmentsHistory.commitments.length).toBeGreaterThanOrEqual(3);
    });
});
