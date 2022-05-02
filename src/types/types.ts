import { Account } from "@eversdk/appkit";
import { ClientConfig, KeyPair } from "@eversdk/core";


export type TEverState = {
    config: ClientConfig;
}

export type TUserStatePersist = {
    phrase?: string;
    nonce?: string;
    pin?: string;
}

export type TUserState = TUserStatePersist & {
    keys?: KeyPair;
}

export type TGoshBranch = {
    name: string;
    commitAddr: string;
}

export type TGoshCommitContent = {
    tree: string;
    author: string;
    committer: string;
    title: string;
    message: string;
}

export type TGoshTreeItem = {
    mode: '040000' | '100644';
    type: 'tree' | 'blob';
    sha: string;
    path: string;
    name: string;
}

export type TGoshTree = {
    [key: string]: TGoshTreeItem[]
}

interface IContract {
    abi: any;
    tvc?: string;
    account: Account;
}

export interface IGoshDaoCreator extends IContract {
    address: string;

    deployDao(name: string, rootPubkey: string): Promise<void>;
    sendMoneyDao(name: string, value: number): Promise<void>;
    sendMoney(rootPubkey: string, pubkey: string, daoAddr: string, value: number): Promise<void>;
}
export interface IGoshRoot extends IContract {
    address: string;
    daoCreator: IGoshDaoCreator;

    createDao(name: string, rootPubkey: string): Promise<IGoshDao>;

    getDaoAddr(name: string): Promise<string>;
    getDaoWalletCode(pubkey: string): Promise<string>;
    getRepoAddr(name: string, daoName: string): Promise<string>;
    getDaoRepoCode(daoAddress: string): Promise<string>;
    getSmvProposalCode(): Promise<string>;
    getSmvPlatformCode(): Promise<string>;
    getSmvClientCode(): Promise<string>;
}

export interface IGoshDao extends IContract {
    address: string;
    daoCreator: IGoshDaoCreator;
    meta?: {
        name: string;
    };

    load(): Promise<void>;
    deployWallet(rootPubkey: string, pubkey: string, keys: KeyPair): Promise<string>;
    getWalletAddr(rootPubkey: string, pubkey: string): Promise<string>;
    getWallets(): Promise<string[]>;
    getName(): Promise<string>;
    getRootPubkey(): Promise<string>;
    getSmvRootTokenAddr(): Promise<string>;
    mint(
        rootTokenAddr: string,
        amount: number,
        recipient: string,
        deployWalletValue: number,
        remainingGasTo: string,
        notify: boolean,
        payload: string,
        keys: KeyPair
    ): Promise<void>;
}

export interface IGoshWallet extends IContract {
    address: string;

    getDao(): Promise<IGoshDao>;
    getRoot(): Promise<IGoshRoot>;
    createCommit(
        repo: IGoshRepository,
        branch: TGoshBranch,
        pubkey: string,
        blobs: { name: string; modified: string; original: string; }[],
        message: string,
        parent2?: TGoshBranch
    ): Promise<void>;

    getDaoAddr(): Promise<string>;
    getRootAddr(): Promise<string>;
    getPubkey(): Promise<string>;
    deployRepo(name: string): Promise<void>;
    deployBranch(repo: IGoshRepository, newName: string, fromName: string): Promise<void>;
    deleteBranch(repo: IGoshRepository, branchName: string): Promise<void>;
    deployCommit(
        repoName: string,
        branchName: string,
        commitName: string,
        commitData: string,
        parent1: string,
        parent2: string
    ): Promise<void>;
    deployBlob(
        repoName: string,
        branchName: string,
        commitName: string,
        blobName: string,
        blobContent: string,
        blobPrevSha: string
    ): Promise<void>;
    setCommit(
        repoName: string,
        branchName: string,
        commitName: string,
        branchCommit: string,
        value: number
    ): Promise<void>;
    setBlobs(repoName: string, commitName: string, blobAddr: string[]): Promise<void>;
    getSmvLockerAddr(): Promise<string>;
    getSmvTokenBalance(): Promise<number>;
    getSmvClientAddr(lockerAddr: string, proposalId: string): Promise<string>;
    lockVoting(amount: number): Promise<void>;
    unlockVoting(amount: number): Promise<void>;
    voteFor(
        platformCode: string,
        clientCode: string,
        proposalAddr: string,
        choice: boolean,
        amount: number
    ): Promise<void>;
    tryProposalResult(proposalAddr: string): Promise<void>;
    updateHead(): Promise<void>;
}

export interface IGoshRepository extends IContract {
    address: string;
    meta?: {
        name: string;
        branchCount: number;
    }

    load(): Promise<void>;
    getName(): Promise<string>;
    getBranches(): Promise<TGoshBranch[]>;
    getBranch(name: string): Promise<TGoshBranch>;
    getCommitAddr(branchName: string, commitSha: string): Promise<string>;
    getBlobAddr(blobName: string): Promise<string>;
}

export interface IGoshCommit extends IContract {
    address: string;
    meta?: {
        repoAddr: string;
        branchName: string;
        sha: string;
        content: TGoshCommitContent;
        parent1Addr: string;
        parent2Addr: string;
    }

    load(): Promise<void>;
    getCommit(): Promise<any>;
    getName(): Promise<string>;
    getParent(): Promise<string[]>;
    getBlobs(): Promise<string[]>;
}

export interface IGoshBlob extends IContract {
    address: string;
    meta?: {
        name: string;
        content: string;
        commitAddr: string;
        prevSha: string;
    }

    load(): Promise<void>;
    getBlob(): Promise<any>;
    getPrevSha(): Promise<string>;
}

export interface IGoshSmvProposal extends IContract {
    address: string;
    meta?: {
        kind: number;
        id: string;
        votes: { yes: number; no: number; }
        time: { start: Date; finish: Date; }
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

    load(): Promise<void>;
    getId(): Promise<string>;
    getVotes(): Promise<{ yes: number; no: number; }>;
    getTime(): Promise<{ start: Date; finish: Date; }>;
    getProposalParams(): Promise<any>;
    getLockerAddr(): Promise<string>;
    isCompleted(): Promise<boolean>;

    getBlob1Params(): Promise<any>;
    getBlob2Params(): Promise<any>;
}

export interface IGoshSmvLocker extends IContract {
    address: string;
    meta?: {
        votesTotal: number;
        votesLocked: number;
        isBusy: boolean;
    }

    load(): Promise<void>;
    getVotes(): Promise<{ total: number; locked: number; }>;
    getIsBusy(): Promise<boolean>;
}

export interface IGoshSmvClient extends IContract {
    address: string;

    getLockedAmount(): Promise<number>;
}

export interface IGoshSmvTokenRoot extends IContract {
    address: string;

    getTotalSupply(): Promise<number>;
}
