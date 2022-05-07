import React, { useState } from "react";
import { Field, Form, Formik } from "formik";
import { Link, Navigate, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { TRepoLayoutOutletContext } from "../RepoLayout";
import TextField from "../../components/FormikForms/TextField";
import { useMonaco } from "@monaco-editor/react";
import { getCodeLanguageFromFilename, isMainBranch } from "../../helpers";
import * as Yup from "yup";
import { Tab } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCode, faEye } from "@fortawesome/free-solid-svg-icons";
import { classNames } from "../../utils";
import BlobEditor from "../../components/Blob/Editor";
import BlobPreview from "../../components/Blob/Preview";
import FormCommitBlock from "./FormCommitBlock";
import { useRecoilValue } from "recoil";
import { goshCurrBranchSelector } from "../../store/gosh.state";
import { useGoshRepoBranches } from "../../hooks/gosh.hooks";
import { userStateAtom } from "../../store/user.state";
import RepoBreadcrumbs from "../../components/Repo/Breadcrumbs";


type TFormValues = {
    name: string;
    content: string;
    title: string;
    message: string;
}

const BlobCreatePage = () => {
    const pathName = useParams()['*'];
    const { daoName, repoName, branchName = 'main' } = useParams();
    const navigate = useNavigate();
    const { goshRepo, goshWallet } = useOutletContext<TRepoLayoutOutletContext>();
    const monaco = useMonaco();
    const userState = useRecoilValue(userStateAtom);
    const { updateBranch } = useGoshRepoBranches(goshRepo);
    const branch = useRecoilValue(goshCurrBranchSelector(branchName));
    const [activeTab, setActiveTab] = useState<number>(0);
    const [blobCodeLanguage, setBlobCodeLanguage] = useState<string>('plaintext');

    const urlBack = `/${daoName}/${repoName}/tree/${branchName}${pathName && `/${pathName}`}`;

    const onCommitChanges = async (values: TFormValues) => {
        try {
            if (!userState.keys) throw Error('User is undefined');
            if (!goshWallet) throw Error('GoshWallet is undefined');
            if (!repoName) throw Error('Repository is undefined');
            if (!branch) throw Error('Branch is undefined');
            if (isMainBranch(branchName)) throw Error(`Can not push to branch '${branchName}'. Create PR`);
            if (!goshWallet.isDaoParticipant) throw Error('You are not DAO participant');

            const message = [values.title, values.message].filter((v) => !!v).join('\n\n');
            await goshWallet.createCommit(
                goshRepo,
                branch,
                userState.keys.public,
                [{
                    name: `${pathName && `${pathName}/`}${values.name}`,
                    modified: values.content,
                    original: ''
                }],
                message
            );

            await updateBranch(branch.name);
            navigate(urlBack);
        } catch (e: any) {
            console.error(e.message);
            alert(e.message);
        }
    }

    if (!goshWallet?.isDaoParticipant) return <Navigate to={urlBack} />;
    return (
        <div className="bordered-block px-7 py-8">
            <Formik
                initialValues={{ name: '', content: '', title: '', message: '' }}
                validationSchema={Yup.object().shape({
                    name: Yup.string().required('Field is required'),
                    title: Yup.string().required('Field is required')
                })}
                onSubmit={onCommitChanges}
            >
                {({ values, setFieldValue, isSubmitting, handleBlur }) => (
                    <Form>
                        <div className="flex gap-3 items-baseline justify-between ">
                            <div className="flex items-baseline">
                                <RepoBreadcrumbs
                                    daoName={daoName}
                                    repoName={repoName}
                                    branchName={branchName}
                                    pathName={pathName}
                                    isBlob={false}
                                />
                                <div>
                                    <Field
                                        name="name"
                                        component={TextField}
                                        errorEnabled={false}
                                        inputProps={{
                                            className: '!text-sm !px-2.5 !py-1.5',
                                            autoComplete: 'off',
                                            placeholder: 'Name of new file',
                                            disabled: !monaco || activeTab === 1,
                                            onBlur: (e: any) => {
                                                // Formik `handleBlur` event
                                                handleBlur(e);

                                                // Resolve file code language by it's extension
                                                // and update editor
                                                const language = getCodeLanguageFromFilename(
                                                    monaco,
                                                    e.target.value
                                                );
                                                setBlobCodeLanguage(language);

                                                // Set commit title
                                                setFieldValue('title', `Create ${e.target.value}`);
                                            }
                                        }}
                                    />
                                </div>
                                <span className="mx-2">in</span>
                                <span>{branchName}</span>
                            </div>

                            <Link
                                to={urlBack}
                                className="btn btn--body px-3 py-1.5 !text-sm !font-normal"
                            >
                                Discard changes
                            </Link>
                        </div>

                        <div className="mt-5 border rounded overflow-hidden">
                            <Tab.Group
                                defaultIndex={activeTab}
                                onChange={(index) => setActiveTab(index)}
                            >
                                <Tab.List
                                >
                                    <Tab
                                        className={({ selected }) => classNames(
                                            'px-4 py-3 border-r text-sm',
                                            selected
                                                ? 'bg-white border-b-white font-medium text-extblack'
                                                : 'bg-transparent border-b-transparent text-extblack/70 hover:text-extblack'
                                        )}
                                    >
                                        <FontAwesomeIcon icon={faCode} size="sm" className="mr-1" />
                                        Edit new file
                                    </Tab>
                                    <Tab
                                        className={({ selected }) => classNames(
                                            'px-4 py-3 text-sm',
                                            selected
                                                ? 'bg-white border-b-white border-r font-medium text-extblack'
                                                : 'bg-transparent border-b-transparent text-extblack/70 hover:text-extblack'
                                        )}
                                    >
                                        <FontAwesomeIcon icon={faEye} size="sm" className="mr-1" />
                                        Preview
                                    </Tab>
                                </Tab.List>
                                <Tab.Panels
                                    className="-mt-[1px] border-t"
                                >
                                    <Tab.Panel>
                                        <BlobEditor
                                            language={blobCodeLanguage}
                                            value={values.content}
                                            onChange={(value) => setFieldValue('content', value)}
                                        />
                                    </Tab.Panel>
                                    <Tab.Panel>
                                        <BlobPreview
                                            language={blobCodeLanguage}
                                            value={values.content}
                                        />
                                    </Tab.Panel>
                                </Tab.Panels>
                            </Tab.Group>
                        </div>

                        <FormCommitBlock
                            urlBack={urlBack}
                            isDisabled={!monaco || isSubmitting}
                            isSubmitting={isSubmitting}
                        />
                    </Form>
                )}
            </Formik>
        </div>
    );
}

export default BlobCreatePage;
