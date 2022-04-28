import { atom, selectorFamily } from "recoil";
import { TGoshBranch, TGoshTree } from "../types/types";


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

export const goshRepoTreeAtom = atom<TGoshTree | undefined>({
    key: 'GoshRepoTreeAtom',
    default: undefined
});

export const goshRepoTreeSelector = selectorFamily({
    key: 'GoshRepoTreeSelector',
    get: (path: string) => ({ get }) => {
        const tree = get(goshRepoTreeAtom);
        if (!tree) return undefined;
        return [...tree[path]].sort((a, b) => (a.type > b.type) ? -1 : 1);
    }
});