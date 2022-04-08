import React, { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { useEverClient } from "./hooks/ever.hooks";
import Header from "./components/Header";
import ProtectedLayout from "./pages/ProtectedLayout";
import HomePage from "./pages/Home";
import SignupPage from "./pages/Signup";
import SigninPage from "./pages/Signin";
import AccountPage from "./pages/Account";
import RepositoriesPage from "./pages/Repositories";
import RepositoryCreatePage from "./pages/RepositoryCreate";
import RepositoryLayout from "./pages/RepositoryLayout";
import RepositoryPage from "./pages/Repository";
import BlobCreatePage from "./pages/BlobCreate";
import BlobPage from "./pages/Blob";
import CommitsPage from "./pages/Commits";

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
        <div className="wrapper min-h-full flex flex-col">
            <Header />
            <main className="main">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/account/signin" element={<SigninPage />} />
                    <Route path="/account/signup" element={<SignupPage />} />
                    <Route path="/account" element={<ProtectedLayout />}>
                        <Route index element={<AccountPage />} />
                    </Route>
                    <Route path="/repositories" element={<ProtectedLayout />}>
                        <Route index element={<RepositoriesPage />} />
                        <Route path="create" element={<RepositoryCreatePage />} />
                        <Route path=":repoName" element={<RepositoryLayout />}>
                            <Route index element={<RepositoryPage />} />
                            <Route path="tree/:branchName" element={<RepositoryPage />} />
                            <Route path="blobs/:branchName/create" element={<BlobCreatePage />} />
                            <Route path="blobs/:branchName/:blobName" element={<BlobPage />} />
                            <Route path="commits/:branchName" element={<CommitsPage />} />
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
