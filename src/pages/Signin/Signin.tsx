import React from "react";
import { Form, Formik, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import TextareaField from "../../components/FormikForms/TextareaField";
import { useEverClient } from "../../hooks/ever.hooks";
import { useSetRecoilState } from "recoil";
import { userStateAtom } from "../../store/user.state";
import { useNavigate } from "react-router-dom";
import Spinner from "../../components/Spinner";
import { getGoshRootFromPhrase } from "../../helpers";


type TFormValues = {
    phrase: string;
}

const SigninPage = () => {
    const navigate = useNavigate();
    const everClient = useEverClient();
    const setUserState = useSetRecoilState(userStateAtom);

    const onFormSubmit = async (values: TFormValues) => {
        console.debug('[Signin form] - Submit values', values);
        const root = await getGoshRootFromPhrase(everClient, values.phrase);
        setUserState({ address: root.details?.address, phrase: values.phrase });
        root.isDeployed
            ? navigate('/repositories', { replace: true })
            : navigate('/account', { replace: true });
    }

    return (
        <div className="block-auth">
            <h1 className="px-2 text-center font-bold text-32px sm:text-5xl leading-56px">
                Sign in to Gosh
            </h1>
            <div className="px-9 sm:px-2 mt-0 sm:mt-2 mb-10 text-center text-gray-606060 text-lg sm:text-xl leading-normal">
                Please, write your seed phrase
            </div>

            <Formik
                initialValues={{ phrase: '' }}
                onSubmit={onFormSubmit}
                validationSchema={Yup.object().shape({
                    phrase: Yup.string().required('Phrase is required')
                })}
            >
                {({ isSubmitting, touched, errors }) => (
                    <Form className="px-5 sm:px-124px">
                        <div>
                            <Field
                                name="phrase"
                                component={TextareaField}
                                errorEnabled={false}
                                inputProps={{
                                    className: '!px-7 !py-6',
                                    autoComplete: 'off',
                                    placeholder: 'GOSH root seed phrase'
                                }}
                            />
                        </div>

                        <div className="mt-10 text-red-dd3a3a text-center text-base h-6">
                            {touched.phrase && errors.phrase && (<ErrorMessage name={'phrase'} />)}
                        </div>

                        <div className="mt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn btn--body w-full py-3 text-xl leading-normal"
                            >
                                {isSubmitting && <Spinner className="mr-3" size={'lg'} />}
                                Sign in
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
}

export default SigninPage;
