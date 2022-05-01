import React, { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSetRecoilState, useRecoilValue } from "recoil";
import PinCodeModal from "../components/Modal/PinCode";
import { appModalStateAtom } from "../store/app.state";
import { userStateAtom, userStatePersistAtom } from "../store/user.state";


const ProtectedLayout = () => {
    const userStatePersist = useRecoilValue(userStatePersistAtom);
    const userState = useRecoilValue(userStateAtom);
    const setModal = useSetRecoilState(appModalStateAtom);

    useEffect(() => {
        if (userStatePersist.pin && !userState.phrase) setModal({
            static: true,
            isOpen: true,
            element: <PinCodeModal unlock={true} />
        });
    }, [userStatePersist.pin, userState.phrase, setModal]);

    if (!userStatePersist.pin) return <Navigate to="/" />
    return <Outlet />
}

export default ProtectedLayout;
