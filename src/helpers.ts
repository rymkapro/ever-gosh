import { signerKeys, TonClient } from "@eversdk/core";
import WalletABI from "./contracts/wallets/SafeMultisigWallet.abi.json";
import { Account } from "@eversdk/appkit";
import { toast } from "react-toastify";
import { SHA1 } from "crypto-js";
import { Buffer } from "buffer";
import { GoshRoot } from "./types/classes";
import { IGoshRepository, IGoshRoot, TDiffData, TGoshBranch } from "./types/types";


export const getEndpoints = (): string[] => {
    switch (process.env.REACT_APP_EVER_NETWORK) {
        case 'devnet':
            return ['https://net.ton.dev'];
        case 'mainnet':
            return ['https://main.ton.dev'];
        case 'se':
        default:
            return ['http://localhost'];
    }
}

export const getGiverData = (): any => {
    switch (process.env.REACT_APP_EVER_NETWORK) {
        case 'devnet':
            return {
                address: '0:3282fb4cce2cde32cca0bc11edf3df8fb32c3847ec8b75f4e678718cde2f6bb0',
                keys: {
                    public: '41a71ceaa7ac96eda2b261cfeeec2a52120fe93f744eb6909b2a33eb183f7ba2',
                    secret: '4565f3d76cbf69bbf335de22cf7c99beb2c57fc30de62d540812663fb5839c25'
                }
            };
        case 'mainnet':
            return {};
        case 'se':
        default:
            return {
                address: '0:c6f86566776529edc1fcf3bc444c2deb9f3e077f35e49871eb4d775dd0b04391',
                keys: {
                    public: 'b8093a117f55aaa95dcccb191552de9d4535294aab8b2e83373b7c58f1de971c',
                    secret: '2e800b65403b5e072e47ace28a926a96a4599bbc4c96a42f6e9661a19d1ba635'
                },
                phrase: 'country dinosaur canvas sentence castle soda quantum stamp reason walnut palm flock'
            };
    }
}

export const getGoshRootFromPhrase = async (
    client: TonClient,
    phrase: string,
    address?: string
): Promise<IGoshRoot> => {
    const keys = await client.crypto.mnemonic_derive_sign_keys({ phrase });
    const root = new GoshRoot(client, { keys, address });
    await root.load();
    return root;
}

export const getGoshRepositoryBranches = async (
    repo: IGoshRepository,
    selectedBranchName: string = 'master'
): Promise<{ branches: TGoshBranch[], branch: TGoshBranch | undefined }> => {
    const branches = await repo.getBranches();
    const branch = branches.find((branch) => branch.name === selectedBranchName);
    return { branches, branch };
}

/**
 * Generate commit diff content
 * @param monaco Monaco object from `useMonaco` hook
 */
export const generateDiff = async (
    monaco: any,
    modified: string,
    original?: string
): Promise<TDiffData[]> => {
    return new Promise((resolve, reject) => {
        if (!monaco) reject('Can not create diff (Diff editor is not initialized)');

        // Create hidden monaco diff editor and get diff
        const originalModel = monaco.editor.createModel(original, 'markdown');
        const modifiedModel = monaco.editor.createModel(modified, 'markdown');

        const diffContainer = document.createElement('div');
        const diffEditor = monaco.editor.createDiffEditor(diffContainer);
        diffEditor.setModel({ original: originalModel, modified: modifiedModel });
        diffEditor.onDidUpdateDiff(() => {
            const content = diffEditor.getOriginalEditor().getValue().split('\n');
            const changes = diffEditor.getLineChanges();
            const diff: TDiffData[] = [];
            changes.forEach((item: any) => {
                const {
                    originalStartLineNumber,
                    originalEndLineNumber,
                    modifiedStartLineNumber,
                    modifiedEndLineNumber
                } = item;

                const lines = [];
                for (let line = originalStartLineNumber - 1; line < originalEndLineNumber; line++) {
                    lines.push(content[line]);
                }
                diff.push({ modifiedStartLineNumber, modifiedEndLineNumber, originalLines: lines });
            });
            resolve(diff);
        });
    });
}

export const restoreFromDiff = (modified: string, diff: TDiffData[]): string => {
    const restored = [];
    const source = modified.split('\n');
    for (let mL = 0; mL < source.length; mL++) {
        const changed = diff.find((item) => item.modifiedStartLineNumber - 1 === mL);
        if (changed) {
            if (changed.modifiedEndLineNumber === 0) restored.push(source[mL]);
            restored.push(...changed.originalLines);
            if (changed.modifiedEndLineNumber > 0) mL = changed.modifiedEndLineNumber - 1;
        } else {
            restored.push(source[mL]);
        }
    }
    // console.log('Restored', restored);
    return restored.join('\n');
}

export const getCodeLanguageFromFilename = (monaco: any, filename: string): string => {
    let splitted = filename.split('.');
    const ext = `.${splitted[splitted.length - 1]}`;
    const found = monaco.languages.getLanguages().find((item: any) => (
        item.extensions.indexOf(ext) >= 0
    ));
    return found?.id || 'plaintext';
}

/**
 * SafeMultisigWallet as a giver
 * @param client
 * @param address
 * @param value
 */
export const giver = async (
    client: TonClient,
    address: string,
    value: number | bigint,
    payload: string = ''
) => {
    const wallet = getGiverData();
    const signer = signerKeys(wallet.keys);
    const account = new Account({ abi: WalletABI }, { client, address: wallet.address, signer });
    await account.run('sendTransaction', { dest: address, value, bounce: false, flags: 1, payload });
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

export const sha1 = (data: string, type: 'blob' | 'commit'): string => {
    let content = data;
    if (type === 'commit') content += '\n';
    const size = Buffer.from(content, 'utf-8').byteLength;
    const object = `${type} ${size}\0${content}`;
    const hash = SHA1(object)
    return hash.toString();
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
