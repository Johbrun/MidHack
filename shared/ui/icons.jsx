// Jeu d'icônes au trait commun au Hacking QG et au dashboard : même grille
// 24px, même épaisseur, pour que la navigation, les tuiles et les boutons se
// répondent d'une application à l'autre. (Le BananaShop garde le sien : il doit
// ressembler à une vraie boutique, pas aux outils de l'atelier.)
function Icon({ size = 16, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p) => (
  <Icon {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></Icon>
);
export const IconTarget = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></Icon>
);
export const IconRadio = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14" /></Icon>
);
export const IconFlag = (p) => (
  <Icon {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><path d="M4 22v-7" /></Icon>
);
export const IconList = (p) => (
  <Icon {...p}><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></Icon>
);
export const IconBook = (p) => (
  <Icon {...p}><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" /><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" /></Icon>
);
export const IconDownload = (p) => (
  <Icon {...p}><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></Icon>
);
export const IconMessage = (p) => (
  <Icon {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Icon>
);
export const IconLock = (p) => (
  <Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Icon>
);
export const IconLockOpen = (p) => (
  <Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.75-1.4" /></Icon>
);
export const IconSun = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></Icon>
);
export const IconMoon = (p) => (
  <Icon {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></Icon>
);
export const IconCopy = (p) => (
  <Icon {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></Icon>
);
export const IconCheck = (p) => (
  <Icon {...p}><path d="M20 6 9 17l-5-5" /></Icon>
);
export const IconArrowRight = (p) => (
  <Icon {...p}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></Icon>
);
export const IconArrowLeft = (p) => (
  <Icon {...p}><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></Icon>
);
export const IconExternal = (p) => (
  <Icon {...p}><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></Icon>
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
export const IconChevronLeft = (p) => (
  <Icon {...p}><path d="m15 6-6 6 6 6" /></Icon>
);
export const IconSidebar = (p) => (
  <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></Icon>
);
export const IconArrowDown = (p) => (
  <Icon {...p}><path d="M12 5v14" /><path d="m6 13 6 6 6-6" /></Icon>
);
export const IconCompass = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></Icon>
);
export const IconBulb = (p) => (
  <Icon {...p}><path d="M9 18h6M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.74V16h8v-1.26A7 7 0 0 0 12 2z" /></Icon>
);
export const IconWrench = (p) => (
  <Icon {...p}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></Icon>
);
export const IconMaximize = (p) => (
  <Icon {...p}><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" /></Icon>
);
export const IconMinimize = (p) => (
  <Icon {...p}><path d="M3 8h5V3M21 8h-5V3M3 16h5v5M21 16h-5v5" /></Icon>
);
export const IconShield = (p) => (
  <Icon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Icon>
);
export const IconTrash = (p) => (
  <Icon {...p}><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /><path d="M9 7V4h6v3" /></Icon>
);
export const IconTerminal = (p) => (
  <Icon {...p}><path d="m5 7 4 4-4 4" /><path d="M13 15h6" /></Icon>
);
export const IconKey = (p) => (
  <Icon {...p}><circle cx="8" cy="14" r="4" /><path d="m10.8 11.2 8.2-8.2" /><path d="m17 5 2.5 2.5" /><path d="m14.5 7.5 2.5 2.5" /></Icon>
);
export const IconRocket = (p) => (
  <Icon {...p}><path d="M12 2c3.5 2.3 5.5 6 5.5 10l-2.5 3h-6l-2.5-3C6.5 8 8.5 4.3 12 2z" /><circle cx="12" cy="9" r="1.8" /><path d="M8.5 16.5 6 19l2 .5.5 2 2.5-2.5M15.5 16.5 18 19l-2 .5-.5 2-2.5-2.5" /></Icon>
);
// Loupe : icône de la page « Pick the line » (revue de code).
export const IconSearch = (p) => (
  <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></Icon>
);
// Schéma de flux (nœuds reliés) : icône de la page Threat Model.
export const IconSitemap = (p) => (
  <Icon {...p}><rect x="9" y="3" width="6" height="5" rx="1" /><rect x="3" y="16" width="6" height="5" rx="1" /><rect x="15" y="16" width="6" height="5" rx="1" /><path d="M12 8v4M12 12H6v4M12 12h6v4" /></Icon>
);
// Maillons de chaîne : icône de la page Kill Chain.
export const IconLink = (p) => (
  <Icon {...p}><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.1" /><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.1" /></Icon>
);
// Éditeur de scénarios Kill Chain : créer, modifier, importer.
export const IconPlus = (p) => (
  <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
);
export const IconPencil = (p) => (
  <Icon {...p}><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></Icon>
);
export const IconUpload = (p) => (
  <Icon {...p}><path d="M12 15V3" /><path d="m7 8 5-5 5 5" /><path d="M5 21h14" /></Icon>
);
export const IconArrowUp = (p) => (
  <Icon {...p}><path d="M12 19V5" /><path d="m6 11 6-6 6 6" /></Icon>
);

// ─── Icônes propres au dashboard ───
export const IconDrop = (p) => (
  <Icon {...p}><path d="M12 2.5s-6.5 7.1-6.5 12a6.5 6.5 0 0 0 13 0c0-4.9-6.5-12-6.5-12z" /></Icon>
);
export const IconSnowflake = (p) => (
  <Icon {...p}><path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7" /><path d="m9 4 3 3 3-3M9 20l3-3 3 3" /></Icon>
);
export const IconClock = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>
);
export const IconMegaphone = (p) => (
  <Icon {...p}><path d="M3 11v2a1 1 0 0 0 1 1h3l6 5V5L7 10H4a1 1 0 0 0-1 1z" /><path d="M17 8.5a5 5 0 0 1 0 7M19.5 6a8.5 8.5 0 0 1 0 12" /></Icon>
);
export const IconRefresh = (p) => (
  <Icon {...p}><path d="M20 11a8 8 0 0 0-14.9-3.9L4 9" /><path d="M4 4v5h5" /><path d="M4 13a8 8 0 0 0 14.9 3.9L20 15" /><path d="M20 20v-5h-5" /></Icon>
);
export const IconUnlock = (p) => (
  <Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.75-1.4" /></Icon>
);
export const IconAlert = (p) => (
  <Icon {...p}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></Icon>
);
export const IconGrid = (p) => (
  <Icon {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></Icon>
);
export const IconSliders = (p) => (
  <Icon {...p}><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></Icon>
);
export const IconUsers = (p) => (
  <Icon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Icon>
);
export const IconPlay = (p) => (
  <Icon {...p}><path d="M7 4.5v15l12-7.5z" /></Icon>
);
export const IconStop = (p) => (
  <Icon {...p}><rect x="6" y="6" width="12" height="12" rx="1.5" /></Icon>
);
export const IconLogout = (p) => (
  <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></Icon>
);
export const IconServer = (p) => (
  <Icon {...p}><rect x="3" y="4" width="18" height="7" rx="1.5" /><rect x="3" y="13" width="18" height="7" rx="1.5" /><path d="M7 7.5h.01M7 16.5h.01" /></Icon>
);
export const IconTrophy = (p) => (
  <Icon {...p}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></Icon>
);
