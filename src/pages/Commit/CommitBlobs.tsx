import { useEffect, useState } from 'react';
import Spinner from '../../components/Spinner';
import { getRepoTree, loadFromIPFS, zstd } from '../../helpers';
import { EGoshBlobFlag, IGoshRepository } from '../../types/types';
import GoshSnapshotABI from '../../contracts/snapshot.abi.json';
import { abiSerialized } from '@eversdk/core';
import { Buffer } from 'buffer';
import * as Diff2html from 'diff2html';
import BlobDiffPreview from '../../components/Blob/DiffPreview';
import { GoshCommit, GoshDiff, GoshSnapshot } from '../../types/classes';

type TCommitBlobsType = {
    className?: string;
    repo: IGoshRepository;
    branch: string;
    commit: string;
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
    const { className, repo, branch, commit } = props;
    const [isFetched, setIsFetched] = useState<boolean>(false);
    const [blobs, setBlobs] = useState<
        {
            filename: string;
            content: string;
            patch: string;
        }[]
    >([]);

    useEffect(() => {
        const getCommitBlobs = async (
            repo: IGoshRepository,
            branch: string,
            commitName: string
        ) => {
            setIsFetched(false);

            const snapCode = await repo.getSnapshotCode(branch);
            const commitAddr = await repo.getCommitAddr(commitName);
            const commit = new GoshCommit(repo.account.client, commitAddr);

            const sources: string[] = [commitAddr];
            let nextAddr: string = await commit.getNextAddr();
            while (nextAddr) {
                sources.push(nextAddr);
                const diff = new GoshDiff(repo.account.client, nextAddr);
                nextAddr = await diff.getNextAddr();
            }

            const tree = await getRepoTree(repo, commitAddr);
            console.debug('Tree', tree);

            const messages = await repo.account.client.net.query_collection({
                collection: 'messages',
                filter: {
                    src: {
                        in: sources,
                    },
                    msg_type: { eq: 0 },
                    dst_account: {
                        code: { eq: snapCode },
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
                    let patch;
                    let content;

                    const snapshot = new GoshSnapshot(
                        repo.account.client,
                        decoded.value.diff.snap
                    );
                    let filename = await snapshot.getName();
                    filename = filename.replace(`${branch}/`, '');

                    const treeItem = tree.items.find((item) => {
                        const path = item.path ? `${item.path}/` : '';
                        return `${path}${item.name}` === filename;
                    });
                    if (!treeItem) {
                        console.error('Tree item not found', filename);
                        continue;
                    }
                    console.debug('Tree item', treeItem);

                    if (decoded.value.diff.ipfs) {
                        content = await loadFromIPFS(decoded.value.diff.ipfs);
                        if (
                            (treeItem.flags & EGoshBlobFlag.COMPRESSED) ===
                            EGoshBlobFlag.COMPRESSED
                        ) {
                            content = await zstd.decompress(
                                repo.account.client,
                                content.toString(),
                                false
                            );
                            content = Buffer.from(content, 'base64');
                        }
                        if (
                            (treeItem.flags & EGoshBlobFlag.BINARY) !==
                            EGoshBlobFlag.BINARY
                        ) {
                            content = content.toString();
                        }
                    } else {
                        const compressed = Buffer.from(
                            decoded.value.diff.patch,
                            'hex'
                        ).toString('base64');
                        patch = await zstd.decompress(
                            repo.account.client,
                            compressed,
                            true
                        );
                    }

                    blobs.push({ filename, content, patch });
                }
            }

            setBlobs(blobs);
            setIsFetched(true);
        };

        getCommitBlobs(repo, branch, commit);
    }, [repo, branch, commit]);

    return (
        <div className={className}>
            {!isFetched && (
                <div className="text-gray-606060 text-sm">
                    <Spinner className="mr-3" />
                    Loading commit diff...
                </div>
            )}

            {isFetched && (
                <>
                    <DiffHtml
                        patch={blobs
                            .filter((blob) => !!blob.patch)
                            .map((blob) => blob.patch)}
                    />

                    {blobs
                        .filter((blob) => !!blob.content)
                        .map((blob, index) => (
                            <div
                                key={index}
                                className="my-5 border rounded overflow-hidden"
                            >
                                <div className="bg-gray-100 border-b px-3 py-1.5 text-sm font-semibold">
                                    {blob.filename}
                                </div>
                                <BlobDiffPreview modified={blob.content} />
                            </div>
                        ))}
                </>
            )}
        </div>
    );
};

export default CommitBlobs;
