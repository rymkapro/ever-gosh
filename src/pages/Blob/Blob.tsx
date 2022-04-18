import React, { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import BranchSelect from "../../components/BranchSelect";
import { IGoshBlob, IGoshRepository, IGoshSnapshot, TGoshBranch } from "../../types/types";
import { TRepoLayoutOutletContext } from "../RepoLayout";
import { useMonaco } from "@monaco-editor/react";
// import { GoshBlob } from "../../types/classes";
import { getCodeLanguageFromFilename, getGoshRepoBranches } from "../../helpers";
import BlobPreview from "../../components/Blob/Preview";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil } from "@fortawesome/free-solid-svg-icons";
import CopyClipboard from "../../components/CopyClipboard";
import { GoshSnapshot } from "../../types/classes";
import Spinner from "../../components/Spinner";


const BlobPage = () => {
    const { goshRepo, branches } = useOutletContext<TRepoLayoutOutletContext>();
    const { daoName, repoName, branchName, blobName } = useParams();
    const navigate = useNavigate();
    const monaco = useMonaco();
    const [snapshot, setSnapshot] = useState<IGoshSnapshot>();

    useEffect(() => {
        const getSnapshot = async (repo: IGoshRepository, branch: string, blob: string) => {
            const snapAddr = await repo.getSnapshotAddr(branch, blob);
            const snapshot = new GoshSnapshot(repo.account.client, snapAddr);
            await snapshot.load();
            setSnapshot(snapshot);
        }

        if (goshRepo && branchName && blobName) getSnapshot(goshRepo, branchName, blobName);
    }, [goshRepo, branchName, blobName]);

    return (
        <div className="bordered-block px-7 py-8">
            <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                    <BranchSelect
                        branch={branches.branchCurr}
                        branches={branches.branchList}
                        onChange={(selected) => {
                            if (selected) {
                                navigate(`/orgs/${daoName}/repos/${repoName}/blob/${blobName}`);
                            }
                        }}
                    />
                    <Link
                        to={`/orgs/${daoName}/repos/${repoName}/tree/${branchName}`}
                        className="ml-3 text-extblue font-medium hover:underline"
                    >
                        {repoName}
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="font-meduim">{blobName}</span>
                </div>
            </div>

            {!snapshot && (
                <>
                    <Spinner className="mr-2" />
                    Loading file
                </>
            )}
            {snapshot && !snapshot.meta && (<p>File not found</p>)}
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
                            to={`/orgs/${daoName}/repos/${repoName}/blobs/update/${branchName}/${blobName}`}
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
