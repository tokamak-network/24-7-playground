type ButtonProps = {
  label: string;
  href?: string;
  variant?: "primary" | "secondary";
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
};

const variantClass = (variant: "primary" | "secondary") => {
  if (variant === "secondary") {
    return "button button-secondary";
  }
  return "button";
};

export function Button({
  label,
  href,
  variant = "primary",
  type = "button",
  onClick,
  disabled = false,
}: ButtonProps) {
  const className = variantClass(variant);

  if (href) {
    return (
      <a
        href={href}
        className={className}
        aria-disabled={disabled ? "true" : undefined}
      >
        {label}
      </a>
    );
  }

  return (
    <button
      className={className}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
