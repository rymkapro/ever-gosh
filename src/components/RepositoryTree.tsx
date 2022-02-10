import React, { useEffect, useState } from "react";
import { faFile } from "@fortawesome/free-regular-svg-icons";
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useOutletContext, useParams, generatePath } from "react-router-dom";
import { IRepository, TRepositoryTreeItem } from "../types";


const RepositoryTree = () => {
    const { branch = 'master', '*': path } = useParams();
    const { repository } = useOutletContext<{ repository: IRepository, branches: string[] }>();
    const [tree, setTree] = useState<TRepositoryTreeItem[]>();

    const getBackUrl = (): string => {
        const back = path?.split('/').slice(0, -1).join('/');
        return generatePath('/repo/:address/tree/:branch/*', {
            address: repository.address,
            branch,
            '*': back || undefined
        });
    }

    const getItemUrl = (item: TRepositoryTreeItem): string => {
        return generatePath('/repo/:address/:section/:branch/:path:name', {
            address: repository.address,
            section: item.isBlob ? 'blob' : 'tree',
            branch,
            path: path ? `${path}/` : '',
            name: item.name
        });
    }

    useEffect(() => {
        repository.getTree(branch, path).then((response) => setTree(response));
    }, [branch, path, repository]);

    return (
        <div className="repo-tree">
            {path && (
                <div className="repo-tree__item repo-tree__item--single">
                    <Link to={getBackUrl()}>..</Link>
                </div>
            )}

            {tree?.map((item, index) => (
                <div className="repo-tree__item" key={index}>
                    <div className="repo-tree__name">
                        <FontAwesomeIcon
                            icon={!item.isBlob ? faFolder : faFile}
                            fixedWidth
                            className="--fa-before"
                        />
                        <Link to={getItemUrl(item)}>{item.name}</Link>
                    </div>
                    <div className="repo-tree__commit">{item.commit}</div>
                </div>
            ))}
        </div>
    );
}

export default RepositoryTree;
