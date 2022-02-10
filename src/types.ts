export enum ERepositoryType {
    PRIVATE,
    PUBLIC
}

export type TRepositoryItem = {
    address: string;
    name: string;
    type: string;
    description?: string;
    language?: string;
    license?: string;
    updated: string;
}

export type TRepositoryBranch = {
    name: string;
    tree: TRepositoryTreeItem[];
}

export type TRepositoryTreeItem = {
    name: string;
    isBlob: boolean;
    commit: string;
    content?: string;
    language?: string;
}

export interface IRepository {
    address: string;
    name: string;
    type: ERepositoryType;
    description?: string;
    language?: string;
    license?: string;
    updated?: string;

    getTypeString(): string;
    getBranches(): Promise<string[]>;
    getTree(branch: string, path?: string): Promise<TRepositoryTreeItem[]>;
    getBlob(branch: string, path: string): Promise<TRepositoryTreeItem | undefined>
}