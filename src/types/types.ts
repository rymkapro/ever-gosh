import { Account } from "@eversdk/appkit";
import { ClientConfig, KeyPair } from "@eversdk/core";


export type TEverState = {
    config: ClientConfig;
}

export type TUserState = {
    phrase?: string;
    keys?: KeyPair;
}

export type TAccountData = {
    address: string;
    balance: number;
    acc_type: number;
    acc_type_name: string;
    code?: string;
    data?: string;
}

export type TGoshBranch = {
    name: string;
    commitAddr: string;
    snapshot: string[];
}

export type TGoshSnapshotMetaContentItem = {
    name: string;
    address: string;
    firstCommitSha: string;
    lastCommitSha: string;
    lastCommitMsg: {
        title: string;
        message: string;
    };
}

export type TDiffData = {
    modifiedStartLineNumber: number;
    modifiedEndLineNumber: number;
    originalLines: string[];
}

interface IContract {
    abi: any;
    tvc?: string;
    account: Account;
}

export interface IGoshDaoCreator extends IContract {
    address: string;

    createDao(name: string, rootPubkey: string): Promise<void>;
    sendMoney(rootPubkey: string, pubkey: string, daoAddr: string, value: number): Promise<void>;
}
export interface IGoshRoot extends IContract {
    address: string;
    daoCreator: IGoshDaoCreator;

    createDao(name: string, rootPubkey: string): Promise<string>;
    getDaoAddr(name: string): Promise<string>;
    getDaoWalletCode(pubkey: string): Promise<string>;
    getRepoAddr(name: string, daoAddr: string): Promise<string>;
    getDaoRepoCode(daoAddress: string): Promise<string>;
}

export interface IGoshDao extends IContract {
    address: string;
    daoCreator: IGoshDaoCreator;
    meta?: {
        name: string;
    };

    load(): Promise<void>;
    createWallet(rootPubkey: string, pubkey: string): Promise<string>;
    getWalletAddr(rootPubkey: string, pubkey: string): Promise<string>;
    getName(): Promise<string>;
    getRootPubkey(): Promise<string>;
}

export interface IGoshWallet extends IContract {
    address: string;

    getDaoAddr(): Promise<string>;
    createRepo(name: string): Promise<void>;
    createBranch(repoName: string, newName: string, fromName: string): Promise<void>;
    createCommit(
        repoName: string,
        branchName: string,
        commitSha: string,
        commitData: string,
        parent1: string,
        parent2: string
    ): Promise<void>;
    createBlob(
        repoName: string,
        commit: string,
        blobSha: string,
        blobContent: string
    ): Promise<void>;
    createDiff(
        repoName: string,
        branchName: string,
        filePath: string,
        diff: string
    ): Promise<void>;
}

export interface IGoshRepository extends IContract {
    address: string;
    meta?: {
        name: string;
    }

    load(): Promise<void>;
    getName(): Promise<string>;
    getBranches(): Promise<TGoshBranch[]>;
    getBranch(name: string): Promise<TGoshBranch>;
    // getCommitAddr(commitSha: string): Promise<string>;
    // createCommit(
    //     branchName: string,
    //     commitData: { title: string; message: string; },
    //     diffData: { name: string; diff: TDiffData[] }[],
    //     blobs: { name: string; content: string; }[]
    // ): Promise<void>;
    // createBranch(name: string, fromName: string): Promise<void>;
    // deleteBranch(name: string): Promise<void>;
    // createSnapshot(name: string): Promise<void>;
}

export interface IGoshCommit extends IContract {
    address: string;
    meta?: {
        branchName: string;
        sha: string;
        content: {
            title: string;
            message: string;
            blobs: {
                name: string;
                sha: string;
                diff: TDiffData[];
            }[];
        }
        parentAddr: string;
    }

    load(): Promise<void>;
    getCommit(): Promise<any>;
    getName(): Promise<string>;
    getParent(): Promise<string>;
    getBlobs(): Promise<string[]>;
    getBlobAddr(blobSha: string): Promise<string>;
    createBlob(content: string, sha?: string): Promise<string>;
}

export interface IGoshBlob extends IContract {
    address: string;
    meta?: {
        sha: string;
        content: string;
        commitAddr: string;
    }
}

export interface IGoshSnapshot extends IContract {
    address: string;
    meta?: {
        content: TGoshSnapshotMetaContentItem[];
    };

    load(): Promise<void>;
    getSnapshot(): Promise<any>;
    setSnapshot(content: TGoshSnapshotMetaContentItem[]): Promise<void>;
}
