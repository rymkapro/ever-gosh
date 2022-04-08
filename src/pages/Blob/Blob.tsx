import React, { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import BranchSelect from "../../components/BranchSelect";
import { IGoshBranch, TGoshSnapshotMetaContentItem } from "../../types/types";
import { TRepositoryLayoutOutletContext } from "../RepositoryLayout";
import Editor, { useMonaco } from "@monaco-editor/react";
import { Form, Formik } from "formik";
import ReactMarkdown from 'react-markdown'
import Spinner from "../../components/Spinner";


type TFormCommitValues = {
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
        blob?: TGoshSnapshotMetaContentItem;
        isEditing: boolean;
        isDirty: boolean;
    }>({
        blob: undefined,
        isEditing: false,
        isDirty: false
    });

    const onCommitChanges = async (values: TFormCommitValues) => {
        if (!branchName || !editing.blob) return;

        try {
            await goshRepository.createCommit(
                branchName,
                JSON.stringify([{
                    name: editing.blob.name,
                    original: editing.blob?.content,
                    modified: values.blobContent
                }]),
                [{
                    name: editing.blob.name,
                    content: values.blobContent
                }]
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
                setBranch(branch);
                setEditing((currVal) => ({
                    ...currVal,
                    blob: branch.snapshot.meta?.content.find((item) => item.sha === blobName)
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
                    <span>{editing.blob?.name}</span>
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
                >
                    {({ isSubmitting, values, setFieldValue }) => (
                        <Form>
                            <div className="flex gap-x-3 justify-end">
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
