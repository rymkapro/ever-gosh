import { signerKeys, TonClient } from "@eversdk/core";
import WalletABI from "./contracts/wallets/SafeMultisigWallet.abi.json";
import wallet from "./contracts/wallets/SafeMultisigWallet.json";
import { Account } from "@eversdk/appkit";
import { toast } from "react-toastify";


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
 * Convert from evers to nanoevers
 * @param value
 * @returns
 */
export const fromEvers = (value: number): number => {
    return value * 10 ** 9;
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
