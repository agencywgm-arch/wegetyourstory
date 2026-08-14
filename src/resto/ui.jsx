import React, { useEffect } from "react";
import { W, FONT, display, label, glass, brandPattern } from "./theme.js";

/* ==========================================================================
   Primitives de l'interface Well Done — surfaces sombres, verre, or.
   ========================================================================== */

/* Vignette d'article : photo si l'enseigne en a fourni une, emoji sinon —
   jamais les deux, pour ne pas mélanger deux langages visuels sur la carte. */
export function Dish({ item, size = 46, radius = 14, fontSize = 24 }) {
  return (
    <span
      style={{
        width: size, height: size, borderRadius: radius, flexShrink: 0,
        background: "rgba(198,154,99,.11)", border: `1px solid ${W.line}`,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", fontSize,
      }}
    >
      {item.image ? (
        <img
          src={item.image}
          alt=""
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        item.emoji
      )}
    </span>
  );
}

export function Screen({ children, tone = "dark", pad = true, style }) {
  const dark = tone === "dark";
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: dark ? W.void : W.cream,
        color: dark ? W.text : W.ink,
        position: "relative",
        isolation: "isolate",
        ...style,
      }}
    >
      {dark && (
        <>
          <div
            aria-hidden
            style={{
              position: "fixed", inset: 0, zIndex: -2,
              background: `radial-gradient(900px circle at 12% -8%, rgba(76,164,53,0.16), transparent 62%),
                           radial-gradient(760px circle at 92% 4%, rgba(198,154,99,0.13), transparent 60%),
                           linear-gradient(180deg, ${W.forest} 0%, ${W.void} 58%)`,
            }}
          />
          <div
            aria-hidden
            style={{
              position: "fixed", inset: 0, zIndex: -1,
              backgroundImage: brandPattern(0.5),
              backgroundSize: "180px 180px",
              opacity: 0.55,
              maskImage: "linear-gradient(180deg, rgba(0,0,0,.7), transparent 70%)",
              WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,.7), transparent 70%)",
            }}
          />
        </>
      )}
      <div style={{ position: "relative", padding: pad ? undefined : 0 }}>{children}</div>
    </div>
  );
}

export function Panel({ children, elev = 1, pad = 20, style, onClick, hover }) {
  return (
    <div
      onClick={onClick}
      className={hover ? "wd-hover" : undefined}
      style={{ ...glass(elev), padding: pad, cursor: onClick ? "pointer" : undefined, ...style }}
    >
      {children}
    </div>
  );
}

const VARIANTS = {
  primary: { background: `linear-gradient(135deg, ${W.greenLt}, ${W.green})`, color: "#08210C", border: "1px solid transparent", shadow: "0 10px 26px rgba(76,164,53,.32)" },
  gold: { background: `linear-gradient(135deg, ${W.goldLt}, ${W.gold})`, color: "#2A1B08", border: "1px solid transparent", shadow: "0 10px 26px rgba(198,154,99,.28)" },
  outline: { background: "rgba(255,255,255,0.03)", color: W.text, border: `1px solid ${W.lineStrong}`, shadow: "none" },
  ghost: { background: "transparent", color: W.textSoft, border: "1px solid transparent", shadow: "none" },
  danger: { background: `linear-gradient(135deg, #FF6B6B, ${W.danger})`, color: "#2A0808", border: "1px solid transparent", shadow: "0 10px 26px rgba(255,77,77,.3)" },
  light: { background: W.text, color: W.forest, border: "1px solid transparent", shadow: "0 10px 26px rgba(0,0,0,.3)" },
};

const SIZES = {
  xs: { padding: "6px 12px", fontSize: 12.5 },
  sm: { padding: "9px 16px", fontSize: 13.5 },
  md: { padding: "12px 22px", fontSize: 14.5 },
  lg: { padding: "16px 30px", fontSize: 16 },
};

