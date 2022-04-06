import { atom } from "recoil";
import { TEverState } from "../types/types";


export const everStateAtom = atom<TEverState>({
    key: 'EverStateAtom',
    default: {
        config: { network: { endpoints: ['http://localhost'] } }
    }
});