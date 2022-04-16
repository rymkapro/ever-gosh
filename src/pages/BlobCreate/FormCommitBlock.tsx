import React from "react";
import { Field } from "formik";
import TextField from "../../components/FormikForms/TextField";
import TextareaField from "../../components/FormikForms/TextareaField";
import { Link } from "react-router-dom";
import { classNames } from "../../utils";
import Spinner from "../../components/Spinner";


type TFormCommitBlockProps = {
    urlBack: string;
    className?: string;
    isDisabled?: boolean;
    isSubmitting?: boolean;
}

const FormCommitBlock = (props: TFormCommitBlockProps) => {
    const { urlBack, className, isDisabled, isSubmitting } = props;

    return (
        <div className={classNames('mt-5 border rounded px-4 py-3', className)}>
            <h3 className="text-lg font-semibold mb-2">Commit data</h3>
            <div>
                <Field
                    name="title"
                    component={TextField}
                    inputProps={{
                        className: 'text-sm py-1.5 w-full',
                        autoComplete: 'off',
                        placeholder: 'Commit title'
                    }}
                />
            </div>
            <div className="mt-3">
                <Field
                    name="message"
                    component={TextareaField}
                    help="Markdown syntax is supported"
                    inputProps={{
                        className: 'text-sm py-1.5 w-full',
                        placeholder: 'Commit optional description'
                    }}
                />
            </div>
            <div className="flex mt-4 items-center gap-3">
                <button
                    className="btn--blue text-sm font-medium px-3 py-1.5"
                    type="submit"
                    disabled={isDisabled}
                >
                    {isSubmitting && <Spinner className="mr-2" />}
                    Commit changes
                </button>
                <Link
                    to={urlBack}
                    className="px-3 py-1.5 border rounded text-sm font-medium text-rose-500 border-rose-500 hover:bg-rose-50"
                >
                    Cancel
                </Link>
            </div>
        </div>
    );
}

export default FormCommitBlock;
