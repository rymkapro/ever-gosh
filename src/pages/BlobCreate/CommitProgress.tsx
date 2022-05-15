import React from "react";
import Spinner from "../../components/Spinner";
import { TCreateCommitCallbackParams } from "../../types/types";


const Result = (props: any) => {
    return (
        <span className="mr-3">
            {!props.flag ? <Spinner size="sm" /> : 'OK'}
        </span>
    );
}

const CommitProgress = (props: TCreateCommitCallbackParams) => {
    const {
        tree,
        commitDeploy,
        blobsDeploy,
        blobsSet,
        completed
    } = props;
    return (
        <div className="text-sm text-gray-050a15/70 bg-gray-050a15/5 rounded p-3">
            <code className="flex flex-col gap-2">
                <div>
                    <Result flag={tree} />
                    Build updated tree...
                </div>
                <div>
                    <Result flag={commitDeploy} />
                    Deploy commit...
                </div>
                <div>
                    <Result flag={blobsDeploy && blobsDeploy?.counter === blobsDeploy?.total} />
                    Deploy blobs... {blobsDeploy?.counter ?? 0} / {blobsDeploy?.total ?? 0}
                </div>
                <div>
                    <Result flag={blobsSet && blobsSet?.counter === blobsSet?.total} />
                    Set blobs for commit... {blobsSet?.counter ?? 0} / {blobsSet?.total ?? 0}
                </div>
                <div>
                    <Result flag={completed} />
                    Create proposal or wait for commit...
                </div>
            </code>
        </div>
    );
}

export default CommitProgress;
