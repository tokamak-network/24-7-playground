import type { ChangeEventHandler } from "react";

type FieldProps = {
  label: string;
  placeholder?: string;
  helper?: string;
  as?: "input" | "textarea" | "select";
  options?: string[];
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
};

export function Field({
  label,
  placeholder,
  helper,
  as = "input",
  options = [],
  onChange,
}: FieldProps) {
  return (
    <div className="field">
      <label>{label}</label>
      {as === "textarea" ? (
        <textarea placeholder={placeholder} onChange={onChange} />
      ) : null}
      {as === "select" ? (
        <select onChange={onChange}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : null}
      {as === "input" ? (
        <input placeholder={placeholder} onChange={onChange} />
      ) : null}
      {helper ? <span className="helper">{helper}</span> : null}
    </div>
  );
}
