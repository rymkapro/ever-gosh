import { Account, AccountType } from "@eversdk/appkit";
import { KeyPair, signerKeys, signerNone, TonClient } from "@eversdk/core";
import {
    GoshABI,
    GoshBlobABI,
    GoshBlobTVC,
    GoshCommitABI,
    GoshCommitTVC,
    GoshRepositoryABI,
    GoshRepositoryTVC,
    GoshSnapshotABI,
    GoshSnapshotTVC,
    GoshTVC
} from "../contracts/gosh/gosh";
import { fromEvers, getGiverData, giver, sha1 } from "../helpers";
import {
    IGoshBlob,
    TGoshBranch,
    IGoshCommit,
    IGoshRepository,
    IGoshRoot,
    IGoshSnapshot,
    TDiffData,
    TGoshSnapshotMetaContentItem
} from "./types";


export class GoshRoot implements IGoshRoot {
    abi: any = GoshABI;
    tvc: string = GoshTVC;
    account: Account;
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
    isDeploying: boolean = false;
    ownerPublic: string = `0x${getGiverData().keys.public}`;

    constructor(client: TonClient, options: { keys: KeyPair, address?: string }) {
        this.account = new Account(
            { abi: this.abi, tvc: this.tvc },
            {
                client,
                address: options.address,
                signer: signerKeys(options.keys)
            }
        );
    }

    /**
     * Gosh root is fully deployed when root contract
     * is deployed and relative data is set
     */
    get isDeployed(): boolean {
        return this.details?.acc_type === AccountType.active && this.isRelativeDataDeployed;
    }

    /** Check if Gosh root relative data is set */
    get isRelativeDataDeployed(): boolean {
        if (!this.details?.data.decoded) return false;
        return !Object
            .values(this.details.data.decoded)
            .some((value: any) => value === 'te6ccgEBAQEAAgAAAA==');
    }

    /** Load account details */
    async load(): Promise<void> {
        const address = await this.account.getAddress();
        const details = await this.account.getAccount();
        await this.setDetails({ ...details, id: address });
    }

    /** Subscribe for account changes */
    async subscribeAccount(callback: (details: IGoshRoot['details']) => void): Promise<void> {
        await this.account.subscribeAccount(
            'id acc_type balance code data',
            async (account) => {
                await this.setDetails(account);
                callback(this.details);
            }
        );
    }

    /** Deploy contract and relative data */
    async deploy(): Promise<void> {
        if (!this.details || this.isDeployed || this.isDeploying) return;
        this.isDeploying = true;

        // Topup gosh address with giver
        if (this.details.acc_type === AccountType.nonExist) {
            console.debug('[GoshRoot] - Topup with giver');
            await giver(this.account.client, this.details.address, fromEvers(20));
        }

        // Deploy gosh contract
        if (this.details.acc_type === AccountType.uninit) {
            console.debug('[GoshRoot] - Deploy contract');
            if (this.details.balance >= fromEvers(20)) {
                await this.account.deploy();
            }

        }

        // Deploy gosh contract relative data (repository, commit, etc. code and data)
        if (this.details.acc_type === AccountType.active && !this.isRelativeDataDeployed) {
            const empty = 'te6ccgEBAQEAAgAAAA==';
            const {
                m_RepositoryCode,
                m_CommitCode,
                m_BlobCode,
                m_SnapshotCode
            } = this.details.data.decoded || {};

            if (m_RepositoryCode === empty) {
                console.debug('[GoshRoot] - Set repository');
                const repository = await this.account.client.boc.decode_tvc({
                    tvc: GoshRepositoryTVC
                });
                await this.account.run(
                    'setRepository',
                    { code: repository?.code, data: repository?.data }
                );
            }

            if (m_CommitCode === empty) {
                console.debug('[GoshRoot] - Set commit');
                const commit = await this.account.client.boc.decode_tvc({
                    tvc: GoshCommitTVC
                });
                await this.account.run(
                    'setCommit',
                    { code: commit?.code, data: commit?.data }
                );
            }

            if (m_BlobCode === empty) {
                console.debug('[GoshRoot] - Set blob');
                const blob = await this.account.client.boc.decode_tvc({
                    tvc: GoshBlobTVC
                });
                await this.account.run(
                    'setBlob',
                    { code: blob?.code, data: blob?.data }
                );
            }

            if (m_SnapshotCode === empty) {
                console.debug('[GoshRoot] - Set snapshot');
                const snapshot = await this.account.client.boc.decode_tvc({
                    tvc: GoshSnapshotTVC
                });
                await this.account.run(
                    'setSnapshot',
                    { code: snapshot?.code, data: snapshot?.data }
                );
            }
        }

        this.isDeploying = false;
    }

