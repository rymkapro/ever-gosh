import React from "react";

import { Route, Routes } from "react-router-dom";

import "./scss/style.scss";
import Header from "./components/Header";
import HomePage from "./pages/Home";
import RepositoryPageLayout from "./pages/RepositoryPage/Layout";
import RepositoryPageIndex from "./pages/RepositoryPage/IndexOutlet";
import RepositoryPageTree from "./pages/RepositoryPage/TreeOutlet";
import RepositoryPageBlob from "./pages/RepositoryPage/BlobOutlet";
import RepositoryPageEdit from "./pages/RepositoryPage/EditOutlet";


const App = () => {
    return (
        <div className="wrapper">
            <Header />
            <main className="main">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/repo/:address" element={<RepositoryPageLayout />}>
                        <Route index element={<RepositoryPageIndex />} />
                        <Route path="tree/:branch" element={<RepositoryPageIndex />} />
                        <Route path="tree/:branch/*" element={<RepositoryPageTree />} />
                        <Route path="blob/:branch/*" element={<RepositoryPageBlob />} />
                        <Route path="edit/:branch/*" element={<RepositoryPageEdit />} />
                    </Route>
                    <Route path="*" element={<p>No match</p>} />
                </Routes>
            </main>
            <footer className="footer"></footer>
        </div>
    );
}

export default App;
