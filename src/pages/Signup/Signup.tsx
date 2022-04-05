import React, { useEffect, useState } from "react";
import { Form, Formik, Field } from "formik";
import * as Yup from "yup";
import TextareaField from "../../components/FormikForms/TextareaField";
import SwitchField from "../../components/FormikForms/SwitchField";
import { useEverClient } from "../../hooks/ever.hooks";
import { signerKeys } from "@eversdk/core";
import { Account } from "@eversdk/appkit";
import { GoshABI, GoshTVC } from "../../contracts/gosh/gosh";
import { useSetRecoilState } from "recoil";
import { userStateAtom } from "../../store/user.state";
import { useNavigate } from "react-router-dom";


type TFormValues = {
    phrase: string;
    isConfirmed: boolean;
}

const SignupPage = () => {
    const navigate = useNavigate();
    const everClient = useEverClient();
    const setUserState = useSetRecoilState(userStateAtom);
    const [phrase, setPhrase] = useState<string>('');

    const onFormSubmit = async (values: TFormValues) => {
        console.debug('[Signup form] - Submit values', values);
        // Derive keys from phrase and create signer
        const keys = await everClient.crypto.mnemonic_derive_sign_keys({ phrase: values.phrase });
        const signer = signerKeys(keys);

        // Create GOSH root account and get address
        const root = new Account({ abi: GoshABI, tvc: GoshTVC }, { signer, client: everClient });
        const address = await root.getAddress();

        setUserState({ address, phrase: values.phrase });
        navigate('/account', { replace: true });
    }

    useEffect(() => {
        const generatePhrase = async () => {
            const result = await everClient.crypto.mnemonic_from_random({});
            setPhrase(result.phrase);
        }

        console.debug('[Signup] - Generate phrase');
        generatePhrase();
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
                                        autoComplete: 'off',
                                        placeholder: 'GOSH root seed phrase',
                                        readOnly: true
                                    }}
                                    inputClassName="px-3 py-2 w-full"
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
