/* ==========================================================================
   WELL DONE — direction artistique
   Vert forêt profond, or bronze, vert vif. Surfaces sombres, verre dépoli,
   typographie large et serrée. Toute la couleur du SaaS sort d'ici.
   ========================================================================== */

export const W = {
  /* Fonds — du plus profond au plus clair */
  void: "#0A1A0D",
  forest: "#0F2413",
  surface: "#16351A",
  surfaceUp: "#1D4223",
  surfaceHi: "#25512B",

  /* Traits */
  line: "rgba(198,154,99,0.18)",
  lineSoft: "rgba(255,255,255,0.07)",
  lineStrong: "rgba(198,154,99,0.38)",

  /* Texte */
  text: "#F5F2EA",
  textSoft: "rgba(245,242,234,0.66)",
  textDim: "rgba(245,242,234,0.40)",

  /* Marque */
  gold: "#C69A63",
  goldLt: "#E3C398",
  green: "#4CA435",
  greenLt: "#6FCC52",
  orange: "#F0803C",

  /* États */
  danger: "#FF4D4D",
  warn: "#F5A623",
  ok: "#4CA435",
  info: "#5AA9E6",

  /* Clair — portail client en plein jour */
  cream: "#F7F5F0",
  creamAlt: "#EDE9E0",
  ink: "#0F2413",
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

/* Panneau de verre : la surface de base de toute l'interface sombre. */
export const glass = (elev = 1) => ({
  background:
    elev >= 2
      ? "linear-gradient(160deg, rgba(37,81,43,0.92), rgba(22,53,26,0.92))"
      : "linear-gradient(160deg, rgba(29,66,35,0.72), rgba(15,36,19,0.78))",
  border: `1px solid ${W.line}`,
  borderRadius: 22,
  backdropFilter: "blur(20px)",
  boxShadow:
    elev >= 2
      ? "0 24px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)"
      : "0 10px 34px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.045)",
});

export const goldText = {
  background: `linear-gradient(135deg, ${W.goldLt}, ${W.gold})`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

/* Motif géométrique de la marque, en filigrane derrière les grands aplats. */
export const brandPattern = (opacity = 0.05) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'>
      <g fill='none' stroke='rgb(198,154,99)' stroke-width='2' opacity='${opacity}'>
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
