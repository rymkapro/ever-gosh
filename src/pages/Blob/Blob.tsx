import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import BranchSelect from "../../components/BranchSelect";
import { IGoshBlob, IGoshBranch } from "../../types/types";
import { TRepositoryLayoutOutletContext } from "../RepositoryLayout";
import Editor, { useMonaco } from "@monaco-editor/react";
import { Field, Form, Formik } from "formik";
import TextField from "../../components/FormikForms/TextField";
import * as Yup from "yup";
import ReactMarkdown from 'react-markdown'


type TFormCommitValues = {
    commitName: string;
    blobContent: string;
}

const BlobPage = () => {
    const { goshRepository } = useOutletContext<TRepositoryLayoutOutletContext>();
    const { repoName, branchName = 'master', blobName } = useParams();
    const navigate = useNavigate();
    const monaco = useMonaco();
    const [branches, setBranches] = useState<IGoshBranch[]>([]);
    const [branch, setBranch] = useState<IGoshBranch>();
    const [editing, setEditing] = useState<{
        blob?: IGoshBlob['meta'] & { lastCommitName: string };
        isEditing: boolean;
        isDirty: boolean;
    }>({
        blob: undefined,
        isEditing: false,
        isDirty: false
    });

    const onCommitChanges = async (values: TFormCommitValues) => {
        console.log(values);
        if (!branchName || !blobName) return;
        await goshRepository.createCommit(
            branchName,
            values.commitName,
            JSON.stringify([{ name: blobName, original: editing.blob?.content, modified: values.blobContent }]),
            [{ name: blobName, content: values.blobContent }]
        );
    }

    useEffect(() => {
        const initState = async () => {
            const branches = await goshRepository.getBranches();
            const branch = branches.find((branch) => branch.name === branchName);
            if (branch) {
                await branch.snapshot.load();
                setBranch(branch);
                setEditing((currVal) => ({
                    ...currVal,
                    blob: branch.snapshot.meta?.content.find((item) => item.name === blobName)
                }));
            }
            setBranches(branches);
        }

        initState();
    }, [goshRepository, branchName, blobName]);

    useEffect(() => {
        const codeElement = document.getElementById('code');
        if (monaco && codeElement) {
            monaco.editor.colorizeElement(codeElement, { mimeType: 'text/markdown' });
        }
    }, [monaco])

    if (!branch) return <p>Loading...</p>;
    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                    <BranchSelect
                        branch={branch}
                        branches={branches}
                        onChange={(selected) => {
                            if (selected) {
                                navigate(`/repositories/${repoName}/blob/${selected.name}/${blobName}`);
                            }
                        }}
                    />
                    <span className="mx-3">/</span>
                    <span>{blobName}</span>
                </div>

                {!editing.isEditing && (
                    <button
                        className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600 disabled:opacity-75 rounded font-medium"
                        type="button"
                        onClick={() => setEditing({
                            ...editing,
                            isEditing: true
                        })}
                    >
                        Edit
                    </button>
                )}
            </div>

            {!editing.blob && (<p>Blob not found</p>)}
            {editing.blob && !editing.isEditing && (
                <div className="markdown-body py-3 px-4 border rounded overflow-hidden">
                    <ReactMarkdown>{editing.blob.content}</ReactMarkdown>
                </div>
            )}
            {editing.blob && editing.isEditing && (
                <Formik
                    initialValues={{ commitName: '', blobContent: editing.blob.content }}
                    onSubmit={onCommitChanges}
                    validationSchema={Yup.object().shape({
                        commitName: Yup.string().required(' ')
                    })}
                >
                    {({ isSubmitting, values, setFieldValue }) => (
                        <Form>
                            <div className="flex gap-x-3">
                                <Field
                                    name="commitName"
                                    component={TextField}
                                    inputClassName="grow"
                                    inputProps={{
                                        placeholder: 'Commit name',
                                        autoComplete: 'off'
                                    }}
                                />

                                <button
                                    className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600 disabled:opacity-75 rounded font-medium"
                                    type="submit"
                                    disabled={isSubmitting || !editing.isDirty}
                                >
                                    Commit changes
                                </button>

                                <button
                                    className="px-3 py-1.5 text-sm text-white bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 disabled:opacity-75 rounded font-medium"
                                    type="button"
                                    onClick={() => setEditing({
                                        ...editing,
                                        isEditing: false
                                    })}
                                >
                                    Cancel
                                </button>
                            </div>

                            <div className="mt-4 py-3 border rounded overflow-hidden">
                                <Editor
                                    className="min-h-[500px]"
                                    language="markdown"
                                    value={values.blobContent}
                                    onMount={(editor) => {
                                        editor.onDidChangeModelContent(() => {
                                            setFieldValue('blobContent', editor.getValue());
                                            setEditing({
                                                ...editing,
                                                isDirty: editor.getValue() !== editing.blob?.content
                                            });
                                        });
                                    }}
                                />
                            </div>
                        </Form>
                    )}
                </Formik>
            )}
        </div>
    );
}

export default BlobPage;
