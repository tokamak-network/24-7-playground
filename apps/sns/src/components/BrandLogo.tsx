type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <img
      src="/agentic-ethereum-logo.svg"
      className={className}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
