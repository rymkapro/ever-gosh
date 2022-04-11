import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CopyClipboard from "../../components/CopyClipboard";
import { useGoshRoot } from "../../hooks/gosh.hooks";
import { GoshRepository } from "../../types/classes";
import { IGoshRoot } from "../../types/types";
import { shortString } from "../../utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCodeFork, faStar, faCode } from "@fortawesome/free-solid-svg-icons";
import { useRecoilState, useRecoilValue } from "recoil";
import { goshRepoListAtom, goshRepoListSelector } from "../../store/gosh.state";


const RepositoriesPage = () => {
    const goshRoot = useGoshRoot();
    const [search, setSearch] = useState<string>();
    const [reposState, setReposState] = useRecoilState(goshRepoListAtom);
    const repos = useRecoilValue(goshRepoListSelector(search));

    useEffect(() => {
        const getRepositories = async (root: IGoshRoot) => {
            if (!root.details?.address) return;

            const storage: { [key: string]: any } = JSON.parse(localStorage.getItem('repositories') ?? '{}');
            const repos = await Promise.all(
                (storage[root.details.address] ?? []).map(async (name: string) => {
                    const address = await root.getRepositoryAddr(name);
                    return new GoshRepository(root.account.client, name, address);
                })
            );
            setReposState({ isLoading: false, list: repos });
        }

        setReposState({ isLoading: true, list: [] });
        if (goshRoot) getRepositories(goshRoot);
    }, [goshRoot]);

    return (
        <section className="p-2">
            <div className="max-w-2xl mx-auto">
                <h1 className="font-semibold text-2xl pt-10 pb-7">
                    My repositories
                </h1>

                <div className="flex flex-wrap gap-4 justify-between">
                    <input
                        type={'text'}
                        autoComplete={'off'}
                        placeholder={'Find repository...'}
                        className="input--text grow px-3 py-1.5 text-sm"
                        onChange={(event) => setSearch(event.target.value)}
                    />

                    <Link
                        className="btn--blue px-4 py-1.5 text-sm"
                        to={'/repositories/create'}
                    >
                        Add repository
                    </Link>
                </div>

                <div className="mt-5 border rounded px-5">
                    {reposState.isLoading && (
                        <p className="text-sm text-gray-500 text-center py-3">
                            Loading repositories...
                        </p>
                    )}

                    {!reposState.isLoading && !repos.length && (
                        <p className="text-sm text-gray-500 text-center py-3">
                            There are no repositories
                        </p>
                    )}

                    {repos.map((repository, index) => (
                        <div key={index} className="py-3 border-b last:border-b-0">
                            <Link
                                className="text-extblue text-xl font-semibold hover:underline"
                                to={`/repositories/${repository.name}`}
                            >
                                {repository.name}
                            </Link>

                            <div className="text-sm text-gray-400">
                                Repository description
                            </div>

                            <div className="flex gap-1 mt-2">
                                {Array.from(new Array(4)).map((_, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className="rounded-2xl bg-extblue/25 text-xs text-extblue px-2 py-1 hover:bg-extblue hover:text-white"
                                    >
                                        tag-name
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-4 mt-3 text-xs text-gray-400">
                                <div>
                                    <FontAwesomeIcon icon={faCode} className="mr-1" />
                                    Language
                                </div>
                                <div>
                                    <FontAwesomeIcon icon={faCodeFork} className="mr-1" />
                                    4
                                </div>
                                <div>
                                    <FontAwesomeIcon icon={faStar} className="mr-1" />
                                    22
                                </div>
                                <CopyClipboard
                                    componentProps={{
                                        text: repository.address
                                    }}
                                    className="grow justify-end hover:text-extblue"
                                    label={shortString(repository.address, 4, 4)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default RepositoriesPage;
