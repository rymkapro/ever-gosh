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
                    className,
                    form.touched[field.name] && form.errors[field.name]
                        ? 'border-rose-600 focus:ring-rose-200 placeholder:text-rose-600'
                        : 'border-gray-200'
                )}
                {...field}
                {...restInputProps}
            />
        </BaseField>
    );
}

export default TextareaField
