import React, { useEffect, useState } from "react";
import { faCode } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import Spinner from "../components/Spinner";
import { useGoshRepo, useGoshWallet } from "../hooks/gosh.hooks";
import { IGoshRepository, IGoshWallet } from "../types/types";
import { classNames } from "../utils";
import { getGoshRepoBranches } from "../helpers";
import { useSetRecoilState } from "recoil";
import { goshBranchesAtom } from "../store/gosh.state";


export type TRepoLayoutOutletContext = {
    goshRepo: IGoshRepository;
    goshWallet: IGoshWallet;
}

const RepoLayout = () => {
    const { daoName, repoName } = useParams();
    const goshRepo = useGoshRepo(daoName, repoName);
    const goshWallet = useGoshWallet(daoName);
    const setBranches = useSetRecoilState(goshBranchesAtom);
    const [isFetched, setIsFetched] = useState<boolean>(false);

    useEffect(() => {
        console.debug('REPO LAYOUT')
        const init = async (repo: IGoshRepository) => {
            const { branchList } = await getGoshRepoBranches(repo);
            setBranches(branchList);
            setIsFetched(true);
            console.debug('Repo addr:', goshRepo?.address);
            console.debug('Wallet addr:', goshWallet?.address);
        }

        if (goshRepo && goshWallet) init(goshRepo);
    }, [goshRepo, goshWallet, setBranches]);

    return (
        <div className="container my-10">
            <h1 className="flex items-center mb-6">
                <Link to={`/orgs/${daoName}`} className="font-semibold text-xl hover:underline">
                    {daoName}
                </Link>
                <span className="mx-2">/</span>
                <Link to={`/orgs/${daoName}/repos/${repoName}`} className="font-semibold text-xl hover:underline">
                    {repoName}
                </Link>
            </h1>

            {!isFetched && (
                <>
                    <Spinner className="mr-3" />
                    Loading repository
                </>
            )}

            {isFetched && (
                <>
                    <div className="flex gap-x-6 mb-6">
                        <NavLink
                            to={`/orgs/${daoName}/repos/${repoName}`}
                            end
                            className={({ isActive }) => classNames(
                                'text-base text-gray-050a15/50 hover:text-gray-050a15 py-1.5 px-2',
                                isActive ? '!text-gray-050a15 border-b border-b-gray-050a15' : null
                            )}
                        >
                            <FontAwesomeIcon icon={faCode} size="sm" className="mr-2" />
                            Code
                        </NavLink>
                        <NavLink
                            to={`/orgs/${daoName}/repos/${repoName}/pulls`}
                            className={({ isActive }) => classNames(
                                'text-base text-gray-050a15/50 hover:text-gray-050a15 py-1.5 px-2',
                                isActive ? '!text-gray-050a15 border-b border-b-gray-050a15' : null
                            )}
                        >
                            <FontAwesomeIcon icon={faCode} size="sm" className="mr-2" />
                            Pull requests
                        </NavLink>
                    </div>

                    <Outlet context={{ goshRepo, goshWallet }} />
                </>
            )}
        </div>
    );
}

export default RepoLayout;
