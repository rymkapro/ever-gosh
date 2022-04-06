import { Account, AccountType } from "@eversdk/appkit";
import { KeyPair, signerKeys, signerNone, TonClient } from "@eversdk/core";
import {
    GoshABI,
    GoshBlobTVC,
    GoshCommitABI,
    GoshCommitTVC,
    GoshRepositoryABI,
    GoshRepositoryTVC,
    GoshSnapshotTVC,
    GoshTVC
} from "../contracts/gosh/gosh";
import { fromEvers, giver } from "../helpers";
import { IGoshBranch, IGoshCommit, IGoshRepository, IGoshRoot } from "./types";


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
        console.log('Name is', name);
        const encoded = await this.account.client.abi.encode_message_body({
            abi: this.account.abi,
            call_set: { function_name: 'deployRepository', input: { name } },
            signer: signerNone(),
            is_internal: true
        });
        await giver(this.account.client, this.details.address, fromEvers(3), encoded.body);

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

        // TODO: Make PR to `appkitjs` to get an ability to set signer for `runLocal`
        // const result = await this.account.runLocal('getAddrRepository', { name });
        const { message } = await this.account.client.abi.encode_message({
            address: this.details.address,
            abi: this.account.abi,
            call_set: { function_name: 'getAddrRepository', input: { name } },
            signer: signerNone()
        });
        const result = await this.account.client.tvm.run_tvm({
            message,
            account: await this.account.boc(),
            abi: this.account.abi
        })
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
            snapshot: item.snapshot
        }));
    }

    async getBranch(name: string): Promise<IGoshBranch> {
        const result = await this.account.runLocal('getAddrBranch', { name });
        return {
            name: result.decoded?.output.value0.key,
            commit: result.decoded?.output.value0.value,
            snapshot: result.decoded?.output.value0.snapshot
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

    async createCommit(branchName: string, name: string, data: string): Promise<void> {
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
        await giver(this.account.client, this.address, fromEvers(1.35), body);
    }
}

export class GoshCommit implements IGoshCommit {
    abi: any = GoshCommitABI;
    account: Account;
    address: string;

    constructor(client: TonClient, address: string) {
        this.address = address;
        this.account = new Account({ abi: this.abi }, { client, address });
    }

    async getParent(): Promise<string> {
        const result = await this.account.runLocal('getParent', {});
        return result.decoded?.output.value0;
    }
}
