import React, { useEffect, useState } from "react";
import { Form, Formik, Field } from "formik";
import * as Yup from "yup";
import TextareaField from "../../components/FormikForms/TextareaField";
import SwitchField from "../../components/FormikForms/SwitchField";
import { useEverClient } from "../../hooks/ever.hooks";
import { useSetRecoilState } from "recoil";
import { userStateAtom } from "../../store/user.state";
import { useNavigate } from "react-router-dom";
import Spinner from "../../components/Spinner";
import { TonClient } from "@eversdk/core";
import { createGoshRootFromPhrase } from "../../helpers";


type TFormValues = {
    phrase: string;
    isConfirmed: boolean;
}

const SignupPage = () => {
    const navigate = useNavigate();
    const everClient = useEverClient();
    const setUserState = useSetRecoilState(userStateAtom);
    const [phrase, setPhrase] = useState<string>('');

    const generatePhrase = async (client: TonClient) => {
        const result = await client.crypto.mnemonic_from_random({});
        setPhrase(result.phrase);
    }

    const onFormSubmit = async (values: TFormValues) => {
        console.debug('[Signup form] - Submit values', values);
        const root = await createGoshRootFromPhrase(everClient, values.phrase);
        setUserState({ address: root.details?.address, phrase: values.phrase });
        navigate('/account', { replace: true });
    }

    useEffect(() => {
        console.debug('[Signup] - Generate phrase');
        generatePhrase(everClient);
    }, [everClient]);

    return (
        <section className="px-2">
            <div className="max-w-lg mx-auto">
                <h1 className="text-gray-700 text-center text-3xl font-semibold pt-12 pb-14">Create GOSH account</h1>

                <Formik
                    initialValues={{ phrase, isConfirmed: false }}
                    onSubmit={onFormSubmit}
                    validationSchema={Yup.object().shape({
                        phrase: Yup.string().required('`Phrase` is required'),
                        isConfirmed: Yup.boolean().oneOf([true], 'You should accept this')
                    })}
                    enableReinitialize={true}
                >
                    {({ isSubmitting, values }) => (
                        <Form>
                            <div>
                                <Field
                                    name="phrase"
                                    component={TextareaField}
                                    label="Seed phrase"
                                    inputProps={{
                                        className: 'input--textarea px-3 py-2 w-full',
                                        autoComplete: 'off',
                                        placeholder: 'GOSH root seed phrase',
                                        readOnly: true
                                    }}
                                />
                            </div>

                            <div className="mt-4">
                                <Field
                                    name="isConfirmed"
                                    component={SwitchField}
                                    label="I have written phrase carefuly"
                                />
                            </div>

                            <div className="mt-5">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !values.isConfirmed}
                                    className="px-3 py-3 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600 disabled:opacity-75 rounded w-full font-medium"
                                >
                                    {isSubmitting && <Spinner className="mr-2" size={'lg'} />}
                                    Create account
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </section>
    );
}

export default SignupPage;
