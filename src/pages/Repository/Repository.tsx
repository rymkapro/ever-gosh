import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { IGoshBranch, IGoshCommit, IGoshRepository } from "../../types/types";
import { TRepositoryLayoutOutletContext } from "../RepositoryLayout";
import { Combobox } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/solid";
import { GoshCommit } from "../../types/classes";


const RepositoryPage = () => {
    const { goshRepository } = useOutletContext<TRepositoryLayoutOutletContext>();
    const [branches, setBranches] = useState<IGoshBranch[]>([]);
    const [branch, setBranch] = useState<IGoshBranch>()

    const getCommits = async (repository: IGoshRepository, branchName: string) => {
        const branch = await repository.getBranch(branchName);
        console.log('Branch', branch);

        const commits: IGoshCommit[] = [];
        while (true) {
            if (!branch.commit) break;
            const commit = new GoshCommit(repository.account.client, branch.commit);
            commits.push(commit);
            const parent = await commit.getParent();
            if (!parent) break;
        }
        console.log('Repo addr', repository.address);
        console.log('Commits', commits);
    }

    useEffect(() => {
        const initState = async () => {
            const branches = await goshRepository.getBranches();
            const master = await goshRepository.getBranch('master');
            // console.log(master, goshRepository.address);

            setBranches(branches);
            setBranch(master);
        }

        initState();
        getCommits(goshRepository, 'master');
    }, [goshRepository]);

    return (
        <div>
            <Combobox
                value={branch}
                onChange={(value) => setBranch(value)}
                as="div"
                className="relative inline-block"
            >
                <div className="relative inline-flex gap-x-3 items-center overflow-hidden border rounded px-2 py-1">
                    <Combobox.Input
                        onChange={(event) => { }}
                        displayValue={(branch: IGoshBranch) => branch.name}
                        className="text-gray-700 border-none focus:ring-0 outline-none w-auto"
                    />
                    <Combobox.Button className="">
                        <ChevronDownIcon className="w-4 h-4 text-gray-400" aria-hidden="true" />
                    </Combobox.Button>
                </div>
                <Combobox.Options className="absolute w-full py-1 mt-1 overflow-auto text-base bg-white rounded shadow-md max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {branches.map((branch) => (
                        <Combobox.Option
                            key={branch.name}
                            value={branch}
                            className="cursor-default select-none relative py-2 px-4"
                        >
                            {branch.name}
                        </Combobox.Option>
                    ))}
                </Combobox.Options>
            </Combobox>

            <div className="flex flex-col gap-3 mt-5">
                {/* <button
                    className="px-3 py-1 border rounded"
                    onClick={async () => {
                        await goshRepository.createBranch('dev', 'master');
                        console.log('Branch created');

                    }}
                >
                    Create branch
                </button>
                <button
                    className="px-3 py-1 border rounded"
                    onClick={async () => {
                        await goshRepository.deleteBranch('dev');
                        console.log('Branch deleted');

                    }}
                >
                    Delete branch
                </button>
                <button
                    className="px-3 py-1 border rounded"
                    onClick={async () => {
                        await goshRepository.createCommit('master', 'name-0', 'changes-0');
                        console.log('Commit created');
                    }}
                >
                    Create commit
                </button> */}
            </div>
        </div>
    );
}

export default RepositoryPage;
