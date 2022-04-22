import React from "react";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import TextField from "../../components/FormikForms/TextField";
import { useGoshWallet } from "../../hooks/gosh.hooks";
import { useNavigate, useParams } from "react-router-dom";
import Spinner from "../../components/Spinner";


type TFormValues = {
    name: string;
}

const RepoCreatePage = () => {
    const { daoName } = useParams();
    const goshWallet = useGoshWallet(daoName);
    const navigate = useNavigate();

    const onRepoCreate = async (values: TFormValues) => {
        try {
            await goshWallet?.deployRepo(values.name);
            navigate(`/${daoName}/${values.name}`, { replace: true });
        } catch (e: any) {
            console.error(e.message);
            alert(e.message);
        }
    }

    return (
        <div className="container mt-12 mb-5">
            <div className="bordered-block max-w-lg px-7 py-8 mx-auto">
                <h1 className="font-semibold text-2xl text-center mb-8">Create new repository</h1>

                <Formik
                    initialValues={{ name: '' }}
                    onSubmit={onRepoCreate}
                    validationSchema={Yup.object().shape({
                        name: Yup.string().required('Name is required')
                    })}
                >
                    {({ isSubmitting }) => (
                        <Form>
                            <div>
                                <Field
                                    name="name"
                                    component={TextField}
                                    inputProps={{
                                        className: 'w-full',
                                        autoComplete: 'off',
                                        placeholder: 'Repository name'
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !goshWallet}
                                className="btn btn--body px-3 py-3 w-full mt-6"
                            >
                                {isSubmitting && <Spinner className="mr-2" size={'lg'} />}
                                Create repository
                            </button>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}

export default RepoCreatePage;
