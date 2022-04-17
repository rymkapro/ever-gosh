import React, { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { useEverClient } from "./hooks/ever.hooks";
import Header from "./components/Header";
import ProtectedLayout from "./pages/ProtectedLayout";
import AccountLayout from "./pages/AccountLayout";
import DaoLayout from "./pages/DaoLayout";
import HomePage from "./pages/Home";
import SignupPage from "./pages/Signup";
import SigninPage from "./pages/Signin";
import DaosPage from "./pages/Daos";
import DaoPage from "./pages/Dao";
import DaoCreatePage from "./pages/DaoCreate";
import ReposPage from "./pages/Repos";
import RepoCreatePage from "./pages/RepoCreate";
// import RepositoryLayout from "./pages/RepositoryLayout";
// import RepositoryPage from "./pages/Repository";
// import BlobCreatePage from "./pages/BlobCreate";
// import BlobUpdatePage from "./pages/BlobUpdate";
// import BlobPage from "./pages/Blob";
// import CommitsPage from "./pages/Commits";
// import CommitPage from "./pages/Commit";
// import BranchesPage from "./pages/Branches";

import "./assets/scss/style.scss";


const App = () => {
    const client = useEverClient();
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    useEffect(() => {
        if (!client) return;
        setIsInitialized(true);
    }, [client]);

    if (!isInitialized) return <p>Loading...</p>
    return (
        <div className="wrapper">
            <Header />
            <main className="main grow">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/account/signin" element={<SigninPage />} />
                    <Route path="/account/signup" element={<SignupPage />} />
                    <Route path="/account" element={<ProtectedLayout />}>
                        <Route path="orgs/create" element={<DaoCreatePage />} />
                        <Route element={<AccountLayout />}>
                            <Route index element={null} />
                            <Route path="orgs" element={<DaosPage />} />
                        </Route>
                    </Route>
                    <Route path="/orgs/:daoName" element={<ProtectedLayout />}>
                        <Route path="repos/create" element={<RepoCreatePage />} />
                        <Route element={<DaoLayout />}>
                            <Route index element={<DaoPage />} />
                            <Route path="repos" element={<ReposPage />} />
                        </Route>
                    </Route>
                    <Route path="/repositories" element={<ProtectedLayout />}>
                        {/* <Route index element={<RepositoriesPage />} />
                        <Route path="create" element={<RepositoryCreatePage />} />
                        <Route path=":repoName" element={<RepositoryLayout />}>
                            <Route index element={<RepositoryPage />} />
                            <Route path="tree/:branchName" element={<RepositoryPage />} />
                            <Route path="blobs/create/:branchName" element={<BlobCreatePage />} />
                            <Route path="blobs/update/:branchName/:blobName" element={<BlobUpdatePage />} />
                            <Route path="blob/:branchName/:blobName" element={<BlobPage />} />
                            <Route path="commits/:branchName" element={<CommitsPage />} />
                            <Route path="commit/:commitName" element={<CommitPage />} />
                            <Route path="branches" element={<BranchesPage />} />
                        </Route> */}
                    </Route>
                    <Route path="*" element={<p>No match (404)</p>} />
                </Routes>
            </main>
            <footer className="footer"></footer>
            <ToastContainer />

        </div>
    );
}

export default App;
