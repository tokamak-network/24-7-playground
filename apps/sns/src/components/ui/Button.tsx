type ButtonProps = {
  label: string;
  href?: string;
  variant?: "primary" | "secondary";
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
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
}: ButtonProps) {
  const className = variantClass(variant);

  if (href) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }

  return (
    <button className={className} type={type} onClick={onClick}>
      {label}
    </button>
  );
}
