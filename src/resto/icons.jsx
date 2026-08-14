import React from "react";

/* ==========================================================================
   Jeu d'icônes au trait — une seule grille, une seule graisse.
   Les emojis restent réservés aux plats ; toute l'interface passe par ici.
   ========================================================================== */

const P = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };

const PATHS = {
  // Interfaces
  phone: <><rect x="7" y="2.5" width="10" height="19" rx="2.6" /><path d="M11 18.6h2" /></>,
  kitchen: <><path d="M4 20h16" /><path d="M6.5 20v-4.2" /><path d="M17.5 20v-4.2" /><path d="M5 15.8h14a5 5 0 0 0-1.1-8.2A4.2 4.2 0 0 0 12 4.6a4.2 4.2 0 0 0-5.9 3A5 5 0 0 0 5 15.8Z" /></>,
  desktop: <><rect x="2.6" y="4" width="18.8" height="12.4" rx="2" /><path d="M9 20.4h6M12 16.4v4" /></>,

  // Modes de commande
  dinein: <><path d="M6 3v8a2.4 2.4 0 0 0 4.8 0V3" /><path d="M8.4 11v10" /><path d="M17 3c-1.7 1.2-2.4 3-2.4 5.2 0 1.7.9 2.8 2.4 3V21" /></>,
  takeaway: <><path d="M4.4 8h15.2l-1.3 12.1a1.4 1.4 0 0 1-1.4 1.2H7.1a1.4 1.4 0 0 1-1.4-1.2Z" /><path d="M3 4.6h18L19.6 8H4.4Z" /><path d="M9.6 12.4l1 5.2M14.4 12.4l-1 5.2" /></>,

  // Métier
  chart: <><path d="M3.4 20.6h17.2" /><path d="M6.6 20.6v-6.4M11 20.6V8M15.4 20.6v-4.2M19.8 20.6V4.6" /></>,
  orders: <><path d="M5.2 3.4h13.6v17.2l-2.3-1.6-2.3 1.6-2.2-1.6-2.3 1.6-2.2-1.6-2.3 1.6Z" /><path d="M8.6 8.4h6.8M8.6 12.4h6.8" /></>,
  cash: <><rect x="2.6" y="6" width="18.8" height="12" rx="2.2" /><circle cx="12" cy="12" r="2.6" /><path d="M6 10v4M18 10v4" /></>,
  menu: <><rect x="3.6" y="3.6" width="16.8" height="16.8" rx="3" /><path d="M7.6 8.6h8.8M7.6 12h8.8M7.6 15.4h5.4" /></>,
  users: <><circle cx="9.2" cy="8.4" r="3.4" /><path d="M3 20.2a6.3 6.3 0 0 1 12.4 0" /><path d="M16 5.4a3.4 3.4 0 0 1 0 6.5" /><path d="M17.4 14.4a5.5 5.5 0 0 1 3.6 5" /></>,
  qr: <><rect x="3.4" y="3.4" width="6.6" height="6.6" rx="1.4" /><rect x="14" y="3.4" width="6.6" height="6.6" rx="1.4" /><rect x="3.4" y="14" width="6.6" height="6.6" rx="1.4" /><path d="M14 14h3v3h-3zM20.6 14v3M17.6 20.6h3M14 20.6h.6" /></>,
  journal: <><circle cx="12" cy="12" r="8.8" /><path d="M12 6.8V12l3.4 2" /></>,

  // Actions et états
  bell: <><path d="M6.4 9.4a5.6 5.6 0 0 1 11.2 0c0 4 1.5 5.6 1.5 5.6H4.9s1.5-1.6 1.5-5.6Z" /><path d="M10.2 18.6a2 2 0 0 0 3.6 0" /></>,
  cart: <><circle cx="9.6" cy="19.4" r="1.5" /><circle cx="17.4" cy="19.4" r="1.5" /><path d="M2.6 3.6h2.6l2.4 11.4h11l2-8H6.4" /></>,
  check: <path d="M4.8 12.6 9.6 17.4 19.2 6.6" />,
  clock: <><circle cx="12" cy="12" r="8.8" /><path d="M12 7v5.3l3.2 1.9" /></>,
  download: <><path d="M12 3.4v11.4" /><path d="M7.6 10.6 12 15l4.4-4.4" /><path d="M4 18.4v1.2a1.4 1.4 0 0 0 1.4 1.4h13.2a1.4 1.4 0 0 0 1.4-1.4v-1.2" /></>,
  print: <><path d="M7 8.4V3.6h10v4.8" /><rect x="3.6" y="8.4" width="16.8" height="7.6" rx="2" /><path d="M7 13.6h10v6.8H7z" /></>,
  spark: <><path d="M12 3.2 13.9 9l5.9 2-5.9 2-1.9 5.8L10.1 13l-5.9-2 5.9-2Z" /></>,
  target: <><circle cx="12" cy="12" r="8.8" /><circle cx="12" cy="12" r="4.2" /><circle cx="12" cy="12" r=".6" /></>,
  pin: <><path d="M19 10.2c0 5.2-7 11-7 11s-7-5.8-7-11a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.6" /></>,
  edit: <><path d="M14.6 4.4 19.6 9.4 8.4 20.6H3.4v-5Z" /><path d="M12.8 6.2 17.8 11.2" /></>,
  card: <><rect x="2.4" y="5.4" width="19.2" height="13.2" rx="2.4" /><path d="M2.4 10h19.2" /><path d="M6 14.6h4" /></>,
  flag: <><path d="M5.4 21V3.6" /><path d="M5.4 4.6c2-1.3 4-1.3 6 0s4 1.3 6 0v9.6c-2 1.3-4 1.3-6 0s-4-1.3-6 0Z" /></>,

  // Catégories de la carte
  burger: <><path d="M3.6 10.6c0-3 3.8-5.4 8.4-5.4s8.4 2.4 8.4 5.4Z" /><path d="M3 11.4h18v1.4a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 12.8Z" /><path d="M3.6 16h16.8" /><path d="M4.4 16c0 2.4 1.6 4.2 7.6 4.2s7.6-1.8 7.6-4.2" /></>,
  drumstick: <><path d="M9.6 14.4c-2.4 2.4-4.4 3-5.6 4.2a2 2 0 0 0 2.8 2.8c1.2-1.2 1.8-3.2 4.2-5.6Z" /><path d="M9.6 14.4a6.6 6.6 0 0 1 0-9.3c2.7-2.7 7.4-2.5 10.5.6s3.3 7.8.6 10.5a6.6 6.6 0 0 1-9.3 0Z" /><path d="M13.4 6.6a4.6 4.6 0 0 1 4 4" /></>,
  sandwich: <><path d="M3.4 11.2h17.2v2.4a2.4 2.4 0 0 1-2.4 2.4H5.8a2.4 2.4 0 0 1-2.4-2.4Z" /><path d="M4.6 11.2a7.4 3 0 0 1 14.8 0" /><path d="M6.6 16v2M12 16v2M17.4 16v2" /></>,
  tray: <><rect x="2.8" y="5" width="18.4" height="14" rx="2" /><path d="M12 5v14" /><path d="M2.8 12h8.2M13 9.4h6.2M13 14.6h6.2" /></>,
  hotdog: <><path d="M4.4 15.4a3.4 3.4 0 0 1 0-6.8h15.2a3.4 3.4 0 0 1 0 6.8Z" /><path d="M6 9.4c1-2 2.6-3 4-3M14 9.4c1-2 2.6-3 4-3" /><path d="M7.2 12h9.6" /></>,
  salad: <><path d="M3 12.6a9 9 0 0 1 18 0Z" /><path d="M3 12.6h18" /><path d="M6 12.6c-.6-3 1-6 3.4-7.4M12 12.6c0-3.4.6-6.4 2-8.2M17 12.6c.4-2.4-.2-4.6-1.6-6.2" /></>,
  fries: <><path d="M5.4 10.4 6.6 20h10.8l1.2-9.6" /><path d="M4.4 10.4h15.2l-.9-2.2H5.3Z" /><path d="M9.6 8.2V5M12 8.2V4.4M14.4 8.2V5.4" /></>,
  extras: <><circle cx="12" cy="12" r="9" /><path d="M12 7.6v8.8M7.6 12h8.8" /></>,
  dessert: <><path d="M4.6 20.2 9 8.6a3.2 3.2 0 0 1 6 0l4.4 11.6Z" /><path d="M7.4 15.4h9.2" /><path d="M12 8.6V3.8" /><path d="M9.6 4.6c.8-1 1.8-1 2.4-.6" /></>,
  drink: <><path d="M6.4 8.4h11.2l-1.4 11a2 2 0 0 1-2 1.8h-4.4a2 2 0 0 1-2-1.8Z" /><path d="M5.4 8.4h13.2" /><path d="M9.6 6.6c0-1.6 1-2.8 2.4-2.8s2.4 1.2 2.4 2.8" /></>,
};

export function Icon({ name, size = 18, stroke = 1.7, color = "currentColor", style }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      stroke={color}
      strokeWidth={stroke}
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0, ...style }}
      {...P}
    >
      {d}
    </svg>
  );
}

/* Icône du mode de commande, pour ne pas disperser la correspondance. */
export const MODE_ICON = { sur_place: "dinein", emporter: "takeaway" };
