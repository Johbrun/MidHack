// Jeu d'icônes au trait (style Lucide), taille et couleur héritées.
function Icon({ size = 20, className = '', strokeWidth = 1.8, children, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconSearch = (p) => (
  <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>
);
export const IconCart = (p) => (
  <Icon {...p}>
    <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.5L21 8H6.2" />
    <circle cx="10" cy="20.5" r="1" /><circle cx="18" cy="20.5" r="1" />
  </Icon>
);
export const IconUser = (p) => (
  <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>
);
export const IconMenu = (p) => (
  <Icon {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Icon>
);
export const IconX = (p) => (
  <Icon {...p}><path d="M18 6 6 18M6 6l12 12" /></Icon>
);
export const IconChevronDown = (p) => (
  <Icon {...p}><path d="m6 9 6 6 6-6" /></Icon>
);
export const IconChevronRight = (p) => (
  <Icon {...p}><path d="m9 6 6 6-6 6" /></Icon>
);
export const IconArrowRight = (p) => (
  <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>
);
export const IconTruck = (p) => (
  <Icon {...p}>
    <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" />
    <circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" />
  </Icon>
);
export const IconLeaf = (p) => (
  <Icon {...p}>
    <path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15Z" /><path d="M5 19 13 11" />
  </Icon>
);
export const IconShield = (p) => (
  <Icon {...p}>
    <path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" />
  </Icon>
);
export const IconRefresh = (p) => (
  <Icon {...p}>
    <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" /><path d="M4 4v4h4" />
    <path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" /><path d="M20 20v-4h-4" />
  </Icon>
);
export const IconCheck = (p) => (
  <Icon {...p}><path d="m5 12 5 5L20 7" /></Icon>
);
export const IconMinus = (p) => (
  <Icon {...p}><path d="M5 12h14" /></Icon>
);
export const IconPlus = (p) => (
  <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
);
export const IconTrash = (p) => (
  <Icon {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Icon>
);
export const IconWallet = (p) => (
  <Icon {...p}>
    <path d="M4 7a2 2 0 0 1 2-2h12v4" /><path d="M4 7v11a2 2 0 0 0 2 2h14V9H6a2 2 0 0 1-2-2Z" />
    <circle cx="16" cy="14.5" r="1" />
  </Icon>
);
export const IconSend = (p) => (
  <Icon {...p}><path d="M21 3 10 14" /><path d="m21 3-7 18-4-7-7-4 18-7Z" /></Icon>
);
export const IconCard = (p) => (
  <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></Icon>
);
export const IconCrown = (p) => (
  <Icon {...p}><path d="m3 8 4 4 5-7 5 7 4-4-2 11H5L3 8Z" /></Icon>
);
export const IconLogout = (p) => (
  <Icon {...p}><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" /></Icon>
);
export const IconSettings = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </Icon>
);
export const IconSparkles = (p) => (
  <Icon {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" />
  </Icon>
);
export const IconLock = (p) => (
  <Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Icon>
);
export const IconClock = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>
);
export const IconStar = ({ filled = true, size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} aria-hidden="true">
    <path
      d="M10 1.8l2.5 5.2 5.6.7-4.1 3.9 1 5.6L10 14.5l-5 2.7 1-5.6L1.9 7.7l5.6-.7L10 1.8z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);
