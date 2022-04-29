import React, { useEffect, useState } from "react";
import { faFile } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { getSnapshotTree } from "../../helpers";
import { goshCurrBranchSelector, goshRepoTreeAtom, goshRepoTreeSelector } from "../../store/gosh.state";
import { IGoshRepository, TGoshBranch } from "../../types/types";
import { TRepoLayoutOutletContext } from "../RepoLayout";


const GotoPage = () => {
    const { daoName, repoName, branchName = 'main' } = useParams();
    const { goshRepo } = useOutletContext<TRepoLayoutOutletContext>();
    const branch = useRecoilValue(goshCurrBranchSelector(branchName));
    const setTree = useSetRecoilState(goshRepoTreeAtom);
    const [search, setSearch] = useState<string>('');
    const blobs = useRecoilValue(goshRepoTreeSelector({ type: 'items', path: search }));

    useEffect(() => {
        const getTree = async (repo: IGoshRepository, currBranch: TGoshBranch) => {
            const tree = await getSnapshotTree(repo.account.client, currBranch);
            console.debug('[Goto] - Tree object:', tree);
            setTree(tree);
        }

        if (goshRepo && branch) getTree(goshRepo, branch);
    }, [goshRepo, branch, setTree]);

    return (
        <div className="bordered-block px-7 py-8">
            <div className="flex items-center mb-3">
                <Link
                    to={`/${daoName}/${repoName}/tree/${branchName}`}
                    className="text-extblue font-medium hover:underline"
                >
                    {repoName}
                </Link>
                <span className="mx-2">/</span>
                <div className="input grow">
                    <input
                        type="text"
                        className="element !py-1.5 !text-sm"
                        placeholder="Search file..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {!!blobs && blobs?.map((item, index) => {
                const path = `${item.path && `${item.path}/`}${item.name}`
                return (
                    <div
                        key={index}
                        className="flex gap-x-4 py-3 border-b border-gray-300 last:border-b-0"
                    >
                        <Link
                            className="text-sm font-medium hover:underline"
                            to={`/${daoName}/${repoName}/blobs/${branchName}/${path}`}
                        >
                            <FontAwesomeIcon
                                className="mr-2"
                                icon={faFile}
                                fixedWidth
                            />
                            {path}
                        </Link>
                    </div>
                )
            })}
        </div>
    );
}

export default GotoPage;
