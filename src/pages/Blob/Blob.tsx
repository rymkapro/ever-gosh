import React, { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import BranchSelect from "../../components/BranchSelect";
import { IGoshRepository, IGoshSnapshot } from "../../types/types";
import { TRepoLayoutOutletContext } from "../RepoLayout";
import { useMonaco } from "@monaco-editor/react";
import { getCodeLanguageFromFilename } from "../../helpers";
import BlobPreview from "../../components/Blob/Preview";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil } from "@fortawesome/free-solid-svg-icons";
import CopyClipboard from "../../components/CopyClipboard";
import { GoshSnapshot } from "../../types/classes";
import Spinner from "../../components/Spinner";
import { useRecoilValue } from "recoil";
import { goshBranchesAtom, goshCurrBranchSelector } from "../../store/gosh.state";
import { AccountType } from "@eversdk/appkit";
import RepoBreadcrumbs from "../../components/Repo/Breadcrumbs";


const BlobPage = () => {
    const { goshRepo } = useOutletContext<TRepoLayoutOutletContext>();
    const { daoName, repoName, branchName = 'main' } = useParams();
    const navigate = useNavigate();
    const monaco = useMonaco();
    const branches = useRecoilValue(goshBranchesAtom);
    const branch = useRecoilValue(goshCurrBranchSelector(branchName));
    const [snapshot, setSnapshot] = useState<IGoshSnapshot>();

    const pathName = useParams()['*'];

    useEffect(() => {
        const getSnapshot = async (repo: IGoshRepository, branch: string, path: string) => {
            setSnapshot(undefined);
            const snapAddr = await repo.getSnapshotAddr(branch, path);
            const snapshot = new GoshSnapshot(repo.account.client, snapAddr);
            const { acc_type } = await snapshot.account.getAccount();
            if (acc_type === AccountType.active) await snapshot.load();
            setSnapshot(snapshot);
        }

        if (goshRepo && branchName && pathName) getSnapshot(goshRepo, branchName, pathName);
    }, [goshRepo, branchName, pathName]);

    return (
        <div className="bordered-block px-7 py-8">
            <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                    <BranchSelect
                        branch={branch}
                        branches={branches}
                        onChange={(selected) => {
                            if (selected) {
                                navigate(`/${daoName}/${repoName}/blobs/${selected.name}/${pathName}`);
                            }
                        }}
                    />
                    <div className="inline-block ml-4">
                        <RepoBreadcrumbs
                            daoName={daoName}
                            repoName={repoName}
                            branchName={branchName}
                            pathName={pathName}
                        />
                    </div>
                </div>
                <div>
                    <Link
                        to={`/${daoName}/${repoName}/find/${branchName}`}
                        className="btn btn--body px-4 py-1.5 text-sm !font-normal"
                    >
                        Go to file
                    </Link>
                </div>
            </div>

            {!snapshot && (
                <div className="text-gray-606060 text-sm">
                    <Spinner className="mr-3" />
                    Loading file...
                </div>
            )}
            {snapshot && !snapshot.meta && (<div className="text-gray-606060 text-sm">File not found</div>)}
            {monaco && snapshot?.meta && (
                <div className="border rounded overflow-hidden">
                    <div className="flex bg-gray-100 px-3 py-1 border-b justify-end">
                        <CopyClipboard
                            componentProps={{
                                text: snapshot.meta.content
                            }}
                            iconContainerClassName="text-extblack/60 hover:text-extblack p-1"
                            iconProps={{
                                size: 'sm'
                            }}
                        />
                        <Link
                            to={`/${daoName}/${repoName}/blobs/update/${branchName}/${pathName}`}
                            className="text-extblack/60 hover:text-extblack p-1 ml-2">
                            <FontAwesomeIcon icon={faPencil} size="sm" />
                        </Link>
                    </div>
                    <BlobPreview
                        language={getCodeLanguageFromFilename(monaco, snapshot.meta.name)}
                        value={snapshot.meta.content}
                    />
                </div>
            )}
        </div>
    );
}

export default BlobPage;
