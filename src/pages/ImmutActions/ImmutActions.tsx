import { SortDirection } from '@eversdk/core';
import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import CopyClipboard from '../../components/CopyClipboard';
import Spinner from '../../components/Spinner';
import { GoshAction, GoshContentSignature } from '../../types/classes';
import { IGoshWallet } from '../../types/types';
import { shortString } from '../../utils';
import { TRepoLayoutOutletContext } from '../RepoLayout';

const ImmutActionsPage = () => {
    const { goshWallet } = useOutletContext<TRepoLayoutOutletContext>();
    const { repoName } = useParams();

    const [items, setItems] = useState<any[]>();

    useEffect(() => {
        const _getItems = async (wallet: IGoshWallet, repoName: string) => {
            // Get SCBA, action contract code hash
            const scba = await wallet.getContentCode(repoName);
            const action = await wallet.getActionCode(repoName);
            const types = {
                [scba.hash]: { name: 'SCBA', instance: GoshContentSignature },
                [action.hash]: { name: 'Action', instance: GoshAction },
            };

            // Get contracts by code hash
            const query = await wallet.account.client.net.query_collection({
                collection: 'messages',
                filter: {
                    code_hash: { in: [scba.hash, action.hash] },
                },
                result: 'dst created_at code_hash',
                order: [{ path: 'created_at', direction: SortDirection.DESC }],
            });

            const items = await Promise.all(
                query.result.map(async (item) => {
                    const object = new types[item.code_hash].instance(
                        wallet.account.client,
                        item.dst
                    );
                    await object.load();

                    return {
                        address: item.dst,
                        created_at: new Date(
                            item.created_at * 1000
                        ).toLocaleString(),
                        type: types[item.code_hash].name,
                        label: object.meta?.label,
                    };
                })
            );
            setItems(items.filter((item) => !!item.label));
        };

        if (goshWallet?.isDaoParticipant && repoName) {
            _getItems(goshWallet, repoName);
        }
    }, [goshWallet, repoName]);

    if (!goshWallet?.isDaoParticipant) {
        return (
            <div className="bordered-block px-7 py-8">
                <div className="text-sm text-gray-606060 text-center">
                    Should be a DAO participant
                </div>
            </div>
        );
    }
    return (
        <div className="bordered-block px-7 py-8">
            {items === undefined && (
                <div className="text-gray-606060 text-sm">
                    <Spinner className="mr-3" />
                    Loading contracts...
                </div>
            )}

            {items && !items?.length && (
                <div className="text-sm text-gray-606060 text-center">
                    There are no contracts yet
                </div>
            )}

            {!!items && (
                <div className="divide-y divide-gray-c4c4c4">
                    {items?.map((item, index) => (
                        <div
                            key={index}
                            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-2"
                        >
                            <div className="whitespace-nowrap">
                                {item.label}
                                <div className="inline-block rounded-md bg-extblue text-white text-xs px-2 py-1 ml-2">
                                    {item.type}
                                </div>
                            </div>
                            <div className="flex flex-nowrap">
                                <a
                                    href={`https://vps23.ever.live/accounts/accountDetails?id=${item.address}`}
                                    className="underline"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {shortString(item.address, 8, 8)}
                                </a>
                                <CopyClipboard
                                    componentProps={{ text: item.address }}
                                    iconContainerClassName="ml-2"
                                />
                            </div>
                            <div className="text-right text-gray-050a15/50 text-sm sm:text-base">
                                {item.created_at}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImmutActionsPage;
