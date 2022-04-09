import React, { Fragment } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { XIcon, MenuIcon } from '@heroicons/react/outline';

import logoWhite from '../../assets/images/logo-white.svg';
import { classNames, shortString } from '../../utils';
import { Link } from 'react-router-dom';
import { useRecoilValue, useResetRecoilState } from 'recoil';
import { userStateAtom } from '../../store/user.state';


const Header = () => {
    const userState = useRecoilValue(userStateAtom);
    const userStateReset = useResetRecoilState(userStateAtom);

    return (
        <header>
            <Disclosure as="nav" className="bg-extblue drop-shadow-md">
                {({ open }) => (
                    <>
                        <div className="px-2 sm:px-6">
                            <div className="relative flex items-center justify-between h-16">
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

                                <div
                                    className="flex flex-1 items-center justify-center sm:justify-start sm:items-stretch"
                                >
                                    <Link to="/" className="flex flex-shrink-0 items-center">
                                        <img src={logoWhite} alt="Logo" className="block h-8 w-auto mr-4" />
                                    </Link>
                                </div>

                                <div
                                    className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0"
                                >
                                    {/* Profile dropdown */}
                                    <Menu as="div" className="relative">
                                        <div>
                                            <Menu.Button className="flex text-sm text-white">
                                                <span className="sr-only">Open user menu</span>
                                                {shortString(userState.address || '', 4, 4)}
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
                                                            to={'/account'}
                                                            className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}
                                                        >
                                                            Account
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link
                                                            to={'/repositories'}
                                                            className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}
                                                        >
                                                            Repositories
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <button
                                                            className={classNames(
                                                                active ? 'bg-gray-100' : '',
                                                                'w-full block px-4 py-2 text-sm text-left text-red-700'
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
                                </div>
                            </div>
                        </div>

                        <Disclosure.Panel className="sm:hidden">
                            <div className="px-2 pt-2 pb-3 space-y-1">
                                <Disclosure.Button
                                    as="a"
                                    href="/"
                                    className={classNames(
                                        'bg-gray-900 text-white',
                                        'block px-3 py-2 rounded-md text-base font-medium'
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
