import React, { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { IGoshRepository, TGoshBranch, TGoshSnapshotMetaContentItem } from "../../types/types";
import { TRepositoryLayoutOutletContext } from "../RepositoryLayout";
import BranchSelect from "../../components/BranchSelect";
import { getGoshRepositoryBranches } from "../../helpers";


const RepositoryPage = () => {
    const { goshRepository } = useOutletContext<TRepositoryLayoutOutletContext>();
    const { repoName, branchName = 'master' } = useParams();
    const navigate = useNavigate();
    const [branches, setBranches] = useState<TGoshBranch[]>([]);
    const [branch, setBranch] = useState<TGoshBranch>();
    const [tree, setTree] = useState<TGoshSnapshotMetaContentItem[]>();

    useEffect(() => {
        const initState = async (repo: IGoshRepository, currBranchName: string) => {
            const [branches, branch] = await getGoshRepositoryBranches(repo, currBranchName);
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
        <div>
            <div className="flex items-center justify-between gap-3">
                <BranchSelect
                    branch={branch}
                    branches={branches}
                    onChange={(selected) => {
                        if (selected) {
                            navigate(`repository/${repoName}/tree/${selected.name}`);
                        }
                    }} />

                <div className="flex gap-3">
                    <Link
                        to={`/repositories/${repoName}/commits/${branchName}`}
                        className="px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600 disabled:opacity-75 rounded font-medium"
                    >
                        Commits
                    </Link>
                    <Link
                        to={`/repositories/${repoName}/blobs/${branchName}/create`}
                        className="px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600 disabled:opacity-75 rounded font-medium"
                    >
                        Create blob
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
                        <div className="basis-1/4 text-gray-600 text-sm font-medium">
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
                                to={`/repositories/${repoName}/commit/${branchName}:${blob.lastCommitSha}`}
                            >
                                {blob.lastCommitMsg}
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RepositoryPage;
