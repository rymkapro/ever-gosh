import { signerKeys, TonClient } from "@eversdk/core";
import WalletABI from "./contracts/wallets/SafeMultisigWallet.abi.json";
import wallet from "./contracts/wallets/SafeMultisigWallet.json";
import { Account } from "@eversdk/appkit";
import { Id, toast, ToastOptions, UpdateOptions } from "react-toastify";


/**
 * SafeMultisigWallet as a giver
 * @param client
 * @param address
 * @param value
 */
export const giver = async (client: TonClient, address: string, value: number, payload: string = '') => {
    const signer = signerKeys(wallet.keys);
    const account = new Account({ abi: WalletABI }, { client, address: wallet.address, signer });
    await account.run('submitTransaction', { dest: address, value, bounce: false, allBalance: false, payload });
}

/**
 * Convert from nanoevers to evers
 * @param value
 * @param round
 * @returns
 */
export const toEvers = (value: any, round: number = 3): number => {
    const rounder = 10 ** round;
    return Math.round(value / 10 ** 9 * rounder) / rounder;
}

/**
 * Decode ever accout data
 * @param account
 * @param data
 * @returns
 */
export const decodeAccountData = async (account: Account, data?: string): Promise<any> => {
    if (!data) data = (await account.getAccount()).data as string;
    if (!data) return undefined;

    const result = await account.client.abi.decode_account_data({
        abi: account.abi,
        data
    });
    return result.data;
}

/**
 * Check if GOSH repository, commit, etc. code and data are set
 * @param decodedData
 * @returns
 */
export const isGoshDataSet = (decodedData: any): boolean => {
    return !Object.values(decodedData).some((value: any) => value === 'te6ccgEBAQEAAgAAAA==')
}

/**
 * Toast shortcuts
 */
export const ToastOptionsShortcuts = {
    Default: {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        pauseOnFocusLoss: false,
        draggable: true,
        closeButton: true,
        progress: undefined
    },
    Message: {
        position: toast.POSITION.TOP_CENTER,
        autoClose: 1500,
        pauseOnFocusLoss: false,
        pauseOnHover: false,
        closeButton: false,
        hideProgressBar: true
    },
    CopyMessage: {
        position: toast.POSITION.TOP_CENTER,
        autoClose: 1500,
        pauseOnFocusLoss: false,
        pauseOnHover: false,
        closeButton: false,
        hideProgressBar: true,
        style: { width: '50%' },
        className: 'mx-auto'
    }
}

// export const Toasts = {
//     onCopy(content?: string) {
//         toast.success(content ?? 'Copied', {
//             ...ToastOptionsShortcuts.Message,
//             style: { width: '50%' },
//             className: 'mx-auto'
//         })
//     },
//     onPromisePending(content: any, options?: ToastOptions): Id {
//         return toast.loading(content, options);
//     },
//     onPromiseSuccess(id: Id, options?: UpdateOptions) {
//         toast.update(id, {
//             ...ToastOptionsShortcuts.Default,
//             type: toast.TYPE.SUCCESS,
//             isLoading: false,
//             autoClose: 2000,
//             ...options
//         });
//     },
//     onPromiseError(id: Id, options?: UpdateOptions) {
//         toast.update(id, {
//             ...ToastOptionsShortcuts.Default,
//             type: toast.TYPE.ERROR,
//             isLoading: false,
//             pauseOnFocusLoss: true,
//             ...options
//         });
//     }
// }