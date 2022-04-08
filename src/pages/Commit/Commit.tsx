import { DiffEditor } from "@monaco-editor/react";
import React, { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { GoshCommit } from "../../types/classes";
import { IGoshCommit, IGoshRepository } from "../../types/types";
import { TRepositoryLayoutOutletContext } from "../RepositoryLayout";


const CommitPage = () => {
    const { goshRepository } = useOutletContext<TRepositoryLayoutOutletContext>();
    const { commitName } = useParams();
    const [commit, setCommit] = useState<IGoshCommit>();

    const getCommit = async (repo: IGoshRepository, branchName: string, name: string) => {
        const address = await repo.getCommitAddress(branchName, name);
        const commit = new GoshCommit(repo.account.client, address);
        await commit.load();
        setCommit(commit);
    }

    useEffect(() => {
        const [branch, commit] = (commitName || '').split(':');
        if (branch && commit) getCommit(goshRepository, branch, commit);
    }, [goshRepository, commitName]);

    return (
        <div>
            <h2 className="text-gray-700 text-xl font-semibold mb-5">Specific commit</h2>

            {!commit && (<p>Loading commit...</p>)}
            {commit && (
                <div>
                    <span className="text-xs mr-2 text-gray-500">SHA1</span>
                    {commit.meta?.sha}

                    {commit.meta?.content.map((blob, index) => (
                        <div key={index} className="my-5 border rounded overflow-hidden">
                            <div className="bg-gray-100 border-b px-3 py-1 text-sm font-semibold">{blob.name}</div>
                            <DiffEditor
                                language="markdown"
                                original={blob.original}
                                modified={blob.modified}
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
                    ))}
                </div>
            )}
        </div>
    );
}

export default CommitPage;
