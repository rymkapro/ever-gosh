import React, { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { useEverClient } from "./hooks/ever.hooks";
import Header from "./components/Header";
import ProtectedLayout from "./pages/ProtectedLayout";
import AccountLayout from "./pages/AccountLayout";
import DaoLayout from "./pages/DaoLayout";
import RepoLayout from "./pages/RepoLayout";
import HomePage from "./pages/Home";
import SignupPage from "./pages/Signup";
import SigninPage from "./pages/Signin";
import DaosPage from "./pages/Daos";
import DaoPage from "./pages/Dao";
import DaoCreatePage from "./pages/DaoCreate";
import ReposPage from "./pages/Repos";
import RepoCreatePage from "./pages/RepoCreate";
import RepoPage from "./pages/Repo";
import BranchesPage from "./pages/Branches";
import BlobCreatePage from "./pages/BlobCreate";
import BlobUpdatePage from "./pages/BlobUpdate";
import BlobPage from "./pages/Blob";
import CommitsPage from "./pages/Commits";
import CommitPage from "./pages/Commit";

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
                        <Route path="repos/:repoName" element={<RepoLayout />}>
                            <Route index element={<RepoPage />} />
                            <Route path="tree/:branchName" element={<RepoPage />} />
                            <Route path="branches" element={<BranchesPage />} />
                            <Route path="blobs/create/:branchName" element={<BlobCreatePage />} />
                            <Route path="blobs/update/:branchName/:blobName" element={<BlobUpdatePage />} />
                            <Route path="blob/:branchName/:blobName" element={<BlobPage />} />
                            <Route path="commits/:branchName" element={<CommitsPage />} />
                            <Route path="commit/:branchName/:commitName" element={<CommitPage />} />
                        </Route>
                        <Route element={<DaoLayout />}>
                            <Route index element={<DaoPage />} />
                            <Route path="repos" element={<ReposPage />} />
                        </Route>
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
