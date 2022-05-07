import React from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import Spinner from "../components/Spinner";
import { useGoshDao, useGoshWallet } from "../hooks/gosh.hooks";
import { IGoshDao, IGoshWallet } from "../types/types";
import { classNames } from "../utils";


export type TDaoLayoutOutletContext = {
    goshDao: IGoshDao;
    goshWallet: IGoshWallet;
}

const DaoLayout = () => {
    const { daoName } = useParams();
    const goshDao = useGoshDao(daoName);
    const goshWallet = useGoshWallet(daoName);
    const tabs = [
        { to: `/${daoName}`, title: 'Overview' },
        { to: `/${daoName}/repos`, title: 'Repositories' },
        { to: `/${daoName}/events`, title: 'Events' },
        { to: `/${daoName}/settings`, title: 'Settings' }
    ];

    return (
        <div className="container my-10">
            {!goshDao && (
                <div className="text-gray-606060">
                    <Spinner className="mr-3" />
                    Loading organization...
                </div>
            )}

            {goshDao && goshWallet && (
                <>
                    <h1 className="mb-6">
                        <Link to={`/${goshDao.meta?.name}`} className="font-semibold text-2xl">
                            {goshDao.meta?.name}
                        </Link>
                    </h1>

                    <div className="flex gap-x-6 mb-6">
                        {tabs.map((item, index) => (
                            <NavLink
                                key={index}
                                to={item.to}
                                end={index === 0}
                                className={({ isActive }) => classNames(
                                    'text-base text-gray-050a15/50 hover:text-gray-050a15 py-1.5 px-2',
                                    isActive ? '!text-gray-050a15 border-b border-b-gray-050a15' : null
                                )}
                            >
                                {item.title}
                            </NavLink>
                        ))}
                    </div>

                    <Outlet context={{ goshDao, goshWallet }} />
                </>
            )}
        </div>
    );
}

export default DaoLayout;
