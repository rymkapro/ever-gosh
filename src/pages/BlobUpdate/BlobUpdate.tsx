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
import { IGoshBlob } from "../../types/types";
import { generateDiff, getCodeLanguageFromFilename, getGoshRepoBranches } from "../../helpers";
// import { GoshBlob } from "../../types/classes";
import BlobDiffPreview from "../../components/Blob/DiffPreview";


type TFormValues = {
    branch: string;
    name: string;
    content: string;
    title: string;
    message: string;
}

const BlobUpdatePage = () => {
    const { goshRepo } = useOutletContext<TRepoLayoutOutletContext>();
    const { repoName, branchName = 'master', blobName } = useParams();
    const navigate = useNavigate();
    const monaco = useMonaco();
    const [activeTab, setActiveTab] = useState<number>(0);
    const [blob, setBlob] = useState<IGoshBlob>();
    const [blobCodeLanguage, setBlobCodeLanguage] = useState<string>('plaintext');
    const urlBack = `/repositories/${repoName}/blob/${branchName}/${blobName}`;

    const onCommitChanges = async (values: TFormValues) => {
        try {
            const diff = await generateDiff(monaco, values.content, blob?.meta?.content);
            // await goshRepo.createCommit(
            //     branchName,
            //     { title: values.title, message: values.message },
            //     [{ name: values.name, diff }],
            //     [{ name: values.name, content: values.content }]
            // );
            navigate(urlBack);
        } catch (e: any) {
            alert(e.message);
        }
    }

    useEffect(() => {
        const initState = async () => {
            // const { branch } = await getGoshRepositoryBranches(goshRepository, branchName);
            // if (branch) {
            //     await branch.snapshot.load();
            //     const blobItem = branch.snapshot.meta?.content.find((item) => item.name === blobName);
            //     if (blobItem) {
            //         const blob = new GoshBlob(goshRepository.account.client, blobItem.address);
            //         await blob.load();
            //         setBlob(blob);
            //     } else {
            //         setBlob(undefined);
            //     }
            // }
        }

        initState();
    }, [goshRepo, branchName, blobName]);

    useEffect(() => {
        if (monaco && blobName) {
            const language = getCodeLanguageFromFilename(monaco, blobName);
            setBlobCodeLanguage(language);
        }
    }, [monaco, blobName])

    return (
        <>
            {monaco && blobName && blob && (
                <Formik
                    initialValues={{
                        branch: branchName,
                        name: blobName,
                        content: blob.meta?.content || '',
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
                                        to={`/repositories/${repoName}/tree/${branchName}`}
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
                                                className: 'text-sm py-1.5',
                                                autoComplete: 'off',
                                                placeholder: 'Name of new file',
                                                disabled: true
                                            }}
                                        />
                                    </div>
                                    <span className="mx-2">in</span>
                                    <span className="text-sm">{repoName}:{branchName}</span>
                                </div>

                                <Link
                                    to={urlBack}
                                    className="px-3 py-1.5 text-sm font-medium border rounded hover:bg-gray-50"
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
                                                original={blob.meta?.content}
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
        </>
    );
}

export default BlobUpdatePage;
