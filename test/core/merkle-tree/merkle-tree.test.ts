/* eslint-disable @typescript-eslint/no-unused-vars */
import CommitmentsHistory from '../../../src/crypto/models/commitments-history';
import MerkleTree from '../../../src/core/merkle-tree/merkle-tree';
import { SerializedTree } from '../../../src/core/merkle-tree/models/serialized-tree';
import TreeFetcher from '../../../src/crypto/tree-fetcher';

describe('Merkle tree', () => {
    let emptyTree: SerializedTree;
    const treeLevels = 4;

    beforeEach(() => {
        const layers = [...Array(treeLevels)].map(() => []);

        emptyTree = {
            treeLevels,
            layers,
            root: '',
            latestBlockNumber: -1
        };
    });

    test('Should calculate correct root', async () => {
        const treeFetcherStub: TreeFetcher = {
            fetchCommitments(fromBlockNumber: number): Promise<CommitmentsHistory> {
                return Promise.resolve({
                    commitments: [
                        '21075943479167553648614525231599574948546152452881088304844047328344502313958',
                        '14448219293738909455402265242403515096209398348429048748817083916789372293916'
                    ],
                    latestBlockNumber: fromBlockNumber + 2
                });
            }
        } as TreeFetcher;
        const saveTreeStub = jest.fn((tree: SerializedTree) => {});
        const tree = new MerkleTree(emptyTree, treeFetcherStub, saveTreeStub);

        const { pathElements, pathIndexes } = await tree.updateAndGetPath(
            '14448219293738909455402265242403515096209398348429048748817083916789372293916'
        );

        expect(pathElements).toEqual([
            '21075943479167553648614525231599574948546152452881088304844047328344502313958',
            '16923532097304556005972200564242292693309333953544141029519619077135960040221',
            '7833458610320835472520144237082236871909694928684820466656733259024982655488',
            '14506027710748750947258687001455876266559341618222612722926156490737302846427'
        ]);
        expect(pathIndexes).toEqual([1, 0, 0, 0]);
        expect(saveTreeStub.mock.calls.length).toBe(1);
        expect(saveTreeStub.mock.calls[0][0]).toEqual({
            root: '14582270858101069057756407375424031133664598385105496509556802343015348135391',
            layers: [
                [
                    '21075943479167553648614525231599574948546152452881088304844047328344502313958',
                    '14448219293738909455402265242403515096209398348429048748817083916789372293916'
                ],
                ['11839932069652697033237086233130144252045791667725111427161524165155473109856'],
                ['21675859677956385208943197345302466261442818946002650510645287969503773917257'],
                ['5751165549514028860515512939231696716946533627211446034780371819694630473334']
            ],
            treeLevels,
            latestBlockNumber: 2
        });
    });

    test('Should update only block number if there are no new commitments', async () => {
        let fetchCallsNumber = -1;
        const firstUpdateBlockNumber = 2;
        const secondUpdateBlockNumber = 5;
        const treeFetcherStub: TreeFetcher = {
            fetchCommitments(fromBlockNumber: number): Promise<CommitmentsHistory> {
                fetchCallsNumber++;
                return Promise.resolve(
                    fetchCallsNumber === 0
                        ? {
                              commitments: [
                                  '21075943479167553648614525231599574948546152452881088304844047328344502313958',
                                  '14448219293738909455402265242403515096209398348429048748817083916789372293916'
                              ],
                              latestBlockNumber: fromBlockNumber + firstUpdateBlockNumber
                          }
                        : {
                              commitments: [],
                              latestBlockNumber: fromBlockNumber + secondUpdateBlockNumber
                          }
                );
            }
        } as TreeFetcher;
        const saveTreeStub = jest.fn((tree: SerializedTree) => {});
        const tree = new MerkleTree(emptyTree, treeFetcherStub, saveTreeStub);

        await tree.updateAndGetPath(
            '21075943479167553648614525231599574948546152452881088304844047328344502313958'
        );

        await tree.updateAndGetPath(
            '14448219293738909455402265242403515096209398348429048748817083916789372293916'
        );

        expect(saveTreeStub.mock.calls.length).toBe(2);
        expect(saveTreeStub.mock.calls[0][0]).toEqual({
            root: '14582270858101069057756407375424031133664598385105496509556802343015348135391',
            layers: [
                [
                    '21075943479167553648614525231599574948546152452881088304844047328344502313958',
                    '14448219293738909455402265242403515096209398348429048748817083916789372293916'
                ],
                ['11839932069652697033237086233130144252045791667725111427161524165155473109856'],
                ['21675859677956385208943197345302466261442818946002650510645287969503773917257'],
                ['5751165549514028860515512939231696716946533627211446034780371819694630473334']
            ],
            treeLevels,
            latestBlockNumber: firstUpdateBlockNumber
        });
        expect(saveTreeStub.mock.calls[1][0]).toEqual({
            root: '14582270858101069057756407375424031133664598385105496509556802343015348135391',
            layers: [
                [
                    '21075943479167553648614525231599574948546152452881088304844047328344502313958',
                    '14448219293738909455402265242403515096209398348429048748817083916789372293916'
                ],
                ['11839932069652697033237086233130144252045791667725111427161524165155473109856'],
                ['21675859677956385208943197345302466261442818946002650510645287969503773917257'],
                ['5751165549514028860515512939231696716946533627211446034780371819694630473334']
            ],
            treeLevels,
            latestBlockNumber: firstUpdateBlockNumber + 1 + secondUpdateBlockNumber
        });
    });

    test('Should correctly update tree after second fetch', async () => {
        let fetchCallsNumber = -1;
        const firstUpdateBlockNumber = 2;
        const secondUpdateBlockNumber = 5;
        const treeFetcherStub: TreeFetcher = {
            fetchCommitments(fromBlockNumber: number): Promise<CommitmentsHistory> {
                fetchCallsNumber++;
                return Promise.resolve(
                    fetchCallsNumber === 0
                        ? {
                              commitments: [
                                  '21075943479167553648614525231599574948546152452881088304844047328344502313958',
                                  '14448219293738909455402265242403515096209398348429048748817083916789372293916'
                              ],
                              latestBlockNumber: fromBlockNumber + firstUpdateBlockNumber
                          }
                        : {
                              commitments: [
                                  '34548211293738909455402265242413515046209398349429048748817083916789372294342'
                              ],
                              latestBlockNumber: fromBlockNumber + secondUpdateBlockNumber
                          }
                );
            }
        } as TreeFetcher;
        const saveTreeStub = jest.fn((tree: SerializedTree) => {});
        const tree = new MerkleTree(emptyTree, treeFetcherStub, saveTreeStub);

        await tree.updateAndGetPath(
            '21075943479167553648614525231599574948546152452881088304844047328344502313958'
        );

        await tree.updateAndGetPath(
            '34548211293738909455402265242413515046209398349429048748817083916789372294342'
        );

        expect(saveTreeStub.mock.calls.length).toBe(2);
        expect(saveTreeStub.mock.calls[0][0]).toEqual({
            root: '14582270858101069057756407375424031133664598385105496509556802343015348135391',
            layers: [
                [
                    '21075943479167553648614525231599574948546152452881088304844047328344502313958',
                    '14448219293738909455402265242403515096209398348429048748817083916789372293916'
                ],
                ['11839932069652697033237086233130144252045791667725111427161524165155473109856'],
                ['21675859677956385208943197345302466261442818946002650510645287969503773917257'],
                ['5751165549514028860515512939231696716946533627211446034780371819694630473334']
            ],
            treeLevels,
            latestBlockNumber: firstUpdateBlockNumber
        });
        expect(saveTreeStub.mock.calls[1][0]).toEqual({
            root: '16118135447192614615320478047789472382097761517045820618594256564645386954516',
            layers: [
                [
                    '21075943479167553648614525231599574948546152452881088304844047328344502313958',
                    '14448219293738909455402265242403515096209398348429048748817083916789372293916',
                    '34548211293738909455402265242413515046209398349429048748817083916789372294342'
                ],
                [
                    '11839932069652697033237086233130144252045791667725111427161524165155473109856',
                    '21603406944810790151089339684576493955211118567894685474100688288091118708247'
                ],
                ['551179706602603856721135112173164800414099585701559689324564677601924407515'],
                ['3998123815070557482559993558957070142515585472413948037212972489985195812688']
            ],
            treeLevels,
            latestBlockNumber: firstUpdateBlockNumber + 1 + secondUpdateBlockNumber
        });
    });
});
