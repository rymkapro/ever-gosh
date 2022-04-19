import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRecoilValue } from "recoil";
import Spinner from "../../components/Spinner";
import { useGoshRoot } from "../../hooks/gosh.hooks";
import { userStateAtom } from "../../store/user.state";
import { GoshDao, GoshWallet } from "../../types/classes";
import { IGoshDao, IGoshRoot } from "../../types/types";


const DaosPage = () => {
    const userState = useRecoilValue(userStateAtom);
    const goshRoot = useGoshRoot();
    const [goshDaos, setGoshDaos] = useState<IGoshDao[]>();

    useEffect(() => {
        const getDaoList = async (goshRoot: IGoshRoot, pubkey: string) => {
            // Get GoshWallet code by user's pubkey and get all user's wallets
            const walletCode = await goshRoot.getDaoWalletCode(`0x${pubkey}`);
            console.debug('GoshWallet code:', walletCode);
            const walletsAddrs = await goshRoot.account.client.net.query_collection({
                collection: 'accounts',
                filter: {
                    code: { eq: walletCode }
                },
                result: 'id'
            });
            console.debug('GoshWallets addreses:', walletsAddrs?.result || []);

            // Get GoshDaos from user's GoshWallets
            const daos = await Promise.all(
                (walletsAddrs?.result || []).map(async (item: any) => {
                    const goshWallet = new GoshWallet(goshRoot.account.client, item.id);
                    const daoAddr = await goshWallet.getDaoAddr();
                    const dao = new GoshDao(goshRoot.account.client, daoAddr);
                    await dao.load();
                    return dao;
                })
            );
            console.debug('GoshDaos:', daos);
            setGoshDaos(daos);
        }

        if (goshRoot && userState.keys) getDaoList(goshRoot, userState.keys.public);
    }, [userState.keys, goshRoot]);

    return (
        <>
            <div className="flex justify-between items-center">
                <div className="input basis-1/2">
                    <input
                        className="element !py-1.5"
                        type="text"
                        placeholder="Search orgranizations (Disabled for now)"
                        disabled
                    />
                </div>
                <Link
                    to="/account/orgs/create"
                    className="btn btn--body py-1.5 px-3 !font-normal"
                >
                    New organization
                </Link>
            </div>

            <div className="mt-8">
                {goshDaos === undefined && (
                    <div className="text-gray-606060">
                        <Spinner className="mr-3" />
                        Loading organizations...
                    </div>
                )}
                {!goshDaos?.length && (
                    <div className="text-gray-606060 text-center">You have no organizations yet</div>
                )}

                <div className="divide-y divide-gray-c4c4c4">
                    {goshDaos?.map((item, index) => (
                        <div key={index} className="py-2">
                            <Link
                                to={`/orgs/${item.meta?.name}`}
                                className="text-xl font-semibold hover:underline"
                            >
                                {item.meta?.name}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default DaosPage;
