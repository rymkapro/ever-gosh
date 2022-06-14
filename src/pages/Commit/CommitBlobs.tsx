import { useCallback, useEffect, useState } from 'react';
import { useMonaco } from '@monaco-editor/react';
import BlobDiffPreview from '../../components/Blob/DiffPreview';
import Spinner from '../../components/Spinner';
import { getCodeLanguageFromFilename, getRepoTree, zstd } from '../../helpers';
import { GoshBlob, GoshCommit, GoshSnapshot } from '../../types/classes';
import { IGoshBlob, IGoshCommit, IGoshRepository } from '../../types/types';
import GoshSnapshotABI from '../../contracts/snapshot.abi.json';
import { abiSerialized } from '@eversdk/core';
import { Buffer } from 'buffer';
import * as Diff2html from 'diff2html';

type TCommitBlobsType = {
    repo: IGoshRepository;
    commitAddr: string;
    snapshotAddr: string[];
};

const DiffHtml = (props: any) => {
    return (
        <div
            dangerouslySetInnerHTML={{
                __html: Diff2html.html(props.patch.join('\n\n'), {
                    drawFileList: false,
                }),
            }}
        />
    );
};

const CommitBlobs = (props: TCommitBlobsType) => {
    const { repo, commitAddr, snapshotAddr } = props;
    const monaco = useMonaco();
    const [isFetched, setIsFetched] = useState<boolean>(false);
    const [isLoadingDiff, setIsLoadingDiff] = useState<boolean>(false);
    // const [blobs, setBlobs] = useState<
    //     {
    //         path: string;
    //         curr: IGoshBlob;
    //         name?: string;
    //         currContent?: string | Buffer;
    //         prevContent?: string | Buffer;
    //     }[]
    // >([]);
    const [blobs, setBlobs] = useState<
        {
            filepath: string;
            patch: string;
        }[]
    >([]);

    const loadBlobContent = useCallback(
        async (
            blob: IGoshBlob
        ): Promise<{ curr: string | Buffer; prev: string | Buffer }> => {
            const curr = await blob.loadContent();
            let prev: string | Buffer = '';
            if (blob.meta?.prevSha) {
                const prevBlobAddr = await repo.getBlobAddr(
                    `blob ${blob.meta.prevSha}`
                );
                const prevBlob = new GoshBlob(
                    repo.account.client,
                    prevBlobAddr
                );
                prev = await prevBlob.loadContent();
            }
            return { curr, prev };
        },
        [repo]
    );

    const loadBlobDiff = async (i: number) => {
        // setIsLoadingDiff(true);
        // const { curr, prev } = await loadBlobContent(blobs[i].curr);
        // setBlobs((currArr) =>
        //     currArr.map((item, index) => {
        //         if (i === index)
        //             return { ...item, currContent: curr, prevContent: prev };
        //         return item;
        //     })
        // );
        // setIsLoadingDiff(false);
    };

    useEffect(() => {
        const getCommitBlobs = async (
            repo: IGoshRepository,
            commitAddr: string,
            snapshotAddr: string[]
        ) => {
            setIsFetched(false);

            console.debug('Commit addr', commitAddr);
            console.debug('Snapshot addr', snapshotAddr);

            const messages = await repo.account.client.net.query_collection({
                collection: 'messages',
                filter: {
                    src: {
                        eq: commitAddr,
                    },
                    msg_type: { eq: 0 },
                    dst: {
                        in: snapshotAddr,
                    },
                },
                result: 'dst boc',
            });

            const blobs: any[] = [];
            for (const message of messages.result) {
                const decoded = await repo.account.client.abi.decode_message({
                    abi: abiSerialized(GoshSnapshotABI),
                    message: message.boc,
                });

                if (decoded.name === 'applyDiff') {
                    const compressedDiff = Buffer.from(
                        decoded.value.diff,
                        'hex'
                    ).toString('base64');
                    const decompressed = await zstd.decompress(
                        repo.account.client,
                        compressedDiff,
                        true
                    );
                    console.debug('Diff', decompressed);
                    blobs.push(decompressed);
                }
            }
            console.debug('Blobs', blobs);

            // // Build repo tree by provided commit
            // const commitTree = await getRepoTree(repo, commit.address);

            // // Get commit blobs
            // const blobAddrs = await commit.getBlobs();
            // console.debug('[Commit blobs] - Blob addrs:', blobAddrs);
            // const blobs: {
            //     path: string;
            //     curr: IGoshBlob;
            //     name?: string;
            //     currContent?: string | Buffer;
            //     prevContent?: string | Buffer;
            // }[] = [];
            // for (let i = 0; i < blobAddrs.length; i += 10) {
            //     const chunk = blobAddrs.slice(i, i + 10);
            //     await Promise.all(
            //         chunk.map(async (addr) => {
            //             // Create blob and load it's data
            //             const blob = new GoshBlob(repo.account.client, addr);
            //             const name = await blob.getName();
            //             if (name.search('blob') >= 0)
            //                 blobs.push({ path: '', name, curr: blob });
            //         })
            //     );
            //     console.debug(
            //         '[Commit blobs] - Get blobs names chunk:',
            //         i,
            //         i + 10
            //     );
            //     await new Promise((resolve) => setInterval(resolve, 500));
            // }

            // // Load contents for first 10 blobs
            // await Promise.all(
            //     blobs.slice(0, 10).map(async (item, index) => {
            //         const { curr, prev } = await loadBlobContent(item.curr);
            //         blobs[index] = {
            //             ...blobs[index],
            //             currContent: curr,
            //             prevContent: prev,
            //         };
            //     })
            // );

            // Update blobs names (path) from tree
            // commitTree.items.forEach((item) => {
            //     const found = blobs.find((bItem) => (
            //         bItem.name === `${item.type} ${item.sha}` && !bItem.path
            //     ));
            //     if (found) found.path = `${item.path ? `${item.path}/` : ''}${item.name}`;
            // });
            // console.debug('[Commit blobs] - Ready to render blobs:', blobs);

            setBlobs(blobs);
            setIsFetched(true);
        };

        getCommitBlobs(repo, commitAddr, snapshotAddr);
    }, [repo, commitAddr, snapshotAddr, loadBlobContent]);

    return (
        <>
            {(!monaco || !isFetched) && (
                <div className="text-gray-606060 text-sm">
                    <Spinner className="mr-3" />
                    Loading commit diff...
                </div>
            )}

            {isFetched && <DiffHtml patch={blobs} />}

            {monaco &&
                isFetched &&
                blobs.map((item, index) => {
                    // const language = getCodeLanguageFromFilename(
                    //     monaco,
                    //     item.filepath
                    // );
                    return (
                        <div
                            key={index}
                            className="my-5 border rounded overflow-hidden"
                        >
                            {/* <div className="bg-gray-100 border-b px-3 py-1.5 text-sm font-semibold">
                                {item.filepath}
                            </div>
                            {item.patch ? (
                                <BlobDiffPreview
                                    original={item.patch}
                                    modified={item.patch}
                                    modifiedLanguage={language}
                                />
                            ) : (
                                <button
                                    className="!block btn btn--body !text-sm mx-auto px-3 py-1.5 my-4"
                                    disabled={isLoadingDiff}
                                    onClick={() => loadBlobDiff(index)}
                                >
                                    {isLoadingDiff && (
                                        <Spinner className="mr-2" size="sm" />
                                    )}
                                    Load diff
                                </button>
                            )} */}
                        </div>
                    );
                })}
        </>
    );
};

export default CommitBlobs;
