import React, { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { IGoshBlob, IGoshBranch } from "../../types/types";
import { TRepositoryLayoutOutletContext } from "../RepositoryLayout";
import BranchSelect from "../../components/BranchSelect";


const RepositoryPage = () => {
    const { goshRepository } = useOutletContext<TRepositoryLayoutOutletContext>();
    const { repoName, branchName = 'master' } = useParams();
    const navigate = useNavigate();
    const [branches, setBranches] = useState<IGoshBranch[]>([]);
    const [branch, setBranch] = useState<IGoshBranch>();
    const [tree, setTree] = useState<(IGoshBlob['meta'] & { lastCommitName: string })[]>();

    // const getCommits = async (repository: IGoshRepository, branchName: string) => {
    //     const branch = await repository.getBranch(branchName);

    //     const commits: IGoshCommit[] = [];
    //     let commitAddress = branch.commit;

    //     while (commitAddress) {
    //         const commit = new GoshCommit(repository.account.client, commitAddress);
    //         await commit.load();
    //         console.log('Commit blobs', await commit.getBlobs());
    //         commitAddress = commit.meta?.parent || '';
    //         commits.push(commit);
    //     }
    //     setCommits(commits);
    // }

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

    // useEffect(() => {
    //     if (branch) {
    //         setCommits(undefined);
    //         getCommits(goshRepository, branch.name);
    //     }
    // }, [goshRepository, branch]);

    if (!branch) return <p>Loading...</p>;
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

                <Link
                    to={`/repositories/${repoName}/blobs/${branchName}/create`}
                    className="px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600 disabled:opacity-75 rounded font-medium"
                >
                    Create blob
                </Link>
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
                        <div className="basis-1/3 text-gray-600 text-sm font-medium">
                            <Link
                                to={`/repositories/${repoName}/blob/${branchName}/${blob?.name}`}
                            >
                                {blob?.name}
                            </Link>
                        </div>
                        <div className="text-gray-500 text-sm">{blob.lastCommitName}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RepositoryPage;
