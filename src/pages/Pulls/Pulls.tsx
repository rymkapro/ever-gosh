import React from "react";
import { Link, useParams } from "react-router-dom";


const PullsPage = () => {
    const { daoName, repoName } = useParams();

    return (
        <div className="bordered-block px-7 py-8">
            <Link to={`/orgs/${daoName}/repos/${repoName}/pulls/create`} className="btn btn--body px-3 py-1.5">
                Create pull request
            </Link>
        </div>
    );
}

export default PullsPage;
