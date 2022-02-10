import React, { useEffect, useState } from "react";

import { Outlet, Link, useParams } from "react-router-dom";

import fixtures from "../../fixtures.json";
import { IRepository } from "../../types";
import { RepositoryFixture } from "../../objects";


const RepositoryPageLayout = () => {
    const { address } = useParams();
    const [repository, setRepository] = useState<IRepository | null>();
    const [branches, setBranches] = useState<string[]>();

    useEffect(() => {
        const getRepository = async () => {
            const found: any = fixtures.find((item) => item.address === address);
            if (found) {
                const { address, name, type, branches, description, language, license, updated } = found;
                const repo = new RepositoryFixture(
                    address, name, type, branches, description, language, license, updated
                );
                setRepository(repo);
                setBranches(await repo.getBranches());
            }
        }

        getRepository();
    }, [address]);

    if (repository === undefined) return <div className="--container">Loading...</div>;
    if (!repository) return <div className="--container">Not found :(</div>;
    return (
        <div className="pagerepo">
            <div className="pagerepo__header">
                <div className="pagerepo__container --container">
                    <h1 className="pagerepo__title">
                        <Link to={`/repo/${repository.address}`}>{repository.name}</Link>
                        <div className="badge">{repository.getTypeString()}</div>
                    </h1>
                </div>
            </div>
            <div className="pagerepo__body --container">
                <Outlet context={{ repository, branches }} />
            </div>
        </div>
    );
}

export default RepositoryPageLayout;
