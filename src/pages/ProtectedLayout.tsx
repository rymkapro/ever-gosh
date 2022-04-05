import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userStateAtom } from "../store/user.state";


const ProtectedLayout = () => {
    const userState = useRecoilValue(userStateAtom);

    if (!userState.address) return <Navigate to={'/'} />
    return <Outlet />
}

export default ProtectedLayout;
