import React from "react";
import { Form, Formik, Field } from "formik";
import * as Yup from "yup";
import TextareaField from "../../components/FormikForms/TextareaField";
import { useEverClient } from "../../hooks/ever.hooks";
import { signerKeys } from "@eversdk/core";
import { Account, AccountType } from "@eversdk/appkit";
import { GoshABI, GoshTVC } from "../../contracts/gosh/gosh";
import { useSetRecoilState } from "recoil";
import { userStateAtom } from "../../store/user.state";
import { useNavigate } from "react-router-dom";
import { decodeAccountData, isGoshDataSet } from "../../helpers";


type TFormValues = {
    phrase: string;
}

const SigninPage = () => {
    const navigate = useNavigate();
    const everClient = useEverClient();
    const setUserState = useSetRecoilState(userStateAtom);

    const onFormSubmit = async (values: TFormValues) => {
        console.debug('[Signin form] - Submit values', values);
        // Derive keys from phrase and create signer
        const keys = await everClient.crypto.mnemonic_derive_sign_keys({ phrase: values.phrase });
        const signer = signerKeys(keys);

        // Create GOSH root account and get address, acc_type
        const root = new Account({ abi: GoshABI, tvc: GoshTVC }, { signer, client: everClient });
        const address = await root.getAddress();
        setUserState({ address, phrase: values.phrase });

        // Check if account is fully deployed and redirect
        const { acc_type, data } = await root.getAccount();
        const decodedData = await decodeAccountData(root, data);
        acc_type === AccountType.active && isGoshDataSet(decodedData)
            ? navigate('/repositories', { replace: true })
            : navigate('/account', { replace: true });
    }

    return (
        <section className="px-2">
            <div className="max-w-lg mx-auto">
                <h1 className="text-gray-700 text-center text-3xl font-semibold pt-12 pb-14">Create GOSH account</h1>

                <Formik
                    initialValues={{ phrase: '' }}
                    onSubmit={onFormSubmit}
                    validationSchema={Yup.object().shape({
                        phrase: Yup.string().required('`Phrase` is required')
                    })}
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
                                        placeholder: 'GOSH root seed phrase'
                                    }}
                                    inputClassName="px-3 py-2 w-full"
                                />
                            </div>

                            <div className="mt-5">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-3 py-3 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600 disabled:opacity-75 rounded w-full font-medium"
                                >
                                    Sign in
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </section>
    );
}

export default SigninPage;