    /** Deploy repository */
    async createRepository(name: string): Promise<string> {
        if (!this.details?.address) throw Error('GoshRoot address is not set');

        // Encode deploy repository message body and
        // send it to GoshRoot via giver
        const encoded = await this.account.client.abi.encode_message_body({
            abi: this.account.abi,
            call_set: {
                function_name: 'deployRepository',
                input: {
                    pubkey: this.ownerPublic,
                    name
                }
            },
            signer: signerNone(),
            is_internal: true
        });
        await giver(this.account.client, this.details.address, fromEvers(2.65), encoded.body);

        // Get deployed repository address and topup it.
        const repoAddr = await this.getRepositoryAddr(name);
        if (!repoAddr) throw Error('Error getting repository address after deploy');
        await giver(this.account.client, repoAddr, fromEvers(30));

        // TODO: Remove in future
        // Store created repository address in local storage
        const storage: { [key: string]: any } = JSON.parse(localStorage.getItem('repositories') ?? '{}');
        if (!storage[this.details.address]) storage[this.details.address] = [];
        storage[this.details.address].push(name);
        localStorage.setItem('repositories', JSON.stringify(storage));

        return repoAddr;
    }

    /** Get repository address by it's name */
    async getRepositoryAddr(name: string): Promise<string> {
        if (!this.details?.address) throw Error('GoshRoot address is not set');
        const result = await this.account.runLocal('getAddrRepository', { name });
        return result.decoded?.output.value0;
    }

    /** Update account details from request of subscription */
    async setDetails(account: any): Promise<void> {
        this.details = {
            address: account.id,
            balance: +(account.balance ?? 0),
            acc_type: account.acc_type,
            code: account.code,
            data: {
                raw: account.data,
                decoded: await this.decodeAccountData(account.data)
            }
        }
    }

    /** Decode account data */
    async decodeAccountData(rawData?: string): Promise<any> {
        if (!rawData) return undefined;
        const { data } = await this.account.client.abi.decode_account_data({
            abi: this.account.abi,
            data: rawData
        });
        return {
            version: data.version,
            m_RepositoryCode: data.m_RepositoryCode,
            m_RepositoryData: data.m_RepositoryData,
            m_CommitCode: data.m_CommitCode,
            m_CommitData: data.m_CommitData,
            m_BlobCode: data.m_BlobCode,
            m_BlobData: data.m_BlobData,
            m_SnapshotCode: data.m_codeSnapshot,
            m_SnapshotData: data.m_dataSnapshot
        };
    }

}

export class GoshRepository implements IGoshRepository {
    abi: any = GoshRepositoryABI;
    account: Account;
    name: string;
    address: string;

    constructor(client: TonClient, name: string, address: string) {
        this.name = name;
        this.address = address;
        this.account = new Account({ abi: this.abi }, { client, address });
    }

    async getBranches(): Promise<TGoshBranch[]> {
        const result = await this.account.runLocal('getAllAddress', {});
        return result.decoded?.output.value0.map((item: any) => ({
            name: item.key,
            commitAddr: item.value,
            snapshot: new GoshSnapshot(this.account.client, item.snapshot)
        }));
    }

    async getBranch(name: string): Promise<TGoshBranch> {
        const result = await this.account.runLocal('getAddrBranch', { name });
        const decoded = result.decoded?.output.value0;
        return {
            name: decoded.key,
            commitAddr: decoded.value,
            snapshot: new GoshSnapshot(this.account.client, decoded.snapshot)
        }
    }

