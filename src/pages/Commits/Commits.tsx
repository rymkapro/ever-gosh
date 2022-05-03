import React, { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import BranchSelect from "../../components/BranchSelect";
import CopyClipboard from "../../components/CopyClipboard";
import Spinner from "../../components/Spinner";
import { getCommitTime } from "../../helpers";
import { goshBranchesAtom, goshCurrBranchSelector } from "../../store/gosh.state";
import { GoshCommit } from "../../types/classes";
import { TGoshBranch, IGoshCommit, IGoshRepository } from "../../types/types";
import { shortString } from "../../utils";
import { TRepoLayoutOutletContext } from "../RepoLayout";


const CommitsPage = () => {
    const { goshRepo } = useOutletContext<TRepoLayoutOutletContext>();
    const { daoName, repoName, branchName = 'main' } = useParams();
    const branches = useRecoilValue(goshBranchesAtom);
    const branch = useRecoilValue(goshCurrBranchSelector(branchName));
    const navigate = useNavigate();
    const [commits, setCommits] = useState<IGoshCommit[]>();

    const renderCommitter = (committer: string) => {
        const [pubkey] = committer.split(' ');
        return (
            <CopyClipboard
                label={shortString(pubkey)}
                componentProps={{
                    text: pubkey
                }}
            />
        );
    }

    useEffect(() => {
        const getCommits = async (repo: IGoshRepository, branch: TGoshBranch) => {
            setCommits(undefined);
            const commits: IGoshCommit[] = [];
            let commitAddr = branch.commitAddr;
            while (commitAddr) {
                const commit = new GoshCommit(repo.account.client, commitAddr);
                await commit.load();
                commitAddr = commit.meta?.parents[0] || '';
                commits.push(commit);
            }
            setCommits(commits);
        }

        if (goshRepo && branch) getCommits(goshRepo, branch);
    }, [goshRepo, branch]);

    return (
        <div className="bordered-block px-7 py-8">
            <BranchSelect
                branch={branch}
                branches={branches}
                onChange={(selected) => {
                    if (selected) {
                        navigate(`/${daoName}/${repoName}/commits/${selected.name}`);
                    }
                }}
            />

            <div className="mt-5 divide-y divide-gray-c4c4c4">
                {commits === undefined && (
                    <div className="text-sm text-gray-606060">
                        <Spinner className="mr-3" />
                        Loading commits...
                    </div>
                )}

                {commits && !commits?.length && (
                    <div className="text-sm text-gray-606060 text-center">
                        There are no commits yet
                    </div>
                )}

                {Boolean(commits?.length) && commits?.map((commit, index) => (
                    <div
                        key={index}
                        className="flex py-3 justify-between items-center"
                    >
                        <div>
                            <Link
                                className="hover:underline"
                                to={`/${daoName}/${repoName}/commits/${branchName}/${commit.meta?.sha}`}
                            >
                                {commit.meta?.content.title}
                            </Link>
                            <div className="mt-2 flex gap-x-4 text-gray-050a15/75 text-xs">
                                <div className="flex items-center">
                                    <span className="mr-2 text-gray-050a15/65">Commit by</span>
                                    {renderCommitter(commit.meta?.content.committer || '')}
                                </div>
                                <div>
                                    <span className="mr-2 text-gray-050a15/65">at</span>
                                    {getCommitTime(commit.meta?.content.committer || '').toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="flex border border-gray-0a1124/65 rounded items-center text-gray-0a1124/65">
                            <Link
                                className="px-2 py-1 font-medium font-mono text-xs hover:underline hover:text-gray-0a1124"
                                to={`/${daoName}/${repoName}/commits/${branchName}/${commit.meta?.sha}`}
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
