import { TonClient } from "@eversdk/core";
import { toast } from "react-toastify";
import cryptoJs, { SHA1 } from "crypto-js";
import { Buffer } from "buffer";
import { GoshBlob, GoshCommit, GoshDaoCreator } from "./types/classes";
import {
    IGoshDaoCreator,
    IGoshRepository,
    TGoshBranch,
    TGoshTree,
    TGoshTreeItem
} from "./types/types";


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
// export const generateDiff = async (
//     monaco: any,
//     modified: string,
//     original?: string
// ): Promise<TDiffData[]> => {
//     return new Promise((resolve, reject) => {
//         if (!monaco) reject('Can not create diff (Diff editor is not initialized)');

//         // Create hidden monaco diff editor and get diff
//         const originalModel = monaco.editor.createModel(original, 'markdown');
//         const modifiedModel = monaco.editor.createModel(modified, 'markdown');

//         const diffContainer = document.createElement('div');
//         const diffEditor = monaco.editor.createDiffEditor(diffContainer);
//         diffEditor.setModel({ original: originalModel, modified: modifiedModel });
//         diffEditor.onDidUpdateDiff(() => {
//             const content = diffEditor.getOriginalEditor().getValue().split('\n');
//             const changes = diffEditor.getLineChanges();
//             const diff: TDiffData[] = [];
//             changes.forEach((item: any) => {
//                 const {
//                     originalStartLineNumber,
//                     originalEndLineNumber,
//                     modifiedStartLineNumber,
//                     modifiedEndLineNumber
//                 } = item;

//                 const lines = [];
//                 for (let line = originalStartLineNumber - 1; line < originalEndLineNumber; line++) {
//                     lines.push(content[line]);
//                 }
//                 diff.push({ modifiedStartLineNumber, modifiedEndLineNumber, originalLines: lines });
//             });
//             resolve(diff);
//         });
//     });
// }

// export const restoreFromDiff = (modified: string, diff: TDiffData[]): string => {
//     const restored = [];
//     const source = modified.split('\n');
//     for (let mL = 0; mL < source.length; mL++) {
//         const changed = diff.find((item) => item.modifiedStartLineNumber - 1 === mL);
//         if (changed) {
//             if (changed.modifiedEndLineNumber === 0) restored.push(source[mL]);
//             restored.push(...changed.originalLines);
//             if (changed.modifiedEndLineNumber > 0) mL = changed.modifiedEndLineNumber - 1;
//         } else {
//             restored.push(source[mL]);
//         }
//     }
//     // console.log('Restored', restored);
//     return restored.join('\n');
// }

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

export const sha1Tree = (items: TGoshTreeItem[]) => {
    const buffer = Buffer.concat(
        items
            //@ts-ignore
            .sort((a: any, b: any) => (a.name > b.name) - (a.name < b.name))
            .map((i: any) => Buffer.concat([
                Buffer.from(`${i.mode === '040000' ? '40000' : i.mode} ${i.name}\0`),
                Buffer.from(i.sha, 'hex')
            ]))
    );

    const size = buffer.byteLength;
    let words = cryptoJs.enc.Utf8.parse(`tree ${size}\0`);
    words.concat(cryptoJs.enc.Hex.parse(buffer.toString('hex')));
    const hash = SHA1(words);
    return hash.toString();
}

export const getTreeItemsFromPath = (filePath: string, fileContent: string): TGoshTreeItem[] => {
    const items: TGoshTreeItem[] = [];

    // Get blob sha, path and name and push it to items
    let [path, name] = splitByPath(filePath);
    const sha = sha1(fileContent, 'blob');
    items.push({ mode: '100644', type: 'blob', sha, path, name });

    // Parse blob path and push subtrees to items
    while (path !== '') {
        const [dirPath, dirName] = splitByPath(path);
        if (!items.find((item) => item.path === dirPath && item.name === dirName)) {
            items.push({ mode: '040000', type: 'tree', sha: '', path: dirPath, name: dirName });
        }
        path = dirPath;
    }
    return items;
}

const getTreeItemsFromBlob = (content: string): TGoshTreeItem[] => {
    return content.split('\n').map((entry: string) => {
        const [mode, type, tail] = entry.split(' ')
        const [sha, fname] = tail.split('\t')
        const lastSlash = fname.lastIndexOf('/')
        const path = lastSlash >= 0 ? fname.slice(0, lastSlash) : ''
        return {
            mode: mode as TGoshTreeItem['mode'],
            type: type as TGoshTreeItem['type'],
            sha,
            path,
            name: lastSlash >= 0 ? fname.slice(lastSlash + 1) : fname,
        }
    });
}

