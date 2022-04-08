import React from "react";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import TextField from "../../components/FormikForms/TextField";
import { useGoshRoot } from "../../hooks/gosh.hooks";
import { useNavigate } from "react-router-dom";
import Spinner from "../../components/Spinner";


type TFormValues = {
    name: string;
}

const RepositoryCreatePage = () => {
    const goshRoot = useGoshRoot();
    const navigate = useNavigate();

    const onFormSubmit = async (values: TFormValues) => {
        try {
            await goshRoot?.createRepository(values.name);
            navigate(`/repositories/${values.name}`, { replace: true });
        } catch (e: any) {
            console.error(e);
        }
    }

    return (
        <section className="p-2">
            <div className="max-w-lg mx-auto">
                <h1 className="text-gray-700 font-semibold text-2xl pt-10 pb-7">
                    Create new repository
                </h1>

                <Formik
                    initialValues={{ name: '' }}
                    onSubmit={onFormSubmit}
                    validationSchema={Yup.object().shape({
                        name: Yup.string().required('`Name` is required')
                    })}
                >
                    {({ isSubmitting }) => (
                        <Form>
                            <div>
                                <Field
                                    name="name"
                                    component={TextField}
                                    label="Repository name"
                                    help="Some help text"
                                    inputProps={{
                                        autoComplete: 'off',
                                        placeholder: 'Repository name'
                                    }}
                                    inputClassName="px-3 py-2 w-full"
                                />
                            </div>

                            <div className="mt-5">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !goshRoot}
                                    className="px-3 py-3 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600 disabled:opacity-75 rounded w-full font-medium"
                                >
                                    {isSubmitting && <Spinner className="mr-2" size={'lg'} />}
                                    Create repository
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </section>
    );
}

export default RepositoryCreatePage;
