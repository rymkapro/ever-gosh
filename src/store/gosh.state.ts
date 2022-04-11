import { atom, selectorFamily } from "recoil";
import { IGoshRepository } from "../types/types";


export const goshRepoListAtom = atom<{ isLoading: boolean, list: IGoshRepository[] }>({
    key: 'GoshRepoListAtom',
    default: {
        isLoading: false,
        list: []
    }
});

export const goshRepoListSelector = selectorFamily({
    key: 'GoshRepoListSelector',
    get: (search: string | undefined) => ({ get }) => {
        const repos = get(goshRepoListAtom);
        if (!search) return repos.list;

        const pattern = new RegExp(search, 'i');
        return repos.list.filter((repo) => repo.name.search(pattern) >= 0);
    }
});