import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useGoshRoot } from "../../hooks/gosh.hooks";
import { GoshRepository } from "../../types/classes";
import { IGoshRepository, IGoshRoot } from "../../types/types";


const RepositoriesPage = () => {
    const goshRoot = useGoshRoot();
    const [repositories, setRepositories] = useState<IGoshRepository[]>();

    const getRepositories = async (root: IGoshRoot) => {
        if (!root.details?.address) return;

        const storage: { [key: string]: any } = JSON.parse(localStorage.getItem('repositories') ?? '{}');
        const repos = await Promise.all(
            (storage[root.details.address] ?? []).map(async (name: string) => {
                const address = await root.getRepositoryAddr(name);
                return new GoshRepository(root.account.client, name, address);
            })
        );
        setRepositories(repos);
    }

    useEffect(() => {
        if (goshRoot) getRepositories(goshRoot);
    }, [goshRoot]);

    return (
        <section className="p-2">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-gray-700 font-semibold text-2xl pt-10 pb-7">Repositories</h1>

                <div className="flex flex-wrap gap-x-32 justify-between">
                    <input
                        type={'text'}
                        autoComplete={'off'}
                        placeholder={'Find repository...'}
                        className="border rounded border-gray-400 px-3 py-1 text-sm flex-1"
                        disabled
                    />

                    <Link
                        className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600 disabled:opacity-75 rounded font-medium"
                        to={'/repositories/create'}
                    >
                        New repository
                    </Link>
                </div>

                <div className="mt-5 border rounded border-gray-400 px-5">
                    {repositories === undefined && (
                        <p className="text-sm text-gray-500 text-center py-3">
                            Loading repositories...
                        </p>
                    )}

                    {repositories && !repositories?.length && (
                        <p className="text-sm text-gray-500 text-center py-3">
                            There are no repositories
                        </p>
                    )}

                    {Boolean(repositories?.length) && repositories?.map((repository, index) => (
                        <div key={index} className="py-3 border-b border-gray-300 last:border-b-0">
                            <div className="text-gray-600 font-semibold">
                                <Link to={`/repositories/${repository.name}`}>{repository.name}</Link>
                            </div>
                            <div className="text-gray-500 text-xs">{repository.address}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default RepositoriesPage;
