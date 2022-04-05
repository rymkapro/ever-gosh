import { TonClient } from "@eversdk/core";
import { atom } from "recoil";
import { TEverState } from "../types/types";


export const everStateAtom = atom<TEverState>({
    key: 'EverStateAtom',
    default: {
        config: undefined,
        configHex: '7b7d',
        client: new TonClient({ network: { endpoints: ['http://localhost'] } })
    },
    dangerouslyAllowMutability: true
});