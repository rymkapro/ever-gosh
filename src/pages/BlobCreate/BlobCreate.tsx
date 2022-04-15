import React, { useState } from "react";
import { Field, Form, Formik } from "formik";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { TRepositoryLayoutOutletContext } from "../RepositoryLayout";
import TextField from "../../components/FormikForms/TextField";
import { useMonaco } from "@monaco-editor/react";
import { generateDiff, getCodeLanguageFromFilename } from "../../helpers";
import * as Yup from "yup";
import { Tab } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCode, faEye } from "@fortawesome/free-solid-svg-icons";
import { classNames } from "../../utils";
import BlobEditor from "../../components/Blob/Editor";
import BlobPreview from "../../components/Blob/Preview";
import FormCommitBlock from "./FormCommitBlock";


type TFormValues = {
    branch: string;
    name: string;
    content: string;
    title: string;
    message: string;
}

const BlobCreatePage = () => {
    const { goshRepository } = useOutletContext<TRepositoryLayoutOutletContext>();
    const { repoName, branchName = 'master' } = useParams();
    const navigate = useNavigate();
    const monaco = useMonaco();
    const [blobCodeLanguage, setBlobCodeLanguage] = useState<string>('plaintext');
    const [activeTab, setActiveTab] = useState<number>(0);
    const urlBack = `/repositories/${repoName}/tree/${branchName}`;

    const onCommitChanges = async (values: TFormValues) => {
        try {
            const diff = await generateDiff(monaco, values.content);
            await goshRepository.createCommit(
                branchName,
                { title: values.title, message: values.message },
                [{ name: values.name, diff }],
                [{ name: values.name, content: values.content }]
            );
            navigate(urlBack);
        } catch (e: any) {
            alert(e.message);
        }
    }

    return (
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
                                    inputProps={{
                                        className: 'input--text text-sm py-1.5',
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
    );
}

export default BlobCreatePage;
