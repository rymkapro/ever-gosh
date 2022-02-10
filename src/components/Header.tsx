import React from "react";
import { Link } from "react-router-dom";

import logo from "../images/logo.svg";


const Header = () => {
    return (
        <header className="header">
            <div className="header__container --container">
                <Link to="/" className="header__logo">
                    <img src={logo} alt="Logo" />
                    EverHub
                </Link>
            </div>
        </header>
    );
}

export default Header;
