import React, { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import BranchSelect from "../../components/BranchSelect";
import { IGoshBlob, TGoshBranch } from "../../types/types";
import { TRepositoryLayoutOutletContext } from "../RepositoryLayout";
import Editor, { useMonaco } from "@monaco-editor/react";
import { Field, Form, Formik } from "formik";
import ReactMarkdown from 'react-markdown'
import Spinner from "../../components/Spinner";
import { GoshBlob } from "../../types/classes";
import { generateDiff } from "../../helpers";
import TextField from "../../components/FormikForms/TextField";
import * as Yup from "yup";


type TFormCommitValues = {
    message: string;
    blobContent: string;
}

const BlobPage = () => {
    const { goshRepository } = useOutletContext<TRepositoryLayoutOutletContext>();
    const { repoName, branchName = 'master', blobName } = useParams();
    const navigate = useNavigate();
    const monaco = useMonaco();
    const [branches, setBranches] = useState<TGoshBranch[]>([]);
    const [branch, setBranch] = useState<TGoshBranch>();
    const [blob, setBlob] = useState<IGoshBlob>();
    const [editing, setEditing] = useState<{
        isEditing: boolean;
        isDirty: boolean;
    }>({
        isEditing: false,
        isDirty: false
    });

    const onCommitChanges = async (values: TFormCommitValues) => {
        if (!branchName || !blob || !blobName) return;
        try {
            const diff = await generateDiff(monaco, values.blobContent, blob.meta?.content);
            await goshRepository.createCommit(
                branchName,
                values.message,
                [{ name: blobName, diff }],
                [{ name: blobName, content: values.blobContent }]
            );
            navigate(`/repositories/${repoName}/tree/${branchName}`);
        } catch (e: any) {
            alert(e.message);
        }
    }

    useEffect(() => {
        const initState = async () => {
            const branches = await goshRepository.getBranches();
            const branch = branches.find((branch) => branch.name === branchName);
            if (branch) {
                await branch.snapshot.load();

                const blobItem = branch.snapshot.meta?.content.find((item) => item.name === blobName);
                if (blobItem) {
                    const blob = new GoshBlob(goshRepository.account.client, blobItem.address);
                    await blob.load();
                    setBlob(blob);
                }
                setBranch(branch);
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
    }, [monaco]);

    return (
        <div>
            <h2 className="text-gray-700 text-xl font-semibold mb-5">Read/update blob</h2>

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

            {!blob && (<p>Blob not found</p>)}
            {blob && !editing.isEditing && (
                <div className="markdown-body py-3 px-4 border rounded overflow-hidden">
                    <ReactMarkdown>{blob.meta?.content || ''}</ReactMarkdown>
                </div>
            )}
            {blob && editing.isEditing && (
                <Formik
                    initialValues={{ message: '', blobContent: blob.meta?.content || '' }}
                    onSubmit={onCommitChanges}
                    validationSchema={Yup.object().shape({
                        message: Yup.string().required(' ')
                    })}
                >
                    {({ isSubmitting, values, setFieldValue }) => (
                        <Form>
                            <div className="flex gap-x-3">
                                <Field
                                    name="message"
                                    component={TextField}
                                    inputClassName="grow"
                                    inputProps={{
                                        autoComplete: 'off',
                                        placeholder: 'Commit message'
                                    }}
                                />
                                <button
                                    className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600 disabled:opacity-75 rounded font-medium"
                                    type="submit"
                                    disabled={isSubmitting || !editing.isDirty}
                                >
                                    {isSubmitting && <Spinner className="mr-2" />}
                                    Commit changes
                                </button>

                                <button
                                    className="px-3 py-1.5 text-sm text-white bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 disabled:opacity-75 rounded font-medium"
                                    type="button"
                                    disabled={isSubmitting}
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
                                                isDirty: editor.getValue() !== blob.meta?.content
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
