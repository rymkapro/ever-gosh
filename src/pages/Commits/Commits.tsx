import React, { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import BranchSelect from "../../components/BranchSelect";
import { getGoshRepositoryBranches } from "../../helpers";
import { GoshCommit } from "../../types/classes";
import { TGoshBranch, IGoshCommit, IGoshRepository } from "../../types/types";
import { shortString } from "../../utils";
import { TRepositoryLayoutOutletContext } from "../RepositoryLayout";


const CommitsPage = () => {
    const { goshRepository } = useOutletContext<TRepositoryLayoutOutletContext>();
    const { repoName, branchName = 'master' } = useParams();
    const navigate = useNavigate();
    const [branches, setBranches] = useState<TGoshBranch[]>([]);
    const [branch, setBranch] = useState<TGoshBranch>();
    const [commits, setCommits] = useState<IGoshCommit[]>();

    const getCommits = async (repo: IGoshRepository, branch: TGoshBranch) => {
        const commits: IGoshCommit[] = [];
        let commitAddr = branch.commitAddr;
        while (commitAddr) {
            const commit = new GoshCommit(repo.account.client, commitAddr);
            await commit.load();
            commitAddr = commit.meta?.parentAddr || '';
            commits.push(commit);
        }
        setCommits(commits);
    }

    useEffect(() => {
        const initState = async (repo: IGoshRepository, currBranchName: string) => {
            const [branches, branch] = await getGoshRepositoryBranches(repo, currBranchName);
            if (branch) {
                await getCommits(repo, branch);
                setBranch(branch);
            }
            setBranches(branches);
        }

        initState(goshRepository, branchName);
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
                        className="flex py-3 border-b border-gray-300 last:border-b-0 justify-between items-center"
                    >
                        <Link
                            className="text-gray-600 font-medium hover:underline"
                            to={`/repositories/${repoName}/commit/${branchName}:${commit.meta?.sha}`}
                        >
                            {commit.meta?.content.message}
                        </Link>
                        <Link
                            className="text-gray-600 font-medium text-sm hover:underline "
                            to={`/repositories/${repoName}/commit/${branchName}:${commit.meta?.sha}`}
                        >
                            {shortString(commit.meta?.sha || '', 7, 0, '')}
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CommitsPage;
