import React, { useState } from "react";
import { faChevronRight, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Field, Form, Formik, FormikHelpers } from "formik";
import { useMutation, useQuery } from "react-query";
import { Link, useOutletContext, useParams } from "react-router-dom";
import BranchSelect from "../../components/BranchSelect";
import TextField from "../../components/FormikForms/TextField";
import Spinner from "../../components/Spinner";
import { getGoshRepositoryBranches } from "../../helpers";
import { TGoshBranch } from "../../types/types";
import { TRepositoryLayoutOutletContext } from "../RepositoryLayout";
import * as Yup from "yup";


type TCreateBranchFormValues = {
    branchName: string;
    fromName: string;
}

export const BranchesPage = () => {
    const { goshRepository } = useOutletContext<TRepositoryLayoutOutletContext>();
    const { repoName } = useParams();
    const [branch, setBranch] = useState<TGoshBranch>();
    const [search, setSearch] = useState<string>();
    const [branchesOnMutation, setBranchesOnMutation] = useState<string[]>([]);
    const brachesListQuery = useQuery(
        ['branchesList'],
        async (): Promise<TGoshBranch[]> => {
            const { branches, branch } = await getGoshRepositoryBranches(goshRepository);
            setBranch(branch);
            return branches;
        },
        {
            enabled: !!goshRepository,
            select: (data) => {
                if (!search) return data;
                const pattern = new RegExp(search, 'i');
                return data.filter((branch) => branch.name.search(pattern) >= 0);
            }
        }
    );
    const branchDeleteMutation = useMutation(
        (name: string) => {
            return goshRepository.deleteBranch(name);
        },
        {
            onMutate: (variables) => {
                setBranchesOnMutation((value) => [...value, variables]);
            },
            onSuccess: () => {
                brachesListQuery.refetch()
            },
            onError: (error: any) => {
                console.error(error);
                alert(error.message);
            },
            onSettled: (data, error, variables) => {
                setBranchesOnMutation((value) => value.filter((item) => item !== variables));
            }
        }
    )

    const onBranchCreate = async (
        values: TCreateBranchFormValues,
        helpers: FormikHelpers<TCreateBranchFormValues>
    ) => {
        try {
            await goshRepository.createBranch(values.branchName, values.fromName);
            await brachesListQuery.refetch();
            helpers.resetForm();
        } catch (e: any) {
            console.error(e);
            alert(e.message);
        }
    }

    const onBranchDelete = (name: string) => {
        if (window.confirm(`Delete branch '${name}'?`)) {
            branchDeleteMutation.mutate(name);
        }
    }

    if (brachesListQuery.isIdle || brachesListQuery.isLoading) return <Spinner />
    return (
        <>
            <div className="flex justify-between gap-4">
                <Formik
                    initialValues={{ branchName: '', fromName: branch?.name || 'master' }}
                    onSubmit={onBranchCreate}
                    validationSchema={Yup.object().shape({
                        branchName: Yup.string()
                            .notOneOf((brachesListQuery.data || []).map((b) => b.name), 'Branch exists')
                            .required('Branch name is required'),
                        fromName: Yup.string().required(' ')
                    })}
                >
                    {({ isSubmitting, setFieldValue }) => (
                        <Form className="flex items-baseline">
                            <BranchSelect
                                branch={branch}
                                branches={brachesListQuery.data || []}
                                onChange={(selected) => {
                                    setBranch(selected);
                                    setFieldValue('fromName', selected?.name);
                                }}
                            />
                            <span className="mx-3">
                                <FontAwesomeIcon icon={faChevronRight} size="sm" />
                            </span>
                            <div>
                                <Field
                                    name="branchName"
                                    component={TextField}
                                    inputProps={{
                                        placeholder: 'Branch name',
                                        autoComplete: 'off',
                                        className: 'input--text text-sm py-1.5'
                                    }}
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn--blue px-3 py-1.5 ml-3 text-sm"
                                disabled={isSubmitting}
                            >
                                {isSubmitting && <Spinner className="mr-2" />}
                                Create branch
                            </button>
                        </Form>
                    )}
                </Formik>

                <div>
                    <input
                        type="text"
                        className="input--text text-sm py-1.5"
                        placeholder="Search branch"
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded mt-5">
                <div className="bg-gray-100 px-3 py-1.5 text-sm font-medium border-b">
                    Repository branches
                </div>
                {brachesListQuery.data?.map((branch, index) => (
                    <div key={index} className="flex gap-4 items-center px-3 py-2 border-b last:border-b-0 text-sm">
                        <div className="grow">
                            <Link
                                to={`/repositories/${repoName}/tree/${branch.name}`}
                                className="hover:underline"
                            >
                                {branch.name}
                            </Link>
                        </div>
                        <div>
                            {branch.name !== 'master' && (
                                <button
                                    type="button"
                                    className="px-2.5 py-1.5 text-white text-xs rounded bg-rose-600 hover:bg-rose-500 disabled:bg-rose-400"
                                    onClick={() => onBranchDelete(branch.name)}
                                    disabled={branchDeleteMutation.isLoading && branchesOnMutation.indexOf(branch.name) >= 0}
                                >
                                    {branchDeleteMutation.isLoading && branchesOnMutation.indexOf(branch.name) >= 0
                                        ? <Spinner size="xs" />
                                        : <FontAwesomeIcon icon={faTrash} size="sm" />
                                    }
                                    <span className="ml-2">Delete</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

export default BranchesPage;
