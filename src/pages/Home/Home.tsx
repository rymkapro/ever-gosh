import React from "react";
import { Link } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userStateAtom } from "../../store/user.state";


const HomePage = () => {
    const userState = useRecoilValue(userStateAtom);

    return (
        <section className="max-w-7xl mx-auto pt-16 px-2">
            <div className="text-center">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
                    Git Open Source Hodler
                </h1>
                <div className="text-base mt-10 sm:text-lg sm:max-w-2xl sm:mx-auto md:text-xl text-left">
                    <p>
                        GOSH secures delivery and decentralization of your code.
                    </p>
                    <p className="mt-6">
                        The first development platform blockchain, purpose-built for securing the software
                        supply chain and extracting the value locked in your projects.
                    </p>
                </div>
                <div className="my-10 flex flex-wrap justify-center gap-x-8 gap-y-4">
                    {userState.phrase ? (
                        <div>
                            <Link
                                to="/account/orgs"
                                className="btn btn--body py-3 px-10 text-xl leading-normal"
                            >
                                Organizations
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div>
                                <Link
                                    to="/account/signin"
                                    className="btn btn--body py-3 px-10 text-xl leading-normal"
                                >
                                    Sign in
                                </Link>
                            </div>
                            <div>
                                <Link
                                    to="/account/signup"
                                    className="btn btn--body py-3 px-10 text-xl leading-normal"
                                >
                                    Create account
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}

export default HomePage;
