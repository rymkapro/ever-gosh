import React from "react";
import { faCode } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, Outlet, useParams } from "react-router-dom";
import Spinner from "../components/Spinner";
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
            <h1 className="font-semibold text-2xl mb-5">
                {repoName}
            </h1>

            <div className="flex border-b">
                <div className="px-3 py-2 border-b-2 border-extblue font-medium text-sm">
                    <Link to={`/repositories/${repoName}`}>
                        <FontAwesomeIcon icon={faCode} size="sm" className="mr-1" />
                        Code
                    </Link>
                </div>
            </div>

            <div className="max-w-6xl mx-auto mt-6">
                {goshRepository ? <Outlet context={{ goshRepository }} /> : <Spinner />}
            </div>
        </section>
    );
}

export default RepositoryLayout;
