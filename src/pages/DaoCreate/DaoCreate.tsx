import React, { useState } from "react";
import { ErrorMessage, Field, FieldArray, Form, Formik } from "formik";
import * as Yup from "yup";
import TextField from "../../components/FormikForms/TextField";
import { useGoshRoot } from "../../hooks/gosh.hooks";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userStateAtom } from "../../store/user.state";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import Spinner from "../../components/Spinner";
import { GoshDao } from "../../types/classes";


type TFormValues = {
    name: string;
    participants: string[];
}

const DaoCreatePage = () => {
    const goshRoot = useGoshRoot();
    const navigate = useNavigate();
    const userState = useRecoilValue(userStateAtom);

    const onDaoCreate = async (values: TFormValues) => {
        try {
            if (!userState.keys) throw Error('Empty user state');
            if (!goshRoot?.account.client) throw Error('Client is not ready');

            // Deploy GoshDao
            const rootPubkey = `0x${userState.keys.public}`;
            const daoAddr = await goshRoot?.createDao(values.name, rootPubkey);
            console.debug('DAO address:', daoAddr);
            const dao = new GoshDao(goshRoot.account.client, daoAddr);

            // Deploy wallets
            await Promise.all(values.participants.map(async (item) => {
                const walletAddr = await dao.createWallet(rootPubkey, item);
                console.debug('DAOWallet address:', walletAddr);
            }));

            navigate('/account/orgs');
        } catch (e: any) {
            console.error(e.message);
            alert(e.message);
        }
    }

    return (
        <div className="container mt-12 mb-5">
            <div className="bordered-block max-w-lg px-7 py-8 mx-auto">
                <h1 className="font-semibold text-2xl text-center mb-8">Create new organization</h1>

                <Formik
                    initialValues={{
                        name: '',
                        participants: [
                            userState.keys ? `0x${userState.keys.public}` : ''
                        ]
                    }}
                    onSubmit={onDaoCreate}
                    validationSchema={Yup.object().shape({
                        name: Yup.string().required('Name is required'),
                        participants: Yup.array().of(Yup.string().required('Required'))
                    })}
                >
                    {({ values, touched, errors, isSubmitting }) => (
                        <Form>
                            <div>
                                <Field
                                    name="name"
                                    component={TextField}
                                    inputProps={{
                                        placeholder: 'New organization name',
                                        autoComplete: 'off'
                                    }}
                                />
                            </div>

                            <div className="mt-6">
                                <h3 className="mb-2">Participants</h3>
                                <FieldArray
                                    name="participants"
                                    render={({ push, remove }) => (
                                        <>
                                            {values.participants.map((item, index) => (
                                                <div key={index} className="flex items-center justify-between gap-x-3 mb-2">
                                                    <div className="grow">
                                                        <Field
                                                            name={`participants.${index}`}
                                                            component={TextField}
                                                            inputProps={{
                                                                className: 'w-full',
                                                                placeholder: 'Participant public key',
                                                                autoComplete: 'off',
                                                                disabled: index === 0
                                                            }}
                                                        />
                                                    </div>
                                                    {index > 0 && (
                                                        <button
                                                            className="btn btn--body px-3.5 py-3"
                                                            type="button"
                                                            onClick={() => remove(index)}
                                                        >
                                                            <FontAwesomeIcon icon={faTrashAlt} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}

                                            <button
                                                className="btn btn--body w-full !font-normal text-sm px-4 py-1.5"
                                                type="button"
                                                onClick={() => push('')}
                                            >
                                                Add participant
                                            </button>

                                            {touched.participants && errors.participants && (
                                                <div className="text-red-dd3a3a text-sm mt-1">
                                                    There are empty participants. Either fill them or remove
                                                </div>
                                            )}
                                        </>
                                    )}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn--body px-3 py-3 w-full mt-8"
                                disabled={isSubmitting}
                            >
                                {isSubmitting && <Spinner className="mr-3" size={'lg'} />}
                                Create organization
                            </button>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}

export default DaoCreatePage;
