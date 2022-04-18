import React, { useEffect, useState } from "react";
import { faCode } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import Spinner from "../components/Spinner";
import { useGoshRepo, useGoshWallet } from "../hooks/gosh.hooks";
import { IGoshRepository, IGoshWallet, TGoshBranch } from "../types/types";
import { classNames } from "../utils";
import { getGoshRepoBranches } from "../helpers";


export type TRepoLayoutOutletContext = {
    goshRepo: IGoshRepository;
    goshWallet: IGoshWallet;
    branches: { branchList: TGoshBranch[]; branchCurr?: TGoshBranch };
}

const RepoLayout = () => {
    const { daoName, repoName, branchName } = useParams();
    const goshRepo = useGoshRepo(daoName, repoName);
    const goshWallet = useGoshWallet(daoName);
    const [isFetched, setIsFetched] = useState<boolean>(false);
    const [branches, setBranches] = useState<{ branchList: TGoshBranch[]; branchCurr?: TGoshBranch }>();

    useEffect(() => {
        const getBranches = async (goshRepo: IGoshRepository) => {
            const branches = await getGoshRepoBranches(goshRepo, branchName);
            console.debug('GoshRepo address', goshRepo.address);
            console.debug('GoshWallet address', goshWallet?.address);
            setBranches(branches);
            setIsFetched(true);
        }

        if (goshRepo && goshWallet) getBranches(goshRepo);
    }, [goshRepo, goshWallet, branchName]);

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
                    </div>

                    <Outlet context={{ goshRepo, goshWallet, branches }} />
                </>
            )}
        </div>
    );
}

export default RepoLayout;