    async createBranch(name: string, fromName: string): Promise<void> {
        // Deploy branch
        const { body } = await this.account.client.abi.encode_message_body({
            abi: this.account.abi,
            call_set: {
                function_name: 'deployBranch',
                input: { newname: name, fromname: fromName }
            },
            is_internal: true,
            signer: signerNone()
        });
        await giver(this.account.client, this.address, fromEvers(1.55), body);

        // Copy `from` branch snapshot to new branch snapshot
        console.debug('Repo addr', this.address);
        const fromBranch = await this.getBranch(fromName);
        await fromBranch.snapshot.load();
        console.debug('From branch:', fromBranch);
        const newBranch = await this.getBranch(name);
        console.debug('New branch:', newBranch);
        await newBranch.snapshot.setSnapshot(fromBranch.snapshot.meta?.content || []);
    }

    async deleteBranch(name: string): Promise<void> {
        const { body } = await this.account.client.abi.encode_message_body({
            abi: this.account.abi,
            call_set: {
                function_name: 'deleteBranch',
                input: { name }
            },
            is_internal: true,
            signer: signerNone()
        });
        await giver(this.account.client, this.address, fromEvers(0.15), body);
    }

    /**
     * Create commit
     * We can use simple `account.run` method to pay from repository contract,
     * but it pays too much, so we create branch via payload from wallet
     * @param branchName
     * @param data
     * @param blobs
     */
    async createCommit(
        branchName: string,
        commitData: { title: string; message: string; },
        diffData: { name: string; diff: TDiffData[] }[],
        blobs: { name: string; content: string }[] = []
    ): Promise<void> {
        // Generate blobs sha
        const blobsWithSha = blobs.map((blob) => ({
            ...blob,
            sha: sha1(blob.content, 'blob')
        }));

        // Create `fullCommit` data
        const commitFullData = {
            ...commitData,
            blobs: diffData.map((item) => {
                const blob = blobsWithSha.find((blob) => blob.name === item.name);
                if (!blob) throw Error(`Can not find blob '${item.name}' in blobs`);
                return {
                    ...item,
                    sha: blob.sha
                };
            })
        }

        // Deploy commit
        const commitSha = sha1(JSON.stringify(commitFullData), 'commit');
        const { body } = await this.account.client.abi.encode_message_body({
            abi: this.account.abi,
            call_set: {
                function_name: 'deployCommit',
                input: {
                    nameBranch: branchName,
                    nameCommit: commitSha,
                    fullCommit: JSON.stringify(commitFullData)
                }
            },
            is_internal: true,
            signer: signerNone()
        });
        await giver(this.account.client, this.address, fromEvers(5), body);

        // Get commit address, create commit object
        const commitAddr = await this.getCommitAddr(commitSha);
        console.debug('[Commit addr]:', commitAddr);
        const commit = new GoshCommit(this.account.client, commitAddr);

        // Get snapshot and load meta
        const snapshot = (await this.getBranch(branchName)).snapshot;
        await snapshot.load();
        if (!snapshot.meta) throw Error('Snapshot meta is not loaded');

        // Map all blobs and deploy them;
        // Update branch snapshot
        await Promise.all(
            blobsWithSha.map(async (blob) => {
                if (!snapshot.meta) return;

                const blobSha = await commit.createBlob(blob.content, blob.sha);
                const blobAddr = await commit.getBlobAddr(blobSha);
                console.debug('[Blob addr]:', blobAddr);
                const foundIndex = snapshot.meta?.content.findIndex((metaItem) => (
                    metaItem && metaItem.name === blob.name
                )) ?? -1;
                if (foundIndex < 0) {
                    snapshot.meta.content.push({
                        name: blob.name,
                        address: blobAddr,
                        firstCommitSha: commitSha,
                        lastCommitSha: commitSha,
                        lastCommitMsg: commitData
                    });
                } else {
                    snapshot.meta.content[foundIndex] = {
                        ...snapshot.meta.content[foundIndex],
                        address: blobAddr,
                        lastCommitSha: commitSha,
                        lastCommitMsg: commitData
                    };
                }
            })
        );
        console.debug('[Snapshot addr]:', snapshot.address);
        await snapshot.setSnapshot(snapshot.meta?.content);
    }

