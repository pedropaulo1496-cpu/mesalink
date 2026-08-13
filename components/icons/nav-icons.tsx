import type { ReactNode } from "react";

export function IconSvg({ children }: { children: ReactNode }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.15"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function HomeIcon() {
  return (
    <IconSvg>
      <path d="M3.5 11.5 12 4l8.5 7.5" />
      <path d="M5.5 10.7V20h13v-9.3" />
      <path d="M9.5 20v-6h5v6" />
    </IconSvg>
  );
}

export function CalendarIcon() {
  return (
    <IconSvg>
      <path d="M7 3v4" />
      <path d="M17 3v4" />
      <path d="M4 8h16" />
      <rect x="4" y="5" width="16" height="16" rx="3" />
      <path d="M8 13h4" />
      <path d="M8 17h7" />
    </IconSvg>
  );
}

export function FlashIcon() {
  return (
    <IconSvg>
      <path d="M13 3 5 13.2h5.2L10.5 21 19 9.8h-5.4L13 3Z" />
    </IconSvg>
  );
}

export function BookIcon() {
  return (
    <IconSvg>
      <path d="M6 4h12a2 2 0 0 1 2 2v14H7a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2Z" />
      <path d="M8 8h8" />
      <path d="M8 12h6" />
    </IconSvg>
  );
}

export function GridIcon() {
  return (
    <IconSvg>
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
    </IconSvg>
  );
}

export function UsersIcon() {
  return (
    <IconSvg>
      <path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4" />
      <circle cx="12" cy="9" r="3" />
      <path d="M20 18c0-1.7-1-3.1-2.5-3.7" />
      <path d="M16.5 6.5a2.6 2.6 0 0 1 0 5" />
    </IconSvg>
  );
}

export function GlobeIcon() {
  return (
    <IconSvg>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16" />
      <path d="M12 4c2.2 2.2 3.2 5 3.2 8s-1 5.8-3.2 8" />
      <path d="M12 4C9.8 6.2 8.8 9 8.8 12s1 5.8 3.2 8" />
    </IconSvg>
  );
}

export function QrIcon() {
  return (
    <IconSvg>
      <path d="M4 4h6v6H4z" />
      <path d="M14 4h6v6h-6z" />
      <path d="M4 14h6v6H4z" />
      <path d="M14 14h2" />
      <path d="M18 14h2v2" />
      <path d="M14 18h2v2" />
      <path d="M18 20h2" />
    </IconSvg>
  );
}

export function MegaphoneIcon() {
  return (
    <IconSvg>
      <path d="M4 13h3l9 4V7l-9 4H4z" />
      <path d="M7 13v5" />
      <path d="M18.5 9.5a4 4 0 0 1 0 5" />
    </IconSvg>
  );
}

export function AiVisibilityIcon() {
  return (
    <IconSvg>
      <path d="M12 3l1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" />
      <path d="M18.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
      <path d="M5.5 14l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
    </IconSvg>
  );
}

export function RevenueAiIcon() {
  return (
    <IconSvg>
      <path d="M12 3v18" />
      <path d="M16.5 6.5c-.9-.9-2.3-1.5-4.1-1.5-2.5 0-4.4 1.3-4.4 3.3 0 5 8.5 1.8 8.5 6.8 0 2.2-1.9 3.9-4.8 3.9-1.8 0-3.5-.6-4.7-1.8" />
      <path d="m18.5 4 .7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
    </IconSvg>
  );
}

export function PartnerNetworkIcon() {
  return (
    <IconSvg>
      <path d="m8.5 12 2 2 5-5" />
      <path d="M7.5 6.5 4 8v6l4 2" />
      <path d="m16.5 6.5 3.5 1.5v6l-4 2" />
      <path d="M8.5 6.5 12 4l3.5 2.5" />
      <path d="M8 16.5 12 20l4-3.5" />
    </IconSvg>
  );
}

export function GiftIcon() {
  return (
    <IconSvg>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M3 7h18v4H3z" />
      <path d="M12 7v13" />
      <path d="M12 7H8.5a2.5 2.5 0 1 1 2.2-3.7L12 7Z" />
      <path d="M12 7h3.5a2.5 2.5 0 1 0-2.2-3.7L12 7Z" />
    </IconSvg>
  );
}

export function PosIcon() {
  return (
    <IconSvg>
      <rect x="5" y="3" width="14" height="18" rx="2.5" />
      <path d="M8 7h8" />
      <path d="M8 12h2" />
      <path d="M12 12h2" />
      <path d="M16 12h.01" />
      <path d="M8 16h2" />
      <path d="M12 16h2" />
      <path d="M16 16h.01" />
    </IconSvg>
  );
}

export function MenuIcon() {
  return (
    <IconSvg>
      <path d="M5 5h14" />
      <path d="M5 12h14" />
      <path d="M5 19h14" />
      <path d="M8 8h8" />
      <path d="M8 15h8" />
    </IconSvg>
  );
}

export function BillingIcon() {
  return (
    <IconSvg>
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="M4 9h16" />
      <path d="M8 14h4" />
      <path d="M15.5 14h.01" />
    </IconSvg>
  );
}

export function SettingsIcon() {
  return (
    <IconSvg>
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
      <path d="M19.4 15a1.8 1.8 0 0 0 .3 2l.1.1a2.1 2.1 0 0 1-3 3l-.1-.1a1.8 1.8 0 0 0-2-.3 1.8 1.8 0 0 0-1 1.6V21a2.1 2.1 0 0 1-4.2 0v-.2a1.8 1.8 0 0 0-1-1.6 1.8 1.8 0 0 0-2 .3l-.1.1a2.1 2.1 0 0 1-3-3l.1-.1a1.8 1.8 0 0 0 .3-2 1.8 1.8 0 0 0-1.6-1H2a2.1 2.1 0 0 1 0-4.2h.2a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0-.3-2l-.1-.1a2.1 2.1 0 0 1 3-3l.1.1a1.8 1.8 0 0 0 2 .3h.1a1.8 1.8 0 0 0 1-1.6V3a2.1 2.1 0 0 1 4.2 0v.2a1.8 1.8 0 0 0 1 1.6h.1a1.8 1.8 0 0 0 2-.3l.1-.1a2.1 2.1 0 0 1 3 3l-.1.1a1.8 1.8 0 0 0-.3 2v.1a1.8 1.8 0 0 0 1.6 1h.2a2.1 2.1 0 0 1 0 4.2h-.2a1.8 1.8 0 0 0-1.6 1Z" />
    </IconSvg>
  );
}

export function MoreIcon() {
  return (
    <IconSvg>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </IconSvg>
  );
}
