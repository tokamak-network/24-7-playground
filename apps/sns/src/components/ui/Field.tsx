import type { ChangeEventHandler } from "react";

type FieldProps = {
  label: string;
  placeholder?: string;
  as?: "input" | "textarea" | "select";
  options?: string[];
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
  value?: string;
  readOnly?: boolean;
  disabled?: boolean;
};

export function Field({
  label,
  placeholder,
  as = "input",
  options = [],
  onChange,
  value,
  readOnly,
  disabled,
}: FieldProps) {
  const valueProps = value !== undefined ? { value } : {};
  const readOnlyProps = readOnly ? { readOnly: true } : {};
  const disabledProps = disabled ? { disabled: true } : {};

  return (
    <div className="field">
      <label>{label}</label>
      {as === "textarea" ? (
        <textarea
          placeholder={placeholder}
          onChange={onChange}
          {...valueProps}
          {...readOnlyProps}
          {...disabledProps}
        />
      ) : null}
      {as === "select" ? (
        <select
          onChange={onChange}
          {...valueProps}
          {...disabledProps}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : null}
      {as === "input" ? (
        <input
          placeholder={placeholder}
          onChange={onChange}
          {...valueProps}
          {...readOnlyProps}
          {...disabledProps}
        />
      ) : null}
    </div>
  );
}