    async getCommitAddr(commitSha: string): Promise<string> {
        const result = await this.account.runLocal(
            'getCommitAddr',
            { nameCommit: commitSha }
        );
        return result.decoded?.output.value0;
    }

    async createSnapshot(name: string): Promise<void> {
        const { body } = await this.account.client.abi.encode_message_body({
            abi: this.account.abi,
            call_set: {
                function_name: 'deployNewSnapshot',
                input: { name }
            },
            is_internal: true,
            signer: signerNone()
        });
        await giver(this.account.client, this.address, fromEvers(1.45), body);
    }
}

export class GoshCommit implements IGoshCommit {
    abi: any = GoshCommitABI;
    account: Account;
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

    constructor(client: TonClient, address: string) {
        this.address = address;
        this.account = new Account({ abi: this.abi }, { client, address });
    }

    async load(): Promise<void> {
        const meta = await this.getCommit();
        this.meta = {
            branchName: meta.branch,
            sha: meta.sha,
            content: JSON.parse(meta.content),
            parentAddr: meta.parent,
        }
    }

    async getCommit(): Promise<any> {
        const result = await this.account.runLocal('getCommit', {});
        return result.decoded?.output;
    }

    async getName(): Promise<string> {
        const result = await this.account.runLocal('getNameCommit', {});
        return result.decoded?.output.value0;
    }

    async getParent(): Promise<string> {
        const result = await this.account.runLocal('getParent', {});
        return result.decoded?.output.value0;
    }

    async getBlobs(): Promise<string[]> {
        const result = await this.account.runLocal('getBlobs', {});
        return result.decoded?.output.value0;
    }

    async getBlobAddr(blobSha: string): Promise<string> {
        const result = await this.account.runLocal(
            'getBlobAddr',
            { nameBlob: blobSha }
        );
        return result.decoded?.output.value0;
    }

    async createBlob(content: string, sha?: string): Promise<string> {
        const blobSha = sha || sha1(content, 'blob');
        await this.account.run(
            'deployBlob',
            {
                nameBlob: blobSha,
                fullBlob: content
            }
        );
        return blobSha;
    }
}

export class GoshBlob implements IGoshBlob {
    abi: any = GoshBlobABI;
    account: Account;
    address: string;
    meta?: { sha: string; content: string; commitAddr: string; };

    constructor(client: TonClient, address: string) {
        this.address = address;
        this.account = new Account({ abi: this.abi }, { client, address });
    }

    async load(): Promise<void> {
        const meta = await this.getBlob();
        this.meta = {
            sha: meta.sha,
            content: meta.content,
            commitAddr: meta.commit,
        }
    }

    async getBlob(): Promise<any> {
        const result = await this.account.runLocal('getBlob', {});
        return result.decoded?.output;
    }
}

class GoshSnapshot implements IGoshSnapshot {
    abi: any = GoshSnapshotABI;
    account: Account;
    address: string;
    meta?: {
        content: TGoshSnapshotMetaContentItem[];
    };

    constructor(client: TonClient, address: string) {
        this.address = address;
        this.account = new Account({ abi: this.abi }, { client, address });
    }

    async load(): Promise<void> {
        const snapshot = await this.getSnapshot();
        this.meta = {
            content: JSON.parse(snapshot || '[]')
        }
    }

    async getSnapshot(): Promise<any> {
        const result = await this.account.runLocal('getSnapshot', {});
        return result.decoded?.output.value0;
    }

    /**
     * Set snapshot
     * `msg.pubkey() == pubkey` (giver) or `msg.sender == _rootRepo` required
     * @param content
     */
    async setSnapshot(content: TGoshSnapshotMetaContentItem[]): Promise<void> {
        const wallet = getGiverData();
        const signer = signerKeys(wallet.keys);
        await this.account.run(
            'setSnapshot',
            { snaphot: JSON.stringify(content) },
            { signer }
        );
    }
}
