import React, { useState } from "react";
import { Field, Form, Formik } from "formik";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { TRepoLayoutOutletContext } from "../RepoLayout";
import TextField from "../../components/FormikForms/TextField";
import { useMonaco } from "@monaco-editor/react";
import { generateDiff, getCodeLanguageFromFilename, sha1 } from "../../helpers";
import * as Yup from "yup";
import { Tab } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCode, faEye } from "@fortawesome/free-solid-svg-icons";
import { classNames } from "../../utils";
import BlobEditor from "../../components/Blob/Editor";
import BlobPreview from "../../components/Blob/Preview";
import FormCommitBlock from "./FormCommitBlock";
import { useGoshWallet } from "../../hooks/gosh.hooks";


type TFormValues = {
    branch: string;
    name: string;
    content: string;
    title: string;
    message: string;
}

const BlobCreatePage = () => {
    const { daoName, repoName, branchName = 'master' } = useParams();
    const goshWallet = useGoshWallet(daoName);
    const navigate = useNavigate();
    const monaco = useMonaco();
    const [blobCodeLanguage, setBlobCodeLanguage] = useState<string>('plaintext');
    const [activeTab, setActiveTab] = useState<number>(0);
    const urlBack = `/orgs/${daoName}/repos/${repoName}/tree/${branchName}`;

    const onCommitChanges = async (values: TFormValues) => {
        try {
            if (!goshWallet) throw Error('Can not get GoshWallet');
            if (!repoName) throw Error('Repository name is undefined');

            console.log('GoshWallet address:', goshWallet.address);

            const da = await goshWallet.account.runLocal('getAddrDao', {});
            console.log('Dao addr', da.decoded?.output.value0);

            const rgad = await goshWallet.account.runLocal('getAddrRootGosh', {});
            console.log('Root addr', rgad.decoded?.output.value0);



            const commitSha = sha1(values.title, 'commit');
            // const blobSha = sha1(values.content, 'blob');
            console.log(repoName, branchName, commitSha);

            await goshWallet.createCommit(
                repoName,
                branchName,
                commitSha,
                'fullCommit',
                '',
                '0:0000000000000000000000000000000000000000000000000000000000000000'
            )
            // await goshWallet.createBlob(repoName, commitSha, blobSha, values.content);

            const diff = await generateDiff(monaco, values.content);
            console.log(values, diff);
            // await goshRepo.createCommit(
            //     branchName,
            //     { title: values.title, message: values.message },
            //     [{ name: values.name, diff }],
            //     [{ name: values.name, content: values.content }]
            // );
            // navigate(urlBack);
        } catch (e: any) {
            alert(e.message);
        }
    }

    return (
        <div className="bordered-block px-7 py-8">
            <Formik
                initialValues={{ branch: branchName, name: '', content: '', title: '', message: '' }}
                validationSchema={Yup.object().shape({
                    name: Yup.string().required('Field is required'),
                    title: Yup.string().required('Field is required')
                })}
                onSubmit={onCommitChanges}
            >
                {({ values, setFieldValue, isSubmitting, handleBlur }) => (
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
                                        errorEnabled={false}
                                        inputProps={{
                                            className: '!text-sm !px-2.5 !py-1.5',
                                            autoComplete: 'off',
                                            placeholder: 'Name of new file',
                                            disabled: !monaco || activeTab === 1,
                                            onBlur: (e: any) => {
                                                // Formik `handleBlur` event
                                                handleBlur(e);

                                                // Resolve file code language by it's extension
                                                // and update editor
                                                const language = getCodeLanguageFromFilename(
                                                    monaco,
                                                    e.target.value
                                                );
                                                setBlobCodeLanguage(language);

                                                // Set commit title
                                                setFieldValue('title', `Create ${e.target.value}`);
                                            }
                                        }}
                                    />
                                </div>
                                <span className="mx-2">in</span>
                                <span>{branchName}</span>
                            </div>

                            <Link
                                to={urlBack}
                                className="btn btn--body px-3 py-1.5 !text-sm !font-normal"
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
                                        Edit new file
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
                                        Preview
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
                                        <BlobPreview
                                            language={blobCodeLanguage}
                                            value={values.content}
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
        </div>
    );
}

export default BlobCreatePage;
