import React, { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { IGoshRepository, IGoshSnapshot, TGoshBranch } from "../../types/types";
import { TRepoLayoutOutletContext } from "../RepoLayout";
import BranchSelect from "../../components/BranchSelect";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClockRotateLeft, faCodeBranch } from "@fortawesome/free-solid-svg-icons";
import { GoshSnapshot } from "../../types/classes";
import { useRecoilValue } from "recoil";
import { goshBranchesAtom, goshCurrBranchSelector } from "../../store/gosh.state";


const RepoPage = () => {
    const { goshRepo } = useOutletContext<TRepoLayoutOutletContext>();
    const { daoName, repoName, branchName = 'master' } = useParams();
    const navigate = useNavigate();
    const branches = useRecoilValue(goshBranchesAtom);
    const branch = useRecoilValue(goshCurrBranchSelector(branchName));
    const [tree, setTree] = useState<IGoshSnapshot[]>();

    useEffect(() => {
        const getTree = async (repo: IGoshRepository, currBranch: TGoshBranch) => {
            console.debug('Snapshot addr:', currBranch.snapshot);
            const snapshots = await Promise.all(
                currBranch.snapshot.map(async (address) => {
                    const snapshot = new GoshSnapshot(repo.account.client, address);
                    await snapshot.load();
                    return snapshot;
                })
            );
            console.debug('GoshSnapshots:', snapshots);
            setTree(snapshots);
        }

        if (goshRepo && branch) getTree(goshRepo, branch);
    }, [goshRepo, branch]);

    return (
        <div className="bordered-block px-7 py-8">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <BranchSelect
                        branch={branch}
                        branches={branches}
                        onChange={(selected) => {
                            if (selected) {
                                navigate(`/orgs/${daoName}/repos/${repoName}/tree/${selected.name}`);
                            }
                        }}
                    />

                    <Link
                        to={`/orgs/${daoName}/repos/${repoName}/branches`}
                        className="ml-4 text-sm text-gray-050a15/65 hover:text-gray-050a15"
                    >
                        <span className="mr-1 font-semibold">
                            <FontAwesomeIcon icon={faCodeBranch} className="mr-1" />
                            {branches.length}
                        </span>
                        branches
                    </Link>

                    <Link
                        to={`/orgs/${daoName}/repos/${repoName}/commits/${branchName}`}
                        className="ml-4 text-sm text-gray-050a15/65 hover:text-gray-050a15"
                    >
                        <FontAwesomeIcon icon={faClockRotateLeft} className="mr-1" />
                        History
                    </Link>
                </div>

                <div className="flex gap-3">
                    <Link
                        to={`/orgs/${daoName}/repos/${repoName}/blobs/create/${branchName}`}
                        className="btn btn--body px-4 py-1.5 text-sm !font-normal"
                    >
                        Add file
                    </Link>
                </div>
            </div>

            <div className="mt-5">
                {tree === undefined && (
                    <p className="text-sm text-gray-500 text-center py-3">
                        Loading tree...
                    </p>
                )}

                {tree && !tree?.length && (
                    <p className="text-sm text-gray-500 text-center py-3">
                        There are no files yet
                    </p>
                )}

                {Boolean(tree?.length) && tree?.map((blob, index) => (
                    <div
                        key={index}
                        className="flex gap-x-4 py-3 border-b border-gray-300 last:border-b-0"
                    >
                        <div className="basis-1/4 text-sm font-medium">
                            <Link
                                className="hover:underline"
                                to={`/orgs/${daoName}/repos/${repoName}/blob/${blob.meta?.name}`}
                            >
                                {blob.meta && blob.meta.name.split('/').slice(-1)}
                            </Link>
                        </div>
                        <div className="text-gray-500 text-sm">
                            {/* <Link
                                className="hover:underline"
                                to={`/repositories/${repoName}/commit/${blob.lastCommitSha}`}
                            >
                                {blob.lastCommitMsg.title}
                            </Link> */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RepoPage;
