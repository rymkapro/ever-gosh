import React, { useEffect, useState } from "react";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMonaco } from "@monaco-editor/react";
import { Field, Form, Formik } from "formik";
import { useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import BlobDiffPreview from "../../components/Blob/DiffPreview";
import { generateDiff, getCodeLanguageFromFilename, sha1 } from "../../helpers";
import { goshCurrBranchSelector } from "../../store/gosh.state";
import { GoshSnapshot } from "../../types/classes";
import { IGoshSnapshot } from "../../types/types";
import { TRepoLayoutOutletContext } from "../RepoLayout";
import * as Yup from "yup";
import FormCommitBlock from "../BlobCreate/FormCommitBlock";
import Spinner from "../../components/Spinner";
import SwitchField from "../../components/FormikForms/SwitchField";
import { useGoshRepoBranches } from "../../hooks/gosh.hooks";


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
    const [compare, setCompare] = useState<{ to?: IGoshSnapshot, from?: IGoshSnapshot }[]>();
    const monaco = useMonaco();

    useEffect(() => {
        const getSnapshots = async (addresses: string[]): Promise<IGoshSnapshot[]> => {
            return await Promise.all(
                addresses.map(async (address) => {
                    const snapshot = new GoshSnapshot(goshWallet.account.client, address);
                    await snapshot.load();
                    return snapshot;
                })
            );
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
                const fromSnapshots = await getSnapshots(branchFrom.snapshot);
                console.debug('From branch snapshots:', fromSnapshots);
                const toSnapshots = await getSnapshots(branchTo.snapshot);
                console.debug('To branch snapshots:', toSnapshots);

                const compare: { to?: IGoshSnapshot, from?: IGoshSnapshot }[] = [];
                for (let i = 0; i < Math.max(fromSnapshots.length, toSnapshots.length); i++) {
                    if (i < toSnapshots.length) {
                        const to = toSnapshots[i];
                        const from = fromSnapshots.find((snap) => {
                            const fromNameClean = snap.meta?.name.split('/').slice(-1)[0];
                            const toNameClean = to.meta?.name.split('/').slice(-1)[0];
                            console.log('From name:', fromNameClean, 'To name:', toNameClean);
                            return fromNameClean === toNameClean;
                        });
                        if (!from || to.meta?.content === from.meta?.content) continue;
                        compare.push({ to, from });
                    } else {
                        compare.push({ to: undefined, from: fromSnapshots[i] });
                    }
                }
                console.debug('Compare list:', compare);
                setCompare(compare);
            } catch (e: any) {
                console.error(e.message);
                alert(e.message);
            }
        }

        if (goshWallet && branchFrom && branchTo) onCompare();
    }, [branchFrom, branchTo, goshWallet]);

    const onCommitMerge = async (values: TCommitFormValues) => {
        try {
            if (!monaco) throw Error('[Merge]: Monaco is not initialized');
            if (!repoName) throw Error('[Merge]: Repository is undefined');
            if (!branchFrom) throw Error('[Merge]: From branch is undefined');
            if (!branchTo) throw Error('[Merge]: To branch in undefined');
            if (branchFrom.name === branchTo.name) throw Error('[Merge]: Banches are equal');
            if (!compare?.length) throw Error('[Merge]: There are no changes to merge');

            console.debug(values);
            // Prepare commit data
            const commitBlobs = await Promise.all(
                compare.map(async ({ to, from }) => {
                    if (!from?.meta) throw new Error('Empty file from');
                    return {
                        sha: sha1(from.meta.content, 'blob'),
                        name: from.meta.name.split('/').slice(-1)[0],
                        diff: await generateDiff(monaco, from.meta.content, to?.meta?.content),
                        content: from.meta.content
                    }
                })
            );
            console.debug('Commit blobs:', commitBlobs);
            const commitData = {
                title: values.title,
                message: values.message,
                blobs: commitBlobs.map((item) => ({
                    sha: item.sha,
                    name: item.name,
                    diff: item.diff
                }))
            }
            console.debug('Commit data:', commitData);
            const commitDataStr = JSON.stringify(commitData)
            const commitSha = sha1(commitDataStr, 'commit');

            // Deploy commit, blob, diff
            await goshWallet.createCommit(
                repoName,
                branchTo.name,
                commitSha,
                commitDataStr,
                branchTo.commitAddr,
                branchFrom.commitAddr
            )
            await Promise.all(commitBlobs.map(async (item) => {
                await goshWallet.createBlob(repoName, commitSha, item.sha, item.content);
                await goshWallet.createDiff(repoName, branchTo.name, item.name, item.content);
            }));

            // Delete branch after merge (if selected), update branches, redirect
            if (values.deleteBranch) await goshWallet.deleteBranch(repoName, branchFrom.name);
            await updateBranches();
            navigate(`/orgs/${daoName}/repos/${repoName}/tree/${branchTo.name}`, { replace: true });
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
                    <div className="text-sm text-gray-606060">
                        There is nothing to merge
                    </div>
                )}

                {compare?.map(({ to, from }, index) => {
                    const fileName = (to?.meta?.name || from?.meta?.name)?.split('/').slice(-1)[0];
                    if (!fileName) return null;

                    const language = getCodeLanguageFromFilename(monaco, fileName);
                    return (
                        <div key={index} className="my-5 border rounded overflow-hidden">
                            <div className="bg-gray-100 border-b px-3 py-1.5 text-sm font-semibold">
                                {fileName}
                            </div>
                            <BlobDiffPreview
                                original={to?.meta?.content}
                                modified={from?.meta?.content}
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
                                    extraButtons={(
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
