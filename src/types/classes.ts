import { Account } from "@eversdk/appkit";
import { KeyPair, signerKeys, signerNone, TonClient } from "@eversdk/core";
import GoshDaoCreatorABI from "../contracts/daocreater.abi.json";
import GoshABI from "../contracts/gosh.abi.json";
import GoshDaoABI from "../contracts/goshdao.abi.json";
import GoshWalletABI from "../contracts/goshwallet.abi.json";
import GoshRepositoryABI from "../contracts/repository.abi.json";
import GoshSnapshotABI from "../contracts/snapshot.abi.json";
import GoshCommitABI from "../contracts/commit.abi.json";
import GoshBlobABI from "../contracts/blob.abi.json";
import GoshSmvProposalABI from "../contracts/SMVProposal.abi.json";
import GoshSmvLockerABI from "../contracts/SMVTokenLocker.abi.json";
import GoshSmvClientABI from "../contracts/SMVClient.abi.json";
import GoshSmvTokenRootABI from "../contracts/TokenRoot.abi.json";
import { fromEvers, getGoshDaoCreator, getSnapshotTree, sha1, sha1Tree, unixtimeWithTz } from "../helpers";
import {
    IGoshBlob,
    TGoshBranch,
    IGoshCommit,
    IGoshRepository,
    IGoshRoot,
    IGoshSnapshot,
    IGoshDao,
    IGoshWallet,
    IGoshDaoCreator,
    TGoshCommitContent,
    IGoshSmvProposal,
    IGoshSmvLocker,
    IGoshSmvClient,
    IGoshSmvTokenRoot
} from "./types";


export class GoshDaoCreator implements IGoshDaoCreator {
    abi: any = GoshDaoCreatorABI;
    account: Account;
    address: string;

    constructor(client: TonClient, address: string) {
        this.address = address;
        this.account = new Account({ abi: this.abi }, { client, address });
    }

    async deployDao(name: string, rootPubkey: string): Promise<void> {
        await this.account.run('deployDao', { name, root_pubkey: rootPubkey });
    }

