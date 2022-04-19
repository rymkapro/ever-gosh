import React, { useEffect, useState } from "react";
import { Field, Form, Formik } from "formik";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import * as Yup from "yup";
import TextField from "../../components/FormikForms/TextField";
import { Tab } from "@headlessui/react";
import { classNames } from "../../utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCode, faEye } from "@fortawesome/free-solid-svg-icons";
import BlobEditor from "../../components/Blob/Editor";
import FormCommitBlock from "../BlobCreate/FormCommitBlock";
import { useMonaco } from "@monaco-editor/react";
import { TRepoLayoutOutletContext } from "../RepoLayout";
import { IGoshRepository, IGoshSnapshot, TGoshBranch } from "../../types/types";
import { constructTree, generateDiff, getCodeLanguageFromFilename, sha1, sha1Tree } from "../../helpers";
import BlobDiffPreview from "../../components/Blob/DiffPreview";
import { GoshCommit, GoshSnapshot } from "../../types/classes";
import { goshCurrBranchSelector } from "../../store/gosh.state";
import { useRecoilValue } from "recoil";
import { useGoshRepoBranches } from "../../hooks/gosh.hooks";
import { userStateAtom } from "../../store/user.state";


type TFormValues = {
    name: string;
    content: string;
    title: string;
    message: string;
}

