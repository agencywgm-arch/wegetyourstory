/* ==========================================================================
   WELL DONE — direction artistique
   Fond blanc, vert et or en accents (boutons d'action, prix), surfaces
   claires en verre dépoli, typographie large et serrée. Toute la couleur
   du SaaS sort d'ici.
   ========================================================================== */

export const W = {
  /* Fonds — du plus clair au légèrement voilé */
  void: "#FFFFFF",
  forest: "#F6F1E7",
  surface: "#FFFFFF",
  surfaceUp: "#F7F3EA",
  surfaceHi: "#FFFFFF",

  /* Traits */
  line: "rgba(169,129,58,0.22)",
  lineSoft: "rgba(15,36,19,0.08)",
  lineStrong: "rgba(169,129,58,0.4)",

  /* Texte */
  text: "#16241A",
  textSoft: "rgba(22,36,26,0.64)",
  textDim: "rgba(22,36,26,0.42)",

  /* Marque */
  gold: "#A9812F",
  goldLt: "#C69A63",
  green: "#2F8A1E",
  greenLt: "#4CA435",
  orange: "#D9661C",

  /* États */
  danger: "#E53E3E",
  warn: "#B9790A",
  ok: "#2F8A1E",
  info: "#1F7FC1",

  /* Ink : toujours sombre, quel que soit le fond — texte sur pastille dorée
     ou verte, wordmark sur fond clair. */
  cream: "#F7F3EA",
  creamAlt: "#EFE8D8",
  ink: "#16241A",
};

export const FONT = {
  fontFamily:
    "'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

/* Titres : large, serré, comme une page produit. */
export const display = (size, weight = 900) => ({
  ...FONT,
  fontSize: size,
  fontWeight: weight,
  letterSpacing: size > 40 ? "-0.035em" : size > 26 ? "-0.025em" : "-0.015em",
  lineHeight: 1.04,
});

export const label = (size = 12, weight = 700) => ({
  ...FONT,
  fontSize: size,
  fontWeight: weight,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
});

/* Panneau de verre : la surface de base de toute l'interface. */
export const glass = (elev = 1) => ({
  background:
    elev >= 2
      ? "linear-gradient(160deg, rgba(255,255,255,0.96), rgba(247,243,234,0.94))"
      : "linear-gradient(160deg, rgba(255,255,255,0.9), rgba(247,243,234,0.86))",
  border: `1px solid ${W.line}`,
  borderRadius: 22,
  backdropFilter: "blur(20px)",
  boxShadow:
    elev >= 2
      ? "0 24px 60px rgba(35,25,10,0.14), inset 0 1px 0 rgba(255,255,255,0.6)"
      : "0 10px 28px rgba(35,25,10,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
});

export const goldText = {
  background: `linear-gradient(135deg, ${W.gold}, #8A6626)`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

/* Motif géométrique de la marque, en filigrane derrière les grands aplats. */
export const brandPattern = (opacity = 0.05) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'>
      <g fill='none' stroke='rgb(169,129,58)' stroke-width='2' opacity='${opacity}'>
        <circle cx='30' cy='30' r='18'/>
        <path d='M90 12 A18 18 0 0 1 108 30 L90 30 Z'/>
        <circle cx='150' cy='42' r='10'/>
        <path d='M18 96 h36 v36 z'/>
        <circle cx='108' cy='108' r='22'/>
        <path d='M144 132 A18 18 0 0 0 162 150'/>
        <path d='M42 156 h30'/>
      </g>
    </svg>`
  )}")`;

/* Halo lumineux : donne la profondeur des pages produit. */
export const glow = (color, size = 620) =>
  `radial-gradient(${size}px circle at var(--gx,50%) var(--gy,0%), ${color}, transparent 70%)`;
