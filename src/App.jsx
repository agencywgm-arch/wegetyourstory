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
   WEGEMO HÔTEL — Démo SaaS hôtelier 100% offline
   Tout l'état vit en React + localStorage. Aucun backend, aucun appel réseau.
   ========================================================================== */

/* ----------------------- Design system ----------------------- */

const C = {
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

const FF = { fontFamily: "'Figtree', sans-serif" };

/* ----------------------- Données démo ----------------------- */

const DEMO_HOTEL = {
  id: "demo-hotel",
  name: "Hôtel Démo",
  address: "5 avenue des Rêves, Paris",
  logo_emoji: "🏨",
  slug: "demo-hotel",
  vertical: "hotel",
};

const DEMO_HOTEL_ROOMS = [101, 102, 103, 104, 201, 202, 203, 204, 301, 302, 303, 304];

const DEMO_HOTEL_MENU = [
  { id: "h1", name: "Club Sandwich", desc: "Poulet, bacon, œuf, frites", price: 18, category: "Plats", emoji: "🥪" },
  { id: "h2", name: "Burger Signature", desc: "Bœuf Angus, cheddar affiné", price: 24, category: "Plats", emoji: "🍔" },
  { id: "h3", name: "Petit-déjeuner continental", desc: "Viennoiseries, jus, boisson chaude", price: 22, category: "Petit-déjeuner", emoji: "🥐" },
  { id: "h4", name: "Plateau de fruits frais", desc: "Sélection de saison", price: 14, category: "En-cas", emoji: "🍓" },
  { id: "h5", name: "Bouteille de Champagne", desc: "Brut, 75cl", price: 65, category: "Boissons", emoji: "🍾", stock: 6 },
  { id: "h6", name: "Café / Thé", desc: "Sélection premium", price: 6, category: "Boissons", emoji: "☕" },
];

const HOTEL_SERVICES = [
  { id: "sv1", emoji: "🧖", name: "Spa & Massage", desc: "Massage 50 min, accès spa inclus", price: 90, cta: "Réserver un créneau" },
  { id: "sv2", emoji: "🏊", name: "Piscine & Sauna", desc: "Accès libre de 7h à 22h", price: 0, cta: "En savoir plus" },
  { id: "sv3", emoji: "👔", name: "Pressing", desc: "Rendu en 24h, retouches possibles", price: 15, cta: "Demander un retrait" },
  { id: "sv4", emoji: "🧹", name: "Ménage supplémentaire", desc: "Passage de l'équipe d'étage", price: 0, cta: "Demander" },
  { id: "sv5", emoji: "🛁", name: "Serviettes & oreillers", desc: "Livrés en chambre en 15 min", price: 0, cta: "Demander" },
  { id: "sv6", emoji: "⏰", name: "Réveil téléphonique", desc: "À l'heure de votre choix", price: 0, cta: "Programmer" },
  { id: "sv7", emoji: "🚕", name: "Taxi / Transfert", desc: "Réservation par la réception", price: 0, cta: "Commander un taxi" },
  { id: "sv8", emoji: "🕐", name: "Late check-out", desc: "Jusqu'à 15h selon disponibilité", price: 25, cta: "Demander" },
];

const NEARBY = [
  { id: "n1", emoji: "🎷", title: "Jazz au Caveau", when: "Ce soir 20h30", dist: "400m", tag: "Concert", desc: "Quartet live dans une cave voûtée du quartier. Réservation conseillée." },
  { id: "n2", emoji: "🖼️", title: "Expo Monet", when: "Tous les jours 10h-19h", dist: "1,2 km", tag: "Exposition", desc: "Rétrospective exceptionnelle — coupe-file offert pour nos clients." },
  { id: "n3", emoji: "🥐", title: "Marché Saint-Germain", when: "Demain 8h-13h", dist: "600m", tag: "Marché", desc: "Producteurs locaux, fromages affinés et fleurs fraîches." },
  { id: "n4", emoji: "🍷", title: "La Cave d'Auguste", when: "17h-23h", dist: "250m", tag: "-10%", desc: "Bar à vins partenaire : -10% sur présentation de votre code d'accès." },
  { id: "n5", emoji: "🚲", title: "Balade vélo bords de Seine", when: "Départ 10h & 15h", dist: "Devant l'hôtel", tag: "Activité", desc: "2h guidées, casque fourni. 18€ par personne." },
];

const HOTEL_INFO = [
  { emoji: "📶", label: "Wi-Fi", value: "Réseau « HotelDemo » — code SEJOUR2026" },
  { emoji: "🥐", label: "Petit-déjeuner", value: "7h-10h30, Salle Verrière (RDC) · en chambre +8€" },
  { emoji: "🕛", label: "Check-out", value: "Jusqu'à 12h (late check-out 15h sur demande)" },
  { emoji: "☎️", label: "Réception", value: "24h/24 — composez le 9 depuis votre chambre" },
  { emoji: "🅿️", label: "Parking", value: "28€/nuit, hauteur max 1,90m" },
  { emoji: "🏋️", label: "Salle de sport", value: "Niveau -1, ouverte de 6h à 23h" },
];

const ID_TYPES = ["Carte d'identité", "Passeport", "Permis de conduire", "Titre de séjour"];

const ARRIVAL_SLOTS = ["Avant 15h", "15h - 17h", "17h - 19h", "19h - 22h", "Après 22h"];

const BREAKFAST_FORMULAS = [
  { id: "continental", emoji: "🥐", name: "Continental", price: 22, desc: "Viennoiseries, pain frais, confitures, jus pressé, boisson chaude" },
  { id: "gourmand", emoji: "🍳", name: "Gourmand", price: 28, desc: "Continental + œufs au choix, saumon fumé, fruits frais" },
  { id: "healthy", emoji: "🥣", name: "Healthy", price: 24, desc: "Granola, yaourt grec, fruits de saison, avocado toast, jus détox" },
];
const BREAKFAST_SLOTS = [
  "7h00 – 7h30", "7h30 – 8h00", "8h00 – 8h30", "8h30 – 9h00",
  "9h00 – 9h30", "9h30 – 10h00", "10h00 – 10h30",
];
const TRAY_CHARGE = 8;
const DEMO_NIGHT_RATE = 145;
const DEMO_CITY_TAX = 3.3;

const CONCIERGE_QUICK = [
  { emoji: "🛁", label: "Serviettes" },
  { emoji: "🛏️", label: "Oreiller supplémentaire" },
  { emoji: "🧹", label: "Ménage" },
  { emoji: "⏰", label: "Réveil 7h" },
  { emoji: "🚕", label: "Taxi pour 9h" },
  { emoji: "🍼", label: "Lit bébé" },
];

/* ----------------------- Utilitaires ----------------------- */

const uid = () => Math.random().toString(36).slice(2, 10);

const fmtEuro = (n) => (Math.round(n * 100) / 100).toFixed(2).replace(".", ",") + " €";

const nowTime = () =>
  new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const toISO = (d) => {
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const todayISO = () => toISO(new Date());
const addDaysISO = (iso, n) => {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return toISO(d);
};
const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
};
const nightsBetween = (a, b) => {
  if (!a || !b) return 1;
  const n = Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
  return Math.max(1, n);
};

const genAccessCode = (room) => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `WGM-${room}-${s}`;
};

/* ----------------------- localStorage = le "serveur" ----------------------- */

const KEY_CHECKINS = "wgm_demo_checkins";
const KEY_STAFF_RESAS = "wgm_demo_staff_resas";
const KEY_ORDERS = "wgm_demo_orders";
const KEY_REQUESTS = "wgm_demo_requests";
const KEY_MENU = "wgm_demo_menu";
const KEY_HOTEL = "wgm_demo_hotel";
const KEY_ACTIVITY = "wgm_demo_activity";
const KEY_ROOMS = "wgm_demo_rooms_state";

const readLS = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return Array.isArray(fallback) && !Array.isArray(v) ? fallback : v;
  } catch {
    return fallback;
  }
};
const writeLS = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
};

/* La carte et l'identité de l'hôtel sont éditables côté réception et
   persistées : le portail client reflète les modifications. */
const readMenu = () => readLS(KEY_MENU, DEMO_HOTEL_MENU);
const readHotelProfile = () => ({ ...DEMO_HOTEL, ...readLS(KEY_HOTEL, {}) });

const readGuestCheckins = () => readLS(KEY_CHECKINS, []);
const writeGuestCheckins = (list) => writeLS(KEY_CHECKINS, list);
const readGuestOrders = () => readLS(KEY_ORDERS, []);
const writeGuestOrders = (list) => writeLS(KEY_ORDERS, list);
const readGuestRequests = () => readLS(KEY_REQUESTS, []);
const writeGuestRequests = (list) => writeLS(KEY_REQUESTS, list);

/* Journal d'activité : chaque action (client ou réception) laisse une trace */
const logActivity = (emoji, text, type = "stay") => {
  const list = readLS(KEY_ACTIVITY, []);
  list.push({ id: uid(), ts: Date.now(), at: nowTime(), emoji, text, type });
  writeLS(KEY_ACTIVITY, list.slice(-100));
};
const readActivity = () => readLS(KEY_ACTIVITY, []).slice().reverse();
const timeAgo = (ts) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
};

/* État ménage des chambres : une chambre libérée passe "à nettoyer" */
const readRoomsState = () => readLS(KEY_ROOMS, {});
const setRoomCleaning = (room, dirty) => {
  const m = readRoomsState();
  if (dirty) m[room] = "dirty";
  else delete m[room];
  writeLS(KEY_ROOMS, m);
};

/* Note de chambre — partagée entre le check-out express (client) et la
   facture côté réception, pour que les deux racontent la même histoire. */
function computeBill(entry, roomOrders, late) {
  const nights = nightsBetween(entry.checkin_date, entry.checkout_date);
  const guests = entry.guests || 1;
  const ordersTotal = (roomOrders || []).reduce((s, o) => s + (o.total || 0), 0);
  const lines = [
    { label: `Chambre ${entry.room} · ${nights} nuit(s) × ${fmtEuro(DEMO_NIGHT_RATE)}`, amount: nights * DEMO_NIGHT_RATE },
    { label: `Petit-déjeuner (${guests} pers. · hier)`, amount: guests * 22 },
    { label: "Minibar", amount: 8 },
    ordersTotal > 0 && { label: "Room service & petit-déj en chambre (votre séjour)", amount: ordersTotal },
    { label: `Taxe de séjour · ${guests} pers. × ${nights} nuit(s)`, amount: guests * nights * DEMO_CITY_TAX },
    late && { label: "Late check-out (15h)", amount: 25 },
  ].filter(Boolean);
  return { lines, total: lines.reduce((s, l) => s + l.amount, 0), nights, guests };
}

/* Fait avancer automatiquement les statuts des commandes room service :
   Reçue (8s) → En préparation (22s de plus) → En route. */
function autoAdvanceOrders() {
  const orders = readGuestOrders();
  let changed = false;
  const next = orders.map((o) => {
    if (o.order_type !== "room_service") return o;
    const elapsed = (Date.now() - (o.placed_at || 0)) / 1000;
    if (o.status === "pending" && elapsed > 8) {
      changed = true;
      return { ...o, status: "preparing" };
    }
    if (o.status === "preparing" && elapsed > 30) {
      changed = true;
      return { ...o, status: "ready" };
    }
    return o;
  });
  if (changed) writeGuestOrders(next);
  return changed;
}

const ORDER_STATUS_CLIENT = {
  pending: { label: "Reçue ✓", color: C.accentBlue },
  preparing: { label: "En préparation 👨‍🍳", color: C.accentOrange },
  ready: { label: "En route vers votre chambre 🛎️", color: C.accentGreen },
  done: { label: "Livrée ✓", color: C.textTertiary },
  scheduled: { label: "Programmé ⏰", color: C.accentGreen },
};

const ORDER_STATUS_STAFF = {
  pending: { label: "Nouvelle", color: C.accentBlue, next: "preparing", nextLabel: "👨‍🍳 En préparation" },
  preparing: { label: "En préparation", color: C.accentOrange, next: "ready", nextLabel: "🛎️ Prête" },
  ready: { label: "Prête", color: C.accentGreen, next: "done", nextLabel: "✅ Livrée" },
  done: { label: "Livrée", color: C.textTertiary, next: null, nextLabel: null },
  scheduled: { label: "Programmée ⏰", color: C.accentGreen, next: "done", nextLabel: "✅ Livrée" },
};

/* Commandes room service seedées (dashboard) */
const seedTodayOrders = () => [
  {
    id: "o1", room: 204, order_type: "room_service", payment_method: "room", status: "pending", at: "12:42",
    items: [{ name: "Club Sandwich", qty: 1, price: 18, emoji: "🥪" }, { name: "Café / Thé", qty: 2, price: 6, emoji: "☕" }],
    total: 30, note: "",
  },
  {
    id: "o2", room: 302, order_type: "room_service", payment_method: "room", status: "preparing", at: "12:35",
    items: [{ name: "Bouteille de Champagne", qty: 1, price: 65, emoji: "🍾" }],
    total: 65, note: "",
  },
  {
    id: "o3", room: 103, order_type: "room_service", payment_method: "room", status: "ready", at: "12:21",
    items: [{ name: "Petit-déjeuner continental", qty: 1, price: 22, emoji: "🥐" }],
    total: 22, note: "Livraison 8h",
  },
  {
    id: "o4", room: 301, order_type: "room_service", payment_method: "room", status: "done", at: "11:05",
    items: [{ name: "Burger Signature", qty: 1, price: 24, emoji: "🍔" }, { name: "Club Sandwich", qty: 1, price: 18, emoji: "🥪" }],
    total: 42, note: "",
  },
  {
    id: "o5", room: 202, order_type: "room_service", payment_method: "room", status: "done", at: "09:48",
    items: [{ name: "Club Sandwich", qty: 1, price: 18, emoji: "🥪" }],
    total: 18, note: "",
  },
];

/* Séjours seedés (board check-in) — dates relatives à aujourd'hui */
const seedCheckins = () => {
  const t = todayISO();
  return [
    {
      id: "s-lea", guest_name: "Léa Martin", room: 204, guests: 2, email: "lea.martin@email.fr",
      checkin_date: addDaysISO(t, -1), checkout_date: addDaysISO(t, 2), status: "in_house",
    },
    {
      id: "s-tom", guest_name: "Tom Bernard", room: 103, guests: 1, email: "tom.bernard@email.fr",
      checkin_date: t, checkout_date: addDaysISO(t, 2), status: "arriving",
    },
    {
      id: "s-sarah", guest_name: "Sarah Cohen", room: 301, guests: 2, email: "sarah.cohen@email.fr",
      checkin_date: addDaysISO(t, -2), checkout_date: t, status: "departing",
    },
  ];
};

const DEMO_CRM = [
  { name: "Julien Moreau", email: "julien.moreau@email.fr", phone: "06 12 44 78 90", visits: 4, spent: 1240, last: "Séjour du 08/07", tag: "Fidèle" },
  { name: "Emma Laurent", email: "emma.laurent@email.fr", phone: "06 98 32 11 04", visits: 2, spent: 486, last: "Séjour du 02/07", tag: "" },
  { name: "Carlos Diaz", email: "carlos.diaz@email.es", phone: "+34 6 55 12 30 21", visits: 1, spent: 145, last: "Séjour du 27/06", tag: "Nouveau" },
];

/* URL du portail chambre (respecte le base path).
   VITE_HASH_ROUTING=1 bascule en liens #/r/… pour les hébergeurs
   statiques sans fallback SPA (un seul fichier HTML). */
const HASH_ROUTING = !!import.meta.env.VITE_HASH_ROUTING;
const roomPortalPath = (room) => {
  if (HASH_ROUTING) return `${window.location.pathname}#/r/${DEMO_HOTEL.slug}/t/${room}`;
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return `${base}/r/${DEMO_HOTEL.slug}/t/${room}`;
};
const roomPortalUrl = (room) => `${window.location.origin}${roomPortalPath(room)}`;

/* ----------------------- Hooks ----------------------- */

function useTick(ms) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT((x) => x + 1), ms);
    return () => clearInterval(i);
  }, [ms]);
  return t;
}

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
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

function ToastProvider({ children }) {
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

function Surface({ children, style, onClick }) {
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

function Btn({ children, onClick, variant = "primary", size = "md", disabled, dimmed, full, style }) {
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

function Tag({ children, color = C.accentBlue, style }) {
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

function InputField({ label, value, onChange, type = "text", placeholder, required, style, inputStyle }) {
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

function SelectField({ label, value, onChange, options, style }) {
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

function Stepper({ value, onChange, min = 1, max = 9 }) {
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

function QRCanvas({ url, size = 140, dark = "#1D1D1F", light = "#FFFFFF" }) {
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

function Modal({ title, onClose, children, maxWidth = 480 }) {
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

function SectionTitle({ children, style }) {
  return (
    <div style={{ ...FF, fontSize: 13, fontWeight: 800, color: C.textTertiary, textTransform: "uppercase", letterSpacing: 0.6, margin: "22px 0 10px", ...style }}>
      {children}
    </div>
  );
}

/* Styles globaux : transitions, apparitions de vues, accessibilité clavier */
function GlobalStyles() {
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

/* Bip Web Audio pour l'Office (nouvelles commandes) */
function playBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {}
}

/* ==========================================================================
   PORTAIL CHAMBRE CLIENT — /r/demo-hotel/t/{room}
   ========================================================================== */

function PortalHeader({ room, title, onBack }) {
  const hotel = readHotelProfile();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <button
        onClick={onBack}
        style={{
          ...FF, width: 36, height: 36, borderRadius: 999, border: `1px solid ${C.border}`,
          background: C.surface, fontSize: 16, cursor: "pointer", color: C.text, fontWeight: 700,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        ←
      </button>
      <div>
        <div style={{ ...FF, fontSize: 17, fontWeight: 800, color: C.text }}>{title}</div>
        <div style={{ ...FF, fontSize: 12.5, color: C.textSecondary }}>
          {hotel.logo_emoji} {hotel.name} · Chambre {room}
        </div>
      </div>
    </div>
  );
}

function StatusLine({ emoji, label, status }) {
  const st = ORDER_STATUS_CLIENT[status] || { label: status, color: C.accentGreen };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ ...FF, fontSize: 14, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {emoji} {label}
      </div>
      <Tag color={st.color} style={{ flexShrink: 0 }}>{st.label}</Tag>
    </div>
  );
}

function RoomPortal({ room }) {
  const toast = useToast();
  const [view, setView] = useState("hub");
  const tick = useTick(1000);

  useEffect(() => {
    autoAdvanceOrders();
  }, [tick]);

  /* eslint-disable react-hooks/exhaustive-deps */
  const checkinEntry = useMemo(() => {
    const list = readGuestCheckins().filter((e) => Number(e.room) === Number(room));
    return list.length ? list[list.length - 1] : null;
  }, [tick, view]);
  const orders = useMemo(
    () => readGuestOrders().filter((o) => Number(o.room) === Number(room)),
    [tick, view]
  );
  const requests = useMemo(
    () => readGuestRequests().filter((r) => Number(r.room) === Number(room)),
    [tick, view]
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  const active = checkinEntry && checkinEntry.status !== "checked_out" ? checkinEntry : null;
  const justLeft = checkinEntry && checkinEntry.status === "checked_out";

  const addRequest = (label) => {
    const list = readGuestRequests();
    list.push({ id: uid(), room, label, status: "Transmis à la réception ✓", at: nowTime() });
    writeGuestRequests(list);
    logActivity("💬", `Demande ch. ${room} — ${label}`, "request");
    toast.success("Demande transmise à la réception ✓");
  };

  const placeOrder = (order) => {
    const list = readGuestOrders();
    list.push({ id: uid(), room, placed_at: Date.now(), at: nowTime(), ...order });
    writeGuestOrders(list);
    if (order.order_type === "breakfast") {
      logActivity("🥐", `Petit-déj programmé ch. ${room} — ${order.label} · ${order.slot} · ${fmtEuro(order.total)}`, "order");
    } else {
      logActivity("🍽️", `Commande room service ch. ${room} — ${fmtEuro(order.total)} (${order.payment_method === "room" ? "sur la note" : "à la livraison"})`, "order");
    }
  };

  const common = { room, active, checkinEntry, orders, requests, addRequest, placeOrder, toast, back: () => setView("hub"), setView };

  return (
    <div style={{ ...FF, minHeight: "100vh", background: C.bg }}>
      <div key={view} className="wgm-view" style={{ maxWidth: 560, margin: "0 auto", padding: "18px 16px 140px" }}>
        {view === "hub" && <PortalHub {...common} justLeft={justLeft} />}
        {view === "checkin" && <CheckinWizard {...common} />}
        {view === "service" && <RoomServiceView {...common} />}
        {view === "breakfast" && <BreakfastView {...common} />}
        {view === "services" && <HotelServicesView {...common} />}
        {view === "nearby" && <NearbyView {...common} />}
        {view === "info" && <InfoView {...common} />}
        {view === "concierge" && <ConciergeView {...common} />}
        {view === "checkout" && <CheckoutExpress {...common} />}
      </div>
    </div>
  );
}

/* ------- Hub d'accueil ------- */

function PortalHub({ room, active, justLeft, orders, requests, setView }) {
  const hotel = readHotelProfile();
  const firstName = active ? (active.guest_name || "").split(" ")[0] : "";
  const heroMsg = justLeft
    ? "Chambre libérée — merci pour votre séjour ! 👋"
    : active
    ? active.express_checkout
      ? `Check-out enregistré — bonne route, ${firstName} ! 🧳`
      : `Bon séjour, ${firstName} — vous êtes enregistré ✓`
    : "Bienvenue ! Toute votre chambre, depuis votre téléphone.";

  const rsInProgress = orders.filter((o) => o.order_type === "room_service" && o.status !== "done").length;
  const breakfastScheduled = orders.some((o) => o.order_type === "breakfast" && o.status === "scheduled");
  const inProgress = orders.filter((o) => o.status !== "done");

  const tiles = [
    !active && {
      key: "checkin", big: true, emoji: "🛎️", title: "Check-in en ligne",
      sub: "2 min — évitez l'attente à la réception", color: C.accentBlue, view: "checkin",
    },
    active && !active.express_checkout && {
      key: "checkout", big: true, emoji: "🧳", title: "Check-out express",
      sub: "Note, options de départ, facture par email", color: C.accentOrange, view: "checkout",
    },
    { key: "service", emoji: "🍽️", title: "Room service", sub: "Carte 24h/24", badge: rsInProgress || null, view: "service" },
    { key: "breakfast", emoji: "🥐", title: "Petit-déjeuner", sub: "Buffet 7h – 10h30 · en chambre (+8€)", badge: breakfastScheduled ? "⏰" : null, view: "breakfast" },
    { key: "services", emoji: "🧖", title: "Services de l'hôtel", sub: "Spa, pressing, ménage…", view: "services" },
    { key: "nearby", emoji: "📍", title: "Autour de vous", sub: "Bons plans du quartier", view: "nearby" },
    { key: "info", emoji: "ℹ️", title: "Infos pratiques", sub: "Wi-Fi, horaires, parking", view: "info" },
    { key: "concierge", emoji: "💬", title: "Conciergerie", sub: "Une demande ? On s'en occupe", badge: requests.length || null, view: "concierge" },
  ].filter(Boolean);

  return (
    <div>
      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)",
          borderRadius: 20, padding: 22, color: C.white, marginBottom: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontSize: 34 }}>{hotel.logo_emoji}</div>
          <span style={{ ...FF, background: "rgba(255,255,255,0.14)", borderRadius: 999, padding: "5px 12px", fontSize: 12.5, fontWeight: 700 }}>
            Chambre {room}
          </span>
        </div>
        <div style={{ ...FF, fontSize: 21, fontWeight: 800, marginTop: 12 }}>{hotel.name}</div>
        <div style={{ ...FF, fontSize: 14, opacity: 0.75, marginTop: 5, lineHeight: 1.45 }}>{heroMsg}</div>
        {active && active.access_code && !active.express_checkout && (
          <div style={{ ...FF, fontSize: 12.5, opacity: 0.6, marginTop: 8 }}>
            Code d'accès : <b>{active.access_code}</b>
          </div>
        )}
      </div>

      {/* Tuiles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {tiles.map((t) => (
          <div
            key={t.key}
            className="wgm-tile"
            onClick={() => setView(t.view)}
            style={{
              gridColumn: t.big ? "1 / -1" : undefined,
              background: t.color ? t.color : C.surface,
              color: t.color ? C.white : C.text,
              borderRadius: 18, padding: t.big ? "18px 20px" : 16,
              border: `1px solid ${t.color ? "transparent" : C.border}`,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.05)",
              cursor: "pointer", position: "relative",
              display: t.big ? "flex" : "block", alignItems: "center", gap: 14,
            }}
          >
            <div style={{ fontSize: t.big ? 34 : 28 }}>{t.emoji}</div>
            <div>
              <div style={{ ...FF, fontWeight: 800, fontSize: t.big ? 17 : 15, marginTop: t.big ? 0 : 8 }}>{t.title}</div>
              <div style={{ ...FF, fontSize: 12.5, opacity: t.color ? 0.85 : 0.6, marginTop: 3, lineHeight: 1.35 }}>{t.sub}</div>
            </div>
            {t.badge && (
              <span
                style={{
                  ...FF, position: "absolute", top: 12, right: 12,
                  background: typeof t.badge === "number" ? C.accent : C.surfaceAlt,
                  color: typeof t.badge === "number" ? C.white : C.text,
                  borderRadius: 999, minWidth: 22, height: 22, padding: "0 6px",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 800,
                }}
              >
                {t.badge}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* En cours */}
      {(inProgress.length > 0 || requests.length > 0) && (
        <Surface style={{ marginTop: 16 }}>
          <div style={{ ...FF, fontWeight: 800, fontSize: 15, marginBottom: 4 }}>🕑 En cours</div>
          {inProgress.map((o) => (
            <StatusLine
              key={o.id}
              emoji={o.order_type === "breakfast" ? "🥐" : "🍽️"}
              label={o.order_type === "breakfast" ? `${o.label} · ${o.slot}` : o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
              status={o.status}
            />
          ))}
          {requests.map((r) => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ ...FF, fontSize: 14, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                💬 {r.label}
              </div>
              <Tag color={C.accentGreen} style={{ flexShrink: 0 }}>{r.status} · {r.at}</Tag>
            </div>
          ))}
        </Surface>
      )}

      <div style={{ ...FF, textAlign: "center", color: C.textTertiary, fontSize: 12.5, marginTop: 26, lineHeight: 1.6 }}>
        Réception 24h/24 — composez le 9<br />
        Propulsé par <b>Wegemo Hôtel</b>
      </div>
    </div>
  );
}

/* ------- Check-in en ligne (wizard 4 étapes + confirmation) ------- */

function CheckinWizard({ room, back, toast }) {
  const [step, setStep] = useState(1);
  const [entry, setEntry] = useState(null);
  const fileRef = useRef(null);
  const [f, setF] = useState({
    checkin_date: todayISO(),
    checkout_date: addDaysISO(todayISO(), 1),
    arrival_time: "15h - 17h",
    guests: 2,
    guest_name: "",
    email: "",
    phone: "",
    nationality: "Française",
    birthdate: "",
    id_type: ID_TYPES[0],
    id_number: "",
    id_file: "",
    notes: "",
    consent: false,
    signature: "",
  });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  const canNext =
    step === 1
      ? f.checkin_date && f.checkout_date && f.checkout_date > f.checkin_date
      : step === 2
      ? f.guest_name.trim() && f.email.trim()
      : step === 3
      ? f.id_number.trim()
      : f.consent && f.signature.trim().length >= 3;

  const submit = () => {
    const e = {
      id: uid(),
      restaurant_id: DEMO_HOTEL.id,
      guest_name: f.guest_name.trim(),
      email: f.email.trim(),
      phone: f.phone.trim(),
      room: Number(room),
      guests: f.guests,
      checkin_date: f.checkin_date,
      checkout_date: f.checkout_date,
      arrival_time: f.arrival_time,
      nationality: f.nationality,
      birthdate: f.birthdate,
      id_type: f.id_type,
      id_number: f.id_number.trim(),
      id_provided: !!f.id_file,
      notes: f.notes.trim(),
      status: "arriving",
      access_code: genAccessCode(room),
      express_checkout: false,
    };
    const list = readGuestCheckins().filter((x) => Number(x.room) !== Number(room));
    list.push(e);
    writeGuestCheckins(list);
    logActivity("📲", `Check-in en ligne — ${e.guest_name} · ch. ${room} · code ${e.access_code}`, "stay");
    setEntry(e);
    setStep(5);
    toast.success("Check-in enregistré — la réception est prévenue ✓");
  };

  const stepTitles = ["Votre séjour", "Vos coordonnées", "Pièce d'identité", "Récap & signature"];

  if (step === 5 && entry) {
    return (
      <div>
        <PortalHeader room={room} title="Check-in confirmé" onBack={back} />
        <div style={{ textAlign: "center", fontSize: 44, margin: "18px 0 6px" }}>🎉</div>
        <div
          style={{
            background: "linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)",
            borderRadius: 20, padding: 24, color: C.white, textAlign: "center",
          }}
        >
          <div style={{ ...FF, fontSize: 13, opacity: 0.7, fontWeight: 600 }}>Votre code d'accès</div>
          <div style={{ ...FF, fontSize: 30, fontWeight: 900, letterSpacing: 1.5, margin: "8px 0" }}>{entry.access_code}</div>
          <div style={{ ...FF, fontSize: 12.5, opacity: 0.7, lineHeight: 1.5 }}>
            À présenter à la réception pour récupérer votre clé.
          </div>
        </div>
        <Surface style={{ marginTop: 14 }}>
          {[
            ["Nom", entry.guest_name],
            ["Chambre", `Chambre ${entry.room} · ${entry.guests} pers.`],
            ["Dates", `${fmtDate(entry.checkin_date)} → ${fmtDate(entry.checkout_date)}`],
            ["Arrivée estimée", entry.arrival_time],
            ["Pièce d'identité", entry.id_provided ? `${entry.id_type} ✅ fournie` : `${entry.id_type} — à présenter à l'arrivée`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ ...FF, fontSize: 13.5, color: C.textSecondary }}>{k}</span>
              <span style={{ ...FF, fontSize: 13.5, fontWeight: 700, color: C.text, textAlign: "right" }}>{v}</span>
            </div>
          ))}
        </Surface>
        <div style={{ marginTop: 16 }}>
          <Btn variant="primary" size="lg" full onClick={back}>
            Découvrir ma chambre →
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PortalHeader room={room} title="🛎️ Check-in en ligne" onBack={back} />

      {/* Barre de progression */}
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        {[1, 2, 3, 4].map((s) => (
          <div key={s} style={{ flex: 1, height: 5, borderRadius: 999, background: s <= step ? C.accentBlue : C.border }} />
        ))}
      </div>
      <div style={{ ...FF, fontSize: 13, color: C.textSecondary, fontWeight: 700, marginBottom: 14 }}>
        Étape {step}/4 — {stepTitles[step - 1]}
      </div>

      {step === 1 && (
        <Surface>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <InputField label="Arrivée" type="date" value={f.checkin_date} onChange={set("checkin_date")} />
            <InputField label="Départ" type="date" value={f.checkout_date} onChange={set("checkout_date")} />
          </div>
          <SelectField label="Heure d'arrivée estimée" value={f.arrival_time} onChange={set("arrival_time")} options={ARRIVAL_SLOTS} style={{ marginTop: 12 }} />
          <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ ...FF, fontSize: 12.5, fontWeight: 700, color: C.textSecondary }}>Nombre de voyageurs</div>
            <Stepper value={f.guests} onChange={set("guests")} min={1} max={6} />
          </div>
        </Surface>
      )}

      {step === 2 && (
        <Surface>
          <InputField label="Nom complet" required value={f.guest_name} onChange={set("guest_name")} placeholder="Prénom Nom" />
          <InputField label="Email" required type="email" value={f.email} onChange={set("email")} placeholder="vous@email.fr" style={{ marginTop: 12 }} />
          <InputField label="Téléphone" type="tel" value={f.phone} onChange={set("phone")} placeholder="06 …" style={{ marginTop: 12 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <InputField label="Nationalité" value={f.nationality} onChange={set("nationality")} />
            <InputField label="Date de naissance" type="date" value={f.birthdate} onChange={set("birthdate")} />
          </div>
        </Surface>
      )}

      {step === 3 && (
        <Surface>
          <SelectField label="Type de pièce" value={f.id_type} onChange={set("id_type")} options={ID_TYPES} />
          <InputField label="Numéro de la pièce" required value={f.id_number} onChange={set("id_number")} placeholder="Ex : 190275T00845" style={{ marginTop: 12 }} />
          <div
            onClick={() => fileRef.current && fileRef.current.click()}
            style={{
              marginTop: 14, border: `2px dashed ${f.id_file ? C.accentGreen : C.borderStrong}`,
              background: f.id_file ? C.accentGreen + "14" : C.surfaceAlt,
              borderRadius: 14, padding: "22px 16px", textAlign: "center", cursor: "pointer",
            }}
          >
            <div style={{ fontSize: 26 }}>{f.id_file ? "✅" : "📷"}</div>
            <div style={{ ...FF, fontSize: 14, fontWeight: 700, color: f.id_file ? C.accentGreen : C.text, marginTop: 6 }}>
              {f.id_file ? f.id_file : "Photographier ou importer la pièce"}
            </div>
            <div style={{ ...FF, fontSize: 12, color: C.textSecondary, marginTop: 4 }}>
              {f.id_file ? "Touchez pour remplacer" : "JPG, PNG ou PDF"}
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            capture="environment"
            style={{ display: "none" }}
            onChange={(e) => set("id_file")((e.target.files && e.target.files[0] && e.target.files[0].name) || "")}
          />
          <div style={{ ...FF, fontSize: 12, color: C.textTertiary, marginTop: 12, lineHeight: 1.5 }}>
            Obligatoire pour la fiche de police (comme sur Booking.com / Airbnb). Vos données restent chez l'hôtelier.
          </div>
        </Surface>
      )}

      {step === 4 && (
        <Surface>
          <div style={{ background: C.surfaceAlt, borderRadius: 14, padding: 14 }}>
            {[
              ["Nom", f.guest_name || "—"],
              ["Voyageurs", `${f.guests} pers. · Chambre ${room}`],
              ["Dates", `${fmtDate(f.checkin_date)} → ${fmtDate(f.checkout_date)}`],
              ["Arrivée", f.arrival_time],
              ["Pièce d'identité", f.id_file ? `${f.id_type} ✅ fournie` : `${f.id_type} — à présenter`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "5px 0" }}>
                <span style={{ ...FF, fontSize: 13, color: C.textSecondary }}>{k}</span>
                <span style={{ ...FF, fontSize: 13, fontWeight: 700, color: C.text, textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
          <InputField label="Demandes particulières" value={f.notes} onChange={set("notes")} placeholder="Étage calme, lit bébé…" style={{ marginTop: 14 }} />
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={f.consent} onChange={(e) => set("consent")(e.target.checked)} style={{ marginTop: 3, width: 16, height: 16 }} />
            <span style={{ ...FF, fontSize: 13, color: C.textSecondary, lineHeight: 1.45 }}>
              J'accepte le règlement intérieur de l'hôtel et confirme l'exactitude des informations fournies.
            </span>
          </label>
          <InputField
            label="Signature — tapez votre nom complet"
            required
            value={f.signature}
            onChange={set("signature")}
            placeholder={f.guest_name || "Prénom Nom"}
            style={{ marginTop: 14 }}
            inputStyle={{ fontStyle: "italic", fontWeight: 700 }}
          />
        </Surface>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {step > 1 && (
          <Btn variant="subtle" size="lg" onClick={() => setStep(step - 1)}>
            ← Retour
          </Btn>
        )}
        {step < 4 ? (
          <Btn variant="blue" size="lg" full disabled={!canNext} onClick={() => setStep(step + 1)}>
            Continuer →
          </Btn>
        ) : (
          <Btn variant="green" size="lg" full disabled={!canNext} onClick={submit}>
            ✅ Valider mon check-in
          </Btn>
        )}
      </div>
    </div>
  );
}

/* ------- Room service ------- */

function RoomServiceView({ room, active, orders, placeOrder, toast, back }) {
  const [cart, setCart] = useState({});
  const menu = useMemo(readMenu, []);
  const categories = [...new Set(menu.map((m) => m.category))];
  const cartItems = menu.filter((m) => cart[m.id] > 0);
  const total = cartItems.reduce((s, m) => s + m.price * cart[m.id], 0);
  const rsOrders = orders.filter((o) => o.order_type === "room_service").slice().reverse();

  const add = (id, d) =>
    setCart((c) => {
      const q = Math.max(0, (c[id] || 0) + d);
      const n = { ...c, [id]: q };
      if (q === 0) delete n[id];
      return n;
    });

  const order = (payment) => {
    if (payment === "room" && !active) {
      toast.error("Faites d'abord votre check-in pour payer sur la note");
      return;
    }
    placeOrder({
      order_type: "room_service",
      payment_method: payment,
      status: "pending",
      items: cartItems.map((m) => ({ name: m.name, qty: cart[m.id], price: m.price, emoji: m.emoji })),
      total,
      note: "",
    });
    setCart({});
    toast.success(payment === "room" ? `Commande envoyée — facturée sur la note de la chambre ${room} ✓` : "Commande envoyée — paiement à la livraison ✓");
  };

  return (
    <div>
      <PortalHeader room={room} title="🍽️ Room service" onBack={back} />

      {rsOrders.length > 0 && (
        <Surface style={{ marginBottom: 16 }}>
          <div style={{ ...FF, fontWeight: 800, fontSize: 14.5, marginBottom: 4 }}>Vos commandes</div>
          {rsOrders.map((o) => (
            <StatusLine key={o.id} emoji="🍽️" label={`${o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")} · ${fmtEuro(o.total)}`} status={o.status} />
          ))}
        </Surface>
      )}

      {categories.map((cat) => (
        <div key={cat}>
          <SectionTitle>{cat}</SectionTitle>
          <Surface style={{ padding: "4px 16px" }}>
            {menu
              .filter((m) => m.category === cat)
              .map((m, i, arr) => (
                <div
                  key={m.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "13px 0",
                    borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
                  }}
                >
                  <div style={{ fontSize: 26 }}>{m.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...FF, fontWeight: 700, fontSize: 14.5, color: C.text }}>{m.name}</div>
                    <div style={{ ...FF, fontSize: 12.5, color: C.textSecondary, marginTop: 2 }}>{m.desc}</div>
                    <div style={{ ...FF, fontSize: 13.5, fontWeight: 800, color: C.text, marginTop: 4 }}>{fmtEuro(m.price)}</div>
                  </div>
                  {cart[m.id] > 0 ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.surfaceAlt, borderRadius: 999, padding: "4px 8px" }}>
                      <button onClick={() => add(m.id, -1)} style={{ ...FF, width: 26, height: 26, borderRadius: 999, border: "none", background: C.surface, fontWeight: 800, cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>−</button>
                      <span style={{ ...FF, fontWeight: 800, fontSize: 14, minWidth: 14, textAlign: "center" }}>{cart[m.id]}</span>
                      <button onClick={() => add(m.id, 1)} style={{ ...FF, width: 26, height: 26, borderRadius: 999, border: "none", background: C.dark, color: C.white, fontWeight: 800, cursor: "pointer" }}>+</button>
                    </span>
                  ) : (
                    <Btn variant="subtle" size="sm" onClick={() => add(m.id, 1)}>+ Ajouter</Btn>
                  )}
                </div>
              ))}
          </Surface>
        </div>
      ))}

      {/* Barre panier */}
      {total > 0 && (
        <div
          style={{
            position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 100,
            background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)",
            borderTop: `1px solid ${C.border}`, padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
          }}
        >
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ ...FF, fontSize: 13.5, color: C.textSecondary, fontWeight: 600 }}>
                {cartItems.reduce((s, m) => s + cart[m.id], 0)} article(s)
              </span>
              <span style={{ ...FF, fontSize: 18, fontWeight: 900, color: C.text }}>{fmtEuro(total)}</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="primary" size="lg" full dimmed={!active} onClick={() => order("room")}>
                🛏️ Sur la note — Ch. {room}
              </Btn>
              <Btn variant="subtle" size="lg" full onClick={() => order("delivery")}>
                💳 À la livraison
              </Btn>
            </div>
            {!active && (
              <div style={{ ...FF, fontSize: 12, color: C.textTertiary, marginTop: 8, textAlign: "center" }}>
                💡 Faites votre check-in en ligne pour débloquer le paiement sur la note.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------- Petit-déjeuner ------- */

function BreakfastView({ room, active, orders, placeOrder, toast, back }) {
  const [formula, setFormula] = useState(null);
  const [persons, setPersons] = useState(2);
  const [slot, setSlot] = useState(BREAKFAST_SLOTS[2]);
  const [allergies, setAllergies] = useState("");
  const scheduled = orders.filter((o) => o.order_type === "breakfast").slice().reverse();

  const sel = BREAKFAST_FORMULAS.find((x) => x.id === formula);
  const total = sel ? sel.price * persons + TRAY_CHARGE : 0;

  const order = () => {
    placeOrder({
      order_type: "breakfast",
      payment_method: active ? "room" : "delivery",
      status: "scheduled",
      label: `${persons} × ${sel.name}`,
      slot,
      persons,
      allergies,
      items: [{ name: `Petit-déjeuner ${sel.name}`, qty: persons, price: sel.price, emoji: sel.emoji }, { name: "Service en chambre", qty: 1, price: TRAY_CHARGE, emoji: "🛎️" }],
      total,
      note: `Créneau ${slot}${allergies ? " · Allergies : " + allergies : ""}`,
    });
    setFormula(null);
    toast.success(`Petit-déjeuner programmé · ${slot} ⏰`);
  };

  return (
    <div>
      <PortalHeader room={room} title="🥐 Petit-déjeuner" onBack={back} />

      {scheduled.length > 0 && (
        <Surface style={{ marginBottom: 16, border: `1px solid ${C.accentGreen}55`, background: C.accentGreen + "0D" }}>
          {scheduled.map((o) => (
            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "6px 0", flexWrap: "wrap" }}>
              <div style={{ ...FF, fontSize: 14, fontWeight: 700, color: C.text }}>🥐 {o.label} · {fmtEuro(o.total)}</div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Tag color={o.status === "done" ? C.textTertiary : C.accentGreen}>
                  {o.status === "done" ? "Livré ✓" : `Programmé · ${o.slot} ⏰`}
                </Tag>
                {o.status === "scheduled" && (
                  <button
                    onClick={() => {
                      writeGuestOrders(readGuestOrders().filter((x) => x.id !== o.id));
                      toast.info("Petit-déjeuner annulé");
                    }}
                    style={{
                      ...FF, border: `1px solid ${C.border}`, background: C.surface, borderRadius: 999,
                      padding: "3px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: C.accent,
                    }}
                  >
                    Annuler
                  </button>
                )}
              </span>
            </div>
          ))}
        </Surface>
      )}

      {/* Buffet */}
      <Surface>
        <div style={{ ...FF, fontWeight: 800, fontSize: 15.5 }}>☀️ Buffet — Salle Verrière (RDC)</div>
        <div style={{ ...FF, fontSize: 13.5, color: C.textSecondary, marginTop: 8, lineHeight: 1.65 }}>
          Tous les jours de <b>7h00 à 10h30</b> (dernier service 10h15).<br />
          22,00 € / personne · enfants -12 ans 11,00 € · -3 ans offert.<br />
          Options sans gluten &amp; vegan disponibles sur demande.
        </div>
        <div style={{ ...FF, fontSize: 12.5, color: C.textTertiary, marginTop: 10, fontStyle: "italic" }}>
          Inclus si votre tarif comprend le petit-déjeuner.
        </div>
      </Surface>

      {/* En chambre */}
      <SectionTitle>En chambre — service {fmtEuro(TRAY_CHARGE)} / plateau</SectionTitle>
      <Surface>
        <div style={{ display: "grid", gap: 10 }}>
          {BREAKFAST_FORMULAS.map((fm) => {
            const on = formula === fm.id;
            return (
              <div
                key={fm.id}
                onClick={() => setFormula(fm.id)}
                style={{
                  display: "flex", gap: 12, alignItems: "flex-start", padding: 13, borderRadius: 14, cursor: "pointer",
                  border: `2px solid ${on ? C.accentOrange : C.border}`,
                  background: on ? "#FFF8EE" : C.surface,
                }}
              >
                <div style={{ fontSize: 26 }}>{fm.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ ...FF, fontWeight: 800, fontSize: 14.5 }}>{fm.name}</span>
                    <span style={{ ...FF, fontWeight: 800, fontSize: 14.5 }}>{fmtEuro(fm.price)}</span>
                  </div>
                  <div style={{ ...FF, fontSize: 12.5, color: C.textSecondary, marginTop: 3, lineHeight: 1.45 }}>{fm.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {sel && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ ...FF, fontSize: 12.5, fontWeight: 700, color: C.textSecondary }}>Nombre de personnes</div>
              <Stepper value={persons} onChange={setPersons} min={1} max={6} />
            </div>
            <SelectField label="Créneau de livraison" value={slot} onChange={setSlot} options={BREAKFAST_SLOTS} style={{ marginTop: 12 }} />
            <InputField label="Allergies ou préférences" value={allergies} onChange={setAllergies} placeholder="Sans gluten, lait d'avoine…" style={{ marginTop: 12 }} />
            <div style={{ ...FF, background: C.surfaceAlt, borderRadius: 12, padding: "10px 14px", fontSize: 13, color: C.textSecondary, marginTop: 14, fontWeight: 600 }}>
              {persons} × {sel.name} ({fmtEuro(sel.price)}) + service en chambre {fmtEuro(TRAY_CHARGE)} = <b style={{ color: C.text }}>{fmtEuro(total)}</b>
            </div>
            <div style={{ marginTop: 12 }}>
              <Btn variant="orange" size="lg" full onClick={order}>
                🥐 Commander pour la chambre {room} — {fmtEuro(total)}
              </Btn>
            </div>
            <div style={{ ...FF, fontSize: 12, color: C.textTertiary, marginTop: 8, textAlign: "center" }}>
              {active ? "Facturé sur votre note de chambre." : "Réglement à la livraison (check-in non fait)."}{" "}
              Commandez avant 22h la veille pour les créneaux avant 8h.
            </div>
          </div>
        )}
      </Surface>
    </div>
  );
}

/* ------- Services de l'hôtel ------- */

function HotelServicesView({ room, addRequest, back }) {
  return (
    <div>
      <PortalHeader room={room} title="🧖 Services de l'hôtel" onBack={back} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {HOTEL_SERVICES.map((s) => (
          <Surface key={s.id} style={{ padding: 14, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 26 }}>{s.emoji}</div>
            <div style={{ ...FF, fontWeight: 800, fontSize: 14, marginTop: 8 }}>{s.name}</div>
            <div style={{ ...FF, fontSize: 12, color: C.textSecondary, marginTop: 3, lineHeight: 1.4, flex: 1 }}>{s.desc}</div>
            <div style={{ ...FF, fontSize: 13, fontWeight: 800, margin: "8px 0", color: s.price === 0 ? C.accentGreen : C.text }}>
              {s.price === 0 ? "Inclus" : fmtEuro(s.price)}
            </div>
            <Btn variant="subtle" size="sm" full onClick={() => addRequest(`${s.emoji} ${s.name}`)}>
              {s.cta}
            </Btn>
          </Surface>
        ))}
      </div>
    </div>
  );
}

/* ------- Autour de vous ------- */

function NearbyView({ room, addRequest, back }) {
  return (
    <div>
      <PortalHeader room={room} title="📍 Autour de vous" onBack={back} />
      <div style={{ display: "grid", gap: 12 }}>
        {NEARBY.map((n) => (
          <Surface key={n.id}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ fontSize: 28 }}>{n.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ ...FF, fontWeight: 800, fontSize: 15 }}>{n.title}</span>
                  <Tag color={C.accentPurple}>{n.tag}</Tag>
                </div>
                <div style={{ ...FF, fontSize: 12.5, color: C.textSecondary, marginTop: 3, fontWeight: 600 }}>
                  {n.when} · {n.dist}
                </div>
                <div style={{ ...FF, fontSize: 13, color: C.textSecondary, marginTop: 6, lineHeight: 1.5 }}>{n.desc}</div>
                <div style={{ marginTop: 10 }}>
                  <Btn variant="subtle" size="sm" onClick={() => addRequest(`${n.emoji} ${n.title}`)}>
                    Réserver via la réception
                  </Btn>
                </div>
              </div>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

/* ------- Infos pratiques ------- */

function InfoView({ room, back }) {
  return (
    <div>
      <PortalHeader room={room} title="ℹ️ Infos pratiques" onBack={back} />
      <Surface style={{ padding: "6px 18px" }}>
        {HOTEL_INFO.map((i, idx) => (
          <div
            key={i.label}
            style={{
              display: "flex", gap: 14, alignItems: "flex-start", padding: "13px 0",
              borderBottom: idx < HOTEL_INFO.length - 1 ? `1px solid ${C.border}` : "none",
            }}
          >
            <div style={{ fontSize: 22 }}>{i.emoji}</div>
            <div>
              <div style={{ ...FF, fontWeight: 800, fontSize: 14 }}>{i.label}</div>
              <div style={{ ...FF, fontSize: 13, color: C.textSecondary, marginTop: 2, lineHeight: 1.5 }}>{i.value}</div>
            </div>
          </div>
        ))}
      </Surface>
    </div>
  );
}

/* ------- Conciergerie ------- */

function ConciergeView({ room, requests, addRequest, back }) {
  const [msg, setMsg] = useState("");
  return (
    <div>
      <PortalHeader room={room} title="💬 Conciergerie" onBack={back} />

      <SectionTitle style={{ marginTop: 0 }}>Demandes rapides</SectionTitle>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {CONCIERGE_QUICK.map((q) => (
          <button
            key={q.label}
            onClick={() => addRequest(`${q.emoji} ${q.label}`)}
            style={{
              ...FF, border: `1px solid ${C.border}`, background: C.surface, borderRadius: 999,
              padding: "9px 14px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", color: C.text,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            {q.emoji} {q.label}
          </button>
        ))}
      </div>

      <SectionTitle>Message libre</SectionTitle>
      <Surface>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Bonjour, serait-il possible de…"
          rows={3}
          style={{
            ...FF, width: "100%", border: `1px solid ${C.borderStrong}`, borderRadius: 12,
            padding: "11px 14px", fontSize: 14.5, resize: "vertical", outline: "none", color: C.text,
          }}
        />
        <div style={{ marginTop: 10, textAlign: "right" }}>
          <Btn
            variant="primary"
            size="md"
            disabled={!msg.trim()}
            onClick={() => {
              addRequest(`✉️ « ${msg.trim()} »`);
              setMsg("");
            }}
          >
            Envoyer
          </Btn>
        </div>
      </Surface>

      {requests.length > 0 && (
        <>
          <SectionTitle>Vos demandes</SectionTitle>
          <Surface style={{ padding: "6px 18px" }}>
            {requests.slice().reverse().map((r, idx, arr) => (
              <div
                key={r.id}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
                  padding: "11px 0", borderBottom: idx < arr.length - 1 ? `1px solid ${C.border}` : "none",
                }}
              >
                <div style={{ ...FF, fontSize: 13.5, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{r.label}</div>
                <Tag color={C.accentGreen} style={{ flexShrink: 0 }}>{r.status} · {r.at}</Tag>
              </div>
            ))}
          </Surface>
        </>
      )}
    </div>
  );
}

/* ------- Check-out express ------- */

function CheckoutExpress({ room, active, orders, toast, back }) {
  const [screen, setScreen] = useState(1);
  const [late, setLate] = useState(false);
  const [luggage, setLuggage] = useState(false);
  const [email, setEmail] = useState((active && active.email) || "");
  const [rating, setRating] = useState(0);

  if (!active) {
    return (
      <div>
        <PortalHeader room={room} title="🧳 Check-out express" onBack={back} />
        <Surface style={{ textAlign: "center", padding: 28 }}>
          <div style={{ fontSize: 34 }}>🛎️</div>
          <div style={{ ...FF, fontWeight: 800, fontSize: 15, marginTop: 10 }}>Faites d'abord votre check-in</div>
          <div style={{ ...FF, fontSize: 13, color: C.textSecondary, marginTop: 6 }}>
            Le check-out express est disponible une fois votre séjour enregistré.
          </div>
        </Surface>
      </div>
    );
  }

  const { lines, total } = computeBill(active, orders, late);

  const submit = () => {
    const list = readGuestCheckins().map((e) =>
      e.id === active.id
        ? {
            ...e,
            status: "departing",
            express_checkout: true,
            late_checkout: late,
            luggage_hold: luggage,
            invoice_email: email.trim(),
            bill_total: Math.round(total * 100) / 100,
          }
        : e
    );
    writeGuestCheckins(list);
    logActivity("🧳", `Check-out express — ${active.guest_name} · ch. ${room} · note ${fmtEuro(total)}`, "stay");
    setScreen(3);
    toast.success("Check-out enregistré — la réception vérifie la chambre ✓");
  };

  const giveRating = (s) => {
    if (rating === 0) logActivity("⭐", `Avis client — ${active.guest_name} · ch. ${room} : ${s}/5`, "stay");
    setRating(s);
    writeGuestCheckins(readGuestCheckins().map((e) => (e.id === active.id ? { ...e, rating: s } : e)));
  };

  const CheckRow = ({ checked, onChange, title, sub }) => (
    <label style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", cursor: "pointer", borderBottom: `1px solid ${C.border}` }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 17, height: 17, marginTop: 2 }} />
      <span>
        <span style={{ ...FF, display: "block", fontWeight: 700, fontSize: 14.5, color: C.text }}>{title}</span>
        <span style={{ ...FF, display: "block", fontSize: 12.5, color: C.textSecondary, marginTop: 2 }}>{sub}</span>
      </span>
    </label>
  );

  return (
    <div>
      <PortalHeader room={room} title="🧳 Check-out express" onBack={back} />

      {screen === 1 && (
        <div>
          <Surface>
            <div style={{ ...FF, fontWeight: 800, fontSize: 15.5, marginBottom: 8 }}>🧾 Note de chambre</div>
            {lines.map((l) => (
              <div key={l.label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ ...FF, fontSize: 13.5, color: C.textSecondary, lineHeight: 1.4 }}>{l.label}</span>
                <span style={{ ...FF, fontSize: 13.5, fontWeight: 700, color: C.text, flexShrink: 0 }}>{fmtEuro(l.amount)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 4px" }}>
              <span style={{ ...FF, fontSize: 15.5, fontWeight: 900 }}>Total</span>
              <span style={{ ...FF, fontSize: 15.5, fontWeight: 900 }}>{fmtEuro(total)}</span>
            </div>
            <div style={{ ...FF, fontSize: 12, color: C.textTertiary, marginTop: 8, lineHeight: 1.5 }}>
              Payé par la carte utilisée à la réservation. Une question ? Composez le 9.
            </div>
          </Surface>

          <Surface style={{ marginTop: 12 }}>
            <div style={{ ...FF, fontWeight: 800, fontSize: 15 }}>🕛 Horaires</div>
            <div style={{ ...FF, fontSize: 13, color: C.textSecondary, marginTop: 8, lineHeight: 1.8 }}>
              Chambre à libérer avant <b>12h00</b><br />
              Late check-out <b>15h00</b> (+25€ selon disponibilité)<br />
              Bagagerie gratuite jusqu'à <b>18h00</b><br />
              Petit-déjeuner servi jusqu'à <b>10h30</b>
            </div>
          </Surface>

          <div style={{ marginTop: 16 }}>
            <Btn variant="primary" size="lg" full onClick={() => setScreen(2)}>
              Préparer mon départ →
            </Btn>
          </div>
        </div>
      )}

      {screen === 2 && (
        <div>
          <Surface>
            <CheckRow
              checked={late}
              onChange={setLate}
              title="🕐 Late check-out — 15h00 (+25,00 €)"
              sub="Selon disponibilité, confirmé par la réception."
            />
            <CheckRow
              checked={luggage}
              onChange={setLuggage}
              title="🧳 Bagagerie (gratuit)"
              sub="Vos bagages gardés en sécurité jusqu'à 18h."
            />
            <InputField label="Facture par email" type="email" value={email} onChange={setEmail} placeholder="vous@email.fr" style={{ marginTop: 14 }} />
            <div style={{ ...FF, background: C.surfaceAlt, borderRadius: 12, padding: "10px 14px", fontSize: 13.5, fontWeight: 700, marginTop: 14, display: "flex", justifyContent: "space-between" }}>
              <span>Total de la note</span>
              <span>{fmtEuro(total)}</span>
            </div>
          </Surface>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Btn variant="subtle" size="lg" onClick={() => setScreen(1)}>← Retour</Btn>
            <Btn variant="orange" size="lg" full onClick={submit}>
              ✅ Valider mon check-out
            </Btn>
          </div>
        </div>
      )}

      {screen === 3 && (
        <div>
          <div style={{ textAlign: "center", fontSize: 44, margin: "14px 0 8px" }}>👋</div>
          <Surface>
            <div style={{ ...FF, fontWeight: 800, fontSize: 16, textAlign: "center" }}>Check-out enregistré !</div>
            <div style={{ ...FF, fontSize: 13.5, color: C.textSecondary, marginTop: 12, lineHeight: 1.9 }}>
              ✔️ Libérez la chambre avant <b>{late ? "15h00" : "12h00"}</b><br />
              🔑 Laissez les clés sur la porte ou à la réception<br />
              {luggage && <>🧳 Déposez vos bagages à la bagagerie (gratuit jusqu'à 18h)<br /></>}
              📧 Facture de <b>{fmtEuro(total)}</b> envoyée à <b>{email || "votre email"}</b><br />
              🚕 Besoin d'un taxi ? Composez le 9
            </div>
          </Surface>

          <Surface style={{ marginTop: 12, textAlign: "center" }}>
            <div style={{ ...FF, fontWeight: 800, fontSize: 14.5 }}>Comment s'est passé votre séjour ?</div>
            <div style={{ marginTop: 10 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  onClick={() => giveRating(s)}
                  style={{ fontSize: 30, cursor: "pointer", filter: s <= rating ? "none" : "grayscale(1) opacity(.35)", padding: "0 3px" }}
                >
                  ⭐
                </span>
              ))}
            </div>
            {rating > 0 && (
              <div style={{ ...FF, fontSize: 13, color: rating >= 4 ? C.accentGreen : C.textSecondary, marginTop: 10, fontWeight: 700 }}>
                {rating >= 4 ? "Merci ! Votre avis compte énormément 💛" : "Merci pour votre retour — la direction en est informée."}
              </div>
            )}
          </Surface>

          <div style={{ marginTop: 16 }}>
            <Btn variant="primary" size="lg" full onClick={back}>
              Retour à l'accueil →
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   DASHBOARD HÔTELIER — Réception
   ========================================================================== */

const STATUS_META = {
  arriving: { label: "Arrivée", color: C.accentBlue },
  in_house: { label: "En séjour", color: C.accentGreen },
  departing: { label: "Départ", color: C.accentOrange },
  checked_out: { label: "Parti", color: C.textTertiary },
};

function RoomBadge({ room, color = C.dark }) {
  return (
    <div
      style={{
        ...FF, width: 52, height: 52, borderRadius: 14, background: color, color: C.white,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 9.5, fontWeight: 700, opacity: 0.7, letterSpacing: 0.5 }}>CH.</span>
      <span style={{ fontSize: 17, fontWeight: 900, lineHeight: 1 }}>{room}</span>
    </div>
  );
}

function KPICard({ label, value, sub, color }) {
  return (
    <Surface style={{ flex: 1, minWidth: 150 }}>
      <div style={{ ...FF, fontSize: 12.5, fontWeight: 700, color: C.textSecondary }}>{label}</div>
      <div style={{ ...FF, fontSize: 26, fontWeight: 900, color: color || C.text, marginTop: 6 }}>{value}</div>
      {sub && <div style={{ ...FF, fontSize: 12, color: C.textTertiary, marginTop: 4 }}>{sub}</div>}
    </Surface>
  );
}

function Dashboard({ onExit }) {
  const toast = useToast();
  const width = useWindowWidth();
  const mobile = width < 768;
  const [tab, setTab] = useState("overview");
  const [drawer, setDrawer] = useState(false);
  const [office, setOffice] = useState(false);
  const tick = useTick(2000);

  useEffect(() => {
    autoAdvanceOrders();
  }, [tick]);

  const [seedOrders, setSeedOrders] = useState(seedTodayOrders);
  const [seeds, setSeeds] = useState(seedCheckins);
  const [menu, setMenuState] = useState(readMenu);
  const [hotel, setHotelState] = useState(readHotelProfile);
  const setMenu = (updater) =>
    setMenuState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      writeLS(KEY_MENU, next);
      return next;
    });
  const setHotel = (updater) =>
    setHotelState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      writeLS(KEY_HOTEL, next);
      return next;
    });

  /* eslint-disable react-hooks/exhaustive-deps */
  const orders = useMemo(() => {
    const guest = readGuestOrders().slice().reverse().map((o) => ({ ...o, src: "guest" }));
    return [...guest, ...seedOrders];
  }, [tick, seedOrders]);

  const board = useMemo(() => {
    const guest = readGuestCheckins().map((e) => ({ ...e, src: "guest" }));
    const staff = readLS(KEY_STAFF_RESAS, []).map((e) => ({ ...e, src: "staff" }));
    const out = [...guest];
    // Une entrée existante pour la chambre (même clôturée) bloque les
    // seeds : sinon le séjour de démo "ressuscite" après un check-out.
    const taken = (room) => out.some((e) => Number(e.room) === Number(room));
    staff.forEach((e) => { if (!taken(e.room)) out.push(e); });
    seeds.forEach((e) => { if (!taken(e.room)) out.push(e); });
    return out;
  }, [tick, seeds]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const advanceOrder = (o) => {
    const meta = ORDER_STATUS_STAFF[o.status];
    if (!meta || !meta.next) return;
    if (o.src === "guest") {
      writeGuestOrders(readGuestOrders().map((x) => (x.id === o.id ? { ...x, status: meta.next } : x)));
    } else {
      setSeedOrders((list) => list.map((x) => (x.id === o.id ? { ...x, status: meta.next } : x)));
    }
    if (meta.next === "done") logActivity("✅", `Commande ch. ${o.room} livrée — ${fmtEuro(o.total)}`, "order");
    toast.success(`Ch. ${o.room} → ${ORDER_STATUS_STAFF[meta.next].label}`);
  };

  const setCheckinStatus = (entry, status) => {
    if (entry.src === "guest") {
      writeGuestCheckins(readGuestCheckins().map((e) => (e.id === entry.id ? { ...e, status } : e)));
    } else if (entry.src === "staff") {
      writeLS(KEY_STAFF_RESAS, readLS(KEY_STAFF_RESAS, []).map((e) => (e.id === entry.id ? { ...e, status } : e)));
    } else {
      setSeeds((list) => list.map((e) => (e.id === entry.id ? { ...e, status } : e)));
    }
    if (status === "in_house") {
      logActivity("🔑", `Check-in confirmé — ${entry.guest_name} · ch. ${entry.room}`, "stay");
    } else if (status === "checked_out") {
      setRoomCleaning(entry.room, true);
      logActivity("🧳", `Départ — ${entry.guest_name} · ch. ${entry.room} → à nettoyer`, "stay");
    }
    toast.success(status === "in_house" ? `${entry.guest_name} — check-in confirmé ✓` : `Ch. ${entry.room} libérée — envoyée au ménage 🧹`);
  };

  const addReservation = (form) => {
    const list = readLS(KEY_STAFF_RESAS, []);
    list.push({ id: uid(), status: "arriving", ...form });
    writeLS(KEY_STAFF_RESAS, list);
    logActivity("📝", `Réservation créée — ${form.guest_name} · ch. ${form.room}`, "stay");
    toast.success(`Réservation créée — ${form.guest_name}, ch. ${form.room} ✓`);
  };

  const newOrdersCount = orders.filter((o) => o.status === "pending").length;
  const arrivalsCount = board.filter((e) => e.status === "arriving").length;
  const departuresDue = board.filter(
    (e) => e.status === "departing" || (e.status === "in_house" && e.checkout_date && e.checkout_date <= todayISO())
  );
  const dirtyCount = Object.keys(readRoomsState()).length;

  const tabs = [
    ["overview", "📊", "Vue d'ensemble", 0],
    ["orders", "🧾", "Room service", newOrdersCount],
    ["checkin", "🛎️", "Check-in", arrivalsCount],
    ["departures", "🧳", "Check-out", departuresDue.length],
    ["rooms", "🛏️", "Chambres", dirtyCount],
    ["activity", "🕑", "Activité", 0],
    ["billing", "💶", "Facturation", 0],
    ["qr", "🔳", "QR Chambres", 0],
    ["inventory", "📦", "Inventaire", 0],
    ["menu", "🍽️", "Carte room service", 0],
    ["crm", "👥", "CRM", 0],
    ["settings", "⚙️", "Paramètres", 0],
  ];

  if (office) {
    return <OfficeView orders={orders} advanceOrder={advanceOrder} onClose={() => setOffice(false)} />;
  }

  const sidebar = (
    <div
      style={{
        width: 220, flexShrink: 0, background: C.surface, borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", padding: 14,
        ...(mobile
          ? { position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 500, boxShadow: "0 0 60px rgba(0,0,0,0.25)" }
          : { position: "sticky", top: 0, height: "100vh" }),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 8px 16px" }}>
        <span style={{ fontSize: 26 }}>{hotel.logo_emoji}</span>
        <div>
          <div style={{ ...FF, fontWeight: 900, fontSize: 15 }}>{hotel.name}</div>
          <div style={{ ...FF, fontSize: 11, color: C.textTertiary, fontWeight: 700 }}>WEGEMO HÔTEL</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {tabs.map(([id, emoji, label, badge]) => (
          <button
            key={id}
            onClick={() => { setTab(id); setDrawer(false); }}
            style={{
              ...FF, display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "10px 12px", borderRadius: 12, border: "none", cursor: "pointer",
              background: tab === id ? C.dark : "transparent",
              color: tab === id ? C.white : C.textSecondary,
              fontSize: 13.5, fontWeight: 700, marginBottom: 2, textAlign: "left",
            }}
          >
            <span style={{ fontSize: 16 }}>{emoji}</span>
            <span style={{ flex: 1 }}>{label}</span>
            {badge > 0 && (
              <span
                style={{
                  ...FF, background: C.accent, color: C.white, borderRadius: 999,
                  minWidth: 19, height: 19, padding: "0 5px", fontSize: 11, fontWeight: 800,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: "grid", gap: 6 }}>
        <Btn variant="subtle" size="sm" full onClick={() => setOffice(true)}>🍳 Office</Btn>
        <Btn variant="subtle" size="sm" full onClick={() => window.open(roomPortalPath(204), "_blank")}>📱 Vue client</Btn>
        <Btn variant="ghost" size="sm" full onClick={onExit}>← Quitter la démo</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ ...FF, display: "flex", minHeight: "100vh", background: C.bg }}>
      {(!mobile || drawer) && sidebar}
      {mobile && drawer && <div onClick={() => setDrawer(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 400 }} />}
      <div style={{ flex: 1, minWidth: 0, padding: mobile ? "14px 14px 40px" : "22px 26px 60px" }}>
        {mobile && (
          <button
            onClick={() => setDrawer(true)}
            style={{ ...FF, border: `1px solid ${C.border}`, background: C.surface, borderRadius: 10, padding: "8px 12px", fontWeight: 800, marginBottom: 12, cursor: "pointer" }}
          >
            ☰ Menu
          </button>
        )}
        <div key={tab} className="wgm-view">
        {tab === "overview" && <OverviewTab orders={orders} board={board} />}
        {tab === "orders" && <OrdersTab orders={orders} advanceOrder={advanceOrder} />}
        {tab === "checkin" && <CheckinBoardTab board={board} setCheckinStatus={setCheckinStatus} addReservation={addReservation} />}
        {tab === "departures" && <DeparturesTab departures={departuresDue} board={board} setCheckinStatus={setCheckinStatus} hotel={hotel} toast={toast} />}
        {tab === "rooms" && <RoomsTab board={board} toast={toast} />}
        {tab === "activity" && <ActivityTab />}
        {tab === "billing" && <BillingTab orders={orders} board={board} toast={toast} />}
        {tab === "qr" && <QRTab toast={toast} />}
        {tab === "inventory" && <InventoryTab menu={menu} setMenu={setMenu} toast={toast} />}
        {tab === "menu" && <MenuTab menu={menu} setMenu={setMenu} toast={toast} />}
        {tab === "crm" && <CRMTab board={board} />}
        {tab === "settings" && <SettingsTab hotel={hotel} setHotel={setHotel} toast={toast} />}
        </div>
      </div>
    </div>
  );
}

function PageTitle({ children, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
      <h1 style={{ ...FF, fontSize: 22, fontWeight: 900, color: C.text }}>{children}</h1>
      {right}
    </div>
  );
}

/* ------- Vue d'ensemble ------- */

function OverviewTab({ orders, board }) {
  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const count = orders.length;
  const inHouse = board.filter((e) => e.status === "in_house").length;
  const ratings = readGuestCheckins().map((e) => e.rating).filter(Boolean);
  const satisfaction = ratings.length
    ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1).replace(".", ",") + "/5"
    : "—";
  const log = readActivity().slice(0, 6);
  const activity = log.length
    ? log.map((a) => ({ key: a.id, text: `${a.emoji} ${a.text}`, right: "", at: `${a.at} · ${timeAgo(a.ts)}` }))
    : [
        ...orders.slice(0, 5).map((o) => ({
          key: "o" + o.id,
          text: `🍽️ Ch. ${o.room} — ${o.order_type === "breakfast" ? o.label + " (petit-déj)" : o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}`,
          right: fmtEuro(o.total), at: o.at,
        })),
        ...board.filter((e) => e.access_code).slice(0, 3).map((e) => ({
          key: "c" + e.id,
          text: `📲 Check-in en ligne — ${e.guest_name} (ch. ${e.room})`,
          right: e.access_code, at: "",
        })),
      ];
  const expressPending = board.filter((e) => e.express_checkout && e.status !== "checked_out");
  return (
    <div>
      <PageTitle>📊 Vue d'ensemble</PageTitle>
      {expressPending.length > 0 && (
        <Surface style={{ marginBottom: 14, border: `1px solid ${C.accentOrange}66`, background: C.accentOrange + "0D" }}>
          <div style={{ ...FF, fontWeight: 800, fontSize: 14.5, color: C.accentOrange }}>
            🧳 {expressPending.length} check-out express à contrôler
          </div>
          <div style={{ ...FF, fontSize: 13, color: C.textSecondary, marginTop: 4 }}>
            {expressPending.map((e) => `Ch. ${e.room} (${e.guest_name} · ${fmtEuro(e.bill_total || 0)})`).join(" · ")} — inspection et confirmation dans l'onglet 🧳 Check-out.
          </div>
        </Surface>
      )}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <KPICard label="CA du jour" value={fmtEuro(revenue)} sub="Room service + petit-déjeuner" color={C.accentGreen} />
        <KPICard label="Commandes room service" value={count} sub="Aujourd'hui" />
        <KPICard label="Panier moyen" value={count ? fmtEuro(revenue / count) : "—"} sub="Par commande" />
        <KPICard label="Chambres en séjour" value={inHouse} sub={`Sur ${DEMO_HOTEL_ROOMS.length} chambres`} color={C.accentBlue} />
        <KPICard label="Satisfaction" value={satisfaction} sub={ratings.length ? `${ratings.length} avis check-out` : "En attente d'avis"} color={C.accentPurple} />
      </div>
      <SectionTitle>Activité récente</SectionTitle>
      <Surface style={{ padding: "6px 18px" }}>
        {activity.map((a, i) => (
          <div key={a.key} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "11px 0", borderBottom: i < activity.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ ...FF, fontSize: 13.5, color: C.text, fontWeight: 600 }}>{a.text}</span>
            <span style={{ ...FF, fontSize: 13, color: C.textSecondary, fontWeight: 700, flexShrink: 0 }}>
              {a.right} {a.at && <span style={{ color: C.textTertiary }}>· {a.at}</span>}
            </span>
          </div>
        ))}
      </Surface>
    </div>
  );
}

/* ------- Room service (commandes) ------- */

function OrdersTab({ orders, advanceOrder }) {
  const [filter, setFilter] = useState("all");
  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready" || o.status === "scheduled").length,
    done: orders.filter((o) => o.status === "done").length,
  };
  const filters = [
    ["all", "Toutes", C.dark],
    ["pending", "Nouvelles", C.accentBlue],
    ["preparing", "En préparation", C.accentOrange],
    ["ready", "Prêtes", C.accentGreen],
    ["done", "Livrées", C.textTertiary],
  ];
  const shown = orders.filter((o) =>
    filter === "all" ? true : filter === "ready" ? o.status === "ready" || o.status === "scheduled" : o.status === filter
  );
  return (
    <div>
      <PageTitle>🧾 Room service</PageTitle>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {filters.map(([id, label, color]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            style={{
              ...FF, border: `1px solid ${filter === id ? "transparent" : C.border}`, borderRadius: 999,
              padding: "7px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer",
              background: filter === id ? color : C.surface, color: filter === id ? C.white : C.textSecondary,
            }}
          >
            {label} · {counts[id]}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {shown.length === 0 && (
          <Surface style={{ textAlign: "center", color: C.textTertiary, ...FF, fontSize: 14 }}>
            Aucune commande dans cette catégorie.
          </Surface>
        )}
        {shown.map((o) => {
          const meta = ORDER_STATUS_STAFF[o.status] || ORDER_STATUS_STAFF.pending;
          return (
            <Surface key={o.id} style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <RoomBadge room={o.room} />
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ ...FF, fontWeight: 700, fontSize: 14.5 }}>
                  {o.order_type === "breakfast"
                    ? `🥐 ${o.label} — petit-déj en chambre`
                    : o.items.map((i) => `${i.qty}× ${i.name}`).join(" · ")}
                </div>
                {o.note && <div style={{ ...FF, fontSize: 12.5, color: C.accentOrange, fontWeight: 700, marginTop: 3 }}>📝 {o.note}</div>}
                <div style={{ ...FF, fontSize: 12.5, color: C.textSecondary, marginTop: 4 }}>
                  {o.at} · {o.payment_method === "room" ? "🛏️ Sur la note" : "💳 À la livraison"} · <b style={{ color: C.text }}>{fmtEuro(o.total)}</b>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Tag color={meta.color}>{meta.label}</Tag>
                {meta.next && (
                  <Btn variant="primary" size="sm" onClick={() => advanceOrder(o)}>
                    {meta.nextLabel}
                  </Btn>
                )}
              </div>
            </Surface>
          );
        })}
      </div>
    </div>
  );
}

/* ------- Board Check-in ------- */

function CheckinBoardTab({ board, setCheckinStatus, addReservation }) {
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ guest_name: "", room: DEMO_HOTEL_ROOMS[0], guests: 2, email: "", checkin_date: todayISO(), checkout_date: addDaysISO(todayISO(), 1) });

  const counts = {
    all: board.length,
    arriving: board.filter((e) => e.status === "arriving").length,
    in_house: board.filter((e) => e.status === "in_house").length,
    departing: board.filter((e) => e.status === "departing").length,
  };
  const filters = [
    ["all", "Tous", C.dark],
    ["arriving", "Arrivées", C.accentBlue],
    ["in_house", "En séjour", C.accentGreen],
    ["departing", "Départs", C.accentOrange],
  ];
  const shown = board.filter((e) => (filter === "all" ? true : e.status === filter));

  return (
    <div>
      <PageTitle right={<Btn variant="primary" size="sm" onClick={() => setShowForm(true)}>+ Réservation</Btn>}>
        🛎️ Check-in
      </PageTitle>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {filters.map(([id, label, color]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            style={{
              ...FF, border: `1px solid ${filter === id ? "transparent" : C.border}`, borderRadius: 999,
              padding: "7px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer",
              background: filter === id ? color : C.surface, color: filter === id ? C.white : C.textSecondary,
            }}
          >
            {label} · {counts[id]}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {shown.map((e) => {
          const meta = STATUS_META[e.status];
          return (
            <Surface key={e.id} style={{ opacity: e.status === "checked_out" ? 0.55 : 1 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                <RoomBadge room={e.room} color={meta.color} />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ ...FF, fontWeight: 800, fontSize: 15.5 }}>{e.guest_name}</span>
                    <Tag color={meta.color}>{meta.label}</Tag>
                    {e.access_code && <Tag color={C.accentBlue}>📲 en ligne</Tag>}
                    {e.rating && <Tag color={C.accentPurple}>⭐ {e.rating}/5</Tag>}
                  </div>
                  <div style={{ ...FF, fontSize: 13, color: C.textSecondary, marginTop: 4 }}>
                    {e.guests} pers. · {fmtDate(e.checkin_date)} → {fmtDate(e.checkout_date)} {e.email && <>· {e.email}</>}
                  </div>
                  {e.access_code && (
                    <div style={{ ...FF, fontSize: 12.5, color: C.textSecondary, background: C.surfaceAlt, borderRadius: 10, padding: "7px 11px", marginTop: 8 }}>
                      {e.id_type || "Pièce d'identité"} n° {e.id_number || "—"} {e.id_provided ? "✅" : "(à présenter)"} · code <b>{e.access_code}</b>
                      {e.arrival_time && <> · arrivée {e.arrival_time}</>}
                      {e.notes && <> · 📝 {e.notes}</>}
                    </div>
                  )}
                  {e.express_checkout && e.status !== "checked_out" && (
                    <div style={{ ...FF, fontSize: 12.5, color: C.accentOrange, background: C.accentOrange + "14", borderRadius: 10, padding: "7px 11px", marginTop: 8, fontWeight: 700 }}>
                      🧳 Check-out express · note {fmtEuro(e.bill_total || 0)}
                      {e.late_checkout && <> · late 15h</>}
                      {e.luggage_hold && <> · bagagerie</>}
                      {" — vérifier la chambre puis confirmer"}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                  {e.status === "arriving" && (
                    <Btn variant="green" size="sm" onClick={() => setCheckinStatus(e, "in_house")}>Check-in ✓</Btn>
                  )}
                  {(e.status === "in_house" || e.status === "departing") && (
                    <Btn variant="subtle" size="sm" onClick={() => setCheckinStatus(e, "checked_out")}>Check-out</Btn>
                  )}
                </div>
              </div>
            </Surface>
          );
        })}
        {shown.length === 0 && (
          <Surface style={{ textAlign: "center", color: C.textTertiary, ...FF, fontSize: 14 }}>Aucun séjour dans cette catégorie.</Surface>
        )}
      </div>

      {showForm && (
        <Modal title="+ Nouvelle réservation" onClose={() => setShowForm(false)}>
          <InputField label="Nom du client" required value={f.guest_name} onChange={(v) => setF({ ...f, guest_name: v })} placeholder="Prénom Nom" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <SelectField label="Chambre" value={String(f.room)} onChange={(v) => setF({ ...f, room: Number(v) })} options={DEMO_HOTEL_ROOMS.map(String)} />
            <div>
              <div style={{ ...FF, fontSize: 12.5, fontWeight: 700, color: C.textSecondary, marginBottom: 6 }}>Personnes</div>
              <Stepper value={f.guests} onChange={(v) => setF({ ...f, guests: v })} min={1} max={6} />
            </div>
          </div>
          <InputField label="Email" type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} placeholder="client@email.fr" style={{ marginTop: 12 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <InputField label="Arrivée" type="date" value={f.checkin_date} onChange={(v) => setF({ ...f, checkin_date: v })} />
            <InputField label="Départ" type="date" value={f.checkout_date} onChange={(v) => setF({ ...f, checkout_date: v })} />
          </div>
          <div style={{ marginTop: 16 }}>
            <Btn
              variant="primary" size="lg" full disabled={!f.guest_name.trim()}
              onClick={() => {
                addReservation({ ...f, guest_name: f.guest_name.trim() });
                setShowForm(false);
                setF({ ...f, guest_name: "", email: "" });
              }}
            >
              Créer la réservation
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------- Check-out (départs du jour) ------- */

function printInvoice(hotel, entry, lines, total) {
  const w = window.open("", "_blank", "width=440,height=680");
  if (!w) return;
  const rows = lines
    .map((l) => `<tr><td style="padding:6px 0;color:#6E6E73;">${l.label}</td><td style="padding:6px 0;text-align:right;font-weight:700;">${fmtEuro(l.amount)}</td></tr>`)
    .join("");
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Facture — Chambre ${entry.room}</title></head>
<body style="font-family:'Figtree',-apple-system,sans-serif;color:#1D1D1F;padding:28px;max-width:400px;margin:0 auto;">
  <div style="font-size:26px;">${hotel.logo_emoji}</div>
  <h2 style="margin:8px 0 2px;">${hotel.name}</h2>
  <div style="color:#6E6E73;font-size:13px;">${hotel.address}</div>
  <hr style="border:none;border-top:1px solid #E8E8ED;margin:16px 0;">
  <div style="font-size:14px;line-height:1.7;">
    <b>Facture — Chambre ${entry.room}</b><br>
    ${entry.guest_name || ""} · ${entry.guests || 1} pers.<br>
    Séjour du ${fmtDate(entry.checkin_date)} au ${fmtDate(entry.checkout_date)}
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:13.5px;margin-top:14px;">${rows}</table>
  <hr style="border:none;border-top:1px solid #E8E8ED;margin:10px 0;">
  <table style="width:100%;font-size:16px;font-weight:800;"><tr><td>Total</td><td style="text-align:right;">${fmtEuro(total)}</td></tr></table>
  <p style="color:#AEAEB2;font-size:11.5px;margin-top:18px;">Payé par la carte utilisée à la réservation.<br>Document de démonstration — Wegemo Hôtel.</p>
  <script>window.print();</script>
</body></html>`);
  w.document.close();
}

function DeparturesTab({ departures, setCheckinStatus, hotel, toast }) {
  const [checks, setChecks] = useState({}); // id -> { room: bool, minibar: bool }
  const setCheck = (id, key, val) => setChecks((c) => ({ ...c, [id]: { ...c[id], [key]: val } }));

  const billFor = (e) => {
    const roomOrders = readGuestOrders().filter((o) => Number(o.room) === Number(e.room));
    const bill = computeBill(e, roomOrders, e.late_checkout);
    return e.bill_total ? { ...bill, total: e.bill_total } : bill;
  };

  const CheckItem = ({ checked, onChange, label }) => (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer", ...FF, fontSize: 13, fontWeight: 700, color: checked ? C.accentGreen : C.textSecondary }}>
      <input type="checkbox" checked={!!checked} onChange={(ev) => onChange(ev.target.checked)} style={{ width: 15, height: 15 }} />
      {label}
    </label>
  );

  return (
    <div>
      <PageTitle>🧳 Check-out — départs du jour</PageTitle>
      <div style={{ ...FF, fontSize: 13.5, color: C.textSecondary, marginBottom: 16, lineHeight: 1.5 }}>
        Contrôlez la chambre, éditez la facture, puis confirmez : la chambre part automatiquement au ménage.
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {departures.length === 0 && (
          <Surface style={{ textAlign: "center", padding: 28 }}>
            <div style={{ fontSize: 32 }}>🌤️</div>
            <div style={{ ...FF, fontWeight: 800, fontSize: 15, marginTop: 8 }}>Aucun départ à traiter</div>
            <div style={{ ...FF, fontSize: 13, color: C.textSecondary, marginTop: 4 }}>Tous les check-outs du jour sont clôturés.</div>
          </Surface>
        )}
        {departures.map((e) => {
          const bill = billFor(e);
          const ck = checks[e.id] || {};
          const ready = ck.room && ck.minibar;
          return (
            <Surface key={e.id}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                <RoomBadge room={e.room} color={C.accentOrange} />
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ ...FF, fontWeight: 800, fontSize: 15.5 }}>{e.guest_name}</span>
                    {e.express_checkout ? <Tag color={C.accentOrange}>🧳 express</Tag> : <Tag color={C.accentBlue}>départ prévu</Tag>}
                    {e.rating && <Tag color={C.accentPurple}>⭐ {e.rating}/5</Tag>}
                  </div>
                  <div style={{ ...FF, fontSize: 13, color: C.textSecondary, marginTop: 4 }}>
                    {e.guests || 1} pers. · {fmtDate(e.checkin_date)} → {fmtDate(e.checkout_date)} · note <b style={{ color: C.text }}>{fmtEuro(bill.total)}</b>
                  </div>
                  {e.express_checkout && (
                    <div style={{ ...FF, fontSize: 12.5, color: C.textSecondary, background: C.surfaceAlt, borderRadius: 10, padding: "7px 11px", marginTop: 8 }}>
                      {e.late_checkout ? "🕐 Late check-out 15h · " : "🕛 Départ avant 12h · "}
                      {e.luggage_hold ? "🧳 bagagerie demandée · " : ""}
                      {e.invoice_email ? `facture → ${e.invoice_email}` : "facture à remettre"}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10 }}>
                    <CheckItem checked={ck.room} onChange={(v) => setCheck(e.id, "room", v)} label="Chambre inspectée" />
                    <CheckItem checked={ck.minibar} onChange={(v) => setCheck(e.id, "minibar", v)} label="Minibar compté" />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                  <Btn variant="subtle" size="sm" onClick={() => printInvoice(hotel, e, bill.lines, bill.total)}>🧾 Facture</Btn>
                  <Btn
                    variant="orange" size="sm" disabled={!ready}
                    onClick={() => setCheckinStatus(e, "checked_out")}
                  >
                    ✅ Confirmer le départ
                  </Btn>
                  {!ready && (
                    <div style={{ ...FF, fontSize: 11, color: C.textTertiary, maxWidth: 150, textAlign: "center" }}>
                      Cochez l'inspection pour confirmer
                    </div>
                  )}
                </div>
              </div>
            </Surface>
          );
        })}
      </div>
    </div>
  );
}

/* ------- Chambres (occupation & ménage) ------- */

function RoomsTab({ board, toast }) {
  const cleaning = readRoomsState();
  const occupant = (room) =>
    board.find((e) => Number(e.room) === Number(room) && e.status !== "checked_out");

  const stateOf = (room) => {
    if (occupant(room)) return "occupied";
    if (cleaning[room]) return "dirty";
    return "free";
  };
  const META = {
    occupied: { label: "Occupée", color: C.accentBlue },
    dirty: { label: "À nettoyer", color: C.accentOrange },
    free: { label: "Libre", color: C.accentGreen },
  };
  const counts = DEMO_HOTEL_ROOMS.reduce(
    (acc, r) => { acc[stateOf(r)]++; return acc; },
    { occupied: 0, dirty: 0, free: 0 }
  );

  return (
    <div>
      <PageTitle>🛏️ Chambres</PageTitle>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {Object.entries(META).map(([k, m]) => (
          <Tag key={k} color={m.color}>{m.label} · {counts[k]}</Tag>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        {DEMO_HOTEL_ROOMS.map((room) => {
          const st = stateOf(room);
          const meta = META[st];
          const guest = occupant(room);
          return (
            <Surface key={room} style={{ borderTop: `3px solid ${meta.color}`, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ ...FF, fontWeight: 900, fontSize: 15 }}>Ch. {room}</span>
                <Tag color={meta.color} style={{ fontSize: 11 }}>{meta.label}</Tag>
              </div>
              <div style={{ ...FF, fontSize: 12.5, color: C.textSecondary, marginTop: 6, minHeight: 18 }}>
                {guest ? `${guest.guest_name} · ${guest.guests || 1} pers.` : st === "dirty" ? "En attente du ménage" : "Prête à louer"}
              </div>
              {st === "dirty" && (
                <div style={{ marginTop: 10 }}>
                  <Btn
                    variant="green" size="sm" full
                    onClick={() => {
                      setRoomCleaning(room, false);
                      logActivity("🧹", `Ch. ${room} nettoyée — prête à louer`, "stay");
                      toast.success(`Chambre ${room} propre — remise en vente ✓`);
                    }}
                  >
                    🧹 Marquer propre
                  </Btn>
                </div>
              )}
            </Surface>
          );
        })}
      </div>
    </div>
  );
}

/* ------- Journal d'activité ------- */

function ActivityTab() {
  const [filter, setFilter] = useState("all");
  const all = readActivity();
  const counts = {
    all: all.length,
    stay: all.filter((a) => a.type === "stay").length,
    order: all.filter((a) => a.type === "order").length,
    request: all.filter((a) => a.type === "request").length,
  };
  const filters = [
    ["all", "Tout", C.dark],
    ["stay", "Séjours", C.accentBlue],
    ["order", "Commandes", C.accentGreen],
    ["request", "Demandes", C.accentPurple],
  ];
  const shown = all.filter((a) => (filter === "all" ? true : a.type === filter));

  return (
    <div>
      <PageTitle>🕑 Activité</PageTitle>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {filters.map(([id, label, color]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            style={{
              ...FF, border: `1px solid ${filter === id ? "transparent" : C.border}`, borderRadius: 999,
              padding: "7px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer",
              background: filter === id ? color : C.surface, color: filter === id ? C.white : C.textSecondary,
            }}
          >
            {label} · {counts[id]}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <Surface style={{ textAlign: "center", padding: 28 }}>
          <div style={{ fontSize: 32 }}>🕑</div>
          <div style={{ ...FF, fontWeight: 800, fontSize: 15, marginTop: 8 }}>Rien pour l'instant</div>
          <div style={{ ...FF, fontSize: 13, color: C.textSecondary, marginTop: 4, lineHeight: 1.5 }}>
            Chaque check-in, commande ou demande (côté client comme côté réception) apparaîtra ici en temps réel.
          </div>
        </Surface>
      ) : (
        <Surface style={{ padding: "6px 18px" }}>
          {shown.map((a, i) => (
            <div key={a.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: i < shown.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 20 }}>{a.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...FF, fontSize: 13.5, fontWeight: 600, color: C.text, lineHeight: 1.45 }}>{a.text}</div>
                <div style={{ ...FF, fontSize: 11.5, color: C.textTertiary, marginTop: 2 }}>{a.at} · {timeAgo(a.ts)}</div>
              </div>
            </div>
          ))}
        </Surface>
      )}
    </div>
  );
}

/* ------- Facturation ------- */

function BillingTab({ orders, board, toast }) {
  const doneOrders = orders.filter((o) => o.status === "done");
  const checkouts = board.filter((e) => e.express_checkout && e.bill_total);
  const rows = [
    ...doneOrders.map((o) => ({
      key: "o" + o.id, at: o.at, desc: `Room service — Ch. ${o.room}`,
      method: o.payment_method === "room" ? "Sur la note" : "À la livraison", amount: o.total,
    })),
    ...checkouts.map((e) => ({
      key: "c" + e.id, at: "—", desc: `Note de chambre — Ch. ${e.room} (${e.guest_name})`,
      method: "Carte (réservation)", amount: e.bill_total,
    })),
  ];
  const total = rows.reduce((s, r) => s + r.amount, 0);

  const exportCSV = () => {
    const csv = [
      ["Heure", "Libellé", "Méthode", "Montant EUR"],
      ...rows.map((r) => [r.at, r.desc, r.method, String(r.amount).replace(".", ",")]),
      ["", "", "TOTAL", String(Math.round(total * 100) / 100).replace(".", ",")],
    ]
      .map((r) => r.join(";"))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `caisse-${DEMO_HOTEL.slug}-${todayISO()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast.success("Export CSV téléchargé ✓");
  };

  return (
    <div>
      <PageTitle right={<Btn variant="subtle" size="sm" onClick={exportCSV}>⬇️ Export CSV</Btn>}>💶 Facturation</PageTitle>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <KPICard label="Encaissements du jour" value={fmtEuro(total)} color={C.accentGreen} />
        <KPICard label="Opérations" value={rows.length} sub="Commandes livrées + notes de chambre" />
      </div>
      <Surface style={{ padding: "6px 18px" }}>
        {rows.length === 0 && <div style={{ ...FF, padding: 14, color: C.textTertiary, fontSize: 14 }}>Aucun encaissement pour l'instant.</div>}
        {rows.map((r, i) => (
          <div key={r.key} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none", flexWrap: "wrap" }}>
            <span style={{ ...FF, fontSize: 13.5, fontWeight: 600, color: C.text }}>{r.desc}</span>
            <span style={{ ...FF, fontSize: 13, color: C.textSecondary }}>
              {r.method} · {r.at} · <b style={{ color: C.text }}>{fmtEuro(r.amount)}</b>
            </span>
          </div>
        ))}
      </Surface>
    </div>
  );
}

/* ------- QR Chambres ------- */

function QRTab({ toast }) {
  const [dark, setDark] = useState("#1D1D1F");
  const [light, setLight] = useState("#FFFFFF");

  const download = async (room) => {
    try {
      const dataUrl = await QRCode.toDataURL(roomPortalUrl(room), { width: 720, margin: 2, color: { dark, light } });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `qr-${DEMO_HOTEL.slug}-chambre-${room}.png`;
      a.click();
      toast.success(`QR chambre ${room} téléchargé ✓`);
    } catch {
      toast.error("Impossible de générer le QR");
    }
  };

  return (
    <div>
      <PageTitle
        right={
          <span style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
            <label style={{ ...FF, fontSize: 12.5, fontWeight: 700, color: C.textSecondary, display: "inline-flex", gap: 6, alignItems: "center" }}>
              Encre <input type="color" value={dark} onChange={(e) => setDark(e.target.value)} style={{ width: 30, height: 26, border: "none", background: "none", cursor: "pointer" }} />
            </label>
            <label style={{ ...FF, fontSize: 12.5, fontWeight: 700, color: C.textSecondary, display: "inline-flex", gap: 6, alignItems: "center" }}>
              Fond <input type="color" value={light} onChange={(e) => setLight(e.target.value)} style={{ width: 30, height: 26, border: "none", background: "none", cursor: "pointer" }} />
            </label>
          </span>
        }
      >
        🔳 QR Chambres
      </PageTitle>
      <div style={{ ...FF, fontSize: 13.5, color: C.textSecondary, marginBottom: 18, lineHeight: 1.5 }}>
        Collez le QR sur la porte : le client accède au portail chambre — check-in en ligne, room service, services et bons plans.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14 }}>
        {DEMO_HOTEL_ROOMS.map((room) => (
          <Surface key={room} style={{ textAlign: "center" }}>
            <div style={{ ...FF, fontWeight: 900, fontSize: 15, marginBottom: 10 }}>Chambre {room}</div>
            <QRCanvas url={roomPortalUrl(room)} size={140} dark={dark} light={light} />
            <div style={{ display: "grid", gap: 6, marginTop: 12 }}>
              <Btn variant="subtle" size="sm" full onClick={() => download(room)}>⬇️ PNG</Btn>
              <Btn variant="ghost" size="sm" full onClick={() => window.open(roomPortalPath(room), "_blank")}>Ouvrir le portail →</Btn>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

/* ------- Inventaire ------- */

function InventoryTab({ menu, setMenu, toast }) {
  const adjust = (id, d) => {
    setMenu((m) => m.map((x) => (x.id === id && typeof x.stock === "number" ? { ...x, stock: Math.max(0, x.stock + d) } : x)));
  };
  return (
    <div>
      <PageTitle>📦 Inventaire</PageTitle>
      <Surface style={{ padding: "6px 18px" }}>
        {menu.map((m, i) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: i < menu.length - 1 ? `1px solid ${C.border}` : "none", flexWrap: "wrap" }}>
            <span style={{ fontSize: 24 }}>{m.emoji}</span>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ ...FF, fontWeight: 700, fontSize: 14.5 }}>{m.name}</div>
              <div style={{ ...FF, fontSize: 12.5, color: C.textSecondary }}>{m.category} · {fmtEuro(m.price)}</div>
            </div>
            {typeof m.stock === "number" ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                {m.stock <= 3 && <Tag color={C.accent}>Stock bas</Tag>}
                <Stepper value={m.stock} onChange={(v) => { adjust(m.id, v - m.stock); if (v < m.stock) toast.info(`${m.name} : stock ${v}`); }} min={0} max={99} />
                <span style={{ ...FF, fontSize: 12.5, color: C.textSecondary, fontWeight: 700 }}>en stock</span>
              </span>
            ) : (
              <Tag color={C.accentGreen}>Illimité</Tag>
            )}
          </div>
        ))}
      </Surface>
    </div>
  );
}

/* ------- Carte room service (CRUD) ------- */

function MenuTab({ menu, setMenu, toast }) {
  const [editing, setEditing] = useState(null); // null | "new" | item
  const empty = { id: "", name: "", desc: "", price: 10, category: "Plats", emoji: "🍽️" };
  const [f, setF] = useState(empty);

  const openNew = () => { setF(empty); setEditing("new"); };
  const openEdit = (m) => { setF({ ...m }); setEditing(m.id); };

  const save = () => {
    if (!f.name.trim()) return;
    if (editing === "new") {
      setMenu((m) => [...m, { ...f, id: uid(), price: Number(f.price) || 0 }]);
      toast.success(`« ${f.name} » ajouté à la carte ✓`);
    } else {
      setMenu((m) => m.map((x) => (x.id === editing ? { ...f, price: Number(f.price) || 0 } : x)));
      toast.success(`« ${f.name} » mis à jour ✓`);
    }
    setEditing(null);
  };

  const remove = (m) => {
    setMenu((list) => list.filter((x) => x.id !== m.id));
    toast.info(`« ${m.name} » retiré de la carte`);
  };

  return (
    <div>
      <PageTitle right={<Btn variant="primary" size="sm" onClick={openNew}>+ Ajouter un article</Btn>}>🍽️ Carte room service</PageTitle>
      <Surface style={{ padding: "6px 18px" }}>
        {menu.map((m, i) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: i < menu.length - 1 ? `1px solid ${C.border}` : "none", flexWrap: "wrap" }}>
            <span style={{ fontSize: 24 }}>{m.emoji}</span>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ ...FF, fontWeight: 700, fontSize: 14.5 }}>{m.name} <span style={{ color: C.textSecondary, fontWeight: 600 }}>· {fmtEuro(m.price)}</span></div>
              <div style={{ ...FF, fontSize: 12.5, color: C.textSecondary }}>{m.desc}</div>
            </div>
            <Tag color={C.accentPurple}>{m.category}</Tag>
            <span style={{ display: "inline-flex", gap: 6 }}>
              <Btn variant="subtle" size="sm" onClick={() => openEdit(m)}>Modifier</Btn>
              <Btn variant="ghost" size="sm" onClick={() => remove(m)} style={{ color: C.accent }}>Suppr.</Btn>
            </span>
          </div>
        ))}
      </Surface>

      {editing !== null && (
        <Modal title={editing === "new" ? "+ Nouvel article" : "Modifier l'article"} onClose={() => setEditing(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 12 }}>
            <InputField label="Emoji" value={f.emoji} onChange={(v) => setF({ ...f, emoji: v })} />
            <InputField label="Nom" required value={f.name} onChange={(v) => setF({ ...f, name: v })} />
          </div>
          <InputField label="Description" value={f.desc} onChange={(v) => setF({ ...f, desc: v })} style={{ marginTop: 12 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <InputField label="Prix (€)" type="number" value={f.price} onChange={(v) => setF({ ...f, price: v })} />
            <SelectField label="Catégorie" value={f.category} onChange={(v) => setF({ ...f, category: v })} options={["Plats", "Petit-déjeuner", "En-cas", "Boissons"]} />
          </div>
          <div style={{ marginTop: 16 }}>
            <Btn variant="primary" size="lg" full disabled={!f.name.trim()} onClick={save}>Enregistrer</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------- CRM ------- */

function CRMTab({ board }) {
  const [query, setQuery] = useState("");
  const current = board
    .filter((e) => e.guest_name)
    .map((e) => ({
      name: e.guest_name, email: e.email || "—", phone: e.phone || "—", visits: 1,
      spent: e.bill_total || 0,
      last: `Ch. ${e.room} · ${STATUS_META[e.status] ? STATUS_META[e.status].label : e.status}${e.rating ? ` · ⭐ ${e.rating}/5` : ""}`,
      tag: e.access_code ? "📲 en ligne" : "",
    }));
  const all = [...current, ...DEMO_CRM].filter((c) => {
    const q = query.trim().toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q);
  });
  return (
    <div>
      <PageTitle
        right={
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Rechercher un client…"
            style={{
              ...FF, padding: "9px 14px", borderRadius: 999, border: `1px solid ${C.borderStrong}`,
              background: C.surface, fontSize: 13.5, width: 220, outline: "none",
            }}
          />
        }
      >
        👥 CRM clients
      </PageTitle>
      <div style={{ display: "grid", gap: 12 }}>
        {all.length === 0 && (
          <Surface style={{ textAlign: "center", color: C.textTertiary, ...FF, fontSize: 14 }}>
            Aucun client ne correspond à « {query} ».
          </Surface>
        )}
        {all.map((c, i) => (
          <Surface key={i} style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ ...FF, width: 44, height: 44, borderRadius: 999, background: C.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: C.textSecondary, flexShrink: 0 }}>
              {c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ ...FF, fontWeight: 800, fontSize: 15 }}>{c.name}</span>
                {c.tag && <Tag color={c.tag === "Fidèle" ? C.accentPurple : C.accentBlue}>{c.tag}</Tag>}
              </div>
              <div style={{ ...FF, fontSize: 12.5, color: C.textSecondary, marginTop: 3 }}>{c.email} · {c.phone}</div>
            </div>
            <div style={{ ...FF, textAlign: "right", fontSize: 12.5, color: C.textSecondary }}>
              <div><b style={{ color: C.text, fontSize: 14 }}>{c.spent ? fmtEuro(c.spent) : "—"}</b> · {c.visits} séjour(s)</div>
              <div style={{ marginTop: 2 }}>{c.last}</div>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

/* ------- Paramètres ------- */

function SettingsTab({ hotel, setHotel, toast }) {
  const [f, setF] = useState({ name: hotel.name, address: hotel.address, logo_emoji: hotel.logo_emoji });
  const reset = () => {
    [KEY_CHECKINS, KEY_STAFF_RESAS, KEY_ORDERS, KEY_REQUESTS, KEY_MENU, KEY_HOTEL, KEY_ACTIVITY, KEY_ROOMS].forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });
    toast.success("Données de démo réinitialisées ✓");
    setTimeout(() => window.location.reload(), 900);
  };
  return (
    <div>
      <PageTitle>⚙️ Paramètres</PageTitle>
      <Surface style={{ maxWidth: 520 }}>
        <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 12 }}>
          <InputField label="Emoji" value={f.logo_emoji} onChange={(v) => setF({ ...f, logo_emoji: v })} />
          <InputField label="Nom de l'établissement" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
        </div>
        <InputField label="Adresse" value={f.address} onChange={(v) => setF({ ...f, address: v })} style={{ marginTop: 12 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <InputField label="Tarif nuit (€)" value={String(DEMO_NIGHT_RATE)} onChange={() => {}} />
          <InputField label="Taxe de séjour (€/pers/nuit)" value={String(DEMO_CITY_TAX).replace(".", ",")} onChange={() => {}} />
        </div>
        <div style={{ marginTop: 16 }}>
          <Btn variant="primary" size="md" onClick={() => { setHotel({ ...hotel, ...f }); toast.success("Paramètres enregistrés ✓"); }}>
            Enregistrer
          </Btn>
        </div>
      </Surface>
      <Surface style={{ maxWidth: 520, marginTop: 14, border: `1px solid ${C.accent}44` }}>
        <div style={{ ...FF, fontWeight: 800, fontSize: 14.5, color: C.accent }}>Zone démo</div>
        <div style={{ ...FF, fontSize: 13, color: C.textSecondary, margin: "6px 0 12px" }}>
          Efface les check-ins, commandes et demandes créés pendant la démo (localStorage).
        </div>
        <Btn variant="red" size="sm" onClick={reset}>♻️ Réinitialiser la démo</Btn>
      </Surface>
    </div>
  );
}

/* ------- Office (vue cuisine kanban) ------- */

function OfficeView({ orders, advanceOrder, onClose }) {
  const [sound, setSound] = useState(false);
  const pending = orders.filter((o) => o.status === "pending");
  const preparing = orders.filter((o) => o.status === "preparing");
  const ready = orders.filter((o) => o.status === "ready" || o.status === "scheduled");
  const prevPending = useRef(pending.length);

  useEffect(() => {
    if (sound && pending.length > prevPending.current) playBeep();
    prevPending.current = pending.length;
  }, [pending.length, sound]);

  const col = (title, color, list, emptyMsg) => (
    <div style={{ flex: 1, minWidth: 240 }}>
      <div style={{ ...FF, fontWeight: 900, fontSize: 14, color: C.white, background: color, borderRadius: 12, padding: "9px 14px", marginBottom: 10 }}>
        {title} · {list.length}
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {list.map((o) => (
          <Surface key={o.id} style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ ...FF, fontWeight: 900, fontSize: 14 }}>Ch. {o.room}</span>
              <span style={{ ...FF, fontSize: 12, color: C.textTertiary, fontWeight: 700 }}>{o.at}</span>
            </div>
            <div style={{ ...FF, fontSize: 13, color: C.textSecondary, margin: "7px 0", lineHeight: 1.55 }}>
              {o.order_type === "breakfast" ? `🥐 ${o.label} · ${o.slot}` : o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
            </div>
            {o.note && <div style={{ ...FF, fontSize: 12, color: C.accentOrange, fontWeight: 700, marginBottom: 7 }}>📝 {o.note}</div>}
            {ORDER_STATUS_STAFF[o.status].next && (
              <Btn variant="primary" size="sm" full onClick={() => advanceOrder(o)}>
                {ORDER_STATUS_STAFF[o.status].nextLabel} →
              </Btn>
            )}
          </Surface>
        ))}
        {list.length === 0 && (
          <div style={{ ...FF, fontSize: 13, color: C.textTertiary, textAlign: "center", padding: 20, border: `1px dashed ${C.borderStrong}`, borderRadius: 12 }}>
            {emptyMsg}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ ...FF, minHeight: "100vh", background: C.bg, padding: "18px 20px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
        <h1 style={{ ...FF, fontSize: 21, fontWeight: 900 }}>🍳 Office — room service</h1>
        <span style={{ display: "inline-flex", gap: 8 }}>
          <Btn variant={sound ? "green" : "subtle"} size="sm" onClick={() => { setSound(!sound); if (!sound) playBeep(); }}>
            {sound ? "🔔 Son activé" : "🔕 Activer le son"}
          </Btn>
          <Btn variant="subtle" size="sm" onClick={onClose}>← Retour réception</Btn>
        </span>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        {col("🆕 Nouvelles", C.accentBlue, pending, "Aucune nouvelle commande")}
        {col("👨‍🍳 En préparation", C.accentOrange, preparing, "Rien en préparation")}
        {col("🛎️ Prêtes", C.accentGreen, ready, "Rien à livrer")}
      </div>
    </div>
  );
}

/* ==========================================================================
   LANDING + SHELL + ROUTAGE
   ========================================================================== */

function Landing({ onDemo }) {
  const steps = [
    { emoji: "🔳", title: "Collez le QR sur la porte", desc: "Un QR par chambre, généré et téléchargé depuis votre dashboard. Aucun matériel, aucune application." },
    { emoji: "📱", title: "Le client scanne", desc: "Il arrive sur le portail de sa chambre : check-in en ligne, room service, petit-déjeuner, conciergerie." },
    { emoji: "🛎️", title: "La réception reçoit tout", desc: "Check-ins, commandes et demandes apparaissent en direct sur le board — avec la facturation sur la chambre." },
  ];
  const features = [
    { emoji: "🍽️", title: "Room service par QR", desc: "Carte 24h/24, paiement sur la note de chambre, suivi de statut en direct." },
    { emoji: "🛎️", title: "Check-in en ligne", desc: "4 étapes, pièce d'identité et signature — le client évite la file à la réception." },
    { emoji: "🥐", title: "Petit-déj en chambre", desc: "Formules, créneaux par demi-heure et supplément plateau facturés automatiquement." },
    { emoji: "🧳", title: "Check-out express", desc: "Note de chambre détaillée, late check-out, bagagerie et facture par email." },
    { emoji: "💬", title: "Conciergerie", desc: "Demandes 1-tap (serviettes, réveil, taxi…) transmises instantanément à la réception." },
    { emoji: "💶", title: "Caisse & CRM", desc: "Encaissements du jour, export CSV et historique clients au même endroit." },
  ];
  const miniTiles = [
    ["🛎️", "Check-in"], ["🍽️", "Room service"], ["🥐", "Petit-déj"], ["💬", "Conciergerie"],
  ];
  const openPortal = () => window.open(roomPortalPath(204), "_blank");

  return (
    <div style={{ ...FF, minHeight: "100vh", background: C.bg }}>
      {/* Nav */}
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>{DEMO_HOTEL.logo_emoji}</span>
          <span style={{ ...FF, fontWeight: 900, fontSize: 16, letterSpacing: 0.3 }}>WEGEMO <span style={{ color: C.accent }}>HÔTEL</span></span>
        </div>
        <Btn variant="subtle" size="sm" onClick={onDemo}>Voir la démo</Btn>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "44px 22px 10px", textAlign: "center" }}>
        <Tag color={C.accent}>DÉMO INTERACTIVE — SANS INSCRIPTION</Tag>
        <h1 style={{ ...FF, fontSize: "clamp(32px, 6vw, 54px)", fontWeight: 900, color: C.text, marginTop: 18, letterSpacing: -1.2, lineHeight: 1.08, textWrap: "balance" }}>
          L'hôtel, réinventé par le QR code.
        </h1>
        <p style={{ ...FF, fontSize: 17, color: C.textSecondary, margin: "16px auto 0", maxWidth: 560, lineHeight: 1.65 }}>
          Room service, check-in en ligne et conciergerie — le tout depuis un QR code collé sur la porte de chaque chambre. Sans application à installer.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 28 }}>
          <Btn variant="primary" size="lg" onClick={onDemo}>🚀 Voir la démo hôtel</Btn>
          <Btn variant="subtle" size="lg" onClick={openPortal}>📱 Ouvrir le portail chambre</Btn>
        </div>
      </div>

      {/* Aperçu produit : dashboard + téléphone */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 22px 10px", display: "flex", gap: 22, justifyContent: "center", alignItems: "flex-end", flexWrap: "wrap" }}>
        {/* Mini dashboard */}
        <div className="wgm-tile" onClick={onDemo} style={{ flex: "1 1 380px", maxWidth: 520, cursor: "pointer" }}>
          <Surface style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ background: C.dark, padding: "10px 16px", display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: "#FF5F57" }} />
              <span style={{ width: 9, height: 9, borderRadius: 999, background: "#FEBC2E" }} />
              <span style={{ width: 9, height: 9, borderRadius: 999, background: "#28C840" }} />
              <span style={{ ...FF, color: "rgba(255,255,255,.6)", fontSize: 11.5, fontWeight: 700, marginLeft: 8 }}>Dashboard réception</span>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", gap: 10 }}>
                {[["CA du jour", "1 240 €", C.accentGreen], ["Commandes", "17", C.text], ["Arrivées", "5", C.accentBlue]].map(([k, v, col]) => (
                  <div key={k} style={{ flex: 1, background: C.surfaceAlt, borderRadius: 12, padding: "10px 12px" }}>
                    <div style={{ ...FF, fontSize: 10.5, fontWeight: 700, color: C.textSecondary }}>{k}</div>
                    <div style={{ ...FF, fontSize: 17, fontWeight: 900, color: col, marginTop: 3 }}>{v}</div>
                  </div>
                ))}
              </div>
              {[["Ch. 204", "Club Sandwich + 2 Cafés", "Nouvelle", C.accentBlue], ["Ch. 302", "Champagne brut 75cl", "En préparation", C.accentOrange], ["Ch. 103", "Petit-déj continental", "Prête", C.accentGreen]].map(([room, items, st, col]) => (
                <div key={room} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "10px 2px", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ ...FF, fontSize: 12.5, fontWeight: 800 }}>{room}</span>
                  <span style={{ ...FF, fontSize: 12, color: C.textSecondary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{items}</span>
                  <Tag color={col} style={{ fontSize: 10.5 }}>{st}</Tag>
                </div>
              ))}
            </div>
          </Surface>
        </div>
        {/* Mini téléphone */}
        <div className="wgm-tile" onClick={openPortal} style={{ flex: "0 0 220px", cursor: "pointer" }}>
          <div style={{ background: C.dark, borderRadius: 30, padding: 10, boxShadow: "0 20px 50px rgba(0,0,0,.2)" }}>
            <div style={{ background: C.bg, borderRadius: 22, padding: 12, minHeight: 300 }}>
              <div style={{ background: "linear-gradient(135deg, #1D1D1F, #3A3A3C)", borderRadius: 14, padding: 12, color: C.white }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 18 }}>🏨</span>
                  <span style={{ ...FF, fontSize: 9.5, fontWeight: 700, background: "rgba(255,255,255,.15)", borderRadius: 999, padding: "2px 8px" }}>Chambre 204</span>
                </div>
                <div style={{ ...FF, fontSize: 12.5, fontWeight: 800, marginTop: 8 }}>Hôtel Démo</div>
                <div style={{ ...FF, fontSize: 9.5, opacity: 0.7, marginTop: 2 }}>Bon séjour, Léa ✓</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                {miniTiles.map(([em, lb]) => (
                  <div key={lb} style={{ background: C.surface, borderRadius: 11, padding: "10px 8px", border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 16 }}>{em}</div>
                    <div style={{ ...FF, fontSize: 9.5, fontWeight: 800, marginTop: 4 }}>{lb}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comment ça marche */}
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "54px 22px 0" }}>
        <h2 style={{ ...FF, fontSize: 26, fontWeight: 900, textAlign: "center", letterSpacing: -0.5 }}>Comment ça marche</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginTop: 24 }}>
          {steps.map((s, i) => (
            <Surface key={s.title}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ ...FF, width: 26, height: 26, borderRadius: 999, background: C.dark, color: C.white, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900 }}>{i + 1}</span>
                <span style={{ fontSize: 24 }}>{s.emoji}</span>
              </div>
              <div style={{ ...FF, fontWeight: 800, fontSize: 15.5, marginTop: 10 }}>{s.title}</div>
              <div style={{ ...FF, fontSize: 13.5, color: C.textSecondary, marginTop: 5, lineHeight: 1.55 }}>{s.desc}</div>
            </Surface>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "50px 22px 0" }}>
        <h2 style={{ ...FF, fontSize: 26, fontWeight: 900, textAlign: "center", letterSpacing: -0.5 }}>Tout votre hôtel, un seul outil</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginTop: 24 }}>
          {features.map((ft) => (
            <Surface key={ft.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{ fontSize: 26 }}>{ft.emoji}</span>
              <span>
                <span style={{ ...FF, display: "block", fontWeight: 800, fontSize: 15 }}>{ft.title}</span>
                <span style={{ ...FF, display: "block", fontSize: 13, color: C.textSecondary, marginTop: 4, lineHeight: 1.5 }}>{ft.desc}</span>
              </span>
            </Surface>
          ))}
        </div>
      </div>

      {/* CTA final + footer */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "54px 22px 0", textAlign: "center" }}>
        <div style={{ background: "linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)", borderRadius: 22, padding: "34px 24px", color: C.white }}>
          <div style={{ ...FF, fontSize: 23, fontWeight: 900, letterSpacing: -0.5 }}>Testez le parcours complet en 2 minutes</div>
          <div style={{ ...FF, fontSize: 14, opacity: 0.75, marginTop: 8, lineHeight: 1.6 }}>
            Check-in chambre 204 → room service sur la note → check-out express, et tout apparaît côté réception.
          </div>
          <div style={{ marginTop: 20 }}>
            <Btn variant="red" size="lg" onClick={onDemo}>🚀 Voir la démo hôtel</Btn>
          </div>
        </div>
      </div>
      <div style={{ ...FF, textAlign: "center", fontSize: 12.5, color: C.textTertiary, padding: "34px 20px 40px", lineHeight: 1.7 }}>
        Démo 100% autonome — aucune donnée réelle, tout se passe dans votre navigateur.<br />
        © {new Date().getFullYear()} Wegemo Hôtel
      </div>
    </div>
  );
}

function Shell() {
  const [screen, setScreen] = useState("landing");
  if (screen === "dashboard") return <Dashboard onExit={() => setScreen("landing")} />;
  return <Landing onDemo={() => setScreen("dashboard")} />;
}

function parseRoute() {
  const h = window.location.hash.match(/^#\/r\/[^/]+\/t\/(\d+)/);
  if (h) return { view: "portal", room: Number(h[1]) };
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  let path = window.location.pathname;
  if (base && path.startsWith(base)) path = path.slice(base.length);
  const m = path.match(/^\/r\/[^/]+\/t\/(\d+)/);
  if (m) return { view: "portal", room: Number(m[1]) };
  return { view: "shell" };
}

export default function App() {
  const [route, setRoute] = useState(parseRoute);
  useEffect(() => {
    const on = () => setRoute(parseRoute());
    window.addEventListener("popstate", on);
    window.addEventListener("hashchange", on);
    return () => {
      window.removeEventListener("popstate", on);
      window.removeEventListener("hashchange", on);
    };
  }, []);
  return (
    <ToastProvider>
      <GlobalStyles />
      {route.view === "portal" ? <RoomPortal room={route.room} /> : <Shell />}
    </ToastProvider>
  );
}
