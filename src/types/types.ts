import { Account } from "@eversdk/appkit";
import { Abi, ClientConfig, KeyPair, TonClient } from "@eversdk/core";


export type TEverState = {
    config?: ClientConfig;
    configHex: string;
    client: TonClient;
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
    keys?: KeyPair;
    address?: string;
}

export interface IGoshRoot extends IContract {

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