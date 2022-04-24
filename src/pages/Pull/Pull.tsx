import React, { useEffect, useState } from "react";
import { Field, Form, Formik } from "formik";
import { Link, useOutletContext, useParams } from "react-router-dom";
import TextField from "../../components/FormikForms/TextField";
import Spinner from "../../components/Spinner";
import { GoshSmvClient, GoshSmvLocker, GoshSmvProposal } from "../../types/classes";
import { IGoshSmvLocker, IGoshSmvProposal, IGoshWallet } from "../../types/types";
import { TRepoLayoutOutletContext } from "../RepoLayout";
import * as Yup from "yup";
import CopyClipboard from "../../components/CopyClipboard";
import { classNames, shortString } from "../../utils";
import { getCommitTree } from "../../helpers";
import BlobDiffPreview from "../../components/Blob/DiffPreview";
import { useGoshRepoBranches, useGoshRoot } from "../../hooks/gosh.hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";


type TFormValues = {
    approve: string;
    amount: number;
}

const PullPage = () => {
    const { daoName, repoName, pullAddress } = useParams();
    const goshRoot = useGoshRoot();
    const { goshWallet, goshRepo } = useOutletContext<TRepoLayoutOutletContext>();
    const [prop, setProp] = useState<{ prop: IGoshSmvProposal, locked: number; }>();
    const [blob, setBlob] = useState<any>();
    const [locker, setLocker] = useState<IGoshSmvLocker>();
    const [balance, setBalance] = useState<number>();
    const { updateBranch } = useGoshRepoBranches(goshRepo);
    const [release, setRelease] = useState<boolean>(false);

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

    const _setProp = async (prop: IGoshSmvProposal) => {
        let locked = 0;
        if (prop.meta) {
            const propLockerAddr = await prop.getLockerAddr();
            console.log('[propLockerAddr]', propLockerAddr);
            const smvClientAddr = await goshWallet.getSmvClientAddr(
                propLockerAddr,
                prop.meta.id
            );
            console.log('[svmClientAddr]', smvClientAddr);
            try {
                const smvClient = new GoshSmvClient(goshWallet.account.client, smvClientAddr);
                locked = await smvClient.getLockedAmount();
            } catch { }
        }
        setProp({ prop, locked });
    }

    const onProposalCheck = async (goshProposal: IGoshSmvProposal) => {
        try {
            await goshWallet.tryProposalResult(goshProposal.address);
            await locker?.load();
            await goshProposal.load();
            if (goshProposal.meta?.commit.branchName) {
                console.log('Update branch', goshProposal.meta?.commit.branchName)
                await updateBranch(goshProposal.meta?.commit.branchName);
            }
            await getTokenBalance(goshWallet);
            await _setProp(goshProposal);
        } catch (e: any) {
            console.error(e.message)
        }
    }

    const onProposalSubmit = async (values: TFormValues) => {
        try {
            if (!goshRoot) throw Error('GoshRoot is undefined');
            if (!prop) throw Error('Proposal is undefined');

            if (prop.prop.meta?.time.start && Date.now() < prop.prop.meta?.time.start.getTime()) {
                throw Error('It\'s too early to vote.\nPlease, wait for the voting time');
            }
            if (locker?.meta?.isBusy) throw Error('Locker is busy');

            console.log('VALUES', values);
            const smvPlatformCode = await goshRoot.getSmvPlatformCode();
            // console.debug('SMV platform code', smvPlatformCode);
            const smvClientCode = await goshRoot.getSmvClientCode();
            // console.debug('SMV client code', smvClientCode);
            const choice = values.approve === 'true';
            console.debug('SMV choice', choice);
            await goshWallet.voteFor(
                smvPlatformCode,
                smvClientCode,
                prop.prop.address,
                choice,
                values.amount
            );

            await onProposalCheck(prop.prop);
        } catch (e: any) {
            console.error(e.message);
            alert(e.message);
        }
    }

    const onTokensRelease = async () => {
        try {
            if (!prop) throw Error('Proposal is undefined');

            setRelease(true);
            await goshWallet.updateHead();
            await locker?.load();
            await _setProp(prop.prop);
        } catch (e: any) {
            console.error(e.message);
            alert(e.message);
        } finally {
            setRelease(false);
        }
    }

    useEffect(() => {
        const getGoshPull = async (goshWallet: IGoshWallet, address: string) => {
            // Get GoshProposal object
            const prop = new GoshSmvProposal(goshWallet.account.client, address);
            await prop.load();

            const tree = await prop.getBlob1Params();
            console.debug('Tree', tree);
            const blob = await prop.getBlob2Params();
            console.debug('Blob', blob);

            const filesList = tree.fullBlob.split('\n');
            const commitTree = getCommitTree(filesList);
            console.debug('Commit tree', commitTree);

            // Update blobs names (path) from tree
            Object.values(commitTree).forEach((items) => {
                items.forEach((item) => {
                    if (blob.blobName === `${item.type} ${item.sha}`) {
                        blob.name = item.name;
                    }
                })
            });
            console.debug('Ready to render blobs', blob);
            await _setProp(prop);
            setBlob(blob);
        }

        if (goshWallet && pullAddress) getGoshPull(goshWallet, pullAddress);
    }, [pullAddress, goshWallet]);

    useEffect(() => {
        if (goshWallet) {
            getLockerData(goshWallet);
            getTokenBalance(goshWallet);
        }
    }, [goshWallet]);

    useEffect(() => {
        const interval = setInterval(async () => {
            console.log('Reload locker')
            await locker?.load();
        }, 5000);
        return () => {
            clearInterval(interval);
        }
    }, [locker]);

    return (
        <div className="bordered-block px-7 py-8">
            {prop === undefined && (
                <div className="text-gray-606060">
                    <Spinner className="mr-3" />
                    Loading proposal...
                </div>
            )}

            {prop && blob && (
                <div>
                    <div className="mb-5 flex items-center gap-x-6 bg-gray-100 rounded px-4 py-3">
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

                    <div className="flex items-center gap-x-5 py-2">
                        <div className="basis-2/5">
                            <h3 className="text-xl font-semibold">
                                {prop.prop.meta?.commit.fullCommit.title}
                            </h3>

                            <div className="text-gray-606060 text-sm">
                                <CopyClipboard
                                    label={`${'Proposal: '}${shortString(prop.prop.meta?.id || '')}`}
                                    componentProps={{
                                        text: prop.prop.meta?.id || ''
                                    }}
                                />
                            </div>
                            <div className="text-xs text-gray-606060 mt-1">
                                {prop.prop.meta?.time.start.toLocaleString()}
                                <span className="mx-1">-</span>
                                {prop.prop.meta?.time.finish.toLocaleString()}
                            </div>
                        </div>
                        <div className="grow">
                            {prop.prop.meta?.commit.repoName}:{prop.prop.meta?.commit.branchName}
                            <div className="text-gray-606060 text-sm">
                                <CopyClipboard
                                    label={`${'Commit: '}${shortString(prop.prop.meta?.commit.commitName || '')}`}
                                    componentProps={{
                                        text: prop.prop.meta?.commit.commitName || ''
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            {prop.prop.meta?.isCompleted
                                ? <span className="text-green-900">Completed</span>
                                : (<><Spinner className="mr-2" size="sm" /> Running</>)
                            }
                        </div>
                        <div>
                            <span className="text-green-900 text-xl">{prop.prop.meta?.votes.yes}</span>
                            <span className="mx-1">/</span>
                            <span className="text-rose-600 text-xl">{prop.prop.meta?.votes.no}</span>
                        </div>
                        {!!prop.locked && prop.prop.isCompleted && (
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
                    </div>

                    {prop.prop.meta?.isCompleted && (
                        <div className="text-green-700 mt-6">
                            Commit proposal
                            <Link
                                className="mx-1 underline text-green-900"
                                to={`/${daoName}/${repoName}/commits/${prop.prop.meta.commit.branchName}/${prop.prop.meta.commit.commitName}`}
                            >
                                {shortString(prop.prop.meta.commit.commitName)}
                            </Link>
                            was accepted by SMV
                        </div>
                    )}

                    {!prop.prop.meta?.isCompleted && (
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
                    <div className="border rounded overflow-hidden">
                        <div className="bg-gray-100 border-b px-3 py-1.5 text-sm font-semibold">
                            {blob.name}
                        </div>
                        <BlobDiffPreview modified={blob.fullBlob} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default PullPage;
