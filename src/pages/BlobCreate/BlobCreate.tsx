import React, { useEffect, useState } from "react";
import { Field, Form, Formik } from "formik";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import BranchSelect from "../../components/BranchSelect";
import { TGoshBranch } from "../../types/types";
import { TRepositoryLayoutOutletContext } from "../RepositoryLayout";
import TextField from "../../components/FormikForms/TextField";
import Editor, { useMonaco } from "@monaco-editor/react";
import Spinner from "../../components/Spinner";
import { generateDiff, getGoshRepositoryBranches } from "../../helpers";
import * as Yup from "yup";


type TFormValues = {
    blobName: string;
    blobContent: string;
}

const BlobCreatePage = () => {
    const { goshRepository } = useOutletContext<TRepositoryLayoutOutletContext>();
    const { repoName, branchName = 'master' } = useParams();
    const navigate = useNavigate();
    const [branches, setBranches] = useState<TGoshBranch[]>([]);
    const monaco = useMonaco();

    const onFormSubmit = async (values: TFormValues) => {
        try {
            const diff = await generateDiff(monaco, values.blobContent);
            await goshRepository.createCommit(
                branchName,
                'Create blob',
                [{ name: values.blobName, diff }],
                [{ name: values.blobName, content: values.blobContent }]
            );
            navigate(`/repositories/${repoName}/tree/${branchName}`);
        } catch (e: any) {
            alert(e.message);
        }
    }

    useEffect(() => {
        const initState = async () => {
            const [branches] = await getGoshRepositoryBranches(goshRepository);
            setBranches(branches);
        }

        initState();
    }, [goshRepository, branchName]);

    return (
        <div>
            <h2 className="text-gray-700 text-xl font-semibold mb-5">Create blob</h2>

            <Formik
                initialValues={{ blobName: '', blobContent: '' }}
                onSubmit={onFormSubmit}
                validationSchema={Yup.object().shape({
                    blobName: Yup.string().required(' ')
                })}
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
                                {isSubmitting && <Spinner className="mr-2" />}
                                Create blob
                            </button>
                        </div>

                        <Editor
                            className="min-h-[500px]"
                            wrapperProps={{
                                className: 'mt-5 py-3 border rounded overflow-hidden'
                            }}
                            language="markdown"
                            onChange={(value) => setFieldValue('blobContent', value)}
                        />
                    </Form>
                )}
            </Formik>
        </div>
    );
}

export default BlobCreatePage;
