"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { describedBy, Field, Input, Select, Textarea } from "./Field";
import type { FormState } from "./Form";

interface Common {
  name: string;
  label: string;
  state: FormState;
  hint?: string;
  optionalLabel?: string;
  defaultValue?: string;
}

function useFieldProps({ name, state, hint, defaultValue }: Common) {
  const id = `f-${name.replace(/[^\w-]/g, "-")}`;
  const error = state.fieldErrors?.[name];
  return {
    id,
    error,
    controlProps: {
      id,
      name,
      defaultValue: state.values?.[name] ?? defaultValue,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": describedBy(id, hint, error),
    },
  };
}

export function TextField(props: Common & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "defaultValue">) {
  const { name, label, state, hint, optionalLabel, defaultValue, ...rest } = props;
  const { id, error, controlProps } = useFieldProps({ name, label, state, hint, defaultValue });
  return (
    <Field id={id} label={label} hint={hint} error={error} optionalLabel={optionalLabel}>
      <Input {...controlProps} {...rest} key={controlProps.defaultValue} />
    </Field>
  );
}

export function TextAreaField(props: Common & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "defaultValue">) {
  const { name, label, state, hint, optionalLabel, defaultValue, ...rest } = props;
  const { id, error, controlProps } = useFieldProps({ name, label, state, hint, defaultValue });
  return (
    <Field id={id} label={label} hint={hint} error={error} optionalLabel={optionalLabel}>
      <Textarea {...controlProps} {...rest} key={controlProps.defaultValue} />
    </Field>
  );
}

export function SelectField(
  props: Common & Omit<SelectHTMLAttributes<HTMLSelectElement>, "name" | "defaultValue"> & { children: ReactNode },
) {
  const { name, label, state, hint, optionalLabel, defaultValue, children, ...rest } = props;
  const { id, error, controlProps } = useFieldProps({ name, label, state, hint, defaultValue });
  return (
    <Field id={id} label={label} hint={hint} error={error} optionalLabel={optionalLabel}>
      <Select {...controlProps} {...rest} key={controlProps.defaultValue}>
        {children}
      </Select>
    </Field>
  );
}
