import React, { Fragment } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { XIcon, MenuIcon } from "@heroicons/react/outline";

import logoBlack from "../../assets/images/logo-black.svg";
import { classNames, shortString } from "../../utils";
import { Link, useLocation } from "react-router-dom";
import { useRecoilValue, useResetRecoilState } from "recoil";
import { userStateAtom } from "../../store/user.state";


const Header = () => {
    const userState = useRecoilValue(userStateAtom);
    const userStateReset = useResetRecoilState(userStateAtom);
    const location = useLocation();

    return (
        <header>
            <Disclosure
                as="nav"
                className="max-w-container mx-auto relative flex items-center justify-between h-12 mt-12"
            >
                {({ open }) => (
                    <>
                        <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                            {/* Mobile menu button*/}
                            <Disclosure.Button
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            >
                                <span className="sr-only">Open main menu</span>
                                {open ? (
                                    <XIcon className="block h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                                )}
                            </Disclosure.Button>
                        </div>

                        <Link to="/">
                            <img src={logoBlack} alt="Logo" className="block h-12 w-auto" />
                        </Link>

                        <div className="flex items-center gap-x-34px">
                            {location.pathname.search('/signin') >= 0 && (
                                <>
                                    <div className="text-lg text-gray-53596d">Don't have an account?</div>
                                    <Link to={`/account/signup`} className="btn btn--header">Sign up</Link>
                                </>
                            )}
                            {location.pathname.search('/signup') >= 0 && (
                                <>
                                    <div className="text-lg text-gray-53596d">Already have an account?</div>
                                    <Link to={`/account/signin`} className="btn btn--header">Sign in</Link>
                                </>
                            )}

                            {/* Profile dropdown */}
                            {userState.address && (
                                <Menu as="div" className="relative">
                                    <div>
                                        <Menu.Button className="flex text-sm text-white">
                                            <span className="sr-only">Open user menu</span>
                                            {shortString(userState.address || "", 4, 4)}
                                        </Menu.Button>
                                    </div>
                                    <Transition
                                        as={Fragment}
                                        enter="transition ease-out duration-100"
                                        enterFrom="transform opacity-0 scale-95"
                                        enterTo="transform opacity-100 scale-100"
                                        leave="transition ease-in duration-75"
                                        leaveFrom="transform opacity-100 scale-100"
                                        leaveTo="transform opacity-0 scale-95"
                                    >
                                        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <Link
                                                        to={"/account"}
                                                        className={classNames(active ? "bg-gray-100" : "", "block px-4 py-2 text-sm text-gray-700")}
                                                    >
                                                        Account
                                                    </Link>
                                                )}
                                            </Menu.Item>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <Link
                                                        to={"/repositories"}
                                                        className={classNames(active ? "bg-gray-100" : "", "block px-4 py-2 text-sm text-gray-700")}
                                                    >
                                                        Repositories
                                                    </Link>
                                                )}
                                            </Menu.Item>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        className={classNames(
                                                            active ? "bg-gray-100" : "",
                                                            "w-full block px-4 py-2 text-sm text-left text-red-700"
                                                        )}
                                                        onClick={userStateReset}
                                                    >
                                                        Sign out
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        </Menu.Items>
                                    </Transition>
                                </Menu>
                            )}
                        </div>

                        <Disclosure.Panel className="sm:hidden">
                            <div className="px-2 pt-2 pb-3 space-y-1">
                                <Disclosure.Button
                                    as="a"
                                    href="/"
                                    className={classNames(
                                        "bg-gray-900 text-white",
                                        "block px-3 py-2 rounded-md text-base font-medium"
                                    )}
                                >
                                    Menu item
                                </Disclosure.Button>
                            </div>
                        </Disclosure.Panel>
                    </>
                )}
            </Disclosure>
        </header>
    );
}

export default Header;
