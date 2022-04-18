import { KeyPair } from "@eversdk/core";
import { useEffect, useMemo, useState } from "react";
import { useRecoilValue } from "recoil";
import { userStateAtom } from "../store/user.state";
import { GoshDao, GoshRoot, GoshWallet, GoshRepository } from "../types/classes";
import { IGoshDao, IGoshRepository, IGoshRoot, IGoshWallet } from "../types/types";
import { useEverClient } from "./ever.hooks";


/** Create GoshRoot object */
export const useGoshRoot = () => {
    const client = useEverClient();
    const userState = useRecoilValue(userStateAtom);

    return useMemo<IGoshRoot | undefined>(() => {
        const address = process.env.REACT_APP_GOSH_ADDR;
        if (client && userState.keys?.public && address) {
            return new GoshRoot(client, address);
        }
    }, [client, userState.keys]);
}

export const useGoshDao = (name?: string) => {
    const goshRoot = useGoshRoot();
    const [goshDao, setGoshDao] = useState<IGoshDao>();

    useEffect(() => {
        const createDao = async (goshRoot: IGoshRoot, daoName: string) => {
            const daoAddr = await goshRoot.getDaoAddr(daoName);
            const dao = new GoshDao(goshRoot.account.client, daoAddr);
            await dao.load();
            setGoshDao(dao);
        }

        if (goshRoot && name) createDao(goshRoot, name);
    }, [goshRoot, name]);

    return goshDao;
}

export const useGoshWallet = (daoName?: string) => {
    const userState = useRecoilValue(userStateAtom);
    const goshDao = useGoshDao(daoName);
    const [goshWallet, setGoshWallet] = useState<IGoshWallet>();

    useEffect(() => {
        const createWallet = async (goshDao: IGoshDao, keys: KeyPair) => {
            const rootPubkey = await goshDao.getRootPubkey();
            const goshWalletAddr = await goshDao.getWalletAddr(
                rootPubkey,
                `0x${keys.public}`
            );
            const goshWallet = new GoshWallet(
                goshDao.account.client,
                goshWalletAddr,
                keys
            );
            setGoshWallet(goshWallet);
        }

        if (goshDao && userState.keys) createWallet(goshDao, userState.keys);
    }, [goshDao, userState.keys]);

    return goshWallet;
}

/** Create GoshRepository object */
export const useGoshRepo = (daoName?: string, name?: string) => {
    const goshRoot = useGoshRoot();
    const [goshRepo, setGoshRepo] = useState<IGoshRepository>();

    useEffect(() => {
        const createRepo = async (root: IGoshRoot, daoName: string, name: string) => {
            const daoAddr = await root.getDaoAddr(daoName);
            const repoAddr = await root.getRepoAddr(name, daoAddr);
            const repository = new GoshRepository(root.account.client, repoAddr);
            setGoshRepo(repository);
        }

        if (goshRoot && daoName && name) createRepo(goshRoot, daoName, name);
    }, [goshRoot, daoName, name]);

    return goshRepo;
}