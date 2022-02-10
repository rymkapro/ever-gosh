import React, { useEffect, useState } from "react";
import { useParams, useOutletContext, Link, generatePath } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import ReactMarkdown from "react-markdown";
import "github-markdown-css";

import { IRepository, TRepositoryTreeItem } from "../../types";
import RepositoryNav from "../../components/RepositoryNav";



const BlobOutlet = () => {
    const { branch = 'master', '*': path } = useParams();
    const { repository } = useOutletContext<{ repository: IRepository }>();
    const [isFetching, setIsFetching] = useState<boolean>(true);
    const [blob, setBlob] = useState<TRepositoryTreeItem>();

    useEffect(() => {
        const getBlob = async (branch: string, path: string) => {
            setIsFetching(true);
            const item = await repository.getBlob(branch, path);
            setBlob(item);
            setIsFetching(false);
        }

        if (path) getBlob(branch, path);
    }, [path, branch, repository])

    return (
        <div className="pagerepo__blob repoblob">
            <RepositoryNav section="blob" />

            {!blob && !isFetching && (<div className="alert alert--danger">File not found</div>)}
            {blob && (
                <div className="repoblob__viewer">
                    <div className="repoblob__header">
                        <div className="repoblob__name">{blob?.name}</div>
                        <div className="repoblob__actions">
                            <Link
                                to={generatePath('/repo/:address/edit/:branch/*', {
                                    address: repository.address,
                                    branch,
                                    '*': path
                                })}
                                className="repoblob__action"
                            >
                                <FontAwesomeIcon icon={faPencilAlt} />
                            </Link>
                        </div>
                    </div>

                    {blob?.language === 'markdown'
                        ? (
                            <ReactMarkdown
                                children={blob.content ?? ''}
                                className="repoblob__code markdown-body"
                            />
                        )
                        : (
                            <Editor
                                className="repoblob__code"
                                height="646px"
                                language={blob?.language}
                                value={blob?.content}
                                options={{
                                    padding: {
                                        top: 10
                                    },
                                    wordWrap: 'on',
                                    readOnly: true,
                                    domReadOnly: true
                                }}
                            />
                        )
                    }
                </div>
            )}
        </div>
    );
}

export default BlobOutlet;
