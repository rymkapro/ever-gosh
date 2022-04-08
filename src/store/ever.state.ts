import { atom } from "recoil";
import { getEndpoints } from "../helpers";
import { TEverState } from "../types/types";


export const everStateAtom = atom<TEverState>({
    key: 'EverStateAtom',
    default: {
        config: {
            network: {
                endpoints: getEndpoints()
            }
        }
    }
});