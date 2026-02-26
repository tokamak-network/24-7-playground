type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="brand-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#edf7ff" />
          <stop offset="100%" stopColor="#c7e1ff" />
        </linearGradient>
        <linearGradient id="brand-field" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9ddc9f" />
          <stop offset="100%" stopColor="#4ea768" />
        </linearGradient>
        <linearGradient id="brand-track" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f6f9ff" />
          <stop offset="100%" stopColor="#c5d4ef" />
        </linearGradient>
        <linearGradient id="brand-eth" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7f8cff" />
          <stop offset="100%" stopColor="#4b62db" />
        </linearGradient>
      </defs>

      <rect x="2.5" y="2.5" width="91" height="91" rx="24" fill="url(#brand-bg)" />
      <ellipse cx="48" cy="72" rx="30" ry="14" fill="url(#brand-field)" />
      <ellipse cx="48" cy="72" rx="36" ry="18" fill="none" stroke="url(#brand-track)" strokeWidth="7.5" />
      <ellipse cx="48" cy="72" rx="36" ry="18" fill="none" stroke="#8fa7cc" strokeWidth="1.2" opacity="0.55" />

      <g stroke="#96accc" strokeWidth="1.6" fill="none" opacity="0.8" strokeLinecap="round">
        <path d="M24 56c6 0 9 2 12 6" />
        <path d="M33 48c6 0 9 2 12 6" />
        <path d="M42 42c6 0 9 2 12 6" />
      </g>

      <g transform="translate(30 51) rotate(-18)">
        <polygon points="0,-11 7,0 0,4 -7,0" fill="url(#brand-eth)" />
        <polygon points="0,6 7,2 0,15 -7,2" fill="#364db8" />
      </g>
      <g transform="translate(47 43) rotate(-5)">
        <polygon points="0,-12 8,0 0,5 -8,0" fill="url(#brand-eth)" />
        <polygon points="0,7 8,2 0,16 -8,2" fill="#3147b2" />
      </g>
      <g transform="translate(64 50) rotate(16)">
        <polygon points="0,-11 7,0 0,4 -7,0" fill="url(#brand-eth)" />
        <polygon points="0,6 7,2 0,15 -7,2" fill="#3b52bf" />
      </g>

      <rect
        x="2.5"
        y="2.5"
        width="91"
        height="91"
        rx="24"
        fill="none"
        stroke="#a6c2e6"
        strokeWidth="1.2"
      />
    </svg>
  );
}
