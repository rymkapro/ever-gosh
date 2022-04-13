import React from "react";
import { Field, Form, Formik } from "formik";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { TRepositoryLayoutOutletContext } from "../RepositoryLayout";
import TextField from "../../components/FormikForms/TextField";
import Editor, { useMonaco } from "@monaco-editor/react";
import Spinner from "../../components/Spinner";
import { generateDiff } from "../../helpers";
import * as Yup from "yup";


type TFormValues = {
    branch: string;
    name: string;
    content: string;
}

const BlobCreatePage = () => {
    const { goshRepository } = useOutletContext<TRepositoryLayoutOutletContext>();
    const { repoName, branchName = 'master' } = useParams();
    const navigate = useNavigate();
    const monaco = useMonaco();

    const onFormSubmit = async (values: TFormValues) => {
        try {
            const diff = await generateDiff(monaco, values.content);
            await goshRepository.createCommit(
                branchName,
                `Create file \`${values.name}\``,
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
            initialValues={{ branch: branchName, name: '', content: '' }}
            onSubmit={onFormSubmit}
            validationSchema={Yup.object().shape({
                name: Yup.string().required('Field is required')
            })}
        >
            {({ setFieldValue, isSubmitting }) => (
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
                                        placeholder: 'Name of new file'
                                    }}
                                />
                            </div>
                            <span className="mx-2">in</span>
                            <span className="text-sm">{repoName}:{branchName}</span>
                        </div>

                        <button
                            className="btn--blue text-sm font-medium px-3 py-1.5"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Spinner className="mr-2" />}
                            Commit changes
                        </button>
                    </div>

                    <Editor
                        className="min-h-[500px]"
                        wrapperProps={{
                            className: 'mt-5 py-3 border rounded overflow-hidden'
                        }}
                        language="markdown"
                        onChange={(value) => setFieldValue('content', value)}
                    />
                </Form>
            )}
        </Formik>
    );
}

export default BlobCreatePage;
