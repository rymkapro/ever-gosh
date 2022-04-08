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
import { fromEvers, getGiverData, giver } from "../helpers";
import { IGoshBlob, IGoshBranch, IGoshCommit, IGoshRepository, IGoshRoot, IGoshSnapshot } from "./types";


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
        const repoAddress = await this.getRepositoryAddress(name);
        if (!repoAddress) throw Error('Error getting repository address after deploy');
        await giver(this.account.client, repoAddress, fromEvers(30));

        // TODO: Remove in future
        // Store created repository address in local storage
        const storage: { [key: string]: any } = JSON.parse(localStorage.getItem('repositories') ?? '{}');
        if (!storage[this.details.address]) storage[this.details.address] = [];
        storage[this.details.address].push(name);
        localStorage.setItem('repositories', JSON.stringify(storage));

        return repoAddress;
    }

    /** Get repository address by it's name */
    async getRepositoryAddress(name: string): Promise<string> {
        if (!this.details?.address) throw Error('GoshRoot address is not set');
        const result = await this.account.runLocal('getAddrRepository', { name });
        return result.decoded?.output.value0;
    }

    /** Get repositories list */
    async getRepositories(): Promise<IGoshRepository[]> {
        if (!this.details?.address) throw Error('GoshRoot address is not set');

        const storage: { [key: string]: any } = JSON.parse(localStorage.getItem('repositories') ?? '{}');
        const repos = (storage[this.details.address] ?? []).map(async (name: string) => {
            const address = await this.getRepositoryAddress(name);
            return new GoshRepository(this.account.client, name, address);
        });
        return Promise.all(repos);
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

    async getBranches(): Promise<IGoshBranch[]> {
        const result = await this.account.runLocal('getAllAddress', {});
        return result.decoded?.output.value0.map((item: any) => ({
            name: item.key,
            commit: item.value,
            snapshot: new GoshSnapshot(this.account.client, item.snapshot)
        }));
    }

    async getBranch(name: string): Promise<IGoshBranch> {
        const result = await this.account.runLocal('getAddrBranch', { name });
        const decoded = result.decoded?.output.value0;
        return {
            name: decoded.key,
            commit: decoded.value,
            snapshot: new GoshSnapshot(this.account.client, decoded.snapshot)
        }
    }

    async createBranch(name: string, fromName: string): Promise<void> {
        const { body } = await this.account.client.abi.encode_message_body({
            abi: this.account.abi,
            call_set: {
                function_name: 'deployBranch',
                input: { newname: name, fromname: fromName }
            },
            is_internal: true,
            signer: signerNone()
        });
        await giver(this.account.client, this.address, fromEvers(0.25), body);
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
     * @param name
     * @param data
     * @param blobs
     */
    async createCommit(
        branchName: string,
        name: string,
        data: string,
        blobs: { name: string; content: string }[] = []
    ): Promise<void> {
        // Deploy commit
        const { body } = await this.account.client.abi.encode_message_body({
            abi: this.account.abi,
            call_set: {
                function_name: 'deployCommit',
                input: {
                    nameBranch: branchName,
                    nameCommit: name,
                    fullCommit: data
                }
            },
            is_internal: true,
            signer: signerNone()
        });
        await giver(this.account.client, this.address, fromEvers(5), body);

        // Get commit address, create commit object
        const commitAddress = await this.getCommitAddress(branchName, name);
        const commit = new GoshCommit(this.account.client, commitAddress);

        // Get snapshot and load meta
        const snapshot = (await this.getBranch(branchName)).snapshot;
        await snapshot.load();
        if (!snapshot.meta) throw Error('Snapshot meta is not loaded');

        // Search for blobs name in snapshot and deploy blob if not exists.
        // Update snapshot with any blob
        await Promise.all(
            blobs.map(async (blob) => {
                if (!snapshot.meta) return;

                const item = {
                    name: blob.name,
                    content: blob.content,
                    rootCommit: commitAddress,
                    lastCommitName: name
                }

                const foundIndex = snapshot.meta?.content.findIndex((metaItem) => (
                    metaItem && metaItem.name === item.name
                )) ?? -1;
                if (foundIndex < 0) {
                    await commit.createBlob(blob.name, blob.content);
                    snapshot.meta.content.push(item);
                } else {
                    snapshot.meta.content[foundIndex] = item;
                }
            })
        );
        await snapshot.setSnapshot(JSON.stringify(snapshot.meta?.content));
    }

    async getCommitAddress(branchName: string, name: string): Promise<string> {
        const result = await this.account.runLocal(
            'getCommitAddr',
            {
                nameBranch: branchName,
                nameCommit: name
            }
        );
        return result.decoded?.output.value0;
    }
}

export class GoshCommit implements IGoshCommit {
    abi: any = GoshCommitABI;
    account: Account;
    address: string;
    meta?: {
        branchName: string;
        name: string;
        parent: string;
        content: string;
    }

    constructor(client: TonClient, address: string) {
        this.address = address;
        this.account = new Account({ abi: this.abi }, { client, address });
    }

    async load(): Promise<void> {
        const meta = await this.getCommit();
        this.meta = {
            branchName: meta.branch,
            name: meta.sha,
            parent: meta.parent,
            content: meta.content
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

    async createBlob(name: string, content: string): Promise<void> {
        await this.account.run('deployBlob', { nameBlob: name, fullBlob: content });
    }
}

class GoshBlob implements IGoshBlob {
    abi: any = GoshBlobABI;
    account: Account;
    address: string;
    meta?: { name: string; rootCommit: string; content: string; };

    constructor(client: TonClient, address: string) {
        this.address = address;
        this.account = new Account({ abi: this.abi }, { client, address });
    }
}

class GoshSnapshot implements IGoshSnapshot {
    abi: any = GoshSnapshotABI;
    account: Account;
    address: string;
    meta?: {
        content: (IGoshBlob['meta'] & { lastCommitName: string })[];
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
     * @param snapshot
     */
    async setSnapshot(snapshot: string): Promise<void> {
        const wallet = getGiverData();
        const signer = signerKeys(wallet.keys);
        await this.account.run('setSnapshot', { snaphot: snapshot }, { signer });
    }
}
