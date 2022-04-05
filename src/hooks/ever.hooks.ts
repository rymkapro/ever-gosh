import { useEffect, useState } from "react";
import { TonClient } from "@eversdk/core";
import { useRecoilState } from "recoil";
import { everStateAtom } from "../store/ever.state";
import { TAccountData } from "../types/types";
import { Account, AccountType } from "@eversdk/appkit";


export const useEverClient = () => {
    const [everState, setEverState] = useRecoilState(everStateAtom);

    const currentConfigHex = Buffer.from(JSON.stringify(everState.config || {})).toString('hex');
    if (currentConfigHex !== everState.configHex) {
        console.log('[useEverClient]', everState.config);
        setEverState((currVal) => ({
            ...currVal,
            client: new TonClient(everState.config)
        }))
    }

    return everState.client;
}

export const useAccountData = (account: Account | undefined): TAccountData => {
    const [state, setState] = useState<TAccountData>({
        address: '',
        balance: 0,
        acc_type: AccountType.nonExist,
        acc_type_name: ''
    });

    useEffect(() => {
        console.debug('[useAccountInfo] effect');
        if (!account) return;

        const getAccountData = async () => {
            const data = await account?.getAccount();
            const address = await account?.getAddress();
            setState((prevState: any) => ({
                ...prevState,
                address,
                balance: +(data.balance || 0),
                acc_type: data.acc_type,
                acc_type_name: AccountType[data.acc_type],
                code: data.code,
                data: data.data
            }));
        }

        const subscribeAccountData = async () => {
            await account?.subscribeAccount('balance acc_type code data', (response) => {
                setState((prevState: any) => ({
                    ...prevState,
                    balance: +response.balance.toString(16),
                    acc_type: response.acc_type,
                    acc_type_name: response.acc_type_name,
                    code: response.code,
                    data: response.data
                }));
            });
        }

        getAccountData().then();
        subscribeAccountData().then();

        return () => {
            account?.free().then()
        }
    }, [account]);

    return state;
}