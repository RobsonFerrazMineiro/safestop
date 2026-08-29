import { cloneElement, type ReactElement } from "react";

import { cn } from "@/lib/utils";

type FormFieldControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

export type FormFieldProps = {
  id: string;
  label: string;
  error?: string | null;
  describedBy?: string;
  children: ReactElement<FormFieldControlProps>;
  className?: string;
};

export function FormField({ id, label, error, describedBy, children, className }: FormFieldProps) {
  const errorId = `${id}-error`;
  const describedByValue = [describedBy, error ? errorId : undefined]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  const control = cloneElement(children, {
    id,
    "aria-describedby": describedByValue.length > 0 ? describedByValue : undefined,
    "aria-invalid": error ? true : children.props["aria-invalid"],
  });

  return (
    <div className={cn("flex flex-col gap-2 text-left", className)}>
      <label className="text-sm font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      {control}
      {error ? (
        <p className="text-sm text-destructive" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