export function Btn({ children, onClick, variant = "primary", size = "md", full, disabled, style }) {
  const v = VARIANTS[variant];
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="wd-btn"
      style={{
        ...FONT, ...SIZES[size],
        background: v.background, color: v.color, border: v.border, boxShadow: disabled ? "none" : v.shadow,
        borderRadius: 999, fontWeight: 800, letterSpacing: "-0.01em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.38 : 1,
        width: full ? "100%" : undefined,
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Chip({ children, tone = "gold", solid, style }) {
  const c = { gold: W.gold, green: W.green, orange: W.orange, danger: W.danger, warn: W.warn, info: W.info, dim: W.textDim }[tone] || tone;
  return (
    <span
      style={{
        ...FONT, display: "inline-flex", alignItems: "center", gap: 6,
        background: solid ? c : c + "1E",
        color: solid ? "#0B1F0E" : c,
        border: `1px solid ${solid ? "transparent" : c + "40"}`,
        borderRadius: 999, padding: "4px 11px", fontSize: 12, fontWeight: 800,
        letterSpacing: "-0.005em", whiteSpace: "nowrap", ...style,
      }}
    >
      {children}
    </span>
  );
}

export function SectionLabel({ children, right, style }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "26px 0 12px", ...style }}>
      <div style={{ ...label(11.5), color: W.gold }}>{children}</div>
      {right}
    </div>
  );
}

