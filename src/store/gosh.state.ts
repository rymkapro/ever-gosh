import { atom, selectorFamily } from "recoil";
import { TGoshBranch, TGoshTree, TGoshTreeItem } from "../types/types";


export const goshBranchesAtom = atom<TGoshBranch[]>({
    key: 'GoshBranchesAtom',
    default: []
});

export const goshCurrBranchSelector = selectorFamily({
    key: 'GoshCurrBranchSelector',
    get: (branchName: string) => ({ get }) => {
        const branches = get(goshBranchesAtom);
        return branches.find((branch) => branch.name === branchName);
    }
});

export const goshRepoTreeAtom = atom<{ tree: TGoshTree; items: TGoshTreeItem[] } | undefined>({
    key: 'GoshRepoTreeAtom',
    default: undefined
});

export const goshRepoTreeSelector = selectorFamily({
    key: 'GoshRepoTreeSelector',
    get: (params: { type: 'tree' | 'items'; path: string }) => ({ get }) => {
        const treeObject = get(goshRepoTreeAtom);
        if (!treeObject) return undefined;

        const { tree, items } = treeObject;
        if (params.type === 'tree') {
            return [...tree[params.path]].sort((a, b) => (a.type > b.type) ? -1 : 1);
        } else if (params.type === 'items') {
            const filtered = [...items];
            return filtered
                .filter((item) => item.type === 'blob')
                .filter((item) => `${item.path}/${item.name}`.search(params.path) >= 0)
                .sort((a, b) => (`${a.path}/${a.name}` < `${b.path}/${b.name}`) ? -1 : 1);
        } else return undefined;
    }
});