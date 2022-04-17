import React, { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import BranchSelect from "../../components/BranchSelect";
import { IGoshBlob, TGoshBranch } from "../../types/types";
import { TRepositoryLayoutOutletContext } from "../RepositoryLayout";
import { useMonaco } from "@monaco-editor/react";
// import { GoshBlob } from "../../types/classes";
import { getCodeLanguageFromFilename, getGoshRepositoryBranches } from "../../helpers";
import BlobPreview from "../../components/Blob/Preview";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil } from "@fortawesome/free-solid-svg-icons";
import CopyClipboard from "../../components/CopyClipboard";


const BlobPage = () => {
    const { goshRepository } = useOutletContext<TRepositoryLayoutOutletContext>();
    const { repoName, branchName = 'master', blobName } = useParams();
    const navigate = useNavigate();
    const monaco = useMonaco();
    const [branches, setBranches] = useState<TGoshBranch[]>([]);
    const [branch, setBranch] = useState<TGoshBranch>();
    const [blob, setBlob] = useState<IGoshBlob>();

    useEffect(() => {
        const initState = async () => {
            // const { branches, branch } = await getGoshRepositoryBranches(goshRepository, branchName);
            // if (branch) {
            //     await branch.snapshot.load();

            //     const blobItem = branch.snapshot.meta?.content.find((item) => item.name === blobName);
            //     if (blobItem) {
            //         const blob = new GoshBlob(goshRepository.account.client, blobItem.address);
            //         await blob.load();
            //         setBlob(blob);
            //     } else {
            //         setBlob(undefined);
            //     }
            //     setBranch(branch);
            // }
            // setBranches(branches);
        }

        initState();
    }, [goshRepository, branchName, blobName]);

    return (
        <>
            <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                    <BranchSelect
                        branch={branch}
                        branches={branches}
                        onChange={(selected) => {
                            if (selected) {
                                navigate(`/repositories/${repoName}/blob/${selected.name}/${blobName}`);
                            }
                        }}
                    />
                    <Link
                        to={`/repositories/${repoName}/tree/${branchName}`}
                        className="ml-3 text-extblue font-medium hover:underline"
                    >
                        {repoName}
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="font-meduim">{blobName}</span>
                </div>
            </div>

            {!blob && (<p>File not found</p>)}
            {monaco && blobName && blob && (
                <div className="border rounded overflow-hidden">
                    <div className="flex bg-gray-100 px-3 py-1 border-b justify-end">
                        <CopyClipboard
                            componentProps={{
                                text: blob.meta?.content || ''
                            }}
                            iconContainerClassName="text-extblack/60 hover:text-extblack p-1"
                            iconProps={{
                                size: 'sm'
                            }}
                        />
                        <Link
                            to={`/repositories/${repoName}/blobs/update/${branchName}/${blobName}`}
                            className="text-extblack/60 hover:text-extblack p-1 ml-2">
                            <FontAwesomeIcon icon={faPencil} size="sm" />
                        </Link>
                    </div>
                    <BlobPreview
                        language={getCodeLanguageFromFilename(monaco, blobName)}
                        value={blob.meta?.content}
                    />
                </div>
            )}
        </>
    );
}

export default BlobPage;
