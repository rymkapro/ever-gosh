import { Account } from "@eversdk/appkit";
import { ClientConfig } from "@eversdk/core";


export type TEverState = {
    config: ClientConfig;
}

export type TUserState = {
    address?: string;
    phrase?: string;
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
    snapshot: IGoshSnapshot;
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
export interface IGoshRoot extends IContract {
    details?: {
        address: string;
        balance: number;
        acc_type: number;
        code?: string;
        data: {
            raw?: string;
            decoded?: {
                version: string;
                m_RepositoryCode: string;
                m_RepositoryData: string;
                m_CommitCode: string;
                m_CommitData: string;
                m_BlobCode: string;
                m_BlobData: string;
                m_SnapshotCode: string;
                m_SnapshotData: string;
            };
        }
    };
    isDeploying: boolean;

    get isDeployed(): boolean;
    load(): Promise<void>;
    subscribeAccount(callback: (details: IGoshRoot['details']) => void): Promise<void>;
    deploy(): Promise<void>;
    createRepository(name: string): Promise<string>;
    getRepositoryAddr(name: string): Promise<string>;
}

export interface IGoshRepository extends IContract {
    name: string;
    address: string;

    getBranches(): Promise<TGoshBranch[]>;
    getBranch(name: string): Promise<TGoshBranch>;
    getCommitAddr(branchName: string, commitSha: string): Promise<string>;
    createCommit(
        branchName: string,
        commitData: { title: string; message: string; },
        diffData: { name: string; diff: TDiffData[] }[],
        blobs: { name: string; content: string; }[]
    ): Promise<void>;
    createBranch(name: string, fromName: string): Promise<void>;
    deleteBranch(name: string): Promise<void>;
    createSnapshot(name: string): Promise<void>;
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
