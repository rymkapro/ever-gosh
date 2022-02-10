import { IRepository, ERepositoryType, TRepositoryBranch, TRepositoryTreeItem } from "./types";


export class RepositoryFixture implements IRepository {
    address: string;
    name: string;
    type: ERepositoryType;
    description?: string;
    language?: string;
    license?: string;
    updated?: string;
    branches: TRepositoryBranch[];

    constructor(
        address: string, name: string, type: ERepositoryType, branches: TRepositoryBranch[],
        description?: string, language?: string, license?: string, updated?: string,
    ) {
        this.address = address;
        this.name = name;
        this.type = type;
        this.branches = branches;
        this.description = description;
        this.language = language;
        this.license = license;
        this.updated = updated;
    }

    getTypeString(): string {
        const types = {
            0: 'Private',
            1: 'Public'
        }
        return types[this.type];
    }

    async getBranches(): Promise<string[]> {
        return this.branches.map((branch) => branch.name);
    }

    async getTree(branch: string, path?: string): Promise<TRepositoryTreeItem[]> {
        const recursion = (items: any[], parts?: string[]): any => {
            if (!parts) return items;

            const part = parts.shift();
            const found = items.find((item) => item.name === part);
            if (!found) return [];

            if (parts.length) return recursion(found.children, parts);
            return found.children;
        }

        const found = this.branches.find((item) => item.name === branch);
        if (!found) return [];

        const tree = recursion(found.tree, path ? path.split('/') : undefined);
        return tree
            ? tree.map((item: any) => ({
                name: item.name,
                isBlob: item.isBlob,
                commit: item.commit,
                content: item.content,
                language: item.language
            }))
            : [];
    }

    async getBlob(branch: string, path: string): Promise<TRepositoryTreeItem | undefined> {
        // Prepare path to blob and blob name.
        const pathArray = path.split('/');
        const parts = pathArray.slice(0, -1).join('/');
        const blob = pathArray.slice(-1)[0];

        // Get blob parent list and find blob.
        const tree = await this.getTree(branch, parts);
        return tree.find((item) => item.name === blob && item.isBlob);
    }
}