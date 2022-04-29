import React, { useEffect, useState } from "react";
import { Field, Form, Formik, FormikHelpers } from "formik";
import { useParams } from "react-router-dom";
import TextField from "../../components/FormikForms/TextField";
import Spinner from "../../components/Spinner";
import { useGoshWallet } from "../../hooks/gosh.hooks";
import { GoshSmvLocker } from "../../types/classes";
import { IGoshWallet } from "../../types/types";
import * as Yup from "yup";


type TMoveBalanceFormValues = {
    amount: number;
}

const DaoWalletPage = () => {
    const { daoName } = useParams();
    const goshWallet = useGoshWallet(daoName);
    const [data, setData] = useState<{ balance: number; smvBalance?: number; smvLocked?: number; }>();

    const getWalletData = async (wallet: IGoshWallet) => {
        const balance = await wallet.getSmvTokenBalance();
        const lockerAddr = await wallet.getSmvLockerAddr();
        const locker = new GoshSmvLocker(wallet.account.client, lockerAddr);
        await locker.load();
        setData({ balance, smvBalance: locker.meta?.votesTotal, smvLocked: locker.meta?.votesLocked });
    }

    const onMoveBalanceToSmvBalance = async (
        values: TMoveBalanceFormValues,
        helpers: FormikHelpers<TMoveBalanceFormValues>
    ) => {
        console.debug('[Move balance to SMV balance] - Values:', values);
        try {
            if (!goshWallet) throw Error('Wallet is undefined');

            await goshWallet.lockVoting(values.amount);
            helpers.resetForm();
            getWalletData(goshWallet);
        } catch (e: any) {
            console.error(e.message);
            alert(e.message);
        }
    }

    const onMoveSmvBalanceToBalance = async (
        values: TMoveBalanceFormValues,
        helpers: FormikHelpers<TMoveBalanceFormValues>
    ) => {
        console.debug('[Move SMV balance to balance] - Values:', values);
        try {
            if (!goshWallet) throw Error('Wallet is undefined');

            await goshWallet.unlockVoting(values.amount);
            helpers.resetForm();
            getWalletData(goshWallet);
        } catch (e: any) {
            console.error(e.message);
            alert(e.message);
        }
    }

    const onReleaseSmvTokens = async () => {
        try {
            if (!goshWallet) throw Error('Wallet is undefined');

            await goshWallet.updateHead();
            getWalletData(goshWallet);
        } catch (e: any) {
            console.error(e.message);
            alert(e.message);
        }
    }

    useEffect(() => {
        if (goshWallet) getWalletData(goshWallet);
    }, [goshWallet]);

    if (!goshWallet) return (
        <div className="text-gray-606060">
            <Spinner className="mr-3" />
            Loading wallet...
        </div>
    )
    return (
        <>
            <div className="flex items-center gap-x-6 mb-4">
                <div>
                    <span className="font-semibold mr-2">Wallet balance:</span>
                    {data?.balance}
                </div>
                <div>
                    <span className="font-semibold mr-2">SMV balance:</span>
                    {data?.smvBalance}
                </div>
                <div>
                    <span className="font-semibold mr-2">Locked:</span>
                    {data?.smvLocked}
                </div>

            </div>

            <div className="divide-y divide-gray-200">
                <div className="py-5">
                    <p className="mb-3">
                        Move tokens from wallet balance to SMV balance to get an ability to create
                        new proposals and vote
                    </p>
                    <Formik
                        initialValues={{ amount: data?.balance || 0 }}
                        onSubmit={onMoveBalanceToSmvBalance}
                        validationSchema={Yup.object().shape({
                            amount: Yup
                                .number()
                                .min(1)
                                .max(data?.balance || 0)
                                .required('Field is required')
                        })}
                        enableReinitialize
                    >
                        {({ isSubmitting }) => (
                            <Form className="flex items-baseline gap-x-3">
                                <div>
                                    <Field
                                        name="amount"
                                        component={TextField}
                                        inputProps={{
                                            className: '!py-2',
                                            placeholder: 'Amount',
                                            autoComplete: 'off'
                                        }}
                                    />
                                </div>
                                <button
                                    className="btn btn--body !font-normal px-4 py-2"
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && <Spinner className="mr-2" />}
                                    Move tokens to SMV balance
                                </button>
                            </Form>
                        )}
                    </Formik>
                </div>
                <div className="py-5">
                    <p className="mb-3">
                        Move tokens from SMV balance back to wallet balance
                    </p>
                    <Formik
                        initialValues={{ amount: data?.smvBalance || 0 }}
                        onSubmit={onMoveSmvBalanceToBalance}
                        validationSchema={Yup.object().shape({
                            amount: Yup
                                .number()
                                .min(1)
                                .max(data?.smvBalance || 0)
                                .required('Field is required')
                        })}
                        enableReinitialize
                    >
                        {({ isSubmitting }) => (
                            <Form className="flex items-baseline gap-x-3">
                                <div>
                                    <Field
                                        name="amount"
                                        component={TextField}
                                        inputProps={{
                                            className: '!py-2',
                                            placeholder: 'Amount',
                                            autoComplete: 'off'
                                        }}
                                    />
                                </div>
                                <button
                                    className="btn btn--body !font-normal px-4 py-2"
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && <Spinner className="mr-2" />}
                                    Move tokens to wallet balance
                                </button>
                            </Form>
                        )}
                    </Formik>
                </div>
                <div className="py-5">
                    <p className="mb-3">
                        Release locked tokens from all completed proposals back to SMV balance
                    </p>
                    <Formik
                        initialValues={{}}
                        onSubmit={onReleaseSmvTokens}
                        enableReinitialize
                    >
                        {({ isSubmitting }) => (
                            <Form>
                                <button
                                    className="btn btn--body !font-normal px-4 py-2"
                                    type="submit"
                                    disabled={isSubmitting || !data?.smvLocked}
                                >
                                    {isSubmitting && <Spinner className="mr-2" />}
                                    Release locked tokens
                                </button>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>
        </>
    );
}

export default DaoWalletPage;
