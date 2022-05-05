import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import CopyClipboard from "../../components/CopyClipboard";
import { shortString } from "../../utils";
import { TDaoLayoutOutletContext } from "../DaoLayout";
import ReposPage from "../Repos";


const DaoPage = () => {
    const { goshDao } = useOutletContext<TDaoLayoutOutletContext>();

    return (
        <div className="flex gap-4">
            <div className="grow">
                <ReposPage />
            </div>
            <div className="basis-3/12 bordered-block px-7 py-8">
                <h3 className="font-semibold text-base mb-4">Details</h3>

                <div>
                    <p className="text-sm text-gray-606060 mb-1">DAO address</p>
                    <CopyClipboard
                        label={shortString(goshDao.address)}
                        componentProps={{
                            text: goshDao.address
                        }}
                    />
                </div>
                <div className="mt-4">
                    <p className="text-sm text-gray-606060 mb-1">Git remote</p>
                    <Link
                        to={`/${goshDao.meta?.name}/settings/wallet`}
                        className="hover:underline"
                    >
                        Setup git remote
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default DaoPage;
