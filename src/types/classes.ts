import { Account } from "@eversdk/appkit";
import { KeyPair, signerKeys, signerNone, TonClient } from "@eversdk/core";
import { GoshABI, GoshTVC } from "../contracts/gosh/gosh";
import { IGoshRoot } from "./types";


export class GoshRoot implements IGoshRoot {
    abi: any = GoshABI;
    tvc: string = GoshTVC;
    account: Account;
    keys?: KeyPair;
    address?: string;

    constructor(client: TonClient, options: { keys?: KeyPair, address?: string }) {
        this.address = options.address;
        this.account = new Account(
            { abi: this.abi, tvc: this.tvc },
            {
                client,
                address: this.address,
                signer: options.keys ? signerKeys(options.keys) : signerNone()
            }
        );
    }


}

// import {
//     IOrganization,
//     IRepository,
//     ERepositoryType,
//     TRepositoryBranch,
//     TRepositoryTreeItem
// } from "./types";


// export class Organization implements IOrganization {
//     id: string | null;
//     name: string;
//     email: string;

//     constructor(name: string, email: string, id = null) {
//         this.id = id;
//         this.name = name;
//         this.email = email;
//     }
//     async create(): Promise<void> {
//         console.log(`Organization ${this.name} created`);
//     }
//     async update(): Promise<void> {
//         console.log(`Organization ${this.name} updated`);
//     }
//     async save(): Promise<void> {
//         await (this.id ? this.update() : this.create());
//         await new Promise(resolve => setTimeout(resolve, 2000));
//     }

// }


// export class RepositoryFixture implements IRepository {
//     address: string;
//     name: string;
//     type: ERepositoryType;
//     description?: string;
//     language?: string;
//     license?: string;
//     updated?: string;
//     branches: TRepositoryBranch[];

//     constructor(
//         address: string, name: string, type: ERepositoryType, branches: TRepositoryBranch[],
//         description?: string, language?: string, license?: string, updated?: string,
//     ) {
//         this.address = address;
//         this.name = name;
//         this.type = type;
//         this.branches = branches;
//         this.description = description;
//         this.language = language;
//         this.license = license;
//         this.updated = updated;
//     }

//     getTypeString(): string {
//         const types = {
//             0: 'Private',
//             1: 'Public'
//         }
//         return types[this.type];
//     }

//     async getBranches(): Promise<string[]> {
//         return this.branches.map((branch) => branch.name);
//     }

//     async getTree(branch: string, path?: string): Promise<TRepositoryTreeItem[]> {
//         const recursion = (items: any[], parts?: string[]): any => {
//             if (!parts) return items;

//             const part = parts.shift();
//             const found = items.find((item) => item.name === part);
//             if (!found) return [];

//             if (parts.length) return recursion(found.children, parts);
//             return found.children;
//         }

//         const found = this.branches.find((item) => item.name === branch);
//         if (!found) return [];

//         const tree = recursion(found.tree, path ? path.split('/') : undefined);
//         return tree
//             ? tree.map((item: any) => ({
//                 name: item.name,
//                 isBlob: item.isBlob,
//                 commit: item.commit,
//                 content: item.content,
//                 language: item.language
//             }))
//             : [];
//     }

//     async getBlob(branch: string, path: string): Promise<TRepositoryTreeItem | undefined> {
//         // Prepare path to blob and blob name.
//         const pathArray = path.split('/');
//         const parts = pathArray.slice(0, -1).join('/');
//         const blob = pathArray.slice(-1)[0];

//         // Get blob parent list and find blob.
//         const tree = await this.getTree(branch, parts);
//         return tree.find((item) => item.name === blob && item.isBlob);
//     }
// }