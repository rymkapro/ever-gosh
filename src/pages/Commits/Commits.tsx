import React, { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import BranchSelect from "../../components/BranchSelect";
import { GoshCommit } from "../../types/classes";
import { IGoshBranch, IGoshCommit, IGoshRepository } from "../../types/types";
import { TRepositoryLayoutOutletContext } from "../RepositoryLayout";


const CommitsPage = () => {
    const { goshRepository } = useOutletContext<TRepositoryLayoutOutletContext>();
    const { repoName, branchName = 'master' } = useParams();
    const navigate = useNavigate();
    const [branches, setBranches] = useState<IGoshBranch[]>([]);
    const [branch, setBranch] = useState<IGoshBranch>();
    const [commits, setCommits] = useState<IGoshCommit[]>();

    const getCommits = async (repository: IGoshRepository, branchName: string) => {
        const branch = await repository.getBranch(branchName);

        const commits: IGoshCommit[] = [];
        let commitAddress = branch.commit;

        while (commitAddress) {
            const commit = new GoshCommit(repository.account.client, commitAddress);
            await commit.load();
            commitAddress = commit.meta?.parent || '';
            commits.push(commit);
        }
        setCommits(commits);
    }

    useEffect(() => {
        const initState = async () => {
            const branches = await goshRepository.getBranches();
            const branch = branches.find((branch) => branch.name === branchName);
            if (branch) {
                await branch.snapshot.load();
                await getCommits(goshRepository, branchName);
                setBranch(branch);
            }
            setBranches(branches);
        }

        initState();
    }, [goshRepository, branchName]);

    return (
        <div>
            <h2 className="text-gray-700 text-xl font-semibold mb-5">Commits</h2>

            <BranchSelect
                branch={branch}
                branches={branches}
                onChange={(selected) => {
                    if (selected) {
                        navigate(`repository/${repoName}/commits/${selected.name}`);
                    }
                }}
            />

            <div className="mt-5 border rounded px-5">
                {commits === undefined && (
                    <p className="text-sm text-gray-500 text-center py-3">
                        Loading commits...
                    </p>
                )}

                {commits && !commits?.length && (
                    <p className="text-sm text-gray-500 text-center py-3">
                        There are no commits yet
                    </p>
                )}

                {Boolean(commits?.length) && commits?.map((commit, index) => (
                    <div
                        key={index}
                        className="basis-1/4 text-gray-600 text-sm font-medium py-3 border-b border-gray-300 last:border-b-0"
                    >
                        <Link
                            className="underline"
                            to={`/repositories/${repoName}/commit/${commit.meta?.sha}`}
                        >
                            {commit.meta?.sha}
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CommitsPage;
