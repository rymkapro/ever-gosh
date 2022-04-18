import React, { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import BranchSelect from "../../components/BranchSelect";
import CopyClipboard from "../../components/CopyClipboard";
import { GoshCommit } from "../../types/classes";
import { TGoshBranch, IGoshCommit, IGoshRepository } from "../../types/types";
import { shortString } from "../../utils";
import { TRepoLayoutOutletContext } from "../RepoLayout";


const CommitsPage = () => {
    const { goshRepo, branches } = useOutletContext<TRepoLayoutOutletContext>();
    const { daoName, repoName, branchName = 'master' } = useParams();
    const navigate = useNavigate();
    const [commits, setCommits] = useState<IGoshCommit[]>();

    useEffect(() => {
        const getCommits = async (repo: IGoshRepository, branch: TGoshBranch) => {
            const commits: IGoshCommit[] = [];
            let commitAddr = branch.commitAddr;
            while (commitAddr) {
                const commit = new GoshCommit(repo.account.client, commitAddr);
                await commit.load();
                commitAddr = commit.meta?.parent1Addr || '';
                commits.push(commit);
            }
            setCommits(commits);
        }

        if (goshRepo && branches.branchCurr) getCommits(goshRepo, branches.branchCurr);
    }, [goshRepo, branches.branchCurr]);

    return (
        <div className="bordered-block px-7 py-8">
            <BranchSelect
                branch={branches.branchCurr}
                branches={branches.branchList}
                onChange={(selected) => {
                    if (selected) {
                        navigate(`/orgs/${daoName}/repos/${repoName}/commits/${selected.name}`);
                    }
                }}
            />

            <div className="mt-5 divide-y divide-gray-c4c4c4">
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
                        className="flex py-3 justify-between items-center"
                    >
                        <div>
                            <Link
                                className="hover:underline"
                                to={`/orgs/${daoName}/repos/${repoName}/commit/${branchName}/${commit.meta?.sha}`}
                            >
                                {commit.meta?.content.title}
                            </Link>
                            {commit.meta?.content.message && (
                                <div className="text-sm text-gray-0a1124/65">{commit.meta.content.message}</div>
                            )}
                        </div>

                        <div className="flex border border-gray-0a1124/65 rounded items-center text-gray-0a1124/65">
                            <Link
                                className="px-2 py-1 font-medium font-mono text-xs hover:underline hover:text-gray-0a1124"
                                to={`/orgs/${daoName}/repos/${repoName}/commit/${branchName}/${commit.meta?.sha}`}
                            >
                                {shortString(commit.meta?.sha || '', 7, 0, '')}
                            </Link>
                            <CopyClipboard
                                componentProps={{
                                    text: commit.meta?.sha || ''
                                }}
                                iconContainerClassName="px-2 border-l border-gray-0a1124 hover:text-gray-0a1124"
                                iconProps={{
                                    size: 'sm'
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CommitsPage;
