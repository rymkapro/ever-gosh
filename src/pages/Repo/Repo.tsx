import React, { useEffect } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { TRepoLayoutOutletContext } from "../RepoLayout";
import BranchSelect from "../../components/BranchSelect";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faClockRotateLeft,
    faCodeBranch,
    faFolder,
    faMagnifyingGlass,
    faFileCirclePlus
} from "@fortawesome/free-solid-svg-icons";
import { useRecoilValue } from "recoil";
import { goshCurrBranchSelector } from "../../store/gosh.state";
import { useGoshRepoBranches } from "../../hooks/gosh.hooks";
import Spinner from "../../components/Spinner";
import { isMainBranch, splitByPath } from "../../helpers";
import { faFile } from "@fortawesome/free-regular-svg-icons";


const RepoPage = () => {
    const { daoName, repoName, branchName = 'main' } = useParams();
    const pathName = useParams()['*'] || '';
    const navigate = useNavigate();
    const { goshWallet, goshRepo, goshRepoTree } = useOutletContext<TRepoLayoutOutletContext>();
    const { branches, updateBranch } = useGoshRepoBranches(goshRepo);
    const branch = useRecoilValue(goshCurrBranchSelector(branchName));
    const subtree = useRecoilValue(goshRepoTree.getSubtree(pathName));

    const [dirUp] = splitByPath(pathName);

    useEffect(() => {
        updateBranch(branchName);
    }, [branchName, updateBranch]);

    return (
        <div className="bordered-block px-7 py-8">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-4">
                <div className="grow flex items-center gap-y-2 gap-x-5">
                    <BranchSelect
                        branch={branch}
                        branches={branches}
                        onChange={(selected) => {
                            if (selected) {
                                navigate(`/${daoName}/${repoName}/tree/${selected.name}`);
                            }
                        }}
                    />

                    <Link
                        to={`/${daoName}/${repoName}/branches`}
                        className="block text-sm text-gray-050a15/65 hover:text-gray-050a15"
                    >
                        <span className="font-semibold">
                            <FontAwesomeIcon icon={faCodeBranch} className="mr-1" />
                            {branches.length}
                        </span>
                        <span className="hidden sm:inline-block ml-1">branches</span>
                    </Link>

                    <Link
                        to={`/${daoName}/${repoName}/commits/${branchName}`}
                        className="block text-sm text-gray-050a15/65 hover:text-gray-050a15"
                    >
                        <FontAwesomeIcon icon={faClockRotateLeft} />
                        <span className="hidden sm:inline-block ml-1">History</span>
                    </Link>
                </div>

                <div className="flex gap-3">
                    <Link
                        to={`/${daoName}/${repoName}/find/${branchName}`}
                        className="btn btn--body px-4 py-1.5 text-sm !font-normal"
                    >
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                        <span className="hidden sm:inline-block ml-2">Go to file</span>
                    </Link>
                    {!isMainBranch(branchName) && goshWallet?.isDaoParticipant && (
                        <Link
                            to={`/${daoName}/${repoName}/blobs/create/${branchName}${pathName && `/${pathName}`}`}
                            className="btn btn--body px-4 py-1.5 text-sm !font-normal"
                        >
                            <FontAwesomeIcon icon={faFileCirclePlus} />
                            <span className="hidden sm:inline-block ml-2">Add file</span>
                        </Link>
                    )}
                </div>
            </div>

            <div className="mt-5">
                {subtree === undefined && (
                    <div className="text-gray-606060 text-sm">
                        <Spinner className="mr-3" />
                        Loading tree...
                    </div>
                )}

                {subtree && !subtree?.length && (
                    <div className="text-sm text-gray-606060 text-center">
                        There are no files yet
                    </div>
                )}

                {!!subtree && pathName && (
                    <Link
                        className="block py-3 border-b border-gray-300 font-medium"
                        to={`/${daoName}/${repoName}/tree/${branchName}${dirUp && `/${dirUp}`}`}
                    >
                        ..
                    </Link>
                )}
                <div className="divide-y divide-gray-c4c4c4">
                    {!!subtree && subtree?.map((item: any, index: number) => {
                        const path = [item.path, item.name].filter((part) => part !== '').join('/');
                        const type = item.type === 'tree' ? 'tree' : 'blobs';

                        return (
                            <div key={index} className="py-3">
                                <Link
                                    className="hover:underline"
                                    to={`/${daoName}/${repoName}/${type}/${branchName}/${path}`}
                                >
                                    <FontAwesomeIcon
                                        className="mr-2"
                                        icon={item.type === 'tree' ? faFolder : faFile}
                                        fixedWidth
                                    />
                                    {item.name}
                                </Link>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}

export default RepoPage;
