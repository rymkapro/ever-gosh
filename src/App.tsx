import React, { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { useEverClient } from "./hooks/ever.hooks";
import Header from "./components/Header";
import ProtectedLayout from "./pages/ProtectedLayout";
import AccountLayout from "./pages/AccountLayout";
import DaoLayout from "./pages/DaoLayout";
import DaoSettingsLayout from "./pages/DaoSettingsLayout";
import RepoLayout from "./pages/RepoLayout";
import HomePage from "./pages/Home";
import SignupPage from "./pages/Signup";
import SigninPage from "./pages/Signin";
import DaosPage from "./pages/Daos";
import DaoPage from "./pages/Dao";
import DaoCreatePage from "./pages/DaoCreate";
import DaoWalletPage from "./pages/DaoWallet";
import DaoParticipantsPage from "./pages/DaoParticipants";
import ReposPage from "./pages/Repos";
import RepoCreatePage from "./pages/RepoCreate";
import RepoPage from "./pages/Repo";
import BranchesPage from "./pages/Branches";
import BlobCreatePage from "./pages/BlobCreate";
import BlobUpdatePage from "./pages/BlobUpdate";
import BlobPage from "./pages/Blob";
import CommitsPage from "./pages/Commits";
import CommitPage from "./pages/Commit";
import PullsPage from "./pages/Pulls";
import PullCreatePage from "./pages/PullCreate";
import PullPage from "./pages/Pull";
import GotoPage from "./pages/Goto";

import "./assets/scss/style.scss";
import bgImage from "./assets/images/bg.png";  // TODO: Remove after UI design ready


const App = () => {
    const client = useEverClient();
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    // const location = useLocation(); // TODO: Remove after UI design ready

    useEffect(() => {
        if (!client) return;
        setIsInitialized(true);
    }, [client]);

    if (!isInitialized) return <p>Loading...</p>
    return (
        // TODO: remove .wrapper style after UI design ready
        <div
            className="wrapper"
            style={{
                // backgroundImage: ['/', '/account/signin', '/account/signup'].indexOf(location.pathname) >= 0
                //     ? `url(${bgImage})`
                //     : undefined,
                backgroundImage: `url(${bgImage})`,
            }}
        >
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
                    <Route path="/:daoName" element={<ProtectedLayout />}>
                        <Route element={<DaoLayout />}>
                            <Route index element={<DaoPage />} />
                            <Route path="repos" element={<ReposPage />} />
                            <Route path="settings" element={<DaoSettingsLayout />}>
                                <Route path="wallet" element={<DaoWalletPage />} />
                                <Route path="participants" element={<DaoParticipantsPage />} />
                            </Route>
                        </Route>
                        <Route path="repos/create" element={<RepoCreatePage />} />
                        <Route path=":repoName" element={<RepoLayout />}>
                            <Route index element={<RepoPage />} />
                            <Route path="tree/:branchName/*" element={<RepoPage />} />
                            <Route path="branches" element={<BranchesPage />} />
                            <Route path="blobs/create/:branchName/*" element={<BlobCreatePage />} />
                            <Route path="blobs/update/:branchName/*" element={<BlobUpdatePage />} />
                            <Route path="blobs/:branchName/*" element={<BlobPage />} />
                            <Route path="commits/:branchName" element={<CommitsPage />} />
                            <Route path="commits/:branchName/:commitName" element={<CommitPage />} />
                            <Route path="pulls" element={<PullsPage />} />
                            <Route path="pulls/create" element={<PullCreatePage />} />
                            <Route path="pulls/:pullAddress" element={<PullPage />} />
                            <Route path="find/:branchName" element={<GotoPage />} />
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
