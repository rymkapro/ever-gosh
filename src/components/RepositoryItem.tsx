import React from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBalanceScale, faCircle } from "@fortawesome/free-solid-svg-icons";
import { faClock } from "@fortawesome/free-regular-svg-icons";

import { IRepository } from "../types";
import { Link } from "react-router-dom";


type RepositoryItemProps = {
    item: IRepository;
}

const RepositoryItem = (props: RepositoryItemProps) => {
    const { item } = props;

    return (
        <div className="repo-list__item">
            <div className="repo-list__header">
                <div className="repo-list__name">
                    <Link to={`/repo/${item.address}`}>{item.name}</Link>
                </div>
                <div className="repo-list__type badge">{item.getTypeString()}</div>
            </div>

            {item.description && (
                <div className="repo-list__description">{item.description}</div>
            )}

            <div className="repo-list__footer">
                {item.language && (
                    <div className="repo-list__meta">
                        <FontAwesomeIcon className="--fa-before --red" icon={faCircle} />
                        {item.language}
                    </div>
                )}

                {item.license && (
                    <div className="repo-list__meta">
                        <FontAwesomeIcon className="--fa-before" icon={faBalanceScale} />
                        {item.license}
                    </div>
                )}

                <div className="repo-list__meta">
                    <FontAwesomeIcon className="--fa-before" icon={faClock} />
                    Updated {item.updated} ago
                </div>
            </div>
        </div>
    );
}

export default RepositoryItem;
