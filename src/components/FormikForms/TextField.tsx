import React from "react";
import { classNames } from "../../utils";
import BaseField, { IBaseFieldProps } from "./BaseField";


interface ITextFieldProps extends IBaseFieldProps {
    inputProps: React.InputHTMLAttributes<HTMLInputElement>;
}

const TextField = (props: ITextFieldProps) => {
    const { inputProps, field, form } = props;
    const { className, ...restInputProps } = inputProps;

    return (
        <BaseField {...props}>
            <input
                className={classNames(
                    className,
                    form.touched[field.name] && form.errors[field.name]
                        ? 'border-rose-600 placeholder:text-rose-600'
                        : 'border-gray-200'
                )}
                {...restInputProps}
                {...field}
            />
        </BaseField>
    );
}

export default TextField
