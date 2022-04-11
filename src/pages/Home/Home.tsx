import React from "react";
import { Link } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userStateAtom } from "../../store/user.state";


const HomePage = () => {
    const userState = useRecoilValue(userStateAtom);

    return (
        <section className="max-w-7xl mx-auto pt-16 px-2">
            <div className="text-center">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-800">
                    Git Onchain Source Holder
                </h1>
                <p className="text-gray-500 mt-3 text-base sm:mt-5 sm:text-lg sm:max-w-2xl sm:mx-auto md:text-xl text-left">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat dignissimos consectetur quos
                    incidunt laudantium, consequatur adipisci ducimus culpa
                </p>
                <div className="mt-4 sm:mt-10 sm:flex justify-center gap-x-8">
                    {userState.address ? (
                        <div>
                            <Link
                                to="/repositories"
                                className="block btn--blue px-8 md:px-10 py-3 md:py-4 text-base md:text-lg font-medium text-white"
                            >
                                Repositories
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div>
                                <Link
                                    to="/account/signin"
                                    className="block btn--blue px-8 md:px-10 py-3 md:py-4 text-base md:text-lg font-medium text-white"
                                >
                                    Sign in
                                </Link>
                            </div>
                            <div>
                                <Link
                                    to="/account/signup"
                                    className="block btn--blue px-8 md:px-10 py-3 md:py-4 text-base md:text-lg font-medium text-white"
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
