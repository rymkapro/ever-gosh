import { Account, AccountType } from "@eversdk/appkit";
import { KeyPair, signerKeys, signerNone, TonClient } from "@eversdk/core";
import GoshDaoCreatorABI from "../contracts/gosh/daocreater.abi.json";
import GoshABI from "../contracts/gosh/gosh.abi.json";
import GoshDaoABI from "../contracts/gosh/goshdao.abi.json";
import GoshWalletABI from "../contracts/gosh/goshwallet.abi.json";
import GoshRepositoryABI from "../contracts/gosh/repository.abi.json";
import { fromEvers, getGiverData, getGoshDaoCreator, giver, sha1 } from "../helpers";
import {
    IGoshBlob,
    TGoshBranch,
    IGoshCommit,
    IGoshRepository,
    IGoshRoot,
    IGoshSnapshot,
    TDiffData,
    TGoshSnapshotMetaContentItem,
    IGoshDao,
    IGoshWallet,
    IGoshDaoCreator
} from "./types";


export class GoshDaoCreator implements IGoshDaoCreator {
    abi: any = GoshDaoCreatorABI;
    account: Account;
    address: string;

    constructor(client: TonClient, address: string) {
        this.address = address;
        this.account = new Account({ abi: this.abi }, { client, address });
    }

    async createDao(name: string, rootPubkey: string): Promise<void> {
        await this.account.run('deployDao', { name, root_pubkey: rootPubkey });
    }

    async sendMoney(rootPubkey: string, pubkey: string, daoAddr: string, value: number): Promise<void> {
        await this.account.run(
            'sendMoney',
            {
                pubkeyroot: rootPubkey,
                pubkey,
                goshdao: daoAddr,
                value
            }
        );
    }
}
export class GoshRoot implements IGoshRoot {
    abi: any = GoshABI;
    account: Account;
    address: string;
    daoCreator: IGoshDaoCreator;

    constructor(client: TonClient, address: string) {
        this.address = address;
        this.daoCreator = getGoshDaoCreator(client);
        this.account = new Account({ abi: this.abi }, { client, address });
    }

    async createDao(name: string, rootPubkey: string): Promise<string> {
        await this.daoCreator.createDao(name, rootPubkey);
        return await this.getDaoAddr(name);
    }

    async getDaoAddr(name: string): Promise<string> {
        const result = await this.account.runLocal('getAddrDao', { name });
        return result.decoded?.output.value0;
    }

    async getDaoWalletCode(pubkey: string): Promise<string> {
        const result = await this.account.runLocal('getDaoWalletCode', { pubkey });
        return result.decoded?.output.value0;
    }

    async getRepoAddr(name: string, daoAddr: string): Promise<string> {
        const result = await this.account.runLocal(
            'getAddrRepository',
            { name, dao: daoAddr }
        );
        return result.decoded?.output.value0;
    }

    async getDaoRepoCode(daoAddress: string): Promise<string> {
        const result = await this.account.runLocal('getRepoDaoCode', { dao: daoAddress });
        return result.decoded?.output.value0;
    }
}

export class GoshDao implements IGoshDao {
    abi: any = GoshDaoABI;
    account: Account;
    address: string;
    daoCreator: IGoshDaoCreator;
    meta?: {
        name: string;
    };

    constructor(client: TonClient, address: string) {
        this.address = address;
        this.daoCreator = getGoshDaoCreator(client);
        this.account = new Account({ abi: this.abi }, { client, address });
    }

    async load(): Promise<void> {
        this.meta = {
            name: await this.getName()
        }
    }

    async createWallet(rootPubkey: string, pubkey: string): Promise<string> {
        await this.account.run('deployWallet', { pubkeyroot: rootPubkey, pubkey });
        await this.daoCreator.sendMoney(rootPubkey, pubkey, this.address, fromEvers(20));
        return await this.getWalletAddr(rootPubkey, pubkey);
    }

    async getWalletAddr(rootPubkey: string, pubkey: string): Promise<string> {
        const result = await this.account.runLocal(
            'getAddrWallet',
            { pubkeyroot: rootPubkey, pubkey }
        );
        return result.decoded?.output.value0;
    }

    async getName(): Promise<string> {
        const result = await this.account.runLocal('getNameDao', {});
        return result.decoded?.output.value0;
    }

