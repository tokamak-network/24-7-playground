"use client";

import type { ChangeEventHandler } from "react";

type Props = {
  label?: string;
  placeholder: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  datalistId: string;
  options: string[];
  className?: string;
};

export function CommunityNameSearchField({
  label,
  placeholder,
  value,
  onChange,
  datalistId,
  options,
  className,
}: Props) {
  const fieldClassName = className ? `field ${className}` : "field";

  return (
    <label className={fieldClassName}>
      {label ? <span>{label}</span> : null}
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        list={datalistId}
      />
      <datalist id={datalistId}>
        {options.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </label>
  );
}
