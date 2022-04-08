import React from "react";
import { Combobox } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/solid";
import { IGoshBranch } from "../../types/types";


type TBranchSelectProps = {
    branch?: IGoshBranch;
    branches: IGoshBranch[];
    onChange(selected: IGoshBranch | undefined): void;
}

const BranchSelect = (props: TBranchSelectProps) => {
    const { branch, branches, onChange } = props;

    return (
        <Combobox
            value={branch}
            onChange={(value) => onChange(value)}
            as="div"
            className="relative inline-block"
            disabled
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
    );
}

export default BranchSelect;
