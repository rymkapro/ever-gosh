import React, { useEffect, useState } from "react";
import { faCode, faCodePullRequest } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import Spinner from "../components/Spinner";
import { useGoshRepo, useGoshWallet, useGoshRepoBranches } from "../hooks/gosh.hooks";
import { IGoshRepository, IGoshWallet } from "../types/types";
import { classNames } from "../utils";


export type TRepoLayoutOutletContext = {
    goshRepo: IGoshRepository;
    goshWallet: IGoshWallet;
}

const RepoLayout = () => {
    const { daoName, repoName } = useParams();
    const goshRepo = useGoshRepo(daoName, repoName);
    const goshWallet = useGoshWallet(daoName);
    const { updateBranches } = useGoshRepoBranches(goshRepo);
    const [isFetched, setIsFetched] = useState<boolean>(false);

    useEffect(() => {
        const init = async () => {
            await updateBranches();
            setIsFetched(true);
            console.debug('Repo addr:', goshRepo?.address);
            console.debug('Wallet addr:', goshWallet?.address);
        }

        if (goshRepo && goshWallet) init();
    }, [goshRepo, goshWallet, updateBranches]);

    return (
        <div className="container my-10">
            <h1 className="flex items-center mb-6">
                <Link to={`/${daoName}`} className="font-semibold text-xl hover:underline">
                    {daoName}
                </Link>
                <span className="mx-2">/</span>
                <Link to={`/${daoName}/${repoName}`} className="font-semibold text-xl hover:underline">
                    {repoName}
                </Link>
            </h1>

            {!isFetched && (
                <div className="text-gray-606060">
                    <Spinner className="mr-3" />
                    Loading repository...
                </div>
            )}

            {isFetched && (
                <>
                    <div className="flex gap-x-6 mb-6">
                        <NavLink
                            to={`/${daoName}/${repoName}`}
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
                            to={`/${daoName}/${repoName}/pulls`}
                            className={({ isActive }) => classNames(
                                'text-base text-gray-050a15/50 hover:text-gray-050a15 py-1.5 px-2',
                                isActive ? '!text-gray-050a15 border-b border-b-gray-050a15' : null
                            )}
                        >
                            <FontAwesomeIcon icon={faCodePullRequest} size="sm" className="mr-2" />
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
