import React, { useEffect, useState } from "react";
import { faArrowRight, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMonaco } from "@monaco-editor/react";
import { Field, Form, Formik } from "formik";
import { Navigate, useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import BlobDiffPreview from "../../components/Blob/DiffPreview";
import { getCodeLanguageFromFilename, getRepoTree, isMainBranch } from "../../helpers";
import { goshBranchesAtom, goshCurrBranchSelector } from "../../store/gosh.state";
import { TRepoLayoutOutletContext } from "../RepoLayout";
import * as Yup from "yup";
import FormCommitBlock from "../BlobCreate/FormCommitBlock";
import Spinner from "../../components/Spinner";
import SwitchField from "../../components/FormikForms/SwitchField";
import { useGoshRepoBranches } from "../../hooks/gosh.hooks";
import { userStateAtom } from "../../store/user.state";
import { IGoshBlob, TGoshTreeItem } from "../../types/types";
import { GoshBlob } from "../../types/classes";
import BranchSelect from "../../components/BranchSelect";
import { EGoshError, GoshError } from "../../types/errors";
import { toast } from "react-toastify";


type TCommitFormValues = {
    title: string;
    message?: string;
    deleteBranch?: boolean;
}

const PullCreatePage = () => {
    const userState = useRecoilValue(userStateAtom);
    const branches = useRecoilValue(goshBranchesAtom);
    const { daoName, repoName } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { goshRepo, goshWallet } = useOutletContext<TRepoLayoutOutletContext>();
    const monaco = useMonaco();
    const { updateBranches } = useGoshRepoBranches(goshRepo);
    const branchFrom = useRecoilValue(
        goshCurrBranchSelector(searchParams.get('from') || 'main')
    );
    const branchTo = useRecoilValue(
        goshCurrBranchSelector(searchParams.get('to') || 'main')
    );
    const [compare, setCompare] = useState<{ to?: any, from?: any }[]>();

    useEffect(() => {
        const getBlob = async (hash: string): Promise<IGoshBlob> => {
            const addr = await goshRepo.getBlobAddr(`blob ${hash}`);
            const blob = new GoshBlob(goshRepo.account.client, addr);
            await blob.load();
            return blob;
        }

        const onCompare = async () => {
            try {
                if (!branchFrom || !branchTo) throw new GoshError(EGoshError.NO_BRANCH);
                if (branchFrom.name === branchTo.name) {
                    setCompare([]);
                    return;
                };

                setCompare(undefined);
                const fromTree = await getRepoTree(goshRepo, branchFrom);
                const fromTreeItems = [...fromTree.items].filter((item) => item.type === 'blob');
                console.debug('[Pull create] - From tree blobs:', fromTreeItems);
                const toTree = await getRepoTree(goshRepo, branchTo);
                const toTreeItems = [...toTree.items].filter((item) => item.type === 'blob');
                console.debug('[Pull create] - To tree blobs:', toTreeItems);

                // Find items that exist in both trees and were changed
                const intersected = toTreeItems.filter((item) => {
                    return fromTreeItems.find((fItem) => (
                        fItem.path === item.path &&
                        fItem.name === item.name &&
                        fItem.sha !== item.sha
                    ));
                });
                console.debug('[Pull crreate] - Intersected:', intersected);

                // Find items that where added by `fromBranch`
                const added = fromTreeItems.filter((item) => {
                    return !toTreeItems.find((tItem) => (
                        tItem.path === item.path &&
                        tItem.name === item.name
                    ));
                });
                console.debug('[Pull crreate] - Added:', added);

                // Merge intersected and added and generate compare list
                const compare: {
                    to?: { item: TGoshTreeItem; blob: IGoshBlob; },
                    from?: { item: TGoshTreeItem; blob: IGoshBlob; }
                }[] = [];
                await Promise.all(
                    intersected.map(async (item) => {
                        const from = fromTreeItems.find((fItem) => fItem.path === item.path && fItem.name === item.name);
                        const to = toTreeItems.find((tItem) => tItem.path === item.path && tItem.name === item.name);
                        if (from && to) {
                            const fromBlob = await getBlob(from.sha);
                            const toBlob = await getBlob(to.sha);
                            compare.push({ to: { item: to, blob: toBlob }, from: { item: from, blob: fromBlob } });
                        }
                    })
                );
                await Promise.all(
                    added.map(async (item) => {
                        const fromBlob = await getBlob(item.sha);
                        compare.push({ to: undefined, from: { item, blob: fromBlob } });
                    })
                );
                console.debug('[Pull create] - Compare list:', compare);
                setCompare(compare);
            } catch (e: any) {
                console.error(e.message);
                toast.error(e.message);
            }
        }

        if (goshRepo && branchFrom && branchTo) onCompare();

        return () => { }
    }, [branchFrom, branchTo, goshRepo]);

    const onCommitMerge = async (values: TCommitFormValues) => {
        try {
            if (!userState.keys) throw new GoshError(EGoshError.NO_USER);
            if (!goshWallet) throw new GoshError(EGoshError.NO_WALLET);
            if (!repoName) throw new GoshError(EGoshError.NO_REPO);
            if (!branchFrom || !branchTo) throw new GoshError(EGoshError.NO_BRANCH);
            if (branchFrom.name === branchTo.name || !compare?.length)
                throw new GoshError(EGoshError.PR_NO_MERGE);

            // Prepare blobs
            const blobs = compare.map(({ from, to }) => {
                if (!from.item || !from.blob.meta) throw new GoshError(EGoshError.FILE_EMPTY);
                return {
                    name: `${from.item.path && `${from.item.path}/`}${from.item.name}`,
                    modified: from.blob.meta?.content,
                    original: to?.blob.meta?.content || ''
                }
            });
            console.debug('Blobs', blobs);

            if (isMainBranch(branchTo.name)) {
                const smvLocker = await goshWallet.getSmvLocker();
                const smvBalance = smvLocker.meta?.votesTotal || 0;
                if (smvBalance < 20) throw new GoshError(EGoshError.SMV_NO_BALANCE, { min: 20 });
            };

            const message = [values.title, values.message].filter((v) => !!v).join('\n\n');
            await goshWallet.createCommit(
                goshRepo,
                branchTo,
                userState.keys.public,
                blobs,
                message,
                branchFrom
            );

            // Delete branch after merge (if selected), update branches, redirect
            if (values.deleteBranch) await goshWallet.deleteBranch(goshRepo, branchFrom.name);
            await updateBranches();
            navigate(
                isMainBranch(branchTo.name)
                    ? `/${daoName}/events`
                    : `/${daoName}/${repoName}/tree/${branchTo.name}`,
                { replace: true }
            );
        } catch (e: any) {
            console.error(e.message);
            toast.error(e.message);
        }
    }

    if (!goshWallet) return <Navigate to={`/${daoName}/${repoName}`} />
    return (
        <div className="bordered-block px-7 py-8">
            <div className="flex items-center gap-x-4">
                <BranchSelect
                    branch={branchFrom}
                    branches={branches}
                    onChange={(selected) => {
                        navigate(`/${daoName}/${repoName}/pull?from=${selected?.name}&to=${branchTo?.name}`);
                    }}
                />
                <span>
                    <FontAwesomeIcon icon={faChevronRight} size="sm" />
                </span>
                <BranchSelect
                    branch={branchTo}
                    branches={branches}
                    onChange={(selected) => {
                        navigate(`/${daoName}/${repoName}/pull?from=${branchFrom?.name}&to=${selected?.name}`);
                    }}
                />
            </div>

            <div className="mt-5">
                {compare === undefined && (
                    <div className="text-sm text-gray-606060">
                        <Spinner className="mr-3" />
                        Loading diff...
                    </div>
                )}

                {compare && !compare.length && (
                    <div className="text-sm text-gray-606060 text-center">
                        There is nothing to merge
                    </div>
                )}

                {!!compare?.length && (
                    <>
                        <div className="text-lg">
                            Merge branch
                            <span className="font-semibold mx-2">{branchFrom?.name}</span>
                            <FontAwesomeIcon icon={faArrowRight} size="sm" />
                            <span className="font-semibold ml-2">{branchTo?.name}</span>
                        </div>

                        {compare.map(({ to, from }, index) => {
                            const item = to?.item || from?.item;
                            const fileName = `${item.path && `${item.path}/`}${item.name}`;
                            if (!fileName) return null;

                            const language = getCodeLanguageFromFilename(monaco, fileName);
                            return (
                                <div key={index} className="my-5 border rounded overflow-hidden">
                                    <div className="bg-gray-100 border-b px-3 py-1.5 text-sm font-semibold">
                                        {fileName}
                                    </div>
                                    <BlobDiffPreview
                                        original={to?.blob.meta?.content}
                                        modified={from?.blob.meta?.content}
                                        modifiedLanguage={language}
                                    />
                                </div>
                            );
                        })}

                        <div className="mt-5">
                            <Formik
                                initialValues={{
                                    title: `Merge branch '${branchFrom?.name}' into '${branchTo?.name}'`
                                }}
                                onSubmit={onCommitMerge}
                                validationSchema={Yup.object().shape({
                                    title: Yup.string().required('Field is required')
                                })}
                            >
                                {({ isSubmitting }) => (
                                    <Form>
                                        <FormCommitBlock
                                            isDisabled={!monaco || isSubmitting}
                                            isSubmitting={isSubmitting}
                                            extraButtons={!isMainBranch(branchFrom?.name) && (
                                                <Field
                                                    name="deleteBranch"
                                                    component={SwitchField}
                                                    className="ml-4"
                                                    label="Delete branch after merge"
                                                    labelClassName="text-sm text-gray-505050"
                                                />
                                            )}
                                        />
                                    </Form>
                                )}
                            </Formik>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default PullCreatePage;