    async getRootPubkey(): Promise<string> {
        const result = await this.account.runLocal('getRootPubkey', {});
        return result.decoded?.output.value0;
    }
}

export class GoshWallet implements IGoshWallet {
    abi: any = GoshWalletABI;
    account: Account;
    address: string;

    constructor(client: TonClient, address: string, keys?: KeyPair) {
        this.address = address;
        this.account = new Account(
            { abi: this.abi },
            {
                client,
                address,
                signer: keys ? signerKeys(keys) : signerNone()
            }
        );
    }

    async getDaoAddr(): Promise<string> {
        const result = await this.account.runLocal('getAddrDao', {});
        return result.decoded?.output.value0;
    }

    async createRepo(name: string): Promise<void> {
        await this.account.run('deployRepository', { nameRepo: name });
    }

    async createBranch(repoName: string, newName: string, fromName: string): Promise<void> {
        await this.account.run('deployBranch', { repoName, newName, fromName });
    }

    async createCommit(
        repoName: string,
        branchName: string,
        commitSha: string,
        commitData: string,
        parent1: string,
        parent2: string
    ): Promise<void> {
        await this.account.run(
            'deployCommit',
            {
                repoName,
                branchName,
                commitName: commitSha,
                fullCommit: commitData,
                parent1,
                parent2
            }
        )
    }

    async createBlob(
        repoName: string,
        commit: string,
        blobSha: string,
        blobContent: string
    ): Promise<void> {
        await this.account.run(
            'deployBlob',
            {
                repoName,
                commit,
                blobName: blobSha,
                fullBlob: blobContent
            }
        )
    }

    async createDiff(
        repoName: string,
        branchName: string,
        filePath: string,
        diff: string
    ): Promise<void> {
        await this.account.run(
            'deployDiff',
            {
                repoName,
                branch: branchName,
                name: filePath,
                diff
            }
        )
    }
}

export class GoshRepository implements IGoshRepository {
    abi: any = GoshRepositoryABI;
    account: Account;
    address: string;
    meta?: {
        name: string;
    }

    constructor(client: TonClient, address: string) {
        this.address = address;
        this.account = new Account({ abi: this.abi }, { client, address });
    }

    async load(): Promise<void> {
        this.meta = {
            name: await this.getName()
        }
    }

    async getName(): Promise<string> {
        const result = await this.account.runLocal('getName', {});
        return result.decoded?.output.value0;
    }

    async getBranches(): Promise<TGoshBranch[]> {
        const result = await this.account.runLocal('getAllAddress', {});
        return result.decoded?.output.value0.map((item: any) => ({
            name: item.key,
            commitAddr: item.value,
            snapshot: item.snapshot
        }));
    }

    async getBranch(name: string): Promise<TGoshBranch> {
        const result = await this.account.runLocal('getAddrBranch', { name });
        const decoded = result.decoded?.output.value0;
        return {
            name: decoded.key,
            commitAddr: decoded.value,
            snapshot: decoded.snapshot
        }
    }

    // async createBranch(name: string, fromName: string): Promise<void> {
    //     // // Deploy branch
    //     // const { body } = await this.account.client.abi.encode_message_body({
    //     //     abi: this.account.abi,
    //     //     call_set: {
    //     //         function_name: 'deployBranch',
    //     //         input: { newname: name, fromname: fromName }
    //     //     },
    //     //     is_internal: true,
    //     //     signer: signerNone()
    //     // });
    //     // await giver(this.account.client, this.address, fromEvers(1.55), body);

    //     // // Copy `from` branch snapshot to new branch snapshot
    //     // console.debug('Repo addr', this.address);
    //     // const fromBranch = await this.getBranch(fromName);
    //     // await fromBranch.snapshot.load();
    //     // console.debug('From branch:', fromBranch);
    //     // const newBranch = await this.getBranch(name);
    //     // console.debug('New branch:', newBranch);
    //     // await newBranch.snapshot.setSnapshot(fromBranch.snapshot.meta?.content || []);
    // }

