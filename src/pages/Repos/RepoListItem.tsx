import React from "react";
import { faCode, faCodeFork, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import CopyClipboard from "../../components/CopyClipboard";
import { IGoshRepository } from "../../types/types";
import { shortString } from "../../utils";


type TRepositoryListItemProps = {
    daoName: string;
    repository: IGoshRepository
}

const RepositoryListItem = (props: TRepositoryListItemProps) => {
    const { daoName, repository } = props;

    return (
        <div className="py-3">
            <Link
                className="text-xl font-semibold hover:underline"
                to={`/${daoName}/${repository.meta?.name}`}
            >
                {repository.meta?.name}
            </Link>

            <div className="text-sm text-gray-606060">
                Gosh repository
            </div>

            <div className="flex gap-1 mt-2">
                {['gosh', 'vcs', 'ever'].map((value, index) => (
                    <button
                        key={index}
                        type="button"
                        className="rounded-2xl bg-extblue/25 text-xs text-extblue px-2 py-1 hover:bg-extblue hover:text-white"
                    >
                        {value}
                    </button>
                ))}
            </div>

            <div className="flex gap-4 mt-3 text-xs text-gray-606060 justify-between">
                <div className="flex gap-4">
                    <div>
                        <FontAwesomeIcon icon={faCode} className="mr-1" />
                        Language
                    </div>
                    <div>
                        <FontAwesomeIcon icon={faCodeFork} className="mr-1" />
                        {repository.meta?.branchCount}
                    </div>
                    {/* <div>
                        <FontAwesomeIcon icon={faStar} className="mr-1" />
                        22
                    </div> */}
                </div>
                <CopyClipboard
                    componentProps={{
                        text: repository.address
                    }}
                    className="hover:text-gray-050a15"
                    label={shortString(repository.address)}
                />
            </div>
        </div>
    );
}

export default RepositoryListItem;
