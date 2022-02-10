import React from "react";
import { useNavigate, useOutletContext, useParams, generatePath, Link } from "react-router-dom";
import Select from "react-select";
import { IRepository } from "../types";


type TRepositoryNavProps = {
    section: 'tree' | 'blob';
    showBranches?: boolean;
    pathLastItem?(item: string): any;
}

const RepositoryNav = (props: TRepositoryNavProps) => {
    const { section, showBranches = true, pathLastItem } = props;
    const navigate = useNavigate();
    const { branch = 'master', '*': path } = useParams();
    const { repository, branches } = useOutletContext<{ repository: IRepository, branches: string[] }>();

    return (
        <div className="repo-nav">
            {showBranches && (
                <div className="repo-nav__branch">
                    <Select
                        options={branches?.map((item) => ({ value: item, label: item }))}
                        value={{ value: branch, label: branch }}
                        isSearchable={false}
                        onChange={(newValue) => {
                            if (newValue?.value) {
                                const to = generatePath('/repo/:address/:section/:branch/*', {
                                    address: repository.address,
                                    section,
                                    branch: newValue.value,
                                    '*': path
                                });
                                navigate(to);
                            }
                        }}
                    />
                </div>
            )}

            <div className="repo-nav__path">
                {path && (
                    <ul>
                        {[repository.name, ...path.split('/')].map((item, index, array) => {
                            let to = generatePath('/repo/:address/tree/:branch', {
                                address: repository.address,
                                branch
                            });
                            if (index > 0) {
                                to = generatePath(`:to/:path`, {
                                    to,
                                    path: array.slice(1, index + 1).join('/')
                                });
                            }

                            return (
                                <li key={index}>
                                    {index < array.length - 1
                                        ? <Link to={to}>{item}</Link>
                                        : pathLastItem ? pathLastItem(item) : item
                                    }
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default RepositoryNav;
