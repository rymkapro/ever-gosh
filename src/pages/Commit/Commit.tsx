import React, { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { IGoshCommit, IGoshRepository } from "../../types/types";
import { TRepoLayoutOutletContext } from "../RepoLayout";
import { getCommitTime } from "../../helpers";
import { GoshCommit } from "../../types/classes";
import CopyClipboard from "../../components/CopyClipboard";
import { shortString } from "../../utils";
import Spinner from "../../components/Spinner";
import CommitBlobs from "./CommitBlobs";


const CommitPage = () => {
    const { goshRepo } = useOutletContext<TRepoLayoutOutletContext>();
    const { commitName } = useParams();
    const [commit, setCommit] = useState<IGoshCommit>();

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
        const getCommit = async (repo: IGoshRepository, name: string) => {
            // Get commit data
            const address = await repo.getCommitAddr(name);
            const commit = new GoshCommit(repo.account.client, address);
            await commit.load();
            setCommit(commit);
        }

        if (commitName) getCommit(goshRepo, commitName);
    }, [goshRepo, commitName]);

    return (
        <div className="bordered-block px-7 py-8">
            {!commit && (
                <div className="text-gray-606060 text-sm">
                    <Spinner className="mr-3" />
                    Loading commit...
                </div>
            )}
            {commit && (
                <>
                    <div>
                        <div className="font-medium py-2">
                            {commit.meta?.content.title}
                        </div>

                        {commit.meta?.content.message && (
                            <pre className="mb-3 text-gray-050a15/65 text-sm">
                                {commit.meta.content.message}
                            </pre>
                        )}

                        <div className="flex flex-wrap border-t gap-x-6 py-1 text-gray-050a15/75 text-xs">
                            <div className="flex items-center">
                                <span className="mr-2 text-gray-050a15/65">Commit by</span>
                                {renderCommitter(commit.meta?.content.committer || '')}
                            </div>
                            <div>
                                <span className="mr-2 text-gray-050a15/65">at</span>
                                {getCommitTime(commit.meta?.content.committer || '').toLocaleString()}
                            </div>
                            <div className="grow flex items-center justify-start sm:justify-end">
                                <span className="mr-2 text-gray-050a15/65">commit</span>
                                <CopyClipboard
                                    label={shortString(commit.meta?.sha ?? '', 10, 10)}
                                    componentProps={{ text: commit.meta?.sha ?? '' }}
                                />
                            </div>
                        </div>
                    </div>

                    <CommitBlobs repo={goshRepo} commit={commit} />
                </>
            )}
        </div>
    );
}

export default CommitPage;
