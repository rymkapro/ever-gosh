import { TonClient } from "@eversdk/core";
import { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { getGoshRootFromPhrase } from "../helpers";
import { userStateAtom } from "../store/user.state";
import { GoshRepository } from "../types/classes";
import { IGoshRepository, IGoshRoot } from "../types/types";
import { useEverClient } from "./ever.hooks";


/** Create GoshRoot object */
export const useGoshRoot = () => {
    const client = useEverClient();
    const userState = useRecoilValue(userStateAtom);
    const [goshRoot, setGoshRoot] = useState<IGoshRoot>();

    const createGoshRoot = async (client: TonClient, phrase: string, address: string) => {
        const root = await getGoshRootFromPhrase(client, phrase, address);
        setGoshRoot(root);
    }

    useEffect(() => {
        const { phrase, address } = userState;
        if (client && phrase && address) createGoshRoot(client, phrase, address);

        return () => { }
    }, [client, userState]);

    return goshRoot;
}

/** Create GoshRepository object */
export const useGoshRepository = (name?: string) => {
    const goshRoot = useGoshRoot();
    const [goshRepository, setGoshRepository] = useState<IGoshRepository>();

    const createGoshRepository = async (root: IGoshRoot, name: string) => {
        const address = await root.getRepositoryAddr(name);
        const repository = new GoshRepository(root.account.client, name, address);
        setGoshRepository(repository);
    }

    useEffect(() => {
        if (goshRoot && name) createGoshRepository(goshRoot, name);
    }, [goshRoot, name]);

    return goshRepository;
}