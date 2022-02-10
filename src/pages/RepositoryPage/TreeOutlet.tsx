import React from "react";

import RepositoryNav from "../../components/RepositoryNav";
import RepositoryTree from "../../components/RepositoryTree";


const TreeOutlet = () => {
    return (
        <div className="pagerepo__tree repotree">
            <RepositoryNav section="tree" />
            <RepositoryTree />
        </div>
    );
}

export default TreeOutlet;
