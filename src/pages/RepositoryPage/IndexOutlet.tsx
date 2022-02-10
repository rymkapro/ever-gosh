import React from "react";

import { useOutletContext } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faBalanceScale } from "@fortawesome/free-solid-svg-icons";

import { IRepository } from "../../types";
import RepositoryNav from "../../components/RepositoryNav";
import RepositoryTree from "../../components/RepositoryTree";


const IndexOutlet = () => {
    const { repository } = useOutletContext<{ repository: IRepository, branches: string[] }>();

    return (
        <div className="pagerepo__index repoindex">
            <div className="repoindex__content">
                <RepositoryNav section="tree" />
                <RepositoryTree />
            </div>
            <div className="repoindex__aside">
                <div className="repoindex__about">
                    <h3 className="repoindex__subtitle">About</h3>
                    <div className="repoindex__description">{repository.description}</div>
                    <div className="repoindex__meta">
                        {repository.language && (
                            <div className="repoindex__meta-item">
                                <FontAwesomeIcon
                                    className="--fa-before --red"
                                    icon={faCircle}
                                    fixedWidth
                                />
                                {repository.language}
                            </div>
                        )}

                        {repository.license && (
                            <div className="repoindex__meta-item">
                                <FontAwesomeIcon
                                    className="--fa-before"
                                    icon={faBalanceScale}
                                    fixedWidth
                                />
                                {repository.license}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default IndexOutlet;
