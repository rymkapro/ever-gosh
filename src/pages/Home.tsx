import React, { useEffect, useState } from "react";

import fixtures from "../fixtures.json";
import { IRepository } from "../types";
import { RepositoryFixture } from "../objects";
import RepositoryItem from "../components/RepositoryItem";


const HomePage = () => {
    const [repositories, setRepositories] = useState<IRepository[]>();

    const getRepositories = async (): Promise<IRepository[]> => {
        return fixtures.map((item: any) => {
            const { address, name, type, branches, description, language, license, updated } = item;
            return new RepositoryFixture(address, name, type, branches, description, language, license, updated);
        });
    }

    useEffect(() => {
        getRepositories().then((response) => setRepositories(response));
    }, []);

    return (
        <div className="pagehome">
            <section className="pagehome__explore block-explore">
                <div className="block-explore__container --container">
                    <h1 className="block-explore__title">Explore repositories</h1>
                    <div className="block-explore__items repo-list">
                        {repositories && repositories.map((repository, index) => (
                            <RepositoryItem key={index} item={repository} />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default HomePage;