    async sendMoneyDao(name: string, value: number): Promise<void> {
        await this.account.run('sendMoneyDao', { name, value });
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

    async getDaoAddr(name: string): Promise<string> {
        const result = await this.account.runLocal('getAddrDao', { name });
        return result.decoded?.output.value0;
    }

    async getDaoWalletCode(pubkey: string): Promise<string> {
        const result = await this.account.runLocal('getDaoWalletCode', { pubkey });
        return result.decoded?.output.value0;
    }

    async getRepoAddr(name: string, daoName: string): Promise<string> {
        const result = await this.account.runLocal(
            'getAddrRepository',
            { name, dao: daoName }
        );
        return result.decoded?.output.value0;
    }

    async getDaoRepoCode(daoAddress: string): Promise<string> {
        const result = await this.account.runLocal('getRepoDaoCode', { dao: daoAddress });
        return result.decoded?.output.value0;
    }

    async getSmvProposalCode(): Promise<string> {
        const result = await this.account.runLocal('getSMVProposalCode', {});
        return result.decoded?.output.value0;
    }

    async getSmvPlatformCode(): Promise<string> {
        const result = await this.account.runLocal('getSMVPlatformCode', {});
        return result.decoded?.output.value0;
    }

    async getSmvClientCode(): Promise<string> {
        const result = await this.account.runLocal('getSMVClientCode', {});
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

    async deployWallet(rootPubkey: string, pubkey: string, keys: KeyPair): Promise<string> {
        if (!this.meta?.name) await this.load();
        if (!this.meta) throw Error('Can not read DAO name');

        // Topup GoshDao, deploy and topup GoshWallet
        await this.daoCreator.sendMoneyDao(this.meta.name, fromEvers(60));
        await this.account.run('deployWallet', { pubkey });
        await this.daoCreator.sendMoney(rootPubkey, pubkey, this.address, fromEvers(500));
        const goshWalletAddr = await this.getWalletAddr(rootPubkey, pubkey);
        console.debug('[deployWallet] GoshWallet addr:', goshWalletAddr);

        // Get TIP3 root, account addresses and mint tokens
        const rootTokenAddr = await this.getSmvRootTokenAddr();
        console.debug('[deployWallet] Root token addr:', rootTokenAddr);
        await this.mint(rootTokenAddr, 100, goshWalletAddr, 0, this.address, true, '', keys);

        // Get GoshWallet object
        const goshWallet = new GoshWallet(this.account.client, goshWalletAddr);
        console.debug('Token balance:', await goshWallet.getSmvTokenBalance());

        return goshWalletAddr;
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

    async getSmvRootTokenAddr(): Promise<string> {
        const result = await this.account.runLocal('_rootTokenRoot', {});
        return result.decoded?.output._rootTokenRoot;
    }

    async mint(
        rootTokenAddr: string,
        amount: number,
        recipient: string,
        deployWalletValue: number,
        remainingGasTo: string,
        notify: boolean,
        payload: string,
        keys: KeyPair
    ): Promise<void> {
        await this.account.run(
            'mint',
            {
                tokenRoot: rootTokenAddr,
                amount,
                recipient,
                deployWalletValue,
                remainingGasTo,
                notify,
                payload
            },
            {
                signer: signerKeys(keys)
            }
        );
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

    async deployRepo(name: string): Promise<void> {
        await this.account.run('deployRepository', { nameRepo: name });
    }

    async createBranch(
        repoName: string,
        newName: string,
        fromName: string,
        filesCount: number
    ): Promise<void> {
        await this.account.run(
            'deployBranch',
            { repoName, newName, fromName, amountFiles: filesCount }
        );
    }

    async deleteBranch(repoName: string, branchName: string): Promise<void> {
        await this.account.run('deleteBranch', { repoName, Name: branchName });
    }

    async createCommit(
        repoName: string,
        branch: TGoshBranch,
        pubkey: string,
        blobs: { name: string; modified: string; original: string; }[],
        message: string,
        parent2?: TGoshBranch
    ): Promise<void> {
        // Prepare blobs
        const _blobs = blobs.map((blob) => ({
            ...blob,
            sha: sha1(blob.modified, 'blob'),
            prevSha: blob.original ? sha1(blob.original, 'blob') : ''
        }));
        console.log('Blobs', _blobs);

        // Generate current branch full tree and add/update blobs
        const tree = await getSnapshotTree(this.account.client, branch);
        _blobs.forEach((blob) => {
            const foundIndex = tree[''].findIndex((item) => item.name === blob.name);
            if (foundIndex >= 0) tree[''][foundIndex].sha = blob.sha;
            else tree[''].push({
                mode: '100644',
                type: 'blob',
                sha: blob.sha,
                path: '',
                name: blob.name
            });
        });
        console.debug('[createCommit]: Tree after', tree);
        // TODO: Need to recalculate tree (when dirs will be supported)
        const treeSha = sha1Tree(tree);
        const treeStr = tree[''].map((item) => (
            `${item.mode} ${item.type} ${item.sha}\t${item.path}${item.name}`
        ));
        console.debug('[createCommit]: Tree sha after', treeSha);
        console.debug('[createCommit]: Tree str after', treeStr);

        // Build commit data and calculate commit name
        let parentCommitName = '';
        if (branch.commitAddr) {
            const commit = new GoshCommit(this.account.client, branch.commitAddr);
            parentCommitName = await commit.getName();
        }
        let parent2CommitName = '';
        if (parent2?.commitAddr) {
            const commit = new GoshCommit(this.account.client, parent2.commitAddr);
            parent2CommitName = await commit.getName();
        }
        const fullCommit = [
            `tree ${treeSha}`,
            parentCommitName ? `parent ${parentCommitName}` : null,
            parent2CommitName ? `parent ${parent2CommitName}` : null,
            `author ${pubkey} <${pubkey}@gosh.sh> ${unixtimeWithTz()}`,
            `committer ${pubkey} <${pubkey}@gosh.sh> ${unixtimeWithTz()}`,
            '',
            message
        ];
        const commitData = fullCommit.filter((item) => item !== null).join('\n')
        const commitName = sha1(commitData, 'commit');
        console.debug('[createCommit]: Commit data', commitData);
        console.debug('[createCommit]: Commit name', commitName);

        // Deploy commit
        await this.deployCommit(
            repoName,
            branch.name,
            commitName,
            commitData,
            branch.commitAddr,
            parent2?.commitAddr || '0:0000000000000000000000000000000000000000000000000000000000000000',
            `tree ${treeSha}`,
            treeStr.join('\n'),
            '',
            `blob ${_blobs[0].sha}`,
            _blobs[0].modified,
            _blobs[0].prevSha,
            _blobs[0].name,
            _blobs[0].modified
        );
        // await this.deployCommit(
        //     repoName,
        //     branch.name,
        //     commitName,
        //     commitData,
        //     branch.commitAddr,
        //     parent2?.commitAddr || '0:0000000000000000000000000000000000000000000000000000000000000000'
        // );
        // Deploy blobs and diffs
        // await this.deployBlob(repoName, commitName, `tree ${treeSha}`, treeStr.join('\n'), '');
        // await Promise.all(_blobs.map(async (blob) => {
        //     await this.deployBlob(
        //         repoName,
        //         commitName,
        //         `blob ${blob.sha}`,
        //         blob.modified,
        //         blob.prevSha
        //     );
        //     await this.deployDiff(repoName, branch.name, blob.name, blob.modified);
        // }));
    }

    // async deployCommit(
    //     repoName: string,
    //     branchName: string,
    //     commitName: string,
    //     commitData: string,
    //     parent1: string,
    //     parent2: string
    // ): Promise<void> {
    //     await this.account.run(
    //         'deployCommit',
    //         {
    //             repoName,
    //             branchName,
    //             commitName,
    //             fullCommit: commitData,
    //             parent1,
    //             parent2
    //         }
    //     );
    // }

    async deployCommit(
        repoName: string,
        branchName: string,
        commitName: string,
        commitData: string,
        parent1: string,
        parent2: string,
        blobName1: string,
        fullBlob1: string,
        prevSha1: string,
        blobName2: string,
        fullBlob2: string,
        prevSha2: string,
        diffName: string,
        diff: string
    ): Promise<void> {
        await this.account.run(
            'deployCommit',
            {
                repoName,
                branchName,
                commitName,
                fullCommit: commitData,
                parent1,
                parent2,
                blobName1,
                fullBlob1,
                prevSha1,
                blobName2,
                fullBlob2,
                prevSha2,
                diffName,
                diff
            }
        );
    }

    async deployBlob(
        repoName: string,
        commitName: string,
        blobName: string,
        blobContent: string,
        blobPrevSha: string
    ): Promise<void> {
        await this.account.run(
            'deployBlob',
            {
                repoName,
                commit: commitName,
                blobName,
                fullBlob: blobContent,
                prevSha: blobPrevSha
            }
        );
    }

    async deployDiff(
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
        );
    }

    async getSmvLockerAddr(): Promise<string> {
        const result = await this.account.runLocal('tip3VotingLocker', {});
        return result.decoded?.output.tip3VotingLocker;
    }

    async getSmvClientAddr(lockerAddr: string, proposalId: string): Promise<string> {
        const result = await this.account.runLocal(
            'clientAddress',
            { _tip3VotingLocker: lockerAddr, propId: proposalId }
        );
        return result.decoded?.output.value0;
    }

    async getSmvTokenBalance(): Promise<number> {
        const result = await this.account.runLocal('_tokenBalance', {});
        return +result.decoded?.output._tokenBalance;
    }

    async lockVoting(amount: number): Promise<void> {
        await this.account.run('lockVoting', { amount });
    }

    async unlockVoting(amount: number): Promise<void> {
        await this.account.run('unlockVoting', { amount });
    }

    async tryProposalResult(proposalAddr: string): Promise<boolean> {
        const result = await this.account.run('tryProposalResult', { proposal: proposalAddr });
        console.debug('Proposal result', result);
        return false;
    }

    async voteFor(
        platformCode: string,
        clientCode: string,
        proposalAddr: string,
        choice: boolean,
        amount: number
    ): Promise<void> {
        await this.account.run(
            'voteFor',
            { platformCode, clientCode, proposal: proposalAddr, choice, amount }
        )
    }

    async updateHead(): Promise<void> {
        await this.account.run('updateHead', {});
    }
}

export class GoshRepository implements IGoshRepository {
    abi: any = GoshRepositoryABI;
    account: Account;
    address: string;
    meta?: {
        name: string;
        branchCount: number;
    }

    constructor(client: TonClient, address: string) {
        this.address = address;
        this.account = new Account({ abi: this.abi }, { client, address });
    }

    async load(): Promise<void> {
        const branches = await this.getBranches();
        this.meta = {
            name: await this.getName(),
            branchCount: branches.length
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

    async getSnapshotAddr(branchName: string, filePath: string): Promise<string> {
        const result = await this.account.runLocal(
            'getSnapAddr',
            { branch: branchName, name: filePath }
        );
        return result.decoded?.output.value0;
    }

    async getCommitAddr(branchName: string, commitSha: string): Promise<string> {
        const result = await this.account.runLocal(
            'getCommitAddr',
            {
                nameBranch: branchName,
                nameCommit: commitSha
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
        repoAddr: string;
        branchName: string;
        sha: string;
        content: TGoshCommitContent;
        parent1Addr: string;
        parent2Addr: string;
    }

    constructor(client: TonClient, address: string) {
        this.address = address;
        this.account = new Account({ abi: this.abi }, { client, address });
    }

    async load(): Promise<void> {
        const meta = await this.getCommit();
        this.meta = {
            repoAddr: meta.repo,
            branchName: meta.branch,
            sha: meta.sha,
            content: GoshCommit.parseContent(meta.content),
            parent1Addr: meta.parent1,
            parent2Addr: meta.parent2
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

    async getParent(): Promise<string[]> {
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

    static parseContent(content: string): TGoshCommitContent {
        console.debug('[GoshCommit] Commit content', content);
        const splitted = content.split('\n');

        const commentIndex = splitted.findIndex((v) => v === '');
        const commentData = splitted.slice(commentIndex + 1);
        const [title, ...message] = commentData;
        const parsed: { [key: string]: string } = {
            title,
            message: message.filter((v) => v).join('\n')
        };

        const commitData = splitted.slice(0, commentIndex);
        commitData.forEach((item) => {
            ['tree', 'author', 'committer'].forEach((key) => {
                if (item.search(key) >= 0) parsed[key] = item.replace(`${key} `, '');
            });
        });
        return parsed as TGoshCommitContent;
    }
}

export class GoshBlob implements IGoshBlob {
    abi: any = GoshBlobABI;
    account: Account;
    address: string;
    meta?: IGoshBlob['meta'];

    constructor(client: TonClient, address: string) {
        this.address = address;
        this.account = new Account({ abi: this.abi }, { client, address });
    }

    async load(): Promise<void> {
        const meta = await this.getBlob();
        this.meta = {
            name: meta.sha,
            content: meta.content,
            commitAddr: meta.commit,
            prevSha: await this.getPrevSha()
        }
    }

    async getBlob(): Promise<any> {
        const result = await this.account.runLocal('getBlob', {});
        return result.decoded?.output;
    }

    async getPrevSha(): Promise<string> {
        const result = await this.account.runLocal('getprevSha', {});
        return result.decoded?.output.value0;
    }
}

export class GoshSnapshot implements IGoshSnapshot {
    abi: any = GoshSnapshotABI;
    account: Account;
    address: string;
    meta?: {
        name: string;
        content: string;
    };

    constructor(client: TonClient, address: string) {
        this.address = address;
        this.account = new Account({ abi: this.abi }, { client, address });
    }

    async load(): Promise<void> {
        this.meta = {
            name: await this.getName(),
            content: await this.getSnapshot()
        }
    }

    async getName(): Promise<string> {
        const result = await this.account.runLocal('getName', {});
        return result.decoded?.output.value0;
    }

    async getSnapshot(): Promise<any> {
        const result = await this.account.runLocal('getSnapshot', {});
        return result.decoded?.output.value0;
    }
}

export class GoshSmvProposal implements IGoshSmvProposal {
    abi: any = GoshSmvProposalABI;
    address: string;
    account: Account;
    meta?: {
        kind: number;
        id: string;
        votes: { yes: number; no: number; };
        time: { start: Date; finish: Date; };
        isCompleted: boolean;
        commit: {
            repoName: string;
            branchName: string;
            commitName: string;
            fullCommit: TGoshCommitContent;
            parent1: string;
            parent2: string;
        }
    };

    constructor(client: TonClient, address: string) {
        this.address = address;
        this.account = new Account({ abi: this.abi }, { client, address });
    }

    async load(): Promise<void> {
        const id = await this.getId();
        const params = await this.getProposalParams();
        const votes = await this.getVotes();
        const time = await this.getTime();
        const isCompleted = await this.isCompleted();
        this.meta = {
            kind: params.proposalKind,
            id,
            votes,
            time,
            isCompleted,
            commit: {
                repoName: params.repoName,
                branchName: params.branchName,
                commitName: params.commitName,
                fullCommit: GoshCommit.parseContent(params.fullCommit),
                parent1: params.parent1,
                parent2: params.parent2
            }
        }
    }

    async getId(): Promise<string> {
        const result = await this.account.runLocal('propId', {});
        return result.decoded?.output.propId;
    }

    async getProposalParams(): Promise<any> {
        const result = await this.account.runLocal('getProposalParams', {});
        return result.decoded?.output;
    }

    async getVotes(): Promise<{ yes: number; no: number; }> {
        const yes = await this.account.runLocal('votesYes', {});
        const no = await this.account.runLocal('votesNo', {});
        console.debug('VY', yes)
        console.debug('VN', no)
        return {
            yes: +yes.decoded?.output.votesYes,
            no: +no.decoded?.output.votesNo
        }
    }

    async getTime(): Promise<{ start: Date; finish: Date; }> {
        const start = await this.account.runLocal('startTime', {});
        const finish = await this.account.runLocal('finishTime', {});
        return {
            start: new Date(+start.decoded?.output.startTime * 1000),
            finish: new Date(+finish.decoded?.output.finishTime * 1000)
        }
    }

    async isCompleted(): Promise<boolean> {
        const result = await this.account.runLocal('_isCompleted', {});
        return !!result.decoded?.output.value0;
    }

    async getLockerAddr(): Promise<string> {
        const result = await this.account.runLocal('tokenLocker', {});
        return result.decoded?.output.tokenLocker;
    }

    async getBlob1Params(): Promise<any> {
        const result = await this.account.runLocal('getBlob1Params', {});
        return result.decoded?.output;
    }

    async getBlob2Params(): Promise<any> {
        const result = await this.account.runLocal('getBlob2Params', {});
        return result.decoded?.output;
    }
}

export class GoshSmvLocker implements IGoshSmvLocker {
    abi: any = GoshSmvLockerABI;
    account: Account;
    address: string;
    meta?: {
        votesTotal: number;
        votesLocked: number;
        isBusy: boolean;
    };

    constructor(client: TonClient, address: string) {
        this.address = address;
        this.account = new Account({ abi: this.abi }, { client, address });
    }

    async load(): Promise<void> {
        const votes = await this.getVotes();
        const isBusy = await this.getIsBusy();
        this.meta = {
            votesLocked: votes.locked,
            votesTotal: votes.total,
            isBusy
        }
    }

    async getVotes(): Promise<{ total: number; locked: number; }> {
        const total = await this.account.runLocal('total_votes', {});
        const locked = await this.account.runLocal('votes_locked', {});
        return {
            total: +total.decoded?.output.total_votes,
            locked: +locked.decoded?.output.votes_locked
        }
    }

    async getIsBusy(): Promise<boolean> {
        const result = await this.account.runLocal('lockerBusy', {});
        return result.decoded?.output.lockerBusy;
    }
}

export class GoshSmvClient implements IGoshSmvClient {
    abi: any = GoshSmvClientABI;
    account: Account;
    address: string;

    constructor(client: TonClient, address: string) {
        this.address = address;
        this.account = new Account({ abi: this.abi }, { client, address });
    }

    async getLockedAmount(): Promise<number> {
        const result = await this.account.runLocal('_getLockedAmount', {});
        return +result.decoded?.output.value0;
    }
}

export class GoshSmvTokenRoot implements IGoshSmvTokenRoot {
    abi: any = GoshSmvTokenRootABI;
    account: Account;
    address: string;

    constructor(client: TonClient, address: string) {
        this.address = address;
        this.account = new Account({ abi: this.abi }, { client, address });
    }

    async getTotalSupply(): Promise<number> {
        const result = await this.account.runLocal('totalSupply_', {});
        return +result.decoded?.output.totalSupply_;
    }
}
