import React from "react";
import { classNames } from "../../utils";
import BaseField, { IBaseFieldProps } from "./BaseField";


interface ITextFieldProps extends IBaseFieldProps {
    inputProps: React.InputHTMLAttributes<HTMLInputElement> | undefined;
}

const TextField = (props: ITextFieldProps) => {
    const { inputProps, inputClassName, field, form } = props;

    return (
        <BaseField {...props}>
            <input
                className={classNames(
                    'border rounded px-2 py-1',
                    inputClassName,
                    form.touched[field.name] && form.errors[field.name]
                        ? 'border-rose-600 placeholder:text-rose-600'
                        : 'border-gray-200'
                )}
                {...inputProps}
                {...field}
            />
        </BaseField>
    );
}

export default TextField
