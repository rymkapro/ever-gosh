import React, { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { GoshBlob, GoshCommit } from "../../types/classes";
import { IGoshBlob, IGoshCommit, IGoshRepository } from "../../types/types";
import { TRepositoryLayoutOutletContext } from "../RepositoryLayout";
import { DiffEditor } from "@monaco-editor/react";
import { restoreFromDiff } from "../../helpers";


const CommitPage = () => {
    const { goshRepository } = useOutletContext<TRepositoryLayoutOutletContext>();
    const { commitName } = useParams();
    const [commit, setCommit] = useState<IGoshCommit>();
    const [blobs, setBlobs] = useState<IGoshBlob[]>();

    const getCommit = async (repo: IGoshRepository, branchName: string, name: string) => {
        const address = await repo.getCommitAddr(branchName, name);
        const commit = new GoshCommit(repo.account.client, address);
        await commit.load();

        const blobAddrs = await commit.getBlobs();
        const blobs = await Promise.all(
            blobAddrs.map(async (addr) => {
                const blob = new GoshBlob(commit.account.client, addr);
                await blob.load();
                return blob;
            })
        );
        setCommit(commit);
        setBlobs(blobs);
    }

    useEffect(() => {
        const [branch, commit] = (commitName || '').split(':');
        if (branch && commit) getCommit(goshRepository, branch, commit);
    }, [goshRepository, commitName]);

    return (
        <div>
            {!commit && (<p>Loading commit...</p>)}
            {commit && (
                <>
                    <div className="border rounded">
                        <div className="font-medium px-3 mt-2">
                            {commit.meta?.content.title}
                        </div>

                        {commit.meta?.content.message && (
                            <div className="px-3 mb-2 text-gray-500 text-sm">{commit.meta.content.message}</div>
                        )}

                        <div className="flex border-t justify-end px-3 py-1">
                            <div className="text-gray-600 text-xs">
                                <span className="mr-2 text-gray-500">sha1</span>
                                {commit.meta?.sha}
                            </div>
                        </div>
                    </div>

                    {commit.meta?.content.blobs.map((item, index) => {
                        const blob = blobs?.find((blob) => blob.meta?.sha === item.sha);
                        return (
                            <div key={index} className="my-5 border rounded overflow-hidden">
                                <div className="bg-gray-100 border-b px-3 py-1.5 text-sm font-semibold">
                                    {item.name}
                                </div>
                                <DiffEditor
                                    language="markdown"
                                    original={restoreFromDiff(blob?.meta?.content || '', item.diff)}
                                    modified={blob?.meta?.content}
                                    options={{
                                        enableSplitViewResizing: false,
                                        renderSideBySide: false,
                                        readOnly: true,
                                        renderLineHighlight: 'none',
                                        contextmenu: false,
                                        automaticLayout: true,
                                        renderOverviewRuler: false,
                                        scrollBeyondLastLine: false,
                                        scrollbar: {
                                            vertical: 'hidden',
                                            verticalScrollbarSize: 0,
                                            handleMouseWheel: false
                                        },
                                    }}
                                    onMount={(editor) => {
                                        // Set diff editor dom element calculated real height
                                        const originalHeight = editor.getOriginalEditor().getContentHeight();
                                        const modifiedHeight = editor.getModifiedEditor().getContentHeight();
                                        editor._domElement.style.height = `${originalHeight + modifiedHeight}px`;
                                    }}
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
