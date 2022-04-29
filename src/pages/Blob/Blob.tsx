import React, { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import BranchSelect from "../../components/BranchSelect";
import { IGoshBlob, IGoshRepository, TGoshTreeItem } from "../../types/types";
import { TRepoLayoutOutletContext } from "../RepoLayout";
import { useMonaco } from "@monaco-editor/react";
import { getCodeLanguageFromFilename } from "../../helpers";
import BlobPreview from "../../components/Blob/Preview";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil } from "@fortawesome/free-solid-svg-icons";
import CopyClipboard from "../../components/CopyClipboard";
import Spinner from "../../components/Spinner";
import { useRecoilValue } from "recoil";
import { goshBranchesAtom, goshCurrBranchSelector } from "../../store/gosh.state";
import { AccountType } from "@eversdk/appkit";
import RepoBreadcrumbs from "../../components/Repo/Breadcrumbs";
import { GoshBlob } from "../../types/classes";


const BlobPage = () => {
    const pathName = useParams()['*'];

    const { daoName, repoName, branchName = 'main' } = useParams();
    const { goshRepo, goshRepoTree } = useOutletContext<TRepoLayoutOutletContext>();
    const navigate = useNavigate();
    const monaco = useMonaco();
    const branches = useRecoilValue(goshBranchesAtom);
    const branch = useRecoilValue(goshCurrBranchSelector(branchName));
    const treeItem = useRecoilValue(goshRepoTree.getTreeItem(pathName));
    const [blob, setBlob] = useState<IGoshBlob>();

    useEffect(() => {
        const getBlob = async (repo: IGoshRepository, treeItem: TGoshTreeItem) => {
            const blobAddr = await repo.getBlobAddr(`blob ${treeItem.sha}`);
            const blob = new GoshBlob(repo.account.client, blobAddr);
            const { acc_type } = await blob.account.getAccount();
            if (acc_type === AccountType.active) await blob.load();
            setBlob(blob);
        }

        if (goshRepo && treeItem) getBlob(goshRepo, treeItem);
    }, [goshRepo, treeItem]);

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

            {!blob && (
                <div className="text-gray-606060 text-sm">
                    <Spinner className="mr-3" />
                    Loading file...
                </div>
            )}
            {blob && !blob.meta && (<div className="text-gray-606060 text-sm">File not found</div>)}
            {monaco && treeItem && blob?.meta && (
                <div className="border rounded overflow-hidden">
                    <div className="flex bg-gray-100 px-3 py-1 border-b justify-end">
                        <CopyClipboard
                            componentProps={{
                                text: blob.meta.content
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
                        language={getCodeLanguageFromFilename(monaco, treeItem.name)}
                        value={blob.meta.content}
                    />
                </div>
            )}
        </div>
    );
}

export default BlobPage;
