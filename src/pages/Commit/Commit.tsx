import React, { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { GoshBlob, GoshCommit } from "../../types/classes";
import { IGoshBlob, IGoshCommit, IGoshRepository } from "../../types/types";
import { TRepositoryLayoutOutletContext } from "../RepositoryLayout";
import { useMonaco } from "@monaco-editor/react";
import { getCodeLanguageFromFilename, restoreFromDiff } from "../../helpers";
import BlobDiffPreview from "../../components/Blob/DiffPreview";


const CommitPage = () => {
    const { goshRepository } = useOutletContext<TRepositoryLayoutOutletContext>();
    const { commitName } = useParams();
    const monaco = useMonaco();
    const [commit, setCommit] = useState<IGoshCommit>();
    const [blobs, setBlobs] = useState<IGoshBlob[]>();

    const getCommit = async (repo: IGoshRepository, name: string) => {
        const address = await repo.getCommitAddr(name);
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
        if (commitName) getCommit(goshRepository, commitName);
    }, [goshRepository, commitName]);

    return (
        <div>
            {(!monaco || !commit) && (<p>Loading commit...</p>)}
            {monaco && commit && (
                <>
                    <div className="border rounded">
                        <div className="font-medium px-3 py-2">
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
                        const language = getCodeLanguageFromFilename(monaco, item.name);
                        const original = restoreFromDiff(blob?.meta?.content || '', item.diff);
                        return (
                            <div key={index} className="my-5 border rounded overflow-hidden">
                                <div className="bg-gray-100 border-b px-3 py-1.5 text-sm font-semibold">
                                    {item.name}
                                </div>
                                <BlobDiffPreview
                                    original={original}
                                    modified={blob?.meta?.content}
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
