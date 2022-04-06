import React, { useEffect, useState } from "react";
import { AccountType } from "@eversdk/appkit";
import { Tab } from "@headlessui/react";
import { classNames, shortString } from "../../utils";
import {
    ToastOptionsShortcuts,
    toEvers
} from "../../helpers";
import CopyToClipboard from "react-copy-to-clipboard";
import { toast } from "react-toastify";
import { IGoshRoot } from "../../types/types";
import { useGoshRoot } from "../../hooks/gosh.hooks";


const AccountPage = () => {
    const goshRoot = useGoshRoot();
    const [goshRootDetails, setGoshRootDetails] = useState<IGoshRoot['details']>();

    /**
     * Load GoshRoot account data;
     * Deploy if needed;
     * Subscribe for changes
     */
    useEffect(() => {
        const initGoshRoot = async (root: IGoshRoot) => {
            await root.load();
            setGoshRootDetails(root.details);

            await root.subscribeAccount(async (details) => {
                setGoshRootDetails(details);
                if (!root.isDeployed) await root.deploy();
            });

            if (!root.isDeployed) await root.deploy();
        }

        if (goshRoot) initGoshRoot(goshRoot);
    }, [goshRoot]);

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

                                {!goshRootDetails && (
                                    <div className="bg-blue-400 text-white text-sm px-3 py-2 rounded mt-3">
                                        Loading account...
                                    </div>
                                )}

                                {goshRootDetails && (
                                    <>
                                        {!goshRoot?.isDeployed && (
                                            <div className="bg-amber-500 text-white text-sm px-3 py-2 rounded mt-3">
                                                Account is not deployed, deploying...
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-x-4 gap-y-3 mt-5 justify-between">
                                            <div>
                                                <h4 className="font-semibold text-gray-600">Root address</h4>
                                                <CopyToClipboard
                                                    text={goshRootDetails.address}
                                                    onCopy={() => toast.success('Copied', ToastOptionsShortcuts.CopyMessage)}
                                                >
                                                    <button className="font-mono">
                                                        {shortString(goshRootDetails.address, 8, 8)}
                                                    </button>
                                                </CopyToClipboard>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-600">Balance</h4>
                                                {toEvers(goshRootDetails.balance)}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-600">Status</h4>
                                                {AccountType[goshRootDetails.acc_type]}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-600">Version</h4>
                                                {goshRootDetails.data.decoded?.version}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap mt-5 gap-x-4 gap-y-3 justify-between">
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-600">Code</h4>
                                                <span className="font-mono">
                                                    {shortString(goshRootDetails.code || '-', 14, 14)}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-600">Data</h4>
                                                <span className="font-mono">
                                                    {shortString(goshRootDetails.data.raw || '-', 14, 14)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap mt-5 gap-x-4 gap-y-3 justify-between">
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-600">Repository code</h4>
                                                <span className="font-mono">
                                                    {shortString(goshRootDetails.data.decoded?.m_RepositoryCode || '-', 14, 14)}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-600">Repository data</h4>
                                                <span className="font-mono">
                                                    {shortString(goshRootDetails.data.decoded?.m_RepositoryData || '-', 14, 14)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap mt-5 gap-x-4 gap-y-3 justify-between">
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-600">Commit code</h4>
                                                <span className="font-mono">
                                                    {shortString(goshRootDetails.data.decoded?.m_CommitCode || '-', 14, 14)}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-600">Commit data</h4>
                                                <span className="font-mono">
                                                    {shortString(goshRootDetails.data.decoded?.m_CommitData || '-', 14, 14)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap mt-5 gap-x-4 gap-y-3 justify-between">
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-600">Blob code</h4>
                                                <span className="font-mono">
                                                    {shortString(goshRootDetails.data.decoded?.m_BlobCode || '-', 14, 14)}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-600">Blob data</h4>
                                                <span className="font-mono">
                                                    {shortString(goshRootDetails.data.decoded?.m_BlobData || '-', 14, 14)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap mt-5 gap-x-4 gap-y-3 justify-between">
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-600">Snapshot code</h4>
                                                <span className="font-mono">
                                                    {shortString(goshRootDetails.data.decoded?.m_SnapshotCode || '-', 14, 14)}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-600">Snapshot data</h4>
                                                <span className="font-mono">
                                                    {shortString(goshRootDetails.data.decoded?.m_SnapshotData || '-', 14, 14)}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </Tab.Panel>
                        </Tab.Panels>
                    </Tab.Group>
                </div>
            </div>
        </section>
    );
}

export default AccountPage;
