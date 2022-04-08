import React, { useEffect, useState } from "react";
import { Field, Form, Formik } from "formik";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import BranchSelect from "../../components/BranchSelect";
import { IGoshBranch } from "../../types/types";
import { TRepositoryLayoutOutletContext } from "../RepositoryLayout";
import TextField from "../../components/FormikForms/TextField";
import Editor from "@monaco-editor/react";


type TFormValues = {
    blobName: string;
    blobContent: string;
}

const BlobCreatePage = () => {
    const { goshRepository } = useOutletContext<TRepositoryLayoutOutletContext>();
    const { repoName, branchName = 'master' } = useParams();
    const navigate = useNavigate();
    const [branches, setBranches] = useState<IGoshBranch[]>([]);

    const onFormSubmit = async (values: TFormValues) => {
        await goshRepository.createCommit(
            branchName,
            `Create blob ${values.blobName}`,
            JSON.stringify([{ name: values.blobName, original: '', modified: values.blobContent }]),
            [{ name: values.blobName, content: values.blobContent }]
        );
        navigate(`/repositories/${goshRepository.name}/tree/${branchName}`);
    }

    useEffect(() => {
        const initState = async () => {
            const branches = await goshRepository.getBranches();
            setBranches(branches);
        }

        initState();
    }, [goshRepository, branchName]);

    if (!branches) return <p>Loading...</p>;
    return (
        <Formik
            initialValues={{ blobName: '', blobContent: '' }}
            onSubmit={onFormSubmit}
        >
            {({ setFieldValue, isSubmitting }) => (
                <Form>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <BranchSelect
                                branch={branches.find((branch) => branch.name === branchName)}
                                branches={branches}
                                onChange={(selected) => {
                                    if (selected) {
                                        navigate(`/repositories/${repoName}/blobs/${selected.name}/create`);
                                    }
                                }}
                            />
                            <span className="mx-3">/</span>
                            <Field
                                name="blobName"
                                component={TextField}
                                inputProps={{
                                    autoComplete: 'off',
                                    placeholder: 'Blob name'
                                }}
                            />
                        </div>

                        <button
                            className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600 disabled:opacity-75 rounded font-medium"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            Create blob
                        </button>
                    </div>

                    <Editor
                        className="min-h-[500px]"
                        wrapperProps={{
                            className: 'mt-5 py-3 border rounded overflow-hidden'
                        }}
                        onChange={(value) => setFieldValue('blobContent', value)}
                    />
                </Form>
            )}
        </Formik>
    );
}

export default BlobCreatePage;
