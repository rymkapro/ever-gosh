import React from "react";
import { ErrorMessage, FieldProps } from "formik";
import { classNames } from "../../utils";


export interface IBaseFieldProps extends FieldProps {
    children: React.ReactNode;
    label: string | undefined;
    labelClassName: string | undefined;
    help: string | undefined;
    helpClassName: string | undefined;
    errorClassName: string | undefined;
}

const BaseField = (props: IBaseFieldProps) => {
    const { children, label, labelClassName, help, helpClassName, errorClassName, field, form } = props;

    return (
        <>
            {label && (
                <label
                    htmlFor={field.name}
                    className={classNames(
                        'block mb-1 text-sm font-semibold',
                        labelClassName,
                        form.touched[field.name] && form.errors[field.name] ? 'text-rose-600' : 'text-gray-700'
                    )}
                >
                    {label}
                </label>
            )}
            {children}
            {help && (
                <div className={classNames('text-xs text-gray-500 mt-1', helpClassName)}>
                    {help}
                </div>
            )}
            {form.touched[field.name] && form.errors[field.name] && (
                <div className={classNames('text-xs text-rose-600', errorClassName)}>
                    <ErrorMessage name={field.name} />
                </div>
            )}
        </>
    );
}

export default BaseField
