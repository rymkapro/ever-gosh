import React from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { TRepoLayoutOutletContext } from "../RepoLayout";
import BranchSelect from "../../components/BranchSelect";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClockRotateLeft, faCodeBranch, faFolder } from "@fortawesome/free-solid-svg-icons";
import { useRecoilValue } from "recoil";
import { goshCurrBranchSelector } from "../../store/gosh.state";
import { useGoshRepoBranches } from "../../hooks/gosh.hooks";
import Spinner from "../../components/Spinner";
import { isMainBranch, splitByPath } from "../../helpers";
import { faFile } from "@fortawesome/free-regular-svg-icons";


const RepoPage = () => {
    const { goshRepo, goshRepoTree } = useOutletContext<TRepoLayoutOutletContext>();
    const { daoName, repoName, branchName = 'main' } = useParams();
    const pathName = useParams()['*'] || '';
    const navigate = useNavigate();
    const { branches } = useGoshRepoBranches(goshRepo);
    const branch = useRecoilValue(goshCurrBranchSelector(branchName));
    const subtree = useRecoilValue(goshRepoTree.getSubtree(pathName));

    const [dirUp] = splitByPath(pathName);

    return (
        <div className="bordered-block px-7 py-8">
            <div className="flex items-center justify-between gap-3">
                <div>
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
                        className="ml-4 text-sm text-gray-050a15/65 hover:text-gray-050a15"
                    >
                        <span className="mr-1 font-semibold">
                            <FontAwesomeIcon icon={faCodeBranch} className="mr-1" />
                            {branches.length}
                        </span>
                        branches
                    </Link>

                    <Link
                        to={`/${daoName}/${repoName}/commits/${branchName}`}
                        className="ml-4 text-sm text-gray-050a15/65 hover:text-gray-050a15"
                    >
                        <FontAwesomeIcon icon={faClockRotateLeft} className="mr-1" />
                        History
                    </Link>
                </div>

                <div className="flex gap-3">
                    <Link
                        to={`/${daoName}/${repoName}/find/${branchName}`}
                        className="btn btn--body px-4 py-1.5 text-sm !font-normal"
                    >
                        Go to file
                    </Link>
                    {!isMainBranch(branchName) && (
                        <Link
                            to={`/${daoName}/${repoName}/blobs/create/${branchName}${pathName && `/${pathName}`}`}
                            className="btn btn--body px-4 py-1.5 text-sm !font-normal"
                        >
                            Add file
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
                {!!subtree && subtree?.map((item: any, index: number) => {
                    const path = [item.path, item.name].filter((part) => part !== '').join('/');
                    const type = item.type === 'tree' ? 'tree' : 'blobs';

                    return (
                        <div
                            key={index}
                            className="flex gap-x-4 py-3 border-b border-gray-300 last:border-b-0"
                        >
                            <div className="basis-1/4 text-sm font-medium">
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
                            <div className="text-gray-500 text-sm">
                                {/* <Link
                                className="hover:underline"
                                to={``}
                            >
                                Last file commit name
                            </Link> */}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}

export default RepoPage;
