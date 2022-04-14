import React, { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { IGoshRepository, TGoshBranch, TGoshSnapshotMetaContentItem } from "../../types/types";
import { TRepositoryLayoutOutletContext } from "../RepositoryLayout";
import BranchSelect from "../../components/BranchSelect";
import { getGoshRepositoryBranches } from "../../helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClockRotateLeft, faCodeBranch } from "@fortawesome/free-solid-svg-icons";


const RepositoryPage = () => {
    const { goshRepository } = useOutletContext<TRepositoryLayoutOutletContext>();
    const { repoName, branchName = 'master' } = useParams();
    const navigate = useNavigate();
    const [branches, setBranches] = useState<TGoshBranch[]>([]);
    const [branch, setBranch] = useState<TGoshBranch>();
    const [tree, setTree] = useState<TGoshSnapshotMetaContentItem[]>();

    useEffect(() => {
        const initState = async (repo: IGoshRepository, currBranchName: string) => {
            const { branches, branch } = await getGoshRepositoryBranches(repo, currBranchName);
            if (branch) {
                await branch.snapshot.load();
                setBranch(branch);
                setTree(branch.snapshot.meta?.content);
            }
            setBranches(branches);
        }

        initState(goshRepository, branchName);
    }, [goshRepository, branchName]);

    return (
        <>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <BranchSelect
                        branch={branch}
                        branches={branches}
                        onChange={(selected) => {
                            if (selected) {
                                navigate(`/repositories/${repoName}/tree/${selected.name}`);
                            }
                        }}
                    />

                    <Link
                        to={`/repositories/${repoName}/branches`}
                        className="ml-4 text-sm text-gray-500 hover:text-extblue"
                    >
                        <span className="mr-1 font-semibold">
                            <FontAwesomeIcon icon={faCodeBranch} className="mr-1" />
                            {branches.length}
                        </span>
                        branches
                    </Link>

                    <Link
                        to={`/repositories/${repoName}/commits/${branchName}`}
                        className="ml-4 text-sm text-gray-500 hover:text-extblue"
                    >
                        <FontAwesomeIcon icon={faClockRotateLeft} className="mr-1" />
                        History
                    </Link>
                </div>

                <div className="flex gap-3">
                    <Link
                        to={`/repositories/${repoName}/blobs/create/${branchName}`}
                        className="px-4 py-1.5 text-sm font-medium rounded border hover:bg-gray-50"
                    >
                        Add file
                    </Link>
                </div>
            </div>

            <div className="mt-5 border rounded px-5">
                {tree === undefined && (
                    <p className="text-sm text-gray-500 text-center py-3">
                        Loading tree...
                    </p>
                )}

                {tree && !tree?.length && (
                    <p className="text-sm text-gray-500 text-center py-3">
                        There are no files yet
                    </p>
                )}

                {Boolean(tree?.length) && tree?.map((blob, index) => (
                    <div
                        key={index}
                        className="flex gap-x-4 py-3 border-b border-gray-300 last:border-b-0"
                    >
                        <div className="basis-1/4 text-sm font-medium">
                            <Link
                                className="hover:underline"
                                to={`/repositories/${repoName}/blob/${branchName}/${blob?.name}`}
                            >
                                {blob?.name}
                            </Link>
                        </div>
                        <div className="text-gray-500 text-sm">
                            <Link
                                className="hover:underline"
                                to={`/repositories/${repoName}/commit/${blob.lastCommitSha}`}
                            >
                                {blob.lastCommitMsg.title}
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

export default RepositoryPage;
