import React, { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { IGoshBranch, TGoshSnapshotMetaContentItem } from "../../types/types";
import { TRepositoryLayoutOutletContext } from "../RepositoryLayout";
import BranchSelect from "../../components/BranchSelect";


const RepositoryPage = () => {
    const { goshRepository } = useOutletContext<TRepositoryLayoutOutletContext>();
    const { repoName, branchName = 'master' } = useParams();
    const navigate = useNavigate();
    const [branches, setBranches] = useState<IGoshBranch[]>([]);
    const [branch, setBranch] = useState<IGoshBranch>();
    const [tree, setTree] = useState<TGoshSnapshotMetaContentItem[]>();

    useEffect(() => {
        const initState = async () => {
            const branches = await goshRepository.getBranches();
            const branch = branches.find((branch) => branch.name === branchName);
            if (branch) {
                await branch.snapshot.load();
                setBranch(branch);
                setTree(branch.snapshot.meta?.content);
            }
            setBranches(branches);
        }

        initState();
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
                                className="underline"
                                to={`/repositories/${repoName}/blobs/${branchName}/${blob?.sha}`}
                            >
                                {blob?.name}
                            </Link>
                        </div>
                        {/* <div className="text-gray-500 text-sm">
                            <span className="text-xs mr-1">SHA1:</span>
                            {blob.sha}
                        </div> */}
                        <div className="text-gray-500 text-sm">
                            <span className="text-xs mr-1">Last commit:</span>
                            {blob.lastCommitName}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RepositoryPage;
