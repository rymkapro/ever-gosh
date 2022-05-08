import React, { useEffect, useState } from "react";
import { Field, Form, Formik } from "formik";
import { useOutletContext } from "react-router-dom";
import TextField from "../../components/FormikForms/TextField";
import Spinner from "../../components/Spinner";
import { GoshSmvLocker } from "../../types/classes";
import { IGoshSmvLocker, IGoshWallet } from "../../types/types";
import * as Yup from "yup";
import { useRecoilValue } from "recoil";
import { userStateAtom } from "../../store/user.state";
import CopyClipboard from "../../components/CopyClipboard";
import { TDaoLayoutOutletContext } from "../DaoLayout";
import { EGoshError, GoshError } from "../../types/errors";


type TMoveBalanceFormValues = {
    amount: number;
}

const DaoWalletPage = () => {
    const userState = useRecoilValue(userStateAtom);
    const { goshWallet } = useOutletContext<TDaoLayoutOutletContext>();

    const [data, setData] = useState<{
        locker?: IGoshSmvLocker;
        balance?: number;
        smvBalance?: number;
        smvLocked?: number;
    }>();

    const gitRemoteCredentials = {
        "my-wallet": {
            "address": goshWallet?.address,
            "keys": {
                "public": userState.keys?.public,
                "secret": userState.keys?.secret
            }
        }
    }

    const onMoveBalanceToSmvBalance = async (values: TMoveBalanceFormValues) => {
        console.debug('[Move balance to SMV balance] - Values:', values);
        try {
            if (!goshWallet) throw new GoshError(EGoshError.NO_WALLET);

            await goshWallet.lockVoting(values.amount);
            alert('Submitted. Balances will be updated soon');
        } catch (e: any) {
            console.error(e.message);
            alert(e.message);
        }
    }

    const onMoveSmvBalanceToBalance = async (values: TMoveBalanceFormValues) => {
        console.debug('[Move SMV balance to balance] - Values:', values);
        try {
            if (!goshWallet) throw new GoshError(EGoshError.NO_WALLET);

            await goshWallet.unlockVoting(values.amount);
            alert('Submitted. Balances will be updated soon');
        } catch (e: any) {
            console.error(e.message);
            alert(e.message);
        }
    }

    const onReleaseSmvTokens = async () => {
        try {
            if (!goshWallet) throw new GoshError(EGoshError.NO_WALLET);

            await goshWallet.updateHead();
            alert('Release submitted. Available tokens will be released soon');
        } catch (e: any) {
            console.error(e.message);
            alert(e.message);
        }
    }

    useEffect(() => {
        const getWalletData = async (wallet: IGoshWallet) => {
            const balance = await wallet.getSmvTokenBalance();
            const lockerAddr = await wallet.getSmvLockerAddr();
            const locker = new GoshSmvLocker(wallet.account.client, lockerAddr);
            await locker.load();
            setData({
                locker,
                balance,
                smvBalance:
                    locker.meta?.votesTotal,
                smvLocked: locker.meta?.votesLocked
            });
        }

        if (goshWallet && !data?.locker) getWalletData(goshWallet);
        let interval: any;
        if (goshWallet && data?.locker) {
            interval = setInterval(async () => {
                const balance = await goshWallet.getSmvTokenBalance();
                await data.locker?.load();
                setData((prev) => ({
                    ...prev,
                    balance,
                    smvBalance: data.locker?.meta?.votesTotal,
                    smvLocked: data.locker?.meta?.votesLocked
                }));
            }, 5000);
        }

        return () => {
            clearInterval(interval);
        }
    }, [goshWallet, data?.locker]);

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
                    <h3 className="text-lg font-semibold">Topup SMV balance</h3>
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
                    <h3 className="text-lg font-semibold">Release tokens</h3>
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
                    <h3 className="text-lg font-semibold">Release locked tokens</h3>
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
                <div className="py-5">
                    <h3 className="text-lg font-semibold">Git remote</h3>
                    <div className="mb-3">
                        Git remote credentials

                    </div>
                    {goshWallet.isDaoParticipant
                        ? (
                            <pre className="relative text-sm bg-gray-050a15/5 rounded-md px-4 py-3 overflow-x-auto">
                                <CopyClipboard
                                    className="absolute right-3 top-3"
                                    componentProps={{ text: JSON.stringify(gitRemoteCredentials) }}
                                    iconProps={{ size: 'lg' }}
                                />
                                {JSON.stringify(gitRemoteCredentials, undefined, 2)}
                            </pre>
                        )
                        : <p className="text-sm text-rose-400">You are not a DAO participant</p>
                    }

                </div>
            </div>
        </>
    );
}

export default DaoWalletPage;
