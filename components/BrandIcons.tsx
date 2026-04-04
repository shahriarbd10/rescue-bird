type IconProps = {
  size?: number;
  className?: string;
};

function SvgWrap({
  size = 18,
  className,
  children
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <SvgWrap {...props}>
      <path d="M12 3 4 7v5c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V7l-8-4Z" />
      <path d="m9.5 12 1.8 1.8L14.8 10" />
    </SvgWrap>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <SvgWrap {...props}>
      <path d="M13 2 5 13h6l-1 9 9-12h-6l1-8Z" />
    </SvgWrap>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <SvgWrap {...props}>
      <path d="M16 20v-1.5A3.5 3.5 0 0 0 12.5 15h-1A3.5 3.5 0 0 0 8 18.5V20" />
      <circle cx="12" cy="9" r="3" />
      <path d="M6 20v-1a3 3 0 0 1 2-2.8" />
      <path d="M18 20v-1a3 3 0 0 0-2-2.8" />
    </SvgWrap>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <SvgWrap {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-3 7-4 1 3-7 4-1Z" />
    </SvgWrap>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <SvgWrap {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" />
      <path d="m4.5 7 7.5 6L19.5 7" />
    </SvgWrap>
  );
}

export function KeyIcon(props: IconProps) {
  return (
    <SvgWrap {...props}>
      <circle cx="8.5" cy="12" r="3.5" />
      <path d="M12 12h8" />
      <path d="M17 12v3" />
      <path d="M20 12v2" />
    </SvgWrap>
  );
}
