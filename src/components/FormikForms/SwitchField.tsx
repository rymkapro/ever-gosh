import React from "react";
import { Switch } from "@headlessui/react";

import { IBaseFieldProps } from "./BaseField";
import { classNames } from "../../utils";
import { ErrorMessage } from "formik";


const SwitchField = (props: IBaseFieldProps) => {
    const { label, labelClassName, errorClassName, form, field } = props;

    return (
        <>
            <Switch.Group>
                <div className="flex items-center">
                    <Switch
                        checked={form.values[field.name]}
                        onChange={(value) => {
                            form.setFieldTouched(field.name, true);
                            form.setFieldValue(field.name, value, true);
                        }}
                        className={classNames(
                            form.values[field.name] ? 'bg-blue-600' : 'bg-gray-200',
                            'relative inline-flex flex-shrink-0 items-center h-5 rounded-full w-9 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500'
                        )}
                    >
                        <span
                            className={classNames(
                                form.values[field.name] ? 'translate-x-5' : 'translate-x-1',
                                'inline-block w-3 h-3 transform bg-white rounded-full transition-transform'
                            )}
                        />
                    </Switch>

                    {label && (
                        <Switch.Label className={classNames('ml-3 text-sm text-gray-700', labelClassName)}>
                            {label}
                        </Switch.Label>
                    )}
                </div>
            </Switch.Group>

            {form.touched[field.name] && form.errors[field.name] && (
                <div className={classNames('mt-1 text-xs text-rose-600', errorClassName)}>
                    <ErrorMessage name={field.name} />
                </div>
            )}
        </>

    );
}

export default SwitchField
