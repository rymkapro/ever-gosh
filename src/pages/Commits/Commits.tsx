import React, { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import BranchSelect from "../../components/BranchSelect";
import CopyClipboard from "../../components/CopyClipboard";
import { getGoshRepoBranches } from "../../helpers";
// import { GoshCommit } from "../../types/classes";
import { TGoshBranch, IGoshCommit, IGoshRepository } from "../../types/types";
import { shortString } from "../../utils";
import { TRepoLayoutOutletContext } from "../RepoLayout";


const CommitsPage = () => {
    const { goshRepo } = useOutletContext<TRepoLayoutOutletContext>();
    const { repoName, branchName = 'master' } = useParams();
    const navigate = useNavigate();
    const [branches, setBranches] = useState<TGoshBranch[]>([]);
    const [branch, setBranch] = useState<TGoshBranch>();
    const [commits, setCommits] = useState<IGoshCommit[]>();

    const getCommits = async (repo: IGoshRepository, branch: TGoshBranch) => {
        // const commits: IGoshCommit[] = [];
        // let commitAddr = branch.commitAddr;
        // while (commitAddr) {
        //     const commit = new GoshCommit(repo.account.client, commitAddr);
        //     await commit.load();
        //     commitAddr = commit.meta?.parentAddr || '';
        //     commits.push(commit);
        // }
        // setCommits(commits);
    }

    useEffect(() => {
        const initState = async (repo: IGoshRepository, currBranchName: string) => {
            // const { branches, branch } = await getGoshRepositoryBranches(repo, currBranchName);
            // if (branch) {
            //     await getCommits(repo, branch);
            //     setBranch(branch);
            // }
            // setBranches(branches);
        }

        initState(goshRepo, branchName);
    }, [goshRepo, branchName]);

    return (
        <>
            <BranchSelect
                branch={branch}
                branches={branches}
                onChange={(selected) => {
                    if (selected) {
                        navigate(`/repositories/${repoName}/commits/${selected.name}`);
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
                        <div>
                            <Link
                                className="hover:underline"
                                to={`/repositories/${repoName}/commit/${commit.meta?.sha}`}
                            >
                                {commit.meta?.content.title}
                            </Link>
                            {commit.meta?.content.message && (
                                <div className="text-sm text-gray-500">{commit.meta.content.message}</div>
                            )}
                        </div>

                        <div className="flex border rounded items-center">
                            <Link
                                className="px-2 py-1 font-medium font-mono text-xs hover:underline hover:text-extblue"
                                to={`/repositories/${repoName}/commit/${commit.meta?.sha}`}
                            >
                                {shortString(commit.meta?.sha || '', 7, 0, '')}
                            </Link>
                            <CopyClipboard
                                componentProps={{
                                    text: commit.meta?.sha || ''
                                }}
                                iconContainerClassName="px-2 border-l hover:text-extblue"
                                iconProps={{
                                    size: 'sm'
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

export default CommitsPage;
