import React, { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { IGoshBlob, IGoshCommit, IGoshRepository } from "../../types/types";
import { TRepoLayoutOutletContext } from "../RepoLayout";
import { useMonaco } from "@monaco-editor/react";
import { getCommitTime, getCodeLanguageFromFilename, getCommitTree, getBlobContent, zstd } from "../../helpers";
import BlobDiffPreview from "../../components/Blob/DiffPreview";
import { GoshBlob, GoshCommit } from "../../types/classes";
import CopyClipboard from "../../components/CopyClipboard";
import { shortString } from "../../utils";


const CommitPage = () => {
    const { goshRepo } = useOutletContext<TRepoLayoutOutletContext>();
    const { branchName, commitName } = useParams();
    const monaco = useMonaco();
    const [commit, setCommit] = useState<IGoshCommit>();
    const [blobs, setBlobs] = useState<{
        name: string;
        curr: IGoshBlob;
        currContent: string;
        prevContent?: string;
    }[]>([]);

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
        const getCommit = async (repo: IGoshRepository, branch: string, name: string) => {
            // Get commit data
            const address = await repo.getCommitAddr(name);
            const commit = new GoshCommit(repo.account.client, address);
            await commit.load();

            // Get commit blobs
            const blobAddrs = await commit.getBlobs();
            const blobTrees: IGoshBlob[] = [];
            const blobs: {
                name: string;
                curr: IGoshBlob;
                currContent: string;
                prevContent?: string;
            }[] = [];
            await Promise.all(
                blobAddrs.map(async (addr) => {
                    // Create blob and load it's data
                    const blob = new GoshBlob(repo.account.client, addr);
                    await blob.load();
                    if (!blob.meta) throw Error('Can not load blob meta');

                    // Extract tree blob from common blobs
                    if (blob.meta.name.indexOf('tree ') >= 0) {
                        blob.meta.content = await zstd.decompress(
                            goshRepo.account.client,
                            blob.meta.content
                        );
                        blobTrees.push(blob);
                    } else {
                        const currFullBlob = await getBlobContent(goshRepo, blob.meta.name);
                        // If blob has prevSha, load this prev blob
                        let prevFullBlob = undefined;
                        if (blob.meta?.prevSha) {
                            prevFullBlob = await getBlobContent(goshRepo, blob.meta.prevSha);
                        }
                        blobs.push({ name: '', curr: blob, currContent: currFullBlob, prevContent: prevFullBlob });
                    }
                })
            );
            console.debug('Trees blobs', blobTrees);
            console.debug('Common blobs', blobs);

            // Construct commit tree
            const filesList = blobTrees
                .map((blob) => blob.meta?.content || '')
                .reduce((a: string[], content) => [...a, ...content.split('\n')], []);
            console.debug('Files list', filesList);
            const commitTree = getCommitTree(filesList);
            console.debug('Commit tree', commitTree);

            // Update blobs names (path) from tree
            Object.values(commitTree).forEach((items) => {
                items.forEach((item) => {
                    const found = blobs.find((bItem) => (
                        bItem.curr.meta?.name === `${item.type} ${item.sha}`
                    ));
                    if (found) found.name = item.name;
                })
            });
            console.debug('Ready to render blobs', blobs);

            setCommit(commit);
            setBlobs(blobs);
        }

        if (goshRepo && branchName && commitName) getCommit(goshRepo, branchName, commitName);
    }, [goshRepo, branchName, commitName]);

    return (
        <div className="bordered-block px-7 py-8">
            {(!monaco || !commit) && (<p>Loading commit...</p>)}
            {monaco && commit && (
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

                        <div className="flex border-t gap-x-6 py-1 text-gray-050a15/75 text-xs">
                            <div className="flex items-center">
                                <span className="mr-2 text-gray-050a15/65">Commit by</span>
                                {renderCommitter(commit.meta?.content.committer || '')}
                            </div>
                            <div>
                                <span className="mr-2 text-gray-050a15/65">at</span>
                                {getCommitTime(commit.meta?.content.committer || '').toLocaleString()}
                            </div>
                            <div className="grow text-right">
                                <span className="mr-2 text-gray-050a15/65">commit</span>
                                {commit.meta?.sha}
                            </div>
                        </div>
                    </div>

                    {blobs?.map((item, index) => {
                        const language = getCodeLanguageFromFilename(monaco, item.name);
                        return (
                            <div key={index} className="my-5 border rounded overflow-hidden">
                                <div className="bg-gray-100 border-b px-3 py-1.5 text-sm font-semibold">
                                    {item.name}
                                </div>
                                <BlobDiffPreview
                                    original={item.prevContent}
                                    modified={item.currContent}
                                    modifiedLanguage={language}
                                />
                            </div>
                        );
                    })}
                </>
            )}
        </div>
    );
}

export default CommitPage;
