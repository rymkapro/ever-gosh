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
                <div className="mt-5 sm:mt-8 sm:flex justify-center gap-x-8">
                    {userState.address ? (
                        <div>
                            <Link
                                to="/repositories"
                                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                            >
                                Repositories
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div>
                                <Link
                                    to="/account/signin"
                                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                                >
                                    Sign in
                                </Link>
                            </div>
                            <div>
                                <Link
                                    to="/account/signup"
                                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
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
