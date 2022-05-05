import React, { useEffect, useState } from "react";
import { Field, Form, Formik } from "formik";
import { Link, useParams } from "react-router-dom";
import TextField from "../../components/FormikForms/TextField";
import Spinner from "../../components/Spinner";
import {
    GoshBlob,
    GoshCommit,
    GoshRepository,
    GoshSmvClient,
    GoshSmvLocker,
    GoshSmvProposal
} from "../../types/classes";
import {
    IGoshBlob,
    IGoshCommit,
    IGoshRepository,
    IGoshSmvLocker,
    IGoshSmvProposal,
    IGoshWallet
} from "../../types/types";
import * as Yup from "yup";
import CopyClipboard from "../../components/CopyClipboard";
import { classNames, shortString } from "../../utils";
import { getBlobContent, getCodeLanguageFromFilename, getCommitTree } from "../../helpers";
import BlobDiffPreview from "../../components/Blob/DiffPreview";
import { useGoshDao, useGoshRoot, useGoshWallet } from "../../hooks/gosh.hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { useMonaco } from "@monaco-editor/react";


type TFormValues = {
    approve: string;
    amount: number;
}

const PullPage = () => {
    const { daoName, pullAddress } = useParams();
    const goshRoot = useGoshRoot();
    const goshDao = useGoshDao(daoName);
    const goshWallet = useGoshWallet(daoName);
    const monaco = useMonaco();
    const [release, setRelease] = useState<boolean>(false);
    const [check, setCheck] = useState<boolean>(false);
    const [service, setService] = useState<{
        proposal?: IGoshSmvProposal;
        proposalLocked: number;
        locker?: IGoshSmvLocker;
        balance: number;
        repo?: IGoshRepository;
        commit?: IGoshCommit;
        blobs?: {
            name: string;
            curr: IGoshBlob;
            currContent: string;
            prevContent?: string;
        }[];
    }>();

    const getCommit = async (repo: IGoshRepository, name: string): Promise<[IGoshCommit, any[]]> => {
        // Get commit data
        const address = await repo.getCommitAddr(name);
        const commit = new GoshCommit(repo.account.client, address);
        await commit.load();

        // Get commit blobs
        const blobAddrs = await commit.getBlobs();
        const blobTrees: IGoshBlob[] = [];
        const blobs: {
            name: string;
            curr: IGoshBlob;
            currContent: string;
            prevContent?: string;
        }[] = [];
        await Promise.all(
            blobAddrs.map(async (addr) => {
                // Create blob and load it's data
                const blob = new GoshBlob(repo.account.client, addr);
                await blob.load();
                if (!blob.meta) throw Error('Can not load blob meta');

                // Extract tree blob from common blobs
                if (blob.meta.name.indexOf('tree ') >= 0) blobTrees.push(blob);
                else {
                    const currFullBlob = await getBlobContent(repo, blob.meta.name);
                    // If blob has prevSha, load this prev blob
                    let prevFullBlob = undefined;
                    if (blob.meta?.prevSha) {
                        prevFullBlob = await getBlobContent(repo, blob.meta.prevSha);
                    }
                    blobs.push({ name: '', curr: blob, currContent: currFullBlob, prevContent: prevFullBlob });
                }
            })
        );
        console.debug('Trees blobs', blobTrees);
        console.debug('Common blobs', blobs);

        // Construct commit tree
        const filesList = blobTrees
            .map((blob) => blob.meta?.content || '')
            .reduce((a: string[], content) => [...a, ...content.split('\n')], []);
        console.debug('Files list', filesList);
        const commitTree = getCommitTree(filesList);
        console.debug('Commit tree', commitTree);

        // Update blobs names (path) from tree
        Object.values(commitTree).forEach((items) => {
            items.forEach((item) => {
                const found = blobs.find((bItem) => (
                    bItem.curr.meta?.name === `${item.type} ${item.sha}`
                ));
                if (found) found.name = item.name;
            })
        });
        console.debug('Ready to render blobs', blobs);

        return [commit, blobs];
    }

    const onProposalCheck = async (proposal: IGoshSmvProposal, wallet: IGoshWallet) => {
        try {
            if (service?.locker?.meta?.isBusy) throw Error('Locker is busy');
            setCheck(true);
            await wallet.tryProposalResult(proposal.address);
            await proposal.load();
        } catch (e: any) {
            console.error(e.message);
        } finally {
            setCheck(false);
        }
    }

    const onProposalSubmit = async (values: TFormValues) => {
        try {
            if (!goshRoot) throw Error('GoshRoot is undefined');
            if (!goshDao) throw Error('GoshDao is undefined');
            if (!goshWallet) throw Error('GoshWallet is undefined');
            if (!service?.proposal) throw Error('Proposal is undefined');

            if (service.proposal.meta?.time.start && Date.now() < service.proposal.meta?.time.start.getTime()) {
                throw Error('It\'s too early to vote.\nPlease, wait for the voting time');
            }
            if (service.locker?.meta?.isBusy) throw Error('Locker is busy');

            const smvPlatformCode = await goshRoot.getSmvPlatformCode();
            const smvClientCode = await goshDao.getSmvClientCode();
            const choice = values.approve === 'true';
            await goshWallet.voteFor(
                smvPlatformCode,
                smvClientCode,
                service.proposal.address,
                choice,
                values.amount
            );
            alert('Vote accepted. Please, wait a bit for data to be updated or check status later');
        } catch (e: any) {
            console.error(e.message);
            alert(e.message);
        }
    }

    const onTokensRelease = async () => {
        try {
            if (!service?.proposal) throw Error('Proposal is undefined');
            if (!goshWallet) throw Error('GoshWallet is undefined');

            setRelease(true);
            await goshWallet.updateHead();
        } catch (e: any) {
            console.error(e.message);
            alert(e.message);
        } finally {
            setRelease(false);
        }
    }

    useEffect(() => {
        const getGoshPull = async (wallet: IGoshWallet, address: string) => {
            // Get GoshProposal object
            const prop = new GoshSmvProposal(wallet.account.client, address);
            await prop.load();
            if (!prop.meta || !daoName || !goshRoot) {
                alert('Error loading proposal');
                return;
            }

            // Get repository and commit with blobs
            const repoAddr = await goshRoot.getRepoAddr(
                prop.meta.commit.repoName,
                daoName
            );
            const repo = new GoshRepository(goshRoot.account.client, repoAddr);
            const [commit, blobs] = await getCommit(repo, prop.meta.commit.commitName);

            // Get SMVLocker
            const lockerAddr = await wallet.getSmvLockerAddr();
            const locker = new GoshSmvLocker(wallet.account.client, lockerAddr);

            setService({
                proposal: prop,
                proposalLocked: 0,
                locker,
                balance: await wallet.getSmvTokenBalance(),
                repo,
                commit,
                blobs
            });
        }

        if (goshWallet && pullAddress && !service?.locker && !service?.proposal) getGoshPull(goshWallet, pullAddress);
        let interval: any;
        if (goshWallet && service?.locker && service?.proposal) {
            interval = setInterval(async () => {
                await service.locker?.load();
                await service.proposal?.load();
                const balance = await goshWallet.getSmvTokenBalance();

                let proposalLocked = 0;
                try {
                    if (service.locker && service.proposal?.meta) {
                        const smvClientAddr = await goshWallet.getSmvClientAddr(service.locker.address, service.proposal.meta.id);
                        const client = new GoshSmvClient(goshWallet.account.client, smvClientAddr);
                        proposalLocked = await client.getLockedAmount();
                    }
                }
                catch { }

                console.debug('[Locker] - Busy:', service.locker?.meta?.isBusy);
                setService((prev) => ({ ...prev, balance, proposalLocked }));
            }, 5000);
        }

        return () => {
            clearInterval(interval);
        }
    }, [pullAddress, goshWallet, daoName, goshRoot, service?.locker, service?.proposal]);


    return (
        <div className="bordered-block px-7 py-8">
            {!service?.proposal && (
                <div className="text-gray-606060">
                    <Spinner className="mr-3" />
                    Loading proposal...
                </div>
            )}

            {service?.proposal && monaco && (
                <div>
                    <div className="mb-5 flex items-center gap-x-6 bg-gray-100 rounded px-4 py-3">
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

                    <div className="flex items-center gap-x-5 py-2">
                        <div className="basis-2/5">
                            <h3 className="text-xl font-semibold">
                                {service.commit?.meta?.content.title}
                            </h3>

                            <div className="text-gray-606060 text-sm">
                                <CopyClipboard
                                    label={`${'Proposal: '}${shortString(service.proposal.meta?.id || '')}`}
                                    componentProps={{
                                        text: service.proposal.meta?.id || ''
                                    }}
                                />
                            </div>
                            <div className="text-xs text-gray-606060 mt-1">
                                {service.proposal.meta?.time.start.toLocaleString()}
                                <span className="mx-1">-</span>
                                {service.proposal.meta?.time.finish.toLocaleString()}
                            </div>
                        </div>
                        <div className="grow">
                            {service.proposal.meta?.commit.repoName}:{service.proposal.meta?.commit.branchName}
                            <div className="text-gray-606060 text-sm">
                                <CopyClipboard
                                    label={`${'Commit: '}${shortString(service.proposal.meta?.commit.commitName || '')}`}
                                    componentProps={{
                                        text: service.proposal.meta?.commit.commitName || ''
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            {service.proposal.meta?.isCompleted
                                ? <span className="text-green-900">Completed</span>
                                : (<><Spinner className="mr-2" size="sm" /> Running</>)
                            }
                        </div>
                        <div>
                            <span className="text-green-900 text-xl">{service.proposal.meta?.votes.yes}</span>
                            <span className="mx-1">/</span>
                            <span className="text-rose-600 text-xl">{service.proposal.meta?.votes.no}</span>
                        </div>
                        {!!service.proposalLocked && service.proposal.meta?.isCompleted && (
                            <div>
                                <button
                                    type="button"
                                    className="btn btn--body text-sm px-4 py-1.5"
                                    onClick={onTokensRelease}
                                    disabled={release}
                                >
                                    {release && <Spinner className="mr-2" />}
                                    Release
                                </button>
                            </div>
                        )}
                        {goshWallet && !service.proposal.meta?.isCompleted && (
                            <div>
                                <button
                                    type="button"
                                    className="btn btn--body text-sm px-4 py-1.5"
                                    onClick={() => service.proposal && onProposalCheck(service.proposal, goshWallet)}
                                    disabled={check}
                                >
                                    {check && <Spinner className="mr-2" />}
                                    Re-check
                                </button>
                            </div>
                        )}
                    </div>

                    {service.proposal.meta?.isCompleted && (
                        <div className="text-green-700 mt-6">
                            Commit proposal
                            <Link
                                className="mx-1 underline text-green-900"
                                to={`/${daoName}/${service.proposal.meta.commit.repoName}/commits/${service.proposal.meta.commit.branchName}/${service.proposal.meta.commit.commitName}`}
                            >
                                {shortString(service.proposal.meta.commit.commitName)}
                            </Link>
                            was accepted by SMV
                        </div>
                    )}

                    {!service.proposal.meta?.isCompleted && (
                        <Formik
                            initialValues={{ approve: 'true', amount: 51 }}
                            onSubmit={onProposalSubmit}
                            validationSchema={Yup.object().shape({
                                amount: Yup.number().min(20, 'Should be a number >= 20').required('Field is required')
                            })}
                        >
                            {({ isSubmitting }) => (
                                <div className="mt-10">
                                    <h3 className="text-xl font-semibold">Vote for proposal</h3>
                                    <Form className="flex items-baseline my-4 gap-x-6">
                                        <div>
                                            <Field
                                                name="amount"
                                                component={TextField}
                                                inputProps={{
                                                    className: '!py-1.5',
                                                    placeholder: 'Amount of tokens'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="mr-3">
                                                <Field type="radio" name="approve" value={'true'} />
                                                <span className="ml-1">Accept</span>
                                            </label>
                                            <label>
                                                <Field type="radio" name="approve" value={'false'} />
                                                <span className="ml-1">Reject</span>
                                            </label>
                                        </div>
                                        <button
                                            className="btn btn--body font-medium px-4 py-1.5"
                                            type="submit"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting && <Spinner className="mr-2" />}
                                            Vote for proposal
                                        </button>
                                    </Form>
                                </div>
                            )}
                        </Formik>
                    )}

                    <h3 className="mt-10 mb-4 text-xl font-semibold">Proposal diff</h3>
                    {service.blobs?.map((item, index) => {
                        const language = getCodeLanguageFromFilename(monaco, item.name);
                        return (
                            <div key={index} className="my-5 border rounded overflow-hidden">
                                <div className="bg-gray-100 border-b px-3 py-1.5 text-sm font-semibold">
                                    {item.name}
                                </div>
                                <BlobDiffPreview
                                    original={item.prevContent}
                                    modified={item.currContent}
                                    modifiedLanguage={language}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default PullPage;
