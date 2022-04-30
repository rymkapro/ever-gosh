import React, { useCallback, useEffect, useState } from "react";
import { faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Field, FieldArray, Form, Formik, FormikHelpers } from "formik";
import { useRecoilValue } from "recoil";
import CopyClipboard from "../../components/CopyClipboard";
import TextField from "../../components/FormikForms/TextField";
import Spinner from "../../components/Spinner";
import { userStateAtom } from "../../store/user.state";
import { GoshWallet } from "../../types/classes";
import { shortString } from "../../utils";
import * as Yup from "yup";
import { useOutletContext } from "react-router-dom";
import { TDaoLayoutOutletContext } from "../DaoLayout";


type TParticipantFormValues = {
    pubkey: string[];
}

const DaoParticipantsPage = () => {
    const userState = useRecoilValue(userStateAtom);
    const { goshDao } = useOutletContext<TDaoLayoutOutletContext>();
    const [participants, setParticipants] = useState<{ pubkey: string; smvBalance: number; }[]>();

    const getParticipantList = useCallback(async () => {
        // Get GoshWallet code by user's pubkey and get all user's wallets
        const walletAddrs = await goshDao.getWallets();
        console.debug('GoshWallets addreses:', walletAddrs);

        const participants = await Promise.all(
            walletAddrs.map(async (addr) => {
                const wallet = new GoshWallet(goshDao.account.client, addr);
                const pubkey = await wallet.getPubkey();
                const smvBalance = await wallet.getSmvTokenBalance();
                return { pubkey, smvBalance };
            })
        );
        setParticipants(participants);
    }, [goshDao]);

    const onCreateParticipant = async (
        values: TParticipantFormValues,
        helpers: FormikHelpers<any>
    ) => {
        try {
            if (!userState.keys) throw Error('Empty user state');

            console.debug('[DAO participants] - Create values:', values);
            await Promise.all(values.pubkey.map(async (item) => {
                if (!userState.keys) throw Error('Empty user state');

                console.debug('[DAO participants] - DAO address:', goshDao.address);
                const rootPubkey = await goshDao.getRootPubkey();
                console.debug('[DAO participants] - Create root/item/keys:', rootPubkey, item, userState.keys);
                const walletAddr = await goshDao.deployWallet(rootPubkey, item, userState.keys);
                console.debug('[DAO participants] - Create wallet addr:', walletAddr);
            }));

            getParticipantList();
            helpers.resetForm();
        } catch (e: any) {
            console.error(e.message);
            alert(e.message);
        }
    }

    useEffect(() => {
        getParticipantList();
    }, [getParticipantList]);

    return (
        <>
            <div>
                {participants === undefined && (
                    <div className="text-gray-606060">
                        <Spinner className="mr-3" />
                        Loading participants...
                    </div>
                )}

                <div className="divide-y divide-gray-c4c4c4">
                    {participants?.map(({ pubkey, smvBalance }, index) => (
                        <div key={index} className="py-2 flex items-center justify-between">
                            <CopyClipboard
                                componentProps={{ text: pubkey }}
                                label={shortString(pubkey, 10, 10)}
                            />
                            <div>
                                <span className="text-gray-606060 text-sm mr-2">Token balance:</span>
                                {smvBalance}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Formik
                initialValues={{ pubkey: [] }}
                onSubmit={onCreateParticipant}
                validationSchema={Yup.object().shape({
                    pubkey: Yup.array().of(Yup.string().required('Required'))
                })}
            >
                {({ isSubmitting, values, touched, errors }) => (
                    <Form className="mt-8">
                        <FieldArray
                            name="pubkey"
                            render={({ push, remove }) => (
                                <>
                                    {values.pubkey.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between gap-x-3 mb-2">
                                            <div className="grow">
                                                <Field
                                                    name={`pubkey.${index}`}
                                                    component={TextField}
                                                    inputProps={{
                                                        className: 'w-full',
                                                        placeholder: 'Participant public key',
                                                        autoComplete: 'off'
                                                    }}
                                                />
                                            </div>
                                            <button
                                                className="btn btn--body px-3.5 py-3"
                                                type="button"
                                                onClick={() => remove(index)}
                                            >
                                                <FontAwesomeIcon icon={faTrashAlt} />
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        className="btn btn--body w-full !font-normal text-sm px-4 py-1.5"
                                        type="button"
                                        onClick={() => push('')}
                                    >
                                        Add participant
                                    </button>

                                    {touched.pubkey && errors.pubkey && (
                                        <div className="text-red-dd3a3a text-sm mt-1">
                                            There are empty participants. Either fill them or remove
                                        </div>
                                    )}
                                </>
                            )}
                        />

                        <button
                            type="submit"
                            className="btn btn--body px-3 py-3 w-full mt-4"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Spinner className="mr-3" size={'lg'} />}
                            Save changes
                        </button>
                    </Form>
                )}
            </Formik>
        </>
    );
}

export default DaoParticipantsPage;