export function PageHead({ title, sub, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
      <div>
        <h1 style={{ ...display(28), color: W.text, margin: 0 }}>{title}</h1>
        {sub && <div style={{ ...FONT, fontSize: 13.5, color: W.textSoft, marginTop: 7 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

export function Stat({ label: lb, value, sub, tone = "text", icon }) {
  const c = { text: W.text, gold: W.gold, green: W.greenLt, orange: W.orange, danger: W.danger }[tone];
  return (
    <Panel pad={18} style={{ flex: 1, minWidth: 158 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <div style={{ ...label(10.5), color: W.textDim }}>{lb}</div>
      </div>
      <div style={{ ...display(28), color: c, marginTop: 10 }} translate="no">{value}</div>
      {sub && <div style={{ ...FONT, fontSize: 12, color: W.textDim, marginTop: 6 }}>{sub}</div>}
    </Panel>
  );
}

export function Field({ label: lb, value, onChange, type = "text", placeholder, required, style, area }) {
  const Tag = area ? "textarea" : "input";
  return (
    <label style={{ display: "block", ...style }}>
      {lb && (
        <div style={{ ...label(10.5), color: W.textDim, marginBottom: 8 }}>
          {lb} {required && <span style={{ color: W.orange }}>*</span>}
        </div>
      )}
      <Tag
        type={type}
        value={value}
        placeholder={placeholder}
        rows={area ? 3 : undefined}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...FONT, width: "100%", padding: "13px 16px", borderRadius: 14,
          border: `1px solid ${W.lineSoft}`, background: "rgba(0,0,0,0.26)",
          fontSize: 15, color: W.text, outline: "none", resize: area ? "vertical" : undefined,
        }}
      />
    </label>
  );
}

export function Select({ label: lb, value, onChange, children, style }) {
  return (
    <label style={{ display: "block", ...style }}>
      {lb && <div style={{ ...label(10.5), color: W.textDim, marginBottom: 8 }}>{lb}</div>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...FONT, width: "100%", padding: "13px 16px", borderRadius: 14,
          border: `1px solid ${W.lineSoft}`, background: "rgba(0,0,0,0.26)",
          fontSize: 15, color: W.text, outline: "none",
        }}
      >
        {children}
      </select>
    </label>
  );
}

export function Segmented({ options, value, onChange, full, style }) {
  return (
    <div
      style={{
        display: "inline-flex", padding: 4, gap: 4, borderRadius: 999,
        background: "rgba(0,0,0,0.3)", border: `1px solid ${W.lineSoft}`,
        width: full ? "100%" : undefined, ...style,
      }}
    >
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            style={{
              ...FONT, flex: full ? 1 : undefined, border: "none", cursor: "pointer",
              borderRadius: 999, padding: "9px 16px", fontSize: 13.5, fontWeight: 800,
              background: on ? `linear-gradient(135deg, ${W.greenLt}, ${W.green})` : "transparent",
              color: on ? "#08210C" : W.textSoft,
              boxShadow: on ? "0 6px 18px rgba(76,164,53,.28)" : "none",
              whiteSpace: "nowrap",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Stepper({ value, onChange, min = 1, max = 20 }) {
  const b = {
    ...FONT, width: 36, height: 36, borderRadius: 999,
    border: `1px solid ${W.lineStrong}`, background: "rgba(255,255,255,.04)",
    fontSize: 18, fontWeight: 800, cursor: "pointer", color: W.text,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
      <button style={b} onClick={() => onChange(Math.max(min, value - 1))} aria-label="Retirer">−</button>
      <span style={{ ...FONT, fontWeight: 900, fontSize: 17, minWidth: 20, textAlign: "center" }} translate="no">{value}</span>
      <button style={b} onClick={() => onChange(Math.min(max, value + 1))} aria-label="Ajouter">+</button>
    </span>
  );
}

/* Feuille modale : centrée sur grand écran, remontée du bas sur téléphone. */
export function Sheet({ title, sub, onClose, children, footer, maxWidth = 520 }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", esc);
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 900, background: "rgba(4,12,6,.72)",
        backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end",
        justifyContent: "center", padding: 0,
      }}
      className="wd-sheet-wrap"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="wd-sheet"
        style={{
          ...glass(2), width: "100%", maxWidth, maxHeight: "92dvh",
          borderRadius: "26px 26px 0 0", display: "flex", flexDirection: "column",
          padding: 0, animation: "wdSheetUp .32s cubic-bezier(.2,.9,.3,1) both",
        }}
      >
        <div style={{ padding: "18px 22px 14px", borderBottom: `1px solid ${W.lineSoft}`, flexShrink: 0 }}>
          <div style={{ width: 42, height: 4, borderRadius: 99, background: W.lineStrong, margin: "0 auto 14px" }} className="wd-grabber" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ ...display(20), color: W.text }}>{title}</div>
              {sub && <div style={{ ...FONT, fontSize: 13, color: W.textSoft, marginTop: 6, lineHeight: 1.5 }}>{sub}</div>}
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer"
              style={{
                ...FONT, border: `1px solid ${W.lineSoft}`, background: "rgba(0,0,0,.3)", borderRadius: 999,
                width: 34, height: 34, cursor: "pointer", fontSize: 15, color: W.textSoft, flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        </div>
        <div style={{ padding: "18px 22px", overflowY: "auto", flex: 1 }}>{children}</div>
        {footer && (
          <div style={{ padding: "14px 22px calc(18px + env(safe-area-inset-bottom))", borderTop: `1px solid ${W.lineSoft}`, flexShrink: 0, background: "rgba(0,0,0,.22)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Empty({ icon = "○", title, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 20px" }}>
      <div style={{ fontSize: 34, opacity: 0.35, display: "flex", justifyContent: "center", color: W.textSoft }}>{icon}</div>
      <div style={{ ...display(17), color: W.textSoft, marginTop: 12 }}>{title}</div>
      {sub && <div style={{ ...FONT, fontSize: 13, color: W.textDim, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export function WDStyles() {
  return (
    <style>{`
      @keyframes wdSheetUp { from { transform: translateY(24px); opacity: 0 } to { transform: none; opacity: 1 } }
      @keyframes wdFade { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
      @keyframes wdPulse { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
      @keyframes wdRing { 0%,100% { box-shadow: 0 0 0 0 rgba(255,77,77,.55) } 50% { box-shadow: 0 0 0 14px rgba(255,77,77,0) } }
      .wd-view { animation: wdFade .34s cubic-bezier(.2,.9,.3,1) both }
      .wd-btn { transition: transform .14s cubic-bezier(.2,.9,.3,1), filter .18s ease, box-shadow .18s ease }
      .wd-btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.07) }
      .wd-btn:active:not(:disabled) { transform: scale(.975) }
      .wd-hover { transition: transform .2s cubic-bezier(.2,.9,.3,1), border-color .2s ease, box-shadow .2s ease }
      .wd-hover:hover { transform: translateY(-3px); border-color: rgba(198,154,99,.45); box-shadow: 0 22px 50px rgba(0,0,0,.42) }
      .wd-scroll::-webkit-scrollbar { height: 6px; width: 6px }
      .wd-scroll::-webkit-scrollbar-thumb { background: rgba(198,154,99,.3); border-radius: 99px }
      .wd-scroll::-webkit-scrollbar-track { background: transparent }
      ::selection { background: rgba(198,154,99,.35) }
      input::placeholder, textarea::placeholder { color: rgba(245,242,234,.3) }
      select option { background: #16351A; color: #F5F2EA }
      @media (min-width: 700px) {
        .wd-sheet-wrap { align-items: center; padding: 24px }
        .wd-sheet { border-radius: 26px !important }
        .wd-grabber { display: none }
      }
      @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important } }
    `}</style>
  );
}