/** Build grouped by path tree from TGoshTreeItem[] */
export const getTreeFromItems = (items: TGoshTreeItem[]): TGoshTree => {
    const isTree = (i: TGoshTreeItem) => i.type === 'tree'

    const result = items
        .filter(isTree)
        .reduce((acc: TGoshTree, i) => {
            const path = i.path !== '' ? `${i.path}/${i.name}` : i.name;
            if (!acc.path) acc[path] = [];
            return acc;
        }, { '': [] })

    items.forEach((i: any) => {
        result[i.path].push(i);
    })
    return result;
}

export const getRepoTree = async (
    repo: IGoshRepository,
    branch: TGoshBranch
): Promise<{ tree: TGoshTree; items: TGoshTreeItem[]; }> => {
    /** Recursive walker through tree blobs */
    const blobTreeWalker = async (path: string, subitems: TGoshTreeItem[]) => {
        const trees = subitems.filter((item) => item.type === 'tree');
        if (!trees) return;

        await Promise.all(trees.map(async (tree) => {
            const treeAddr = await repo.getBlobAddr(`tree ${tree.sha}`);
            const treeBlob = new GoshBlob(repo.account.client, treeAddr);
            await treeBlob.load();

            const treeItems = getTreeItemsFromBlob(treeBlob.meta?.content || '');
            treeItems.forEach((item) => item.path = `${path && `${path}/`}${tree.name}`);
            items.push(...treeItems);
            await blobTreeWalker(tree.name, treeItems);
        }));
    }

    // Get latest branch commit
    if (!branch.commitAddr) return { tree: { '': [] }, items: [] };
    const commit = new GoshCommit(repo.account.client, branch.commitAddr);
    await commit.load();

    // Get root tree blob
    const rootTreeBlobAddr = await repo.getBlobAddr(`tree ${commit.meta?.content.tree}`);
    const rootTreeBlob = new GoshBlob(repo.account.client, rootTreeBlobAddr);
    await rootTreeBlob.load();

    // Get root tree items and recursively get subtrees
    const items = getTreeItemsFromBlob(rootTreeBlob.meta?.content || '');
    await blobTreeWalker('', items);

    // Build full tree
    const tree = getTreeFromItems(items);
    return { tree, items };
}

export const getCommitTree = (filesList: string[]): TGoshTree => {
    const list = filesList.map((entry: string) => {
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
    return getTreeFromItems(list as TGoshTreeItem[]);
}

/**
 * Sort the hole tree by the longest key (this key will contain blobs only),
 * calculate each subtree sha and update subtree parent item
 */
export const calculateSubtrees = (tree: TGoshTree) => {
    Object.keys(tree)
        .sort((a, b) => b.length - a.length)
        .filter((key) => key.length)
        .forEach((key) => {
            const sha = sha1Tree(tree[key]);
            const [path, name] = splitByPath(key);
            const found = tree[path].find((item) => item.path === path && item.name === name);
            if (found) found.sha = sha;
        });
}

/** Split file path to path and file name */
export const splitByPath = (fullPath: string): [path: string, name: string] => {
    const lastSlashIndex = fullPath.lastIndexOf('/');
    const path = lastSlashIndex >= 0 ? fullPath.slice(0, lastSlashIndex) : '';
    const name = lastSlashIndex >= 0 ? fullPath.slice(lastSlashIndex + 1) : fullPath;
    return [path, name];
}

export const unixtimeWithTz = (): string => {
    const pad = (num: number): string => (num < 10 ? '0' : '') + num;
    const unixtime = Math.floor(Date.now() / 1000);
    const tzo = -new Date().getTimezoneOffset();
    const dif = tzo >= 0 ? '+' : '-';
    return [
        `${unixtime} ${dif}`,
        pad(Math.floor(Math.abs(tzo) / 60)),
        pad(Math.abs(tzo) % 60)
    ].join('');
}

export const getCommitTime = (str: string): Date => {
    const [unixtime] = str.split(' ').slice(-2);
    return new Date(+unixtime * 1000);
}

export const generateRandomBytes = async (
    client: TonClient,
    length: number,
    hex: boolean = false
): Promise<string> => {
    const result = await client.crypto.generate_random_bytes({ length });
    if (hex) return Buffer.from(result.bytes, 'base64').toString('hex');
    return result.bytes;
}

export const chacha20 = {
    async encrypt(client: TonClient, data: string, key: string, nonce: string): Promise<string> {
        const result = await client.crypto.chacha20({
            data,
            key: key.padStart(64, '0'),
            nonce
        });
        return result.data;
    },
    async decrypt(client: TonClient, data: string, key: string, nonce: string): Promise<string> {
        const result = await client.crypto.chacha20({ data, key: key.padStart(64, '0'), nonce });
        return result.data;
    }
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
