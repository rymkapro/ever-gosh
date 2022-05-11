import React, { useCallback, useEffect, useState } from "react";
import { useMonaco } from "@monaco-editor/react";
import BlobDiffPreview from "../../components/Blob/DiffPreview";
import Spinner from "../../components/Spinner";
import { getBlobContent, getCodeLanguageFromFilename, getRepoTree } from "../../helpers";
import { GoshBlob } from "../../types/classes";
import { IGoshBlob, IGoshCommit, IGoshRepository } from "../../types/types";


type TCommitBlobsType = {
    repo: IGoshRepository;
    commit: IGoshCommit;
}

const CommitBlobs = (props: TCommitBlobsType) => {
    const { repo, commit } = props;
    const monaco = useMonaco();
    const [isFetched, setIsFetched] = useState<boolean>(false);
    const [isLoadingDiff, setIsLoadingDiff] = useState<boolean>(false);
    const [blobs, setBlobs] = useState<{
        path: string;
        curr: IGoshBlob;
        name?: string;
        currContent?: string;
        prevContent?: string;
    }[]>([]);

    const loadBlobContent = useCallback(async (blob: IGoshBlob): Promise<{ curr: string; prev: string; }> => {
        await blob.load();
        if (blob.meta) {
            const currContent = await getBlobContent(repo, blob.meta.name);
            let prevContent: string | undefined = undefined;
            if (blob.meta.prevSha) {
                prevContent = await getBlobContent(repo, blob.meta.prevSha);
            }
            return { curr: currContent, prev: prevContent ?? '' }
        }
        return { curr: '', prev: '' };
    }, [repo]);

    const loadBlobDiff = async (i: number) => {
        setIsLoadingDiff(true);
        const { curr, prev } = await loadBlobContent(blobs[i].curr);
        setBlobs((currArr) => currArr.map((item, index) => {
            if (i === index) return { ...item, currContent: curr, prevContent: prev };
            return item;
        }));
        setIsLoadingDiff(false);
    }

    useEffect(() => {
        const getCommitBlobs = async (repo: IGoshRepository, commitAddr: string) => {
            setIsFetched(false);

            // Build repo tree by provided commit
            const commitTree = await getRepoTree(repo, commit.address);

            // Get commit blobs
            const blobAddrs = await commit.getBlobs();
            console.debug('[Commit blobs] - Blob addrs:', blobAddrs);
            const blobs: {
                path: string;
                curr: IGoshBlob;
                name?: string;
                currContent?: string;
                prevContent?: string;
            }[] = [];
            for (let i = 0; i < blobAddrs.length; i += 10) {
                const chunk = blobAddrs.slice(i, i + 10);
                await Promise.all(
                    chunk.map(async (addr) => {
                        // Create blob and load it's data
                        const blob = new GoshBlob(repo.account.client, addr);
                        const name = await blob.getName();
                        if (name.search('blob') >= 0) blobs.push({ path: '', name, curr: blob });
                    })
                );
                console.debug('[Commit blobs] - Get blobs names chunk:', i, i + 10);
                await new Promise((resolve) => setInterval(resolve, 500));
            }

            // Load contents for first 10 blobs
            await Promise.all(
                blobs.slice(0, 10).map(async (item, index) => {
                    const { curr, prev } = await loadBlobContent(item.curr);
                    blobs[index] = { ...blobs[index], currContent: curr, prevContent: prev };
                })
            );

            // Update blobs names (path) from tree
            commitTree.items.forEach((item) => {
                const found = blobs.find((bItem) => (
                    bItem.name === `${item.type} ${item.sha}` && !bItem.path
                ));
                if (found) found.path = `${item.path ? `${item.path}/` : ''}${item.name}`;
            });
            console.debug('[Commit blobs] - Ready to render blobs:', blobs);

            setBlobs(blobs);
            setIsFetched(true);
        }

        getCommitBlobs(repo, commit.address);
    }, [repo, commit.address, loadBlobContent]);

    return (
        <>
            {(!monaco || !isFetched) && (
                <div className="text-gray-606060 text-sm">
                    <Spinner className="mr-3" />
                    Loading commit diff...
                </div>
            )}
            {monaco && isFetched && blobs.map((item, index) => {
                const language = getCodeLanguageFromFilename(monaco, item.path);
                return (
                    <div key={index} className="my-5 border rounded overflow-hidden">
                        <div className="bg-gray-100 border-b px-3 py-1.5 text-sm font-semibold">
                            {item.path}
                        </div>
                        {(item.currContent || item.prevContent)
                            ? (
                                <BlobDiffPreview
                                    original={item.prevContent}
                                    modified={item.currContent}
                                    modifiedLanguage={language}
                                />
                            )
                            : (
                                <button
                                    className="!block btn btn--body !text-sm mx-auto px-3 py-1.5 my-4"
                                    disabled={isLoadingDiff}
                                    onClick={() => loadBlobDiff(index)}
                                >
                                    {isLoadingDiff && <Spinner className="mr-2" size="sm" />}
                                    Load diff
                                </button>
                            )}

                    </div>
                );
            })}
        </>
    );
}

export default CommitBlobs;
