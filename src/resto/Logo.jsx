import React from "react";
import { W, FONT } from "./theme.js";

/* ==========================================================================
   Logo Well Done — reproduction du wordmark : « WELL » léger et espacé au
   dessus de « DONE » massif, dont le O est remplacé par un burger au trait.
   ========================================================================== */

export function BurgerGlyph({ size = 40, color = W.gold, stroke = 6 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <circle cx="50" cy="50" r="45" stroke={color} strokeWidth={stroke} />
      <path d="M28 45 C28 31 72 31 72 45" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <path d="M25 52 H75" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <path
        d="M25 59 q5 -5.5 10 0 t10 0 t10 0 t10 0 t10 0"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M28 66 C28 77 72 77 72 66" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
    </svg>
  );
}

/**
 * @param size    hauteur d'une ligne de texte, en px
 * @param tone    "light" (sur fond sombre) | "dark" (sur fond clair)
 * @param inline  wordmark sur une seule ligne, pour les barres de navigation
 */
export function Logo({ size = 44, tone = "light", inline = false }) {
  const wellColor = tone === "light" ? W.text : W.forest;
  const doneColor = W.gold;
  const glyph = size * 0.94;

  const well = {
    ...FONT,
    fontSize: size,
    fontWeight: 400,
    letterSpacing: size * 0.14,
    color: wellColor,
    lineHeight: 1,
    height: glyph,
    display: "flex",
    alignItems: "center",
    // La lettre-spacing ajoute un blanc après le dernier caractère : on le reprend.
    marginRight: -size * 0.14,
  };
  const done = {
    ...FONT,
    fontSize: size * 1.06,
    fontWeight: 800,
    letterSpacing: size * 0.03,
    color: doneColor,
    lineHeight: 1,
    height: glyph,
    display: "flex",
    alignItems: "center",
    gap: size * 0.04,
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: inline ? "row" : "column",
        alignItems: inline ? "center" : "flex-start",
        gap: inline ? size * 0.34 : size * 0.14,
        userSelect: "none",
      }}
      translate="no"
      aria-label="Well Done"
    >
      <div style={well}>WELL</div>
      <div style={done}>
        <span>D</span>
        <BurgerGlyph size={glyph} color={doneColor} stroke={7} />
        <span>NE</span>
      </div>
    </div>
  );
}

/* Pastille ronde vert forêt — avatars, favicons, coins d'écran. */
export function LogoBadge({ size = 56 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: "#16351A",
        border: `1px solid ${W.lineStrong}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: size * 0.03,
        flexShrink: 0,
      }}
      translate="no"
      aria-label="Well Done"
    >
      <span style={{ ...FONT, fontSize: size * 0.2, fontWeight: 700, color: "#F7F3EA", letterSpacing: size * 0.02, lineHeight: 1 }}>
        WELL
      </span>
      <BurgerGlyph size={size * 0.3} color="#F7F3EA" stroke={8} />
      <span style={{ ...FONT, fontSize: size * 0.2, fontWeight: 700, color: "#F7F3EA", letterSpacing: size * 0.02, lineHeight: 1 }}>
        DONE
      </span>
    </div>
  );
}

/* Signature sous le logo, comme sur la devanture. */
export function Tagline({ size = 11, tone = "light" }) {
  return (
    <div
      style={{
        ...FONT,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: size * 0.42,
        color: tone === "light" ? W.textDim : "rgba(15,36,19,.5)",
        whiteSpace: "nowrap",
      }}
      translate="no"
    >
      BIEN FAIT, SI FRAIS
    </div>
  );
}
