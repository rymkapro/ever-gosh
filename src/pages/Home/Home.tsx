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
                    Git Onchain Source Holder
                </h1>
                <div className="text-base mt-6 sm:text-lg sm:max-w-2xl sm:mx-auto md:text-xl text-left">
                    <p className="text-center">
                        The easiest way to secure your code.
                    </p>
                    <p className="mt-6">
                        GOSH — a scalable blockchain reducing the risks and resources spent on protecting code.
                        Build composable, censorship-resistant repositories.
                        Collaborate and realize great ideas.
                    </p>
                    <p className="mt-2">All in a decentralized way.</p>
                </div>
                <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-4">
                    {userState.address ? (
                        <div>
                            <Link to="/repositories" className="btn py-3 px-10 text-xl leading-normal">
                                Repositories
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div>
                                <Link to="/account/signin" className="btn py-3 px-10 text-xl leading-normal">
                                    Sign in
                                </Link>
                            </div>
                            <div>
                                <Link to="/account/signup" className="btn py-3 px-10 text-xl leading-normal">
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
