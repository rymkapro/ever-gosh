import React, { useState } from "react";
import { Field, Form, Formik } from "formik";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { TRepositoryLayoutOutletContext } from "../RepositoryLayout";
import TextField from "../../components/FormikForms/TextField";
import { useMonaco } from "@monaco-editor/react";
import Spinner from "../../components/Spinner";
import { generateDiff } from "../../helpers";
import * as Yup from "yup";
import { Tab } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCode, faEye } from "@fortawesome/free-solid-svg-icons";
import EditorPanel from "./EditorPanel";
import PreviewPanel from "./PreviewPanel";
import { classNames } from "../../utils";
import TextareaField from "../../components/FormikForms/TextareaField";


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
    const [editorLanguage, setEditorLanguage] = useState<string>('plaintext');
    const [activeTab, setActiveTab] = useState<number>(0);

    const onFormSubmit = async (values: TFormValues) => {
        try {
            const diff = await generateDiff(monaco, values.content);
            await goshRepository.createCommit(
                branchName,
                { title: values.title, message: values.message },
                [{ name: values.name, diff }],
                [{ name: values.name, content: values.content }]
            );
            navigate(`/repositories/${repoName}/tree/${branchName}`);
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
            onSubmit={onFormSubmit}
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
                                            let splitted = e.target.value.split('.');
                                            const ext = `.${splitted[splitted.length - 1]}`;
                                            const found = monaco.languages.getLanguages().find((item: any) => (
                                                item.extensions.indexOf(ext) >= 0
                                            ));
                                            setEditorLanguage(found?.id || 'plaintext');

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
                            to={`/repositories/${repoName}/tree/${branchName}`}
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
                                    <EditorPanel
                                        language={editorLanguage}
                                        value={values.content}
                                        onChange={(value) => setFieldValue('content', value)}
                                    />
                                </Tab.Panel>
                                <Tab.Panel>
                                    <PreviewPanel language={editorLanguage} value={values.content} />
                                </Tab.Panel>
                            </Tab.Panels>
                        </Tab.Group>
                    </div>

                    <div className="mt-5 border rounded px-4 py-3">
                        <h3 className="text-lg font-semibold mb-2">Commit data</h3>
                        <div>
                            <Field
                                name="title"
                                component={TextField}
                                inputProps={{
                                    className: 'input--text text-sm py-1.5 w-full',
                                    autoComplete: 'off',
                                    placeholder: 'Commit title'
                                }}
                            />
                        </div>
                        <div className="mt-3">
                            <Field
                                name="message"
                                component={TextareaField}
                                help="Markdown syntax is supported"
                                inputProps={{
                                    className: 'input--textarea text-sm py-1.5 w-full',
                                    placeholder: 'Commit optional description'
                                }}
                            />
                        </div>
                        <div className="flex mt-4 items-center gap-3">
                            <button
                                className="btn--blue text-sm font-medium px-3 py-1.5"
                                type="submit"
                                disabled={!monaco || isSubmitting}
                            >
                                {isSubmitting && <Spinner className="mr-2" />}
                                Commit changes
                            </button>
                            <Link
                                to={`/repositories/${repoName}/tree/${branchName}`}
                                className="px-3 py-1.5 border rounded text-sm font-medium text-rose-500 border-rose-500 hover:bg-rose-50"
                            >
                                Cancel
                            </Link>
                        </div>
                    </div>
                </Form>
            )}
        </Formik>
    );
}

export default BlobCreatePage;
