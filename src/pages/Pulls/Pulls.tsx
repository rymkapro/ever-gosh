import React, { useEffect, useState } from "react";
import { faChevronRight, faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import BranchSelect from "../../components/BranchSelect";
import { goshBranchesAtom, goshCurrBranchSelector } from "../../store/gosh.state";
import { IGoshRoot, IGoshSmvLocker, IGoshSmvProposal, IGoshWallet, TGoshBranch } from "../../types/types";
import { TRepoLayoutOutletContext } from "../RepoLayout";
import { useGoshRoot } from "../../hooks/gosh.hooks";
import Spinner from "../../components/Spinner";
import { classNames, shortString } from "../../utils";
import CopyClipboard from "../../components/CopyClipboard";
import { GoshSmvClient, GoshSmvLocker, GoshSmvProposal } from "../../types/classes";


const PullsPage = () => {
    const { daoName, repoName } = useParams();
    const goshRoot = useGoshRoot();
    const { goshWallet } = useOutletContext<TRepoLayoutOutletContext>();
    const navigate = useNavigate();
    const branches = useRecoilValue(goshBranchesAtom);
    const defaultBranch = useRecoilValue(goshCurrBranchSelector('main'));
    const [branchFrom, setBranchFrom] = useState<TGoshBranch | undefined>(defaultBranch);
    const [branchTo, setBranchTo] = useState<TGoshBranch | undefined>(defaultBranch);
    const [proposals, setProposals] = useState<{ prop: IGoshSmvProposal; locked: number; }[]>();
    const [locker, setLocker] = useState<IGoshSmvLocker>();
    const [balance, setBalance] = useState<number>();


    const getLockerData = async (goshWallet: IGoshWallet) => {
        const lockerAddr = await goshWallet.getSmvLockerAddr();
        console.debug('Locker addr:', lockerAddr)
        const locker = new GoshSmvLocker(goshWallet.account.client, lockerAddr);
        await locker.load();
        console.debug('Locker votes:', locker.meta?.votesLocked, locker.meta?.votesTotal);
        setLocker(locker);
    }

    const getTokenBalance = async (goshWallet: IGoshWallet) => {
        const balance = await goshWallet.getSmvTokenBalance();
        setBalance(balance);
    }

    const getPullList = async (goshRoot: IGoshRoot) => {
        // Get SMVProposal code
        const proposalCode = await goshRoot.getSmvProposalCode();
        // console.debug('SMVProposal code:', proposalCode);
        const proposalssAddrs = await goshRoot.account.client.net.query_collection({
            collection: 'accounts',
            filter: {
                code: { eq: proposalCode }
            },
            result: 'id'
        });
        console.debug('SMVProposal addreses:', proposalssAddrs?.result || []);

        const proposals = await Promise.all(
            (proposalssAddrs?.result || [])
                .filter((item: any) => item.id !== '0:a85dfabeadfd81e8bd96dfc3b1c28f5fbac429a41ea12183880b4eb496afbd4c')
                .map(async (item: any) => {
                    // Get GoshProposal object
                    const proposal = new GoshSmvProposal(goshRoot.account.client, item.id);
                    await proposal.load();

                    // Get amount of user's locked tokens in proposal
                    let locked = 0;
                    if (proposal.meta) {
                        const propLockerAddr = await proposal.getLockerAddr();
                        console.log('[propLockerAddr]', propLockerAddr);
                        const smvClientAddr = await goshWallet.getSmvClientAddr(
                            propLockerAddr,
                            proposal.meta.id
                        );
                        console.log('[svmClientAddr]', smvClientAddr);
                        try {
                            const smvClient = new GoshSmvClient(goshWallet.account.client, smvClientAddr);
                            locked = await smvClient.getLockedAmount();
                        } catch { }
                    }

                    return { prop: proposal, locked };
                })
        );
        console.debug('SMVProposals:', proposals);
        setProposals(proposals);
    }

    useEffect(() => {
        const interval = setInterval(async () => {
            console.log('Reload locker')
            await locker?.load();
        }, 5000);
        return () => {
            clearInterval(interval);
        }
    }, [locker]);

    useEffect(() => {
        if (goshRoot) getPullList(goshRoot);
    }, [goshRoot]);

    useEffect(() => {
        if (goshWallet) {
            getLockerData(goshWallet);
            getTokenBalance(goshWallet);
        }
    }, [goshWallet]);

    return (
        <div className="bordered-block px-7 py-8">
            <div className="flex items-center gap-x-4">
                <BranchSelect
                    branch={branchFrom}
                    branches={branches}
                    onChange={(selected) => {
                        if (selected) {
                            setBranchFrom(selected);
                        }
                    }}
                />
                <span>
                    <FontAwesomeIcon icon={faChevronRight} size="sm" />
                </span>
                <BranchSelect
                    branch={branchTo}
                    branches={branches}
                    onChange={(selected) => {
                        if (selected) {
                            setBranchTo(selected);
                        }
                    }}
                />
                <button
                    className="btn btn--body px-3 py-1.5 !font-normal !text-sm"
                    disabled={branchFrom?.name === branchTo?.name}
                    onClick={() => {
                        navigate(`/${daoName}/${repoName}/pulls/create?from=${branchFrom?.name}&to=${branchTo?.name}`);
                    }}
                >
                    Create pull request
                </button>
            </div>

            <div className="mt-8">
                <div className="mt-6 mb-5 flex items-center gap-x-6 bg-gray-100 rounded px-4 py-3">
                    <div>
                        <span className="font-semibold mr-2">SMV balance:</span>
                        {locker?.meta?.votesTotal}
                    </div>
                    <div>
                        <span className="font-semibold mr-2">Locked:</span>
                        {locker?.meta?.votesLocked}
                    </div>
                    <div>
                        <span className="font-semibold mr-2">Wallet balance:</span>
                        {balance}
                    </div>
                    <div className="grow text-right">
                        <FontAwesomeIcon
                            icon={faCircle}
                            className={classNames(
                                'ml-2',
                                locker?.meta?.isBusy ? 'text-rose-600' : 'text-green-900'
                            )}
                        />
                    </div>
                </div>

                {proposals === undefined && (
                    <div className="text-gray-606060">
                        <Spinner className="mr-3" />
                        Loading proposals...
                    </div>
                )}
                {proposals && !proposals?.length && (
                    <div className="text-gray-606060 text-center">There are no proposals yet</div>
                )}

                <div className="divide-y divide-gray-c4c4c4">
                    {proposals?.map((item, index) => (
                        <div key={index} className="flex items-center gap-x-5 py-3">
                            <div className="basis-2/5">
                                <Link
                                    to={`/${daoName}/${repoName}/pull/${item.prop.address}`}
                                    className="text-lg font-semibold hover:underline"
                                >
                                    {item.prop.meta?.commit.fullCommit.title}
                                </Link>
                                <div className="text-gray-606060 text-sm">
                                    <CopyClipboard
                                        label={`${'Proposal: '}${shortString(item.prop.meta?.id || '')}`}
                                        componentProps={{
                                            text: item.prop.meta?.id || ''
                                        }}
                                    />
                                </div>
                                <div className="text-xs text-gray-606060 mt-1">
                                    {item.prop.meta?.time.start.toLocaleString()}
                                    <span className="mx-1">-</span>
                                    {item.prop.meta?.time.finish.toLocaleString()}
                                </div>
                            </div>
                            <div className="grow">
                                {item.prop.meta?.commit.repoName}:{item.prop.meta?.commit.branchName}
                                <div className="text-gray-606060 text-sm">
                                    <CopyClipboard
                                        label={`${'Commit: '}${shortString(item.prop.meta?.commit.commitName || '')}`}
                                        componentProps={{
                                            text: item.prop.meta?.commit.commitName || ''
                                        }}
                                    />
                                </div>
                            </div>
                            <div>
                                {item.prop.meta?.isCompleted
                                    ? <span className="text-green-900">Completed</span>
                                    : (<><Spinner className="mr-2" size="sm" /> Running</>)
                                }
                            </div>
                            <div>
                                <span className="text-green-900 text-xl">{item.prop.meta?.votes.yes}</span>
                                <span className="mx-1">/</span>
                                <span className="text-rose-600 text-xl">{item.prop.meta?.votes.no}</span>
                            </div>
                            {!!item.locked && item.prop.isCompleted && (
                                <div>
                                    <button
                                        type="button"
                                        className="btn btn--body text-sm px-4 py-1.5"
                                        onClick={() => { }}
                                    >
                                        Release
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default PullsPage;
