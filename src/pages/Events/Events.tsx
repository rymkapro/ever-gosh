import React, { useEffect, useState } from "react";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useParams } from "react-router-dom";
import CopyClipboard from "../../components/CopyClipboard";
import Spinner from "../../components/Spinner";
import { useGoshDao, useGoshRoot, useGoshWallet } from "../../hooks/gosh.hooks";
import { GoshCommit, GoshRepository, GoshSmvClient, GoshSmvLocker, GoshSmvProposal } from "../../types/classes";
import { IGoshCommit, IGoshDao, IGoshRoot, IGoshSmvLocker, IGoshSmvProposal, IGoshWallet } from "../../types/types";
import { classNames, shortString } from "../../utils";


const EventsPage = () => {
    const { daoName, repoName } = useParams();
    const goshRoot = useGoshRoot();
    const goshDao = useGoshDao(daoName);
    const goshWallet = useGoshWallet(daoName);
    const [proposals, setProposals] = useState<{ prop: IGoshSmvProposal; commit?: IGoshCommit; locked: number; }[]>();
    const [service, setService] = useState<{ locker?: IGoshSmvLocker; balance: number; }>({ locker: undefined, balance: 0 });

    const getPullList = async (goshRoot: IGoshRoot, goshDao: IGoshDao, goshWallet: IGoshWallet) => {
        // Get SMVProposal code
        const proposalCode = await goshDao.getSmvProposalCode();
        // console.debug('SMVProposal code:', proposalCode);
        const proposalssAddrs = await goshDao.account.client.net.query_collection({
            collection: 'accounts',
            filter: {
                code: { eq: proposalCode }
            },
            result: 'id'
        });
        console.debug('[Pulls] - SMVProposal addreses:', proposalssAddrs?.result || []);

        const proposals = await Promise.all(
            (proposalssAddrs?.result || [])
                .map(async (item: any) => {
                    // Get GoshProposal object
                    console.debug('[Pulls] - Prop addr:', item.id)
                    const proposal = new GoshSmvProposal(goshDao.account.client, item.id);
                    await proposal.load();

                    // Get commit
                    let commit = undefined;
                    if (proposal.meta?.commit && daoName) {
                        const repoAddr = await goshRoot.getRepoAddr(
                            proposal.meta.commit.repoName,
                            daoName
                        );
                        const goshRepo = new GoshRepository(goshDao.account.client, repoAddr);
                        const commitAddr = await goshRepo.getCommitAddr(proposal.meta.commit.commitName);
                        commit = new GoshCommit(goshDao.account.client, commitAddr);
                        await commit.load();
                    };

                    // Get amount of user's locked tokens in proposal
                    let locked = 0;
                    if (proposal.meta && goshWallet.isDaoParticipant) {
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

                    return { prop: proposal, commit, locked };
                })
        );
        console.debug('SMVProposals:', proposals);
        setProposals(proposals);
    }

    useEffect(() => {
        if (!repoName && goshRoot && goshDao && goshWallet) getPullList(goshRoot, goshDao, goshWallet);
    }, [repoName, goshRoot, goshDao, goshWallet]);

    useEffect(() => {
        const initService = async (wallet: IGoshWallet) => {
            const lockerAddr = await wallet.getSmvLockerAddr();
            const locker = new GoshSmvLocker(wallet.account.client, lockerAddr);
            const balance = await wallet.getSmvTokenBalance();
            setService({ locker, balance });
        }

        if (goshWallet && goshWallet.isDaoParticipant && !service.locker) initService(goshWallet);

        let interval: any;
        if (goshWallet && goshWallet.isDaoParticipant && service?.locker) {
            interval = setInterval(async () => {
                await service.locker?.load();
                const balance = await goshWallet.getSmvTokenBalance();
                console.debug('[Locker] - Busy:', service.locker?.meta?.isBusy);
                setService((prev) => ({ ...prev, balance }));
            }, 5000);
        }

        return () => {
            clearInterval(interval);
        }
    }, [goshWallet, service?.locker]);

    return (
        <div className="bordered-block px-7 py-8">
            <div>
                {goshWallet?.isDaoParticipant && (
                    <div className="mt-6 mb-5 flex items-center gap-x-6 bg-gray-100 rounded px-4 py-3">
                        <div>
                            <span className="font-semibold mr-2">SMV balance:</span>
                            {service.locker?.meta?.votesTotal}
                        </div>
                        <div>
                            <span className="font-semibold mr-2">Locked:</span>
                            {service.locker?.meta?.votesLocked}
                        </div>
                        <div>
                            <span className="font-semibold mr-2">Wallet balance:</span>
                            {service.balance}
                        </div>
                        <div className="grow text-right">
                            <FontAwesomeIcon
                                icon={faCircle}
                                className={classNames(
                                    'ml-2',
                                    service.locker?.meta?.isBusy ? 'text-rose-600' : 'text-green-900'
                                )}
                            />
                        </div>
                    </div>
                )}

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
                                    to={`/${daoName}/events/${item.prop.address}`}
                                    className="text-lg font-semibold hover:underline"
                                >
                                    {item.commit?.meta?.content.title}
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
                            {/* {!!item.locked && item.prop.isCompleted && (
                                <div>
                                    <button
                                        type="button"
                                        className="btn btn--body text-sm px-4 py-1.5"
                                        onClick={() => { }}
                                    >
                                        Release
                                    </button>
                                </div>
                            )} */}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default EventsPage;