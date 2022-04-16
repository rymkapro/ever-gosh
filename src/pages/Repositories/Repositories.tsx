import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useGoshRoot } from "../../hooks/gosh.hooks";
import { GoshRepository } from "../../types/classes";
import { IGoshRepository } from "../../types/types";
import { useQuery } from "react-query";
import RepositoryListItem from "./RepositoryListItem";


const RepositoriesPage = () => {
    const goshRoot = useGoshRoot();
    const [search, setSearch] = useState<string>();
    const repoListQuery = useQuery(
        ['repositoryList'],
        async (): Promise<IGoshRepository[]> => {
            if (!goshRoot?.details?.address) return [];

            const storage: { [key: string]: any } = JSON.parse(localStorage.getItem('repositories') ?? '{}');
            const repos = await Promise.all(
                (storage[goshRoot.details.address] ?? []).map(async (name: string) => {
                    const address = await goshRoot.getRepositoryAddr(name);
                    return new GoshRepository(goshRoot.account.client, name, address);
                })
            );
            return repos;
        },
        {
            enabled: !!goshRoot,
            select: (data) => {
                if (!search) return data;
                const pattern = new RegExp(search, 'i');
                return data.filter((repo) => repo.name.search(pattern) >= 0);
            }
        }
    );

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
                        className="grow px-3 py-1.5 text-sm"
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
                    {(repoListQuery.isIdle || repoListQuery.isLoading) && (
                        <p className="text-sm text-gray-500 text-center py-3">
                            Loading repositories...
                        </p>
                    )}

                    {repoListQuery.isFetched && !repoListQuery.data?.length && (
                        <p className="text-sm text-gray-500 text-center py-3">
                            There are no repositories
                        </p>
                    )}

                    {repoListQuery.data?.map((repository, index) => (
                        <RepositoryListItem key={index} repository={repository} />
                    ))}
                </div>
            </div>
        </section>
    );
}

export default RepositoriesPage;
