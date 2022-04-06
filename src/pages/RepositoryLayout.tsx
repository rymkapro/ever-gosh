import React from "react";
import { Outlet, useParams } from "react-router-dom";
import { useGoshRepository } from "../hooks/gosh.hooks";
import { IGoshRepository } from "../types/types";


export type TRepositoryLayoutOutletContext = {
    goshRepository: IGoshRepository;
}

const RepositoryLayout = () => {
    const { name } = useParams();
    const goshRepository = useGoshRepository(name);

    return (
        <section className="px-10 py-6">
            <h1 className="text-gray-700 font-semibold text-2xl mb-5">
                {name}
            </h1>

            <div className="flex border-b">
                <div className="px-5 py-2 border-b-2 border-blue-600 text-gray-800 font-medium">
                    Commits
                </div>
            </div>

            <div className="max-w-6xl mx-auto mt-6">
                {goshRepository ? <Outlet context={{ goshRepository }} /> : 'Loading...'}
            </div>
        </section>
    );
}

export default RepositoryLayout;
