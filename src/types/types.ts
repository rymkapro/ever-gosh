import { Account } from "@eversdk/appkit";
import { Abi, ClientConfig, KeyPair, TonClient } from "@eversdk/core";


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

interface IContract {
    abi: any;
    tvc?: string;
    account: Account;
}

export type IGoshBranch = {
    name: string;
    commit: string;
    snapshot: string;
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
    getRepositoryAddress(name: string): Promise<string>;
    getRepositories(): Promise<IGoshRepository[]>;
}

export interface IGoshRepository extends IContract {
    name: string;
    address: string;

    getBranches(): Promise<IGoshBranch[]>;
    getBranch(name: string): Promise<IGoshBranch>;
    createBranch(name: string, fromName: string): Promise<void>;
    deleteBranch(name: string): Promise<void>;
    createCommit(branchName: string, name: string, data: string): Promise<void>;
}

export interface IGoshCommit extends IContract {
    address: string;
}

// export interface IOrganization {
//     id: string | null;
//     name: string;
//     email: string;

//     create(): void;
//     update(): void;
//     save(): void;
// }


// export enum ERepositoryType {
//     PRIVATE,
//     PUBLIC
// }

// export type TRepositoryItem = {
//     address: string;
//     name: string;
//     type: string;
//     description?: string;
//     language?: string;
//     license?: string;
//     updated: string;
// }

// export type TRepositoryBranch = {
//     name: string;
//     tree: TRepositoryTreeItem[];
// }

// export type TRepositoryTreeItem = {
//     name: string;
//     isBlob: boolean;
//     commit: string;
//     content?: string;
//     language?: string;
// }

// export interface IRepository {
//     address: string;
//     name: string;
//     type: ERepositoryType;
//     description?: string;
//     language?: string;
//     license?: string;
//     updated?: string;

//     getTypeString(): string;
//     getBranches(): Promise<string[]>;
//     getTree(branch: string, path?: string): Promise<TRepositoryTreeItem[]>;
//     getBlob(branch: string, path: string): Promise<TRepositoryTreeItem | undefined>
// }