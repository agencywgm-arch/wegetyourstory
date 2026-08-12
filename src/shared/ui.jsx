import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  createContext,
  useContext,
} from "react";
import QRCode from "qrcode";

/* ==========================================================================
   DESIGN SYSTEM PARTAGÉ — commun aux verticales Hôtel et Restaurant.
   Tokens, utilitaires, hooks, toasts et primitives UI. Aucune logique métier.
   ========================================================================== */

/* ----------------------- Tokens ----------------------- */

export const C = {
  bg: "#F5F5F7",
  surface: "#FFFFFF",
  surfaceAlt: "#F2F2F4",
  text: "#1D1D1F",
  textSecondary: "#6E6E73",
  textTertiary: "#AEAEB2",
  border: "#E8E8ED",
  borderStrong: "#D2D2D7",
  dark: "#1D1D1F",
  white: "#FFF",
  accent: "#FF375F",
  accentBlue: "#0A84FF",
  accentGreen: "#30D158",
  accentOrange: "#FF9F0A",
  accentPurple: "#BF5AF2",
};

export const FF = { fontFamily: "'Figtree', sans-serif" };

/* ----------------------- Utilitaires ----------------------- */

export const uid = () => Math.random().toString(36).slice(2, 10);

export const fmtEuro = (n) =>
  (Math.round(n * 100) / 100).toFixed(2).replace(".", ",") + " €";

export const nowTime = () =>
  new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

/* Safari iOS ignore l'attribut `download` : le fichier s'ouvre dans l'onglet au
   lieu d'être enregistré. On passe par la feuille de partage, qui propose
   « Enregistrer dans Fichiers ». */
export const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

// Renvoie false si l'utilisateur a annulé la feuille de partage.
export const saveFile = async (blob, filename) => {
  if (isIOS()) {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename });
        return true;
      } catch (e) {
        if (e?.name === "AbortError") return false;
        // Partage indisponible malgré canShare : on retombe sur le lien.
      }
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
};

/* Jour LOCAL, jamais UTC : `toISOString()` bascule la journée comptable après
   minuit et fait tomber les ventes de nuit sur la veille. */
export const toISO = (d) => {
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
export const todayISO = () => toISO(new Date());
export const addDaysISO = (iso, n) => {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return toISO(d);
};
export const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
};

export const timeAgo = (ts) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
};

/* ----------------------- localStorage ----------------------- */

export const readLS = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return Array.isArray(fallback) && !Array.isArray(v) ? fallback : v;
  } catch {
    return fallback;
  }
};

export const writeLS = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
};

/* ----------------------- Hooks ----------------------- */

export function useTick(ms) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT((x) => x + 1), ms);
    return () => clearInterval(i);
  }, [ms]);
  return t;
}

export function useWindowWidth() {
  const [w, setW] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return w;
}

/* ----------------------- Toasts ----------------------- */

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = (type, msg) => {
    const id = uid();
    setToasts((t) => [...t, { id, type, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  };
  const api = useMemo(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    []
  );
  const colors = { success: C.accentGreen, error: C.accent, info: C.accentBlue };
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div style={{ position: "fixed", top: 16, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 9999, pointerEvents: "none" }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              ...FF, display: "flex", alignItems: "center", gap: 10,
              background: C.dark, color: C.white, padding: "11px 18px", borderRadius: 999,
              boxShadow: "0 8px 30px rgba(0,0,0,0.25)", fontSize: 14, fontWeight: 600,
              maxWidth: "88vw", animation: "wgmToastIn .25s ease",
            }}
          >
            <span
              style={{
                width: 20, height: 20, borderRadius: 999, background: colors[t.type],
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, flexShrink: 0,
              }}
            >
              {icons[t.type]}
            </span>
            {t.msg}
          </div>
        ))}
      </div>
      <style>{`@keyframes wgmToastIn { from { opacity:0; transform: translateY(-8px) scale(.96);} to { opacity:1; transform:none; } }`}</style>
    </ToastCtx.Provider>
  );
}

/* ----------------------- Primitives UI ----------------------- */

export function Surface({ children, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.surface, borderRadius: 18, border: `1px solid ${C.border}`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.04)",
        padding: 18, ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", size = "md", disabled, dimmed, full, style }) {
  const base = {
    primary: { background: C.dark, color: C.white, border: "1px solid transparent" },
    subtle: { background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}` },
    ghost: { background: "transparent", color: C.textSecondary, border: "1px solid transparent" },
    blue: { background: C.accentBlue, color: C.white, border: "1px solid transparent" },
    red: { background: C.accent, color: C.white, border: "1px solid transparent" },
    green: { background: C.accentGreen, color: C.white, border: "1px solid transparent" },
    orange: { background: C.accentOrange, color: C.white, border: "1px solid transparent" },
  }[variant];
  const sz = {
    sm: { padding: "7px 13px", fontSize: 13 },
    md: { padding: "10px 18px", fontSize: 14 },
    lg: { padding: "14px 22px", fontSize: 16 },
  }[size];
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        ...FF, ...base, ...sz, borderRadius: 999, fontWeight: 700, cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : dimmed ? 0.45 : 1, width: full ? "100%" : undefined,
        transition: "transform .12s ease, opacity .15s ease", ...style,
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(.97)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "none"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
    >
      {children}
    </button>
  );
}

export function Tag({ children, color = C.accentBlue, style }) {
  return (
    <span
      style={{
        ...FF, display: "inline-flex", alignItems: "center", gap: 4,
        background: color + "1F", color, borderRadius: 999,
        padding: "3px 10px", fontSize: 12, fontWeight: 700, ...style,
      }}
    >
      {children}
    </span>
  );
}

export function InputField({ label, value, onChange, type = "text", placeholder, required, style, inputStyle }) {
  return (
    <label style={{ display: "block", ...style }}>
      {label && (
        <div style={{ ...FF, fontSize: 12.5, fontWeight: 700, color: C.textSecondary, marginBottom: 6 }}>
          {label} {required && <span style={{ color: C.accent }}>*</span>}
        </div>
      )}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...FF, width: "100%", padding: "11px 14px", borderRadius: 12,
          border: `1px solid ${C.borderStrong}`, background: C.surface, fontSize: 15,
          color: C.text, outline: "none", ...inputStyle,
        }}
      />
    </label>
  );
}

export function SelectField({ label, value, onChange, options, style }) {
  return (
    <label style={{ display: "block", ...style }}>
      {label && (
        <div style={{ ...FF, fontSize: 12.5, fontWeight: 700, color: C.textSecondary, marginBottom: 6 }}>{label}</div>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...FF, width: "100%", padding: "11px 14px", borderRadius: 12,
          border: `1px solid ${C.borderStrong}`, background: C.surface, fontSize: 15, color: C.text,
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export function Stepper({ value, onChange, min = 1, max = 9 }) {
  const b = {
    ...FF, width: 30, height: 30, borderRadius: 999, border: `1px solid ${C.borderStrong}`,
    background: C.surface, fontSize: 16, fontWeight: 800, cursor: "pointer", color: C.text,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <button style={b} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span style={{ ...FF, fontWeight: 800, fontSize: 16, minWidth: 18, textAlign: "center" }}>{value}</span>
      <button style={b} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </span>
  );
}

export function QRCanvas({ url, size = 140, dark = "#1D1D1F", light = "#FFFFFF" }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      QRCode.toCanvas(ref.current, url, {
        width: size,
        margin: 1,
        color: { dark, light },
      }).catch(() => {});
    }
  }, [url, size, dark, light]);
  return <canvas ref={ref} style={{ borderRadius: 10, width: size, height: size }} />;
}

export function Modal({ title, onClose, children, maxWidth = 480 }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.surface, borderRadius: 20, padding: 22, width: "100%",
          maxWidth, maxHeight: "88vh", overflowY: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ ...FF, fontSize: 17, fontWeight: 800, color: C.text }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              ...FF, border: "none", background: C.surfaceAlt, borderRadius: 999,
              width: 30, height: 30, cursor: "pointer", fontSize: 14, fontWeight: 700, color: C.textSecondary,
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SectionTitle({ children, style }) {
  return (
    <div style={{ ...FF, fontSize: 13, fontWeight: 800, color: C.textTertiary, textTransform: "uppercase", letterSpacing: 0.6, margin: "22px 0 10px", ...style }}>
      {children}
    </div>
  );
}

export function PageTitle({ children, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
      <h1 style={{ ...FF, fontSize: 22, fontWeight: 900, color: C.text }}>{children}</h1>
      {right}
    </div>
  );
}

export function KPICard({ label, value, sub, color }) {
  return (
    <Surface style={{ flex: 1, minWidth: 150 }}>
      <div style={{ ...FF, fontSize: 12.5, fontWeight: 700, color: C.textSecondary }}>{label}</div>
      <div style={{ ...FF, fontSize: 26, fontWeight: 900, color: color || C.text, marginTop: 6 }}>{value}</div>
      {sub && <div style={{ ...FF, fontSize: 12, color: C.textTertiary, marginTop: 4 }}>{sub}</div>}
    </Surface>
  );
}

/* Styles globaux : transitions, apparitions de vues, accessibilité clavier */
export function GlobalStyles() {
  return (
    <style>{`
      @keyframes wgmFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
      .wgm-view { animation: wgmFadeUp .28s ease both; }
      button { transition: transform .12s ease, opacity .15s ease, box-shadow .15s ease, background .15s ease; }
      button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
        outline: 2px solid #0A84FF; outline-offset: 2px;
      }
      .wgm-tile { transition: transform .15s ease, box-shadow .15s ease; }
      .wgm-tile:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,.09); }
      .wgm-tile:active { transform: scale(.98); }
      @media (prefers-reduced-motion: reduce) {
        * { animation: none !important; transition: none !important; }
      }
    `}</style>
  );
}

/* Bip Web Audio — nouvelles commandes en cuisine */
export function playBeep(freq = 880, ms = 600, vol = 0.18) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ms / 1000);
    osc.start();
    osc.stop(ctx.currentTime + ms / 1000);
    setTimeout(() => ctx.close().catch(() => {}), ms + 200);
  } catch {}
}
