import React, { useEffect, useState } from "react";
import { Account, AccountType } from "@eversdk/appkit";
import { useRecoilValue } from "recoil";
import { userStateAtom } from "../../store/user.state";
import { useAccountData, useEverClient } from "../../hooks/ever.hooks";
import {
    GoshABI,
    GoshBlobTVC,
    GoshCommitTVC,
    GoshRepositoryTVC,
    GoshSnapshotTVC,
    GoshTVC
} from "../../contracts/gosh/gosh";
import { signerKeys } from "@eversdk/core";
import { Tab } from "@headlessui/react";
import { classNames, shortString } from "../../utils";
import {
    decodeAccountData,
    giver,
    isGoshDataSet,
    ToastOptionsShortcuts,
    toEvers
} from "../../helpers";
import CopyToClipboard from "react-copy-to-clipboard";
import { toast } from "react-toastify";


const AccountPage = () => {
    const userState = useRecoilValue(userStateAtom);
    const everClient = useEverClient();
    const [account, setAccount] = useState<Account>();
    const [decodedData, setDecodedData] = useState<any>();
    const [isDeployed, setIsDeployed] = useState<boolean>(false);
    const accountData = useAccountData(account);

    /** Create account object */
    useEffect(() => {
        const createAccount = async () => {
            if (!userState.phrase) return;
            const keys = await everClient.crypto.mnemonic_derive_sign_keys({ phrase: userState.phrase });
            const signer = signerKeys(keys);
            const account = new Account(
                { abi: GoshABI, tvc: GoshTVC },
                { client: everClient, address: userState.address, signer }
            );
            setAccount(account);
        }

        createAccount();
    }, [everClient, userState.address, userState.phrase]);

    /** Get account decoded data */
    useEffect(() => {
        const getAccountDecodedData = async () => {
            if (!account || !accountData.address) return;
            if (accountData.data) {
                const data = await decodeAccountData(account, accountData.data);
                setDecodedData(data);
                setIsDeployed(isGoshDataSet(data));
            }
        }

        getAccountDecodedData();
    }, [account, accountData.address, accountData.data]);

    /** Deploy account */
    useEffect(() => {
        const deployAccount = async () => {
            if (!account) return;
            console.debug('[Account] - Deploy account');

            const fees = await account.calcDeployFees();
            console.debug('[Account] - Deploy fees', fees);

            const balance = await account.getBalance();
            if (+balance > fees.total_account_fees) await account.deploy();
            else console.log(`Not enough balance to deploy (${toEvers(fees.total_account_fees)} needed)`);
        }

        const setAccountParts = async () => {
            if (!account) return;
            const decoded = await decodeAccountData(account);

            if (decoded?.m_RepositoryCode === 'te6ccgEBAQEAAgAAAA==') {
                console.debug('[Account] - Set repository');
                const repository = await account?.client.boc.decode_tvc({ tvc: GoshRepositoryTVC });
                await account?.run('setRepository', { code: repository?.code, data: repository?.data });
            }

            if (decoded?.m_CommitCode === 'te6ccgEBAQEAAgAAAA==') {
                console.debug('[Account] - Set commit');
                const commit = await account?.client.boc.decode_tvc({ tvc: GoshCommitTVC });
                await account?.run('setCommit', { code: commit?.code, data: commit?.data });
            }

            if (decoded?.m_BlobCode === 'te6ccgEBAQEAAgAAAA==') {
                console.debug('[Account] - Set blob');
                const blob = await account?.client.boc.decode_tvc({ tvc: GoshBlobTVC });
                await account?.run('setBlob', { code: blob?.code, data: blob?.data });
            }

            if (decoded?.m_codeSnapshot === 'te6ccgEBAQEAAgAAAA==') {
                console.debug('[Account] - Set snapshot');
                const snapshot = await account?.client.boc.decode_tvc({ tvc: GoshSnapshotTVC });
                await account?.run('setSnapshot', { code: snapshot?.code, data: snapshot?.data });
            }
        }

        if (!account || !accountData.address || isDeployed) return;
        if (accountData.acc_type === AccountType.nonExist) giver(account.client, accountData.address, 20_000_000_000);
        if (accountData.acc_type === AccountType.uninit) deployAccount();
        if (accountData.acc_type === AccountType.active) setAccountParts();
    }, [account, accountData.acc_type, accountData.address, isDeployed]);

    return (
        <section className="p-2">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-gray-700 font-semibold text-2xl pt-10 pb-8">Account settings</h1>

                <div className="flex gap-x-14 gap-y-8 flex-wrap">
                    <Tab.Group vertical>
                        <Tab.List className="w-full sm:w-1/5 flex flex-col gap-y-1">
                            <Tab
                                className={({ selected }) => (
                                    classNames(
                                        'w-full px-4 py-2 text-sm text-left rounded',
                                        'hover:bg-blue-600 hover:text-white',
                                        selected ? 'tab--active' : ''
                                    )
                                )}
                            >
                                Overview
                            </Tab>
                        </Tab.List>
                        <Tab.Panels className="flex-1">
                            <Tab.Panel>
                                <h3 className="text-gray-700 text-xl pb-2 border-b border-gray-300">
                                    Account overview
                                </h3>

                                <div
                                    className={classNames(
                                        'bg-amber-500 text-white text-sm px-3 py-2 rounded mt-3 transition-all ease-in-out duration-500',
                                        !accountData.address || !isDeployed ? 'visible opacity-100' : 'invisible opacity-0'
                                    )}
                                >
                                    {!accountData.address && (<span>Loading account data...</span>)}
                                    {accountData.address && !isDeployed && (
                                        <span>Account is not deployed, deploying...</span>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-x-4 gap-y-3 mt-5 justify-between">
                                    <div>
                                        <h4 className="font-semibold text-gray-600">Root address</h4>
                                        <CopyToClipboard
                                            text={accountData.address}
                                            onCopy={() => toast.success('Copied', ToastOptionsShortcuts.CopyMessage)}
                                        >
                                            <button className="font-mono">
                                                {shortString(accountData.address, 8, 8)}
                                            </button>
                                        </CopyToClipboard>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-600">Balance</h4>
                                        {toEvers(accountData.balance)}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-600">Status</h4>
                                        {accountData.acc_type_name}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-600">Version</h4>
                                        {decodedData?.version}
                                    </div>
                                </div>

                                <div className="flex flex-wrap mt-5 gap-x-4 gap-y-3 justify-between">
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-600">Code</h4>
                                        <span className="font-mono">
                                            {accountData.code ? shortString(accountData.code, 14, 14) : '-'}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-600">Data</h4>
                                        <span className="font-mono">
                                            {accountData.data ? shortString(accountData.data, 14, 14) : '-'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap mt-5 gap-x-4 gap-y-3 justify-between">
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-600">Repository code</h4>
                                        <span className="font-mono">
                                            {decodedData?.m_RepositoryCode
                                                ? shortString(decodedData.m_RepositoryCode, 14, 14)
                                                : '-'
                                            }
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-600">Repository data</h4>
                                        <span className="font-mono">
                                            {decodedData?.m_RepositoryData
                                                ? shortString(decodedData.m_RepositoryData, 14, 14)
                                                : '-'
                                            }
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap mt-5 gap-x-4 gap-y-3 justify-between">
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-600">Commit code</h4>
                                        <span className="font-mono">
                                            {decodedData?.m_CommitCode
                                                ? shortString(decodedData.m_CommitCode, 14, 14)
                                                : '-'
                                            }
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-600">Commit data</h4>
                                        <span className="font-mono">
                                            {decodedData?.m_CommitData
                                                ? shortString(decodedData.m_CommitData, 14, 14)
                                                : '-'
                                            }
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap mt-5 gap-x-4 gap-y-3 justify-between">
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-600">Blob code</h4>
                                        <span className="font-mono">
                                            {decodedData?.m_BlobCode
                                                ? shortString(decodedData.m_BlobCode, 14, 14)
                                                : '-'
                                            }
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-600">Blob data</h4>
                                        <span className="font-mono">
                                            {decodedData?.m_BlobData
                                                ? shortString(decodedData.m_BlobData, 14, 14)
                                                : '-'
                                            }
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap mt-5 gap-x-4 gap-y-3 justify-between">
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-600">Snapshot code</h4>
                                        <span className="font-mono">
                                            {decodedData?.m_codeSnapshot
                                                ? shortString(decodedData.m_codeSnapshot, 14, 14)
                                                : '-'
                                            }
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-600">Snapshot data</h4>
                                        <span className="font-mono">
                                            {decodedData?.m_dataSnapshot
                                                ? shortString(decodedData.m_dataSnapshot, 14, 14)
                                                : '-'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </Tab.Panel>
                        </Tab.Panels>
                    </Tab.Group>
                </div>
            </div>
        </section>
    );
}

export default AccountPage;
