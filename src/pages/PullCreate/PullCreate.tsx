import React, { useEffect, useState } from "react";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMonaco } from "@monaco-editor/react";
import { Field, Form, Formik } from "formik";
import { useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import BlobDiffPreview from "../../components/Blob/DiffPreview";
import { getCodeLanguageFromFilename, getRepoTree } from "../../helpers";
import { goshCurrBranchSelector } from "../../store/gosh.state";
import { TRepoLayoutOutletContext } from "../RepoLayout";
import * as Yup from "yup";
import FormCommitBlock from "../BlobCreate/FormCommitBlock";
import Spinner from "../../components/Spinner";
import SwitchField from "../../components/FormikForms/SwitchField";
import { useGoshRepoBranches } from "../../hooks/gosh.hooks";
import { userStateAtom } from "../../store/user.state";
import { IGoshBlob, TGoshTreeItem } from "../../types/types";
import { GoshBlob } from "../../types/classes";


type TCommitFormValues = {
    title: string;
    message?: string;
    deleteBranch?: boolean;
}

const PullCreatePage = () => {
    const { goshRepo, goshWallet } = useOutletContext<TRepoLayoutOutletContext>();
    const { daoName, repoName } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { updateBranches } = useGoshRepoBranches(goshRepo);
    const branchFrom = useRecoilValue(
        goshCurrBranchSelector(searchParams.get('from') || 'main')
    );
    const branchTo = useRecoilValue(
        goshCurrBranchSelector(searchParams.get('to') || 'main')
    );
    const [compare, setCompare] = useState<{ to?: any, from?: any }[]>();
    const monaco = useMonaco();
    const userState = useRecoilValue(userStateAtom);

    useEffect(() => {
        const getBlob = async (hash: string): Promise<IGoshBlob> => {
            const addr = await goshRepo.getBlobAddr(`blob ${hash}`);
            const blob = new GoshBlob(goshRepo.account.client, addr);
            await blob.load();
            return blob;
        }

        const onCompare = async () => {
            try {
                if (!branchFrom) throw Error('[Compare]: From branch is undefined');
                if (!branchTo) throw Error('[Compare]: To branch in undefined');
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
                alert(e.message);
            }
        }

        if (goshRepo && branchFrom && branchTo) onCompare();

        return () => { }
    }, [branchFrom, branchTo, goshRepo]);

    const onCommitMerge = async (values: TCommitFormValues) => {
        try {
            if (!userState.keys) throw Error('Can not get user keys');
            if (!repoName) throw Error('[Merge]: Repository is undefined');
            if (!branchFrom) throw Error('[Merge]: From branch is undefined');
            if (!branchTo) throw Error('[Merge]: To branch in undefined');
            if (branchFrom.name === branchTo.name) throw Error('[Merge]: Banches are equal');
            if (!compare?.length) throw Error('[Merge]: There are no changes to merge');

            // Prepare blobs
            const blobs = compare.map(({ from, to }) => {
                if (!from.item || !from.blob.meta) throw new Error('Empty file from');
                return {
                    name: `${from.item.path && `${from.item.path}/`}${from.item.name}`,
                    modified: from.blob.meta?.content,
                    original: to?.blob.meta?.content || ''
                }
            });
            console.debug('Blobs', blobs);

            if (branchTo.name === 'main') {
                const smvLocker = await goshWallet.getSmvLocker();
                const smvBalance = smvLocker.meta?.votesTotal || 0;
                console.debug('[Blob create] - SMV balance:', smvBalance);
                if (smvBalance < 20) throw Error('Not enough tokens. Send at least 20 tokens to SMV.');
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
                branchTo.name === 'main'
                    ? `/${daoName}/${repoName}/pulls`
                    : `/${daoName}/${repoName}/tree/${branchTo.name}`, { replace: true }
            );
        } catch (e: any) {
            console.error(e.message);
            alert(e.message);
        }
    }

    return (
        <div className="bordered-block px-7 py-8">
            <div className="text-lg">
                Merge branch
                <span className="font-semibold mx-2">{branchFrom?.name}</span>
                <FontAwesomeIcon icon={faArrowRight} size="sm" />
                <span className="font-semibold ml-2">{branchTo?.name}</span>
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

                {compare?.map(({ to, from }, index) => {
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
            </div>

            {!!compare?.length && (
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
                                    extraButtons={branchFrom?.name !== 'main' && (
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
            )}
        </div>
    );
}

export default PullCreatePage;