const BlobUpdatePage = () => {
    const { daoName, repoName, branchName = 'main', blobName } = useParams();
    const { goshRepo, goshWallet } = useOutletContext<TRepoLayoutOutletContext>();
    const userState = useRecoilValue(userStateAtom);
    const { updateBranch } = useGoshRepoBranches(goshRepo);
    const branch = useRecoilValue(goshCurrBranchSelector(branchName));
    const navigate = useNavigate();
    const monaco = useMonaco();
    const [activeTab, setActiveTab] = useState<number>(0);
    const [snapshot, setSnapshot] = useState<IGoshSnapshot>();
    const [blobCodeLanguage, setBlobCodeLanguage] = useState<string>('plaintext');
    const urlBack = `/orgs/${daoName}/repos/${repoName}/blob/${branchName}/${blobName}`;

    const getTree = async (repo: IGoshRepository, currBranch: TGoshBranch) => {
        const tree = await Promise.all(
            currBranch.snapshot.map(async (address) => {
                const snapshot = new GoshSnapshot(repo.account.client, address);
                await snapshot.load();

                if (!snapshot.meta) throw Error('[BlobCreate]: Can not load snapshot');
                const sha = sha1(snapshot.meta.content, 'blob');
                return `100644 blob ${sha}\t${snapshot.meta.name}`;
            })
        );
        return tree;
    }

    const onCommitChanges = async (values: TFormValues) => {
        try {
            if (!userState.keys) throw Error('Can not get user keys');
            if (!goshWallet) throw Error('Can not get GoshWallet');
            if (!repoName) throw Error('Repository is undefined');
            if (!branch) throw Error('Branch is undefined');

            // // Prepare commit data
            // const blobSha = sha1(values.content, 'blob');
            // const commitData = {
            //     title: values.title,
            //     message: values.message,
            //     blobs: [
            //         {
            //             sha: blobSha,
            //             name: values.name,
            //             diff: await generateDiff(monaco, values.content, snapshot?.meta?.content)
            //         }
            //     ]
            // };
            // const commitDataStr = JSON.stringify(commitData)
            // const commitSha = sha1(commitDataStr, 'commit');




            // Generate current tree
            const blobSha = sha1(values.content, 'blob');
            const prePreTree = await getTree(goshRepo, branch);
            const preTree = prePreTree.map((item) => {
                const parts = item.split('\t');
                const fileName = parts[1].split('/').slice(-1)[0];
                if (fileName !== values.name) return item;
                return `100644 blob ${blobSha}\t${values.name}`;
            });
            console.debug('Pre tree', preTree);

            const treeBuffer = constructTree(preTree);
            console.debug('Tree buf', treeBuffer, treeBuffer[0].toString('hex'));
            const treeSha = sha1Tree(treeBuffer[0]);
            console.debug('Tree sha', treeSha);

            // Get parent commit
            console.debug('Branch commit addr', branch.commitAddr);
            let lastCommitSha = null;
            if (branch.commitAddr.length) {
                const lastCommit = new GoshCommit(goshWallet.account.client, branch.commitAddr);
                lastCommitSha = await lastCommit.getName();
            }
            console.debug('Last commit sha', lastCommitSha);

            // Full commit
            const unixTime = Math.floor(Date.now() / 1000);
            const fullCommit = [
                `tree ${treeSha}`,
                lastCommitSha ? `parent ${lastCommitSha}` : null,
                `author ${userState.keys.public} <${userState.keys.public}@gosh.sh> ${unixTime} +0300`,
                `committer ${userState.keys.public} <${userState.keys.public}@gosh.sh> ${unixTime} +0300`,
                '',
                `${values.title}`
            ];
            console.debug('Full commit', fullCommit);
            const fullCommitStr = fullCommit.filter((item) => item !== null).join('\n');
            console.debug('Full commit', fullCommitStr);

            const commitSha = sha1(fullCommitStr, 'commit');
            console.debug('Commit sha', commitSha);

            // Deploy commit, blob, diff
            await goshWallet.createCommit(
                repoName,
                branchName,
                commitSha,
                fullCommitStr,
                branch.commitAddr,
                '0:0000000000000000000000000000000000000000000000000000000000000000'
            )
            await goshWallet.createBlob(repoName, commitSha, blobSha, values.content);
            await goshWallet.createDiff(repoName, branchName, values.name, values.content);

            await updateBranch(branch.name);
            navigate(urlBack);
        } catch (e: any) {
            alert(e.message);
        }
    }

    useEffect(() => {
        const getSnapshot = async (repo: IGoshRepository, branch: string, blob: string) => {
            const snapAddr = await repo.getSnapshotAddr(branch, blob);
            const snapshot = new GoshSnapshot(repo.account.client, snapAddr);
            await snapshot.load();
            setSnapshot(snapshot);
        }

        if (goshRepo && branchName && blobName) getSnapshot(goshRepo, branchName, blobName);
    }, [goshRepo, branchName, blobName]);

    useEffect(() => {
        if (monaco && blobName) {
            const language = getCodeLanguageFromFilename(monaco, blobName);
            setBlobCodeLanguage(language);
        }
    }, [monaco, blobName])

    return (
        <div className="bordered-block px-7 py-8">
            {monaco && blobName && snapshot && (
                <Formik
                    initialValues={{
                        name: blobName,
                        content: snapshot.meta?.content || '',
                        title: '',
                        message: ''
                    }}
                    validationSchema={Yup.object().shape({
                        name: Yup.string().required('Field is required'),
                        title: Yup.string().required('Field is required')
                    })}
                    onSubmit={onCommitChanges}
                >
                    {({ values, setFieldValue, isSubmitting }) => (
                        <Form>
                            <div className="flex gap-3 items-baseline justify-between ">
                                <div className="flex items-baseline">
                                    <Link
                                        to={`/orgs/${daoName}/repos/${repoName}/tree/${branchName}`}
                                        className="font-medium text-extblue hover:underline"
                                    >
                                        {repoName}
                                    </Link>
                                    <span className="mx-2">/</span>
                                    <div>
                                        <Field
                                            name="name"
                                            component={TextField}
                                            inputProps={{
                                                className: '!text-sm !py-1.5',
                                                autoComplete: 'off',
                                                placeholder: 'Name of new file',
                                                disabled: true
                                            }}
                                        />
                                    </div>
                                    <span className="mx-2">in</span>
                                    <span>{branchName}</span>
                                </div>

                                <Link
                                    to={urlBack}
                                    className="btn btn--body px-3 py-1.5 text-sm !font-normal"
                                >
                                    Discard changes
                                </Link>
                            </div>

                            <div className="mt-5 border rounded overflow-hidden">
                                <Tab.Group
                                    defaultIndex={activeTab}
                                    onChange={(index) => setActiveTab(index)}
                                >
                                    <Tab.List
                                    >
                                        <Tab
                                            className={({ selected }) => classNames(
                                                'px-4 py-3 border-r text-sm',
                                                selected
                                                    ? 'bg-white border-b-white font-medium text-extblack'
                                                    : 'bg-transparent border-b-transparent text-extblack/70 hover:text-extblack'
                                            )}
                                        >
                                            <FontAwesomeIcon icon={faCode} size="sm" className="mr-1" />
                                            Edit file
                                        </Tab>
                                        <Tab
                                            className={({ selected }) => classNames(
                                                'px-4 py-3 text-sm',
                                                selected
                                                    ? 'bg-white border-b-white border-r font-medium text-extblack'
                                                    : 'bg-transparent border-b-transparent text-extblack/70 hover:text-extblack'
                                            )}
                                        >
                                            <FontAwesomeIcon icon={faEye} size="sm" className="mr-1" />
                                            Preview changes
                                        </Tab>
                                    </Tab.List>
                                    <Tab.Panels
                                        className="-mt-[1px] border-t"
                                    >
                                        <Tab.Panel>
                                            <BlobEditor
                                                language={blobCodeLanguage}
                                                value={values.content}
                                                onChange={(value) => setFieldValue('content', value)}
                                            />
                                        </Tab.Panel>
                                        <Tab.Panel>
                                            <BlobDiffPreview
                                                className="pt-[1px]"
                                                original={snapshot.meta?.content}
                                                modified={values.content}
                                                modifiedLanguage={blobCodeLanguage}
                                            />
                                        </Tab.Panel>
                                    </Tab.Panels>
                                </Tab.Group>
                            </div>

                            <FormCommitBlock
                                urlBack={urlBack}
                                isDisabled={!monaco || isSubmitting}
                                isSubmitting={isSubmitting}
                            />
                        </Form>
                    )}
                </Formik>
            )}
        </div>
    );
}

export default BlobUpdatePage;
