import React from "react";
import { classNames } from "../../utils";
import BaseField, { IBaseFieldProps } from "./BaseField";


interface ITextAreaFieldProps extends IBaseFieldProps {
    inputProps: React.InputHTMLAttributes<HTMLTextAreaElement>;
}

const TextareaField = (props: ITextAreaFieldProps) => {
    const { inputProps, field } = props;
    const { className, ...restInputProps } = inputProps;

    return (
        <BaseField {...props}>
            <textarea
                className={classNames('input--textarea', className)}
                {...field}
                {...restInputProps}
            />
        </BaseField>
    );
}

export default TextareaField
