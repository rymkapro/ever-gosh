import React from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { useGoshRepository } from "../hooks/gosh.hooks";
import { IGoshRepository } from "../types/types";


export type TRepositoryLayoutOutletContext = {
    goshRepository: IGoshRepository;
}

const RepositoryLayout = () => {
    const { repoName } = useParams();
    const goshRepository = useGoshRepository(repoName);

    return (
        <section className="px-10 py-6">
            <h1 className="text-gray-700 font-semibold text-2xl mb-5">
                {repoName}
                <div className="text-xs text-gray-500 font-normal">{goshRepository?.address}</div>
            </h1>

            <div className="flex border-b">
                <div className="px-5 py-2 border-b-2 border-blue-600 text-gray-800 font-medium">
                    <Link to={`/repositories/${repoName}`}>Code</Link>
                </div>
            </div>

            <div className="max-w-6xl mx-auto mt-6">
                {goshRepository ? <Outlet context={{ goshRepository }} /> : 'Loading outlet...'}
            </div>
        </section>
    );
}

export default RepositoryLayout;
