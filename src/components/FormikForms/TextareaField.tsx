import React from "react";
import { classNames } from "../../utils";
import BaseField, { IBaseFieldProps } from "./BaseField";


interface ITextAreaFieldProps extends IBaseFieldProps {
    inputProps: React.InputHTMLAttributes<HTMLTextAreaElement>;
}

const TextareaField = (props: ITextAreaFieldProps) => {
    const { inputProps, field, form } = props;
    const { className, ...restInputProps } = inputProps;

    return (
        <BaseField {...props}>
            <textarea
                className={classNames(
                    'border rounded px-2 py-1 focus:ring-2 focus:ring-extblue/25 focus:outline-none',
                    form.touched[field.name] && form.errors[field.name]
                        ? 'border-rose-600 focus:ring-rose-200 placeholder:text-rose-600'
                        : 'border-gray-200',
                    className
                )}
                {...restInputProps}
                {...field}
            />
        </BaseField>
    );
}

export default TextareaField
