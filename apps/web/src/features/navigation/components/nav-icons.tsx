type IconProps = {
  className?: string;
};

const BASE_PROPS = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export function BrandMarkIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE_PROPS} fill="currentColor" stroke="none">
      <path d="M12 2 4 5v6c0 5 3.4 8.6 8 11 4.6-2.4 8-6 8-11V5l-8-3Z" />
    </svg>
  );
}

export function DashboardIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE_PROPS}>
      <rect height="8" rx="1.5" width="8" x="3" y="3" />
      <rect height="4" rx="1.5" width="8" x="13" y="3" />
      <rect height="4" rx="1.5" width="8" x="13" y="9" />
      <rect height="8" rx="1.5" width="8" x="3" y="13" />
    </svg>
  );
}

export function StopWorkIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE_PROPS}>
      <path d="M8.5 3h7L21 8.5v7L15.5 21h-7L3 15.5v-7L8.5 3Z" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

export function PlusCircleIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE_PROPS}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}

export function MdhoApprovalIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE_PROPS}>
      <rect height="16" rx="2" width="14" x="5" y="4" />
      <path d="M9 2h6v3H9z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function ContactsIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE_PROPS}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 4.5c1.7.4 3 1.9 3 3.7s-1.3 3.3-3 3.7" />
      <path d="M20 20c0-2.7-1.7-5-4-5.8" />
    </svg>
  );
}

export function ReportsIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE_PROPS}>
      <path d="M4 20V10" />
      <path d="M12 20V4" />
      <path d="M20 20v-7" />
    </svg>
  );
}

export function BellIconOutline({ className }: IconProps) {
  return (
    <svg className={className} {...BASE_PROPS}>
      <path d="M15 17H9m8-4a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9Z" />
    </svg>
  );
}

export function ProfileIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE_PROPS}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

export function LogOutIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE_PROPS}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE_PROPS}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE_PROPS}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}
