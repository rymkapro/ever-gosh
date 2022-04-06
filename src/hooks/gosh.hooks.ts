import { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { userStateAtom } from "../store/user.state";
import { GoshRepository, GoshRoot } from "../types/classes";
import { IGoshRepository, IGoshRoot } from "../types/types";
import { useEverClient } from "./ever.hooks";


/** Create GoshRoot object */
export const useGoshRoot = () => {
    const client = useEverClient();
    const userState = useRecoilValue(userStateAtom);
    const [goshRoot, setGoshRoot] = useState<IGoshRoot>();

    useEffect(() => {
        const create = async () => {
            if (!userState.phrase) return;
            const keys = await client.crypto.mnemonic_derive_sign_keys({ phrase: userState.phrase });
            const root = new GoshRoot(client, { keys, address: userState.address });
            await root.load();
            setGoshRoot(root);
        }

        create();
    }, [client, userState]);

    return goshRoot;
}

/** Create GoshRepository object */
export const useGoshRepository = (name?: string) => {
    const goshRoot = useGoshRoot();
    const [goshRepository, setGoshRepository] = useState<IGoshRepository>();

    useEffect(() => {
        const create = async () => {
            if (!goshRoot || !name) return;
            const address = await goshRoot.getRepositoryAddress(name);
            const repository = new GoshRepository(goshRoot.account.client, name, address);
            setGoshRepository(repository);
        }

        create();
    }, [goshRoot, name]);

    return goshRepository;
}