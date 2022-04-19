import { TonClient } from "@eversdk/core";
import { toast } from "react-toastify";
import cryptoJs, { SHA1 } from "crypto-js";
import { Buffer } from "buffer";
import { GoshDaoCreator } from "./types/classes";
import { IGoshDaoCreator, TDiffData } from "./types/types";


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

export const getGoshDaoCreator = (client: TonClient): IGoshDaoCreator => {
    const address = process.env.REACT_APP_CREATOR_ADDR;
    if (!address) throw Error('No GoshDaoCreator address specified');
    return new GoshDaoCreator(client, address);
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
    const object = Buffer.from(`${type} ${size}\0${content}`);
    const hash = SHA1(object.toString());
    return hash.toString();
}

export const sha1Tree = (tree: Buffer) => {
    const size = tree.byteLength;
    let words = cryptoJs.enc.Utf8.parse(`tree ${size}\0`);
    words.concat(cryptoJs.enc.Hex.parse(tree.toString('hex')));
    const hash = SHA1(words);
    return hash.toString();
}


const groupByPath = (list: any) => {
    const isTree = (i: any) => i.type === 'tree'

    const result = list
        .filter(isTree)
        .reduce((acc: any, i: any) => {
            const path = i.path !== '' ? `${i.path}/${i.name}` : i.name
            if (!acc.path) acc[path] = []
            return acc
        }, { '': [] })

    list.forEach((i: any) => {
        result[i.path].push(i)
    })
    return result
}

export const constructTree = (filelist: string[]) => {
    const list = filelist.map((entry: string) => {
        const [mode, type, tail] = entry.split(' ')
        const [sha, fname] = tail.split('\t')
        const lastSlash = fname.lastIndexOf('/')
        const path = lastSlash >= 0 ? fname.slice(0, lastSlash) : ''
        return {
            mode,
            type,
            sha,
            path,
            name: lastSlash >= 0 ? fname.slice(lastSlash + 1) : fname,
        }
    })
    const trees = groupByPath(list)

    const result = Object.keys(trees).sort().map(path => {
        return Buffer.concat(
            trees[path]
                //@ts-ignore
                .sort((a: any, b: any) => (a.name > b.name) - (a.name < b.name))
                .map((i: any) => Buffer.concat([
                    Buffer.from(`${i.mode === '040000' ? '40000' : i.mode} ${i.name}\0`),
                    Buffer.from(i.sha, 'hex')
                ]))
        )
    })
    return result
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