    // async deleteBranch(name: string): Promise<void> {
    //     const { body } = await this.account.client.abi.encode_message_body({
    //         abi: this.account.abi,
    //         call_set: {
    //             function_name: 'deleteBranch',
    //             input: { name }
    //         },
    //         is_internal: true,
    //         signer: signerNone()
    //     });
    //     await giver(this.account.client, this.address, fromEvers(0.15), body);
    // }

    // /**
    //  * Create commit
    //  * We can use simple `account.run` method to pay from repository contract,
    //  * but it pays too much, so we create branch via payload from wallet
    //  * @param branchName
    //  * @param data
    //  * @param blobs
    //  */
    // async createCommit(
    //     branchName: string,
    //     commitData: { title: string; message: string; },
    //     diffData: { name: string; diff: TDiffData[] }[],
    //     blobs: { name: string; content: string }[] = []
    // ): Promise<void> {
    //     // // Generate blobs sha
    //     // const blobsWithSha = blobs.map((blob) => ({
    //     //     ...blob,
    //     //     sha: sha1(blob.content, 'blob')
    //     // }));

    //     // // Create `fullCommit` data
    //     // const commitFullData = {
    //     //     ...commitData,
    //     //     blobs: diffData.map((item) => {
    //     //         const blob = blobsWithSha.find((blob) => blob.name === item.name);
    //     //         if (!blob) throw Error(`Can not find blob '${item.name}' in blobs`);
    //     //         return {
    //     //             ...item,
    //     //             sha: blob.sha
    //     //         };
    //     //     })
    //     // }

    //     // // Deploy commit
    //     // const commitSha = sha1(JSON.stringify(commitFullData), 'commit');
    //     // const { body } = await this.account.client.abi.encode_message_body({
    //     //     abi: this.account.abi,
    //     //     call_set: {
    //     //         function_name: 'deployCommit',
    //     //         input: {
    //     //             nameBranch: branchName,
    //     //             nameCommit: commitSha,
    //     //             fullCommit: JSON.stringify(commitFullData)
    //     //         }
    //     //     },
    //     //     is_internal: true,
    //     //     signer: signerNone()
    //     // });
    //     // await giver(this.account.client, this.address, fromEvers(5), body);

    //     // // Get commit address, create commit object
    //     // const commitAddr = await this.getCommitAddr(commitSha);
    //     // console.debug('[Commit addr]:', commitAddr);
    //     // const commit = new GoshCommit(this.account.client, commitAddr);

    //     // // Get snapshot and load meta
    //     // const snapshot = (await this.getBranch(branchName)).snapshot;
    //     // await snapshot.load();
    //     // if (!snapshot.meta) throw Error('Snapshot meta is not loaded');

    //     // // Map all blobs and deploy them;
    //     // // Update branch snapshot
    //     // await Promise.all(
    //     //     blobsWithSha.map(async (blob) => {
    //     //         if (!snapshot.meta) return;

    //     //         const blobSha = await commit.createBlob(blob.content, blob.sha);
    //     //         const blobAddr = await commit.getBlobAddr(blobSha);
    //     //         console.debug('[Blob addr]:', blobAddr);
    //     //         const foundIndex = snapshot.meta?.content.findIndex((metaItem) => (
    //     //             metaItem && metaItem.name === blob.name
    //     //         )) ?? -1;
    //     //         if (foundIndex < 0) {
    //     //             snapshot.meta.content.push({
    //     //                 name: blob.name,
    //     //                 address: blobAddr,
    //     //                 firstCommitSha: commitSha,
    //     //                 lastCommitSha: commitSha,
    //     //                 lastCommitMsg: commitData
    //     //             });
    //     //         } else {
    //     //             snapshot.meta.content[foundIndex] = {
    //     //                 ...snapshot.meta.content[foundIndex],
    //     //                 address: blobAddr,
    //     //                 lastCommitSha: commitSha,
    //     //                 lastCommitMsg: commitData
    //     //             };
    //     //         }
    //     //     })
    //     // );
    //     // console.debug('[Snapshot addr]:', snapshot.address);
    //     // await snapshot.setSnapshot(snapshot.meta?.content);
    // }

    // async getCommitAddr(commitSha: string): Promise<string> {
    //     const result = await this.account.runLocal(
    //         'getCommitAddr',
    //         { nameCommit: commitSha }
    //     );
    //     return result.decoded?.output.value0;
    // }

