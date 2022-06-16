import { SortDirection } from '@eversdk/core';
import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import CopyClipboard from '../../components/CopyClipboard';
import Spinner from '../../components/Spinner';
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
                [scba.hash]: { name: 'SCBA' },
                [action.hash]: { name: 'Action' },
            };
            console.debug('SCBA/action code hash:', scba, action);

            // Get contracts by code hash
            const query = await wallet.account.client.net.query_collection({
                collection: 'messages',
                filter: {
                    code_hash: { in: [scba.hash, action.hash] },
                },
                result: 'dst created_at code_hash body',
                order: [{ path: 'created_at', direction: SortDirection.DESC }],
            });

            const items = query.result.map((item) => ({
                address: item.dst,
                created_at: new Date(item.created_at * 1000).toLocaleString(),
                type: types[item.code_hash].name,
            }));
            setItems(items);
        };

        if (goshWallet && repoName) _getItems(goshWallet, repoName);
    }, [goshWallet, repoName]);

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
                            <div className="basis-2/12">{item.type}</div>
                            <div className="flex flex-nowrap">
                                <a href="#" className="underline">
                                    {shortString(item.address, 8, 8)}
                                </a>
                                <CopyClipboard
                                    componentProps={{ text: item.address }}
                                    iconContainerClassName="ml-2"
                                />
                            </div>
                            <div className="grow text-right text-gray-050a15/50 text-sm sm:text-base">
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