    // async createSnapshot(name: string): Promise<void> {
    //     const { body } = await this.account.client.abi.encode_message_body({
    //         abi: this.account.abi,
    //         call_set: {
    //             function_name: 'deployNewSnapshot',
    //             input: { name }
    //         },
    //         is_internal: true,
    //         signer: signerNone()
    //     });
    //     await giver(this.account.client, this.address, fromEvers(1.45), body);
    // }
}

// export class GoshCommit implements IGoshCommit {
//     abi: any = GoshCommitABI;
//     account: Account;
//     address: string;
//     meta?: {
//         branchName: string;
//         sha: string;
//         content: {
//             title: string;
//             message: string;
//             blobs: {
//                 name: string;
//                 sha: string;
//                 diff: TDiffData[];
//             }[];
//         }
//         parentAddr: string;
//     }

//     constructor(client: TonClient, address: string) {
//         this.address = address;
//         this.account = new Account({ abi: this.abi }, { client, address });
//     }

//     async load(): Promise<void> {
//         const meta = await this.getCommit();
//         this.meta = {
//             branchName: meta.branch,
//             sha: meta.sha,
//             content: JSON.parse(meta.content),
//             parentAddr: meta.parent,
//         }
//     }

//     async getCommit(): Promise<any> {
//         const result = await this.account.runLocal('getCommit', {});
//         return result.decoded?.output;
//     }

//     async getName(): Promise<string> {
//         const result = await this.account.runLocal('getNameCommit', {});
//         return result.decoded?.output.value0;
//     }

//     async getParent(): Promise<string> {
//         const result = await this.account.runLocal('getParent', {});
//         return result.decoded?.output.value0;
//     }

//     async getBlobs(): Promise<string[]> {
//         const result = await this.account.runLocal('getBlobs', {});
//         return result.decoded?.output.value0;
//     }

//     async getBlobAddr(blobSha: string): Promise<string> {
//         const result = await this.account.runLocal(
//             'getBlobAddr',
//             { nameBlob: blobSha }
//         );
//         return result.decoded?.output.value0;
//     }

//     async createBlob(content: string, sha?: string): Promise<string> {
//         const blobSha = sha || sha1(content, 'blob');
//         await this.account.run(
//             'deployBlob',
//             {
//                 nameBlob: blobSha,
//                 fullBlob: content
//             }
//         );
//         return blobSha;
//     }
// }

// export class GoshBlob implements IGoshBlob {
//     abi: any = GoshBlobABI;
//     account: Account;
//     address: string;
//     meta?: { sha: string; content: string; commitAddr: string; };

//     constructor(client: TonClient, address: string) {
//         this.address = address;
//         this.account = new Account({ abi: this.abi }, { client, address });
//     }

//     async load(): Promise<void> {
//         const meta = await this.getBlob();
//         this.meta = {
//             sha: meta.sha,
//             content: meta.content,
//             commitAddr: meta.commit,
//         }
//     }

//     async getBlob(): Promise<any> {
//         const result = await this.account.runLocal('getBlob', {});
//         return result.decoded?.output;
//     }
// }

// class GoshSnapshot implements IGoshSnapshot {
//     abi: any = GoshSnapshotABI;
//     account: Account;
//     address: string;
//     meta?: {
//         content: TGoshSnapshotMetaContentItem[];
//     };

//     constructor(client: TonClient, address: string) {
//         this.address = address;
//         this.account = new Account({ abi: this.abi }, { client, address });
//     }

//     async load(): Promise<void> {
//         const snapshot = await this.getSnapshot();
//         this.meta = {
//             content: JSON.parse(snapshot || '[]')
//         }
//     }

//     async getSnapshot(): Promise<any> {
//         const result = await this.account.runLocal('getSnapshot', {});
//         return result.decoded?.output.value0;
//     }

//     /**
//      * Set snapshot
//      * `msg.pubkey() == pubkey` (giver) or `msg.sender == _rootRepo` required
//      * @param content
//      */
//     async setSnapshot(content: TGoshSnapshotMetaContentItem[]): Promise<void> {
//         const wallet = getGiverData();
//         const signer = signerKeys(wallet.keys);
//         await this.account.run(
//             'setSnapshot',
//             { snaphot: JSON.stringify(content) },
//             { signer }
//         );
//     }
// }
