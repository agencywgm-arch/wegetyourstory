import { useState, useEffect, useCallback } from "react";
import { readLS, writeLS, uid, nowTime, todayISO } from "../shared/ui.jsx";

/* ==========================================================================
   WELL DONE — données de l'établissement et carte pré-configurée.
   Reprise fidèle de la carte papier (smash burgers, chicken, hot dogs,
   frites, add, desserts, boissons) et des zones de livraison.
   ========================================================================== */

export const BRAND = {
  id: "well-done",
  slug: "well-done",
  name: "WELL DONE",
  tagline: "BIEN FAIT, SI FRAIS",
  logo_emoji: "🍔",
  city: "Livry-Gargan",
  phone: "01 43 00 00 00",
  snapchat: "welldone_burger",
  instagram: "well_doneburger",
  // Vert et or repris de la carte, sur la base neutre du design system.
  green: "#43A32B",
  gold: "#A9812F",
  ink: "#1D1D1F",
};

export const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/* ----------------------- Groupes d'options ----------------------- */

/* Options composables stockées directement sur l'article (pas de table
   séparée) : le tunnel de composition s'appuie sur ce format. */

export const SOFT_DRINKS = [
  "Coca", "Coca zéro", "Coca Cherry", "Ice Tea", "Dr Pepper",
  "Oasis tropical", "Fanta orange", "San Pellegrino", "Évian",
];

const FORMULA = (price) => ({
  key: "formule",
  label: "Formule",
  type: "single",
  required: true,
  choices: [
    { id: "seul", label: "Seul", price: 0 },
    { id: "menu", label: "Frites + boisson soft", price, needsDrink: true },
  ],
});

const DRINK_PICK = {
  key: "boisson",
  label: "Boisson de la formule",
  type: "single",
  // N'apparaît que si la formule est choisie.
  dependsOn: { key: "formule", value: "menu" },
  required: true,
  choices: SOFT_DRINKS.map((d) => ({ id: d, label: d, price: 0 })),
};

const SAUCES_INCLUSES = {
  key: "sauces",
  label: "Sauces incluses",
  hint: "Au choix, sans supplément",
  type: "multi",
  max: 2,
  choices: ["Ketchup", "Moutarde", "Mayonnaise", "Barbecue"].map((s) => ({
    id: s, label: s, price: 0,
  })),
};

const SAUCES_SUPP = {
  key: "sauces_supp",
  label: "Sauces supplémentaires",
  hint: "0,50 € l'unité",
  type: "multi",
  choices: ["Curry mango", "Salsa hot", "Honey mustard", "Garlic", "Sweet chili"].map((s) => ({
    id: s, label: s, price: 0.5,
  })),
};

const EXTRAS = {
  key: "extras",
  label: "Suppléments",
  type: "multi",
  choices: [
    { id: "cheddar", label: "Cheddar", price: 1 },
    { id: "bacon", label: "Bacon de bœuf", price: 1 },
  ],
};

// Burgers : formule à 3 €. Chicken et hot dogs : 3,50 €.
const optionsBurger = () => [FORMULA(3), DRINK_PICK, SAUCES_INCLUSES, SAUCES_SUPP, EXTRAS];
const optionsChicken = () => [FORMULA(3.5), DRINK_PICK, SAUCES_INCLUSES, SAUCES_SUPP, EXTRAS];
const optionsHotdog = () => [FORMULA(3.5), DRINK_PICK, SAUCES_INCLUSES, SAUCES_SUPP, EXTRAS];
const optionsSauceOnly = () => [SAUCES_SUPP];

/* ----------------------- La carte ----------------------- */

export const CATEGORIES = [
  { id: "smash", label: "Smash Burger", emoji: "🍔", note: "Black Angus Beef · Frites + boisson soft + 3 €" },
  { id: "chicken", label: "Chicken Burger", emoji: "🐔", note: "Frites + boisson soft + 3,50 €" },
  { id: "hotdog", label: "Hot Dog", emoji: "🌭", note: "Frites + boisson soft + 3,50 €" },
  { id: "frites", label: "Nos frites", emoji: "🍟" },
  { id: "add", label: "Add", emoji: "🍗" },
  { id: "desserts", label: "Desserts", emoji: "🍨" },
  { id: "boissons", label: "Boissons", emoji: "🥤" },
];

export const WELL_DONE_MENU = [
  /* --- Smash Burger Angus Beef --- */
  {
    id: "b-welldone", category: "smash", name: "Well Done", price: 9.5, emoji: "🍔",
    desc: "Bun's potato, black angus steak, cheddar américain, pickles, salade, tomate, sauce originale",
    badge: "Signature", options: optionsBurger(),
  },
  {
    id: "b-cheese", category: "smash", name: "Cheese", price: 8.9, emoji: "🧀",
    desc: "Bun's potato, black angus steak, cheddar américain, pickles, oignon frais, ketchup, moutarde américaine",
    options: optionsBurger(),
  },
  {
    id: "b-smoky", category: "smash", name: "Smoky", price: 10.9, emoji: "🔥",
    desc: "Bun's potato, black angus steak, cheddar américain, bacon de bœuf, oignon caramélisé, salade, tomate, sauce barbecue",
    options: optionsBurger(),
  },
  {
    id: "b-truffle", category: "smash", name: "Truffle", price: 10.9, emoji: "🍄",
    desc: "Bun's potato, black angus steak, cheddar mature, oignon caramélisé, salade, tomate, sauce à la truffe",
    options: optionsBurger(),
  },
  {
    id: "b-phily", category: "smash", name: "Phily", price: 11.9, emoji: "🥓",
    desc: "Bun's potato, black angus steak, cheddar mature, champignon frais grillé, salade, tomate, philadelphia cheese",
    options: optionsBurger(),
  },

  /* --- Chicken Burger --- */
  {
    id: "c-chicn", category: "chicken", name: "Chic'n", price: 8.5, emoji: "🐔",
    desc: "Bun's potato, filet de poulet pané, cheddar américain, salade, tomate, mayonnaise américaine",
    options: optionsChicken(),
  },
  {
    id: "c-avocado", category: "chicken", name: "Avocado chic'n", price: 9.5, emoji: "🥑",
    desc: "Bun's potato, filet de poulet pané, cheddar américain, avocat, tomate, sauce basilic",
    options: optionsChicken(),
  },
  {
    id: "c-smoky", category: "chicken", name: "Smoky chic'n", price: 9.5, emoji: "🔥",
    desc: "Bun's potato, filet de poulet pané, cheddar américain, bacon de bœuf, oignon caramélisé, sauce barbecue",
    options: optionsChicken(),
  },
  {
    id: "c-pilipli", category: "chicken", name: "Pili pli", price: 9.5, emoji: "🌶️",
    desc: "Bun's potato, filet de poulet pané, cheddar, jalapeños, tomates, sauce épicée",
    badge: "Épicé", options: optionsChicken(),
  },

  /* --- Hot Dog --- */
  {
    id: "h-ny", category: "hotdog", name: "New-yorkais", price: 5.9, emoji: "🌭",
    desc: "Bun's potato hot dog, saucisse de bœuf, relish pickles, crispy oignon, ketchup, moutarde américaine",
    options: optionsHotdog(),
  },
  {
    id: "h-spicy", category: "hotdog", name: "Spicy", price: 6.5, emoji: "🌶️",
    desc: "Bun's potato hot dog, saucisse de bœuf, cheddar fondu, relish pickles, crispy oignon, jalapeños, sauce originale",
    options: optionsHotdog(),
  },
  {
    id: "h-welldone", category: "hotdog", name: "Well Done", price: 6.9, emoji: "🌭",
    desc: "Bun's potato hotdog, saucisse de bœuf, bacon de bœuf, relish pickles, oignon caramélisé, cheddar fondu, sauce originale",
    options: optionsHotdog(),
  },

  /* --- Nos frites --- */
  { id: "f-nature", category: "frites", name: "Frites", price: 3, emoji: "🍟", options: optionsSauceOnly() },
  { id: "f-cheddar", category: "frites", name: "Frites cheddar", price: 4, emoji: "🧀", options: optionsSauceOnly() },
  { id: "f-jalapenos", category: "frites", name: "Frites cheddar jalapeños", price: 4.5, emoji: "🌶️", options: optionsSauceOnly() },
  { id: "f-bacon", category: "frites", name: "Frites cheddar bacon", price: 5, emoji: "🥓", options: optionsSauceOnly() },

  /* --- Add --- */
  { id: "a-nuggets", category: "add", name: "Chicken Nuggets ×5", price: 4.5, emoji: "🍗", options: optionsSauceOnly() },
  { id: "a-chili", category: "add", name: "Chili cheese nuggets ×6", price: 4.5, emoji: "🌶️", options: optionsSauceOnly() },
  { id: "a-mozza", category: "add", name: "Mozza sticks ×4", price: 4.5, emoji: "🧀", options: optionsSauceOnly() },
  { id: "a-tenders", category: "add", name: "Tenders ×3", price: 4.5, emoji: "🍗", options: optionsSauceOnly() },
  { id: "a-chevre", category: "add", name: "Sticks chèvre miel ×4", price: 4.5, emoji: "🍯", options: optionsSauceOnly() },
  { id: "a-onion", category: "add", name: "Oignon rings ×6", price: 4.5, emoji: "🧅", options: optionsSauceOnly() },

  /* --- Desserts --- */
  { id: "d-mousse", category: "desserts", name: "Mousse chocolat", price: 3.9, emoji: "🍫" },
  { id: "d-cookie", category: "desserts", name: "Cookie façon brownie", price: 3.5, emoji: "🍪" },
  { id: "d-cheesecake", category: "desserts", name: "Cheesecake framboise", price: 4.5, emoji: "🍰" },
  { id: "d-brioche", category: "desserts", name: "Brioche perdue caramel beurre salé", price: 3.5, emoji: "🍞" },

  /* --- Boissons --- */
  {
    id: "s-soft", category: "boissons", name: "Soft", price: 2, emoji: "🥤",
    desc: "33 cl",
    options: [{
      key: "parfum", label: "Au choix", type: "single", required: true,
      choices: SOFT_DRINKS.map((d) => ({ id: d, label: d, price: 0 })),
    }],
  },
  {
    id: "s-premium", category: "boissons", name: "Prémium", price: 2.5, emoji: "🥃",
    desc: "Bouteille en verre 25 cl",
    options: [{
      key: "parfum", label: "Au choix", type: "single", required: true,
      choices: [
        { id: "Coca en verre (25cl)", label: "Coca en verre (25 cl)", price: 0 },
        { id: "Coca zéro en verre (25cl)", label: "Coca zéro en verre (25 cl)", price: 0 },
      ],
    }],
  },
  {
    id: "s-lemonaid", category: "boissons", name: "Lemon Aid", price: 2.9, emoji: "🍋",
    desc: "Limonade bio",
    options: [{
      key: "parfum", label: "Parfum", type: "single", required: true,
      choices: ["Citron vert", "Passion", "Gingembre", "Orange sanguine"].map((d) => ({
        id: d, label: d, price: 0,
      })),
    }],
  },
];

/* ----------------------- Livraison ----------------------- */

export const DELIVERY_ZONES = [
  { id: "z1", label: "Zone 1", min: 20, cities: ["Livry-Gargan", "Sevran", "Aulnay-sous-Bois"] },
  { id: "z2", label: "Zone 2", min: 30, cities: ["Bondy", "Les Pavillons-sous-Bois", "Clichy-sous-Bois", "Vaujours", "Tremblay-en-France", "Villeparisis"] },
  { id: "z3", label: "Zone 3", min: 35, cities: ["Montfermeil", "Villemomble", "Villepinte", "Le Blanc-Mesnil", "Le Raincy"] },
  { id: "hors", label: "Hors zone", min: 50, cities: [] },
];

export const ALL_CITIES = DELIVERY_ZONES.flatMap((z) => z.cities);

export const zoneForCity = (city) =>
  DELIVERY_ZONES.find((z) => z.cities.includes(city)) ||
  DELIVERY_ZONES[DELIVERY_ZONES.length - 1];

/* ----------------------- Codes promo ----------------------- */

export const PROMO_CODES = [
  { code: "WELLDONE10", type: "percent", value: 10, label: "−10 % sur la commande", min: 0 },
  { code: "FRITES", type: "amount", value: 3, label: "3 € offerts dès 25 €", min: 25 },
];

export const applyPromo = (code, subtotal) => {
  const p = PROMO_CODES.find((x) => x.code === code.trim().toUpperCase());
  if (!p) return { ok: false, reason: "Code inconnu", discount: 0 };
  if (subtotal < p.min)
    return { ok: false, reason: `Minimum ${p.min} € pour ce code`, discount: 0 };
  const discount = p.type === "percent" ? (subtotal * p.value) / 100 : p.value;
  return { ok: true, promo: p, discount: Math.min(discount, subtotal) };
};

/* ----------------------- localStorage = le "serveur" ----------------------- */

const KEY_ORDERS = "wgm_resto_orders";
const KEY_MENU = "wgm_resto_menu";
const KEY_PROFILE = "wgm_resto_profile";
const KEY_ACTIVITY = "wgm_resto_activity";
const KEY_CUSTOMERS = "wgm_resto_customers";
const KEY_SCANS = "wgm_resto_scans";
const KEY_CART = "wgm_resto_cart";

export const readMenu = () => readLS(KEY_MENU, WELL_DONE_MENU);
export const writeMenu = (m) => writeLS(KEY_MENU, m);

export const readProfile = () => ({ ...BRAND, ...readLS(KEY_PROFILE, {}) });
export const writeProfile = (p) => writeLS(KEY_PROFILE, p);

export const readOrders = () => readLS(KEY_ORDERS, []);
export const writeOrders = (l) => writeLS(KEY_ORDERS, l);

export const readCustomers = () => readLS(KEY_CUSTOMERS, []);
export const writeCustomers = (l) => writeLS(KEY_CUSTOMERS, l);

export const readCart = () => readLS(KEY_CART, {});
export const writeCart = (c) => writeLS(KEY_CART, c);

/* Analytique des scans de QR, avec conversion en commande. */
export const readScans = () => readLS(KEY_SCANS, []);
export const logScan = (table) => {
  const l = readScans();
  const entry = { id: uid(), ts: Date.now(), at: nowTime(), day: todayISO(), table, order_id: null };
  l.push(entry);
  writeLS(KEY_SCANS, l.slice(-400));
  return entry.id;
};
export const linkScanToOrder = (scanId, orderId) => {
  if (!scanId) return;
  const l = readScans();
  const s = l.find((x) => x.id === scanId);
  if (s) {
    s.order_id = orderId;
    writeLS(KEY_SCANS, l);
  }
};

export const logActivity = (emoji, text, type = "order") => {
  const l = readLS(KEY_ACTIVITY, []);
  l.push({ id: uid(), ts: Date.now(), at: nowTime(), emoji, text, type });
  writeLS(KEY_ACTIVITY, l.slice(-120));
};
export const readActivity = () => readLS(KEY_ACTIVITY, []).slice().reverse();

/* CRM : toute commande identifiée alimente la fiche client. */
export const upsertCustomer = (order) => {
  const key = (order.customer?.phone || order.customer?.email || "").trim().toLowerCase();
  if (!key) return;
  const list = readCustomers();
  const found = list.find(
    (c) => (c.phone || "").toLowerCase() === key || (c.email || "").toLowerCase() === key
  );
  if (found) {
    found.orders = (found.orders || 0) + 1;
    found.spent = Math.round(((found.spent || 0) + order.total) * 100) / 100;
    found.last = todayISO();
    found.name = order.customer.name || found.name;
  } else {
    list.push({
      id: uid(),
      name: order.customer.name || "Client",
      phone: order.customer.phone || "",
      email: order.customer.email || "",
      city: order.customer.city || "",
      orders: 1,
      spent: order.total,
      last: todayISO(),
    });
  }
  writeCustomers(list);
};

/* ----------------------- Cycle de vie des commandes ----------------------- */

export const STATUSES = ["PENDING", "PREPARING", "READY", "DONE"];

export const STATUS_META = {
  PENDING: { label: "Reçue", emoji: "🆕", color: "#FF9F0A" },
  PREPARING: { label: "En préparation", emoji: "👨‍🍳", color: "#0A84FF" },
  READY: { label: "Prête", emoji: "✅", color: "#30D158" },
  DONE: { label: "Terminée", emoji: "🏁", color: "#AEAEB2" },
};

export const MODE_META = {
  sur_place: { label: "Sur place", emoji: "🍽️", eta: 15 },
  emporter: { label: "À emporter", emoji: "🥡", eta: 15 },
  livraison: { label: "Livraison", emoji: "🛵", eta: 35 },
};

let refCounter = 0;
export const nextRef = () => {
  const n = readOrders().filter((o) => o.day === todayISO()).length + 1 + refCounter++;
  return `WD-${String(n).padStart(3, "0")}`;
};

export const placeOrder = (order) => {
  const list = readOrders();
  const full = {
    ...order,
    id: uid(),
    ref: nextRef(),
    ts: Date.now(),
    at: nowTime(),
    day: todayISO(),
    status: "PENDING",
    eta_at: Date.now() + MODE_META[order.mode].eta * 60000,
  };
  list.push(full);
  writeOrders(list);
  upsertCustomer(full);
  logActivity(
    MODE_META[order.mode].emoji,
    `${full.ref} · ${MODE_META[order.mode].label}${order.table ? ` · table ${order.table}` : ""} — ${full.items.length} article(s)`,
    "order"
  );
  return full;
};

export const advanceOrder = (id, to) => {
  const list = readOrders();
  const o = list.find((x) => x.id === id);
  if (!o) return null;
  o.status = to;
  if (to === "READY") o.ready_at = Date.now();
  if (to === "DONE") o.done_at = Date.now();
  writeOrders(list);
  logActivity(STATUS_META[to].emoji, `${o.ref} — ${STATUS_META[to].label}`, "order");
  return o;
};

export const shiftEta = (id, minutes) => {
  const list = readOrders();
  const o = list.find((x) => x.id === id);
  if (!o) return;
  o.eta_at = Math.max(Date.now(), (o.eta_at || Date.now()) + minutes * 60000);
  writeOrders(list);
};

/* ----------------------- Jeu de démonstration ----------------------- */

/* Quelques commandes déjà en cours pour que le dashboard et la cuisine ne
   soient pas vides à la première ouverture. */
export const seedOrders = () => {
  const t = Date.now();
  const line = (item, qty, opts = [], extra = 0) => ({
    key: uid(),
    item_id: item.id,
    name: item.name,
    emoji: item.emoji,
    qty,
    unit: item.price + extra,
    total: (item.price + extra) * qty,
    opts,
  });
  const find = (id) => WELL_DONE_MENU.find((m) => m.id === id);
  return [
    {
      id: uid(), ref: "WD-001", ts: t - 9 * 60000, at: nowTime(), day: todayISO(),
      mode: "sur_place", table: 4, status: "PREPARING",
      items: [
        line(find("b-smoky"), 1, ["Formule frites + boisson soft", "Coca", "Barbecue"], 3),
        line(find("f-cheddar"), 1, ["Curry mango"], 0.5),
      ],
      subtotal: 18.4, discount: 0, total: 18.4,
      payment_method: "carte", paid: true,
      customer: { name: "Table 4" },
      eta_at: t + 6 * 60000,
    },
    {
      id: uid(), ref: "WD-002", ts: t - 3 * 60000, at: nowTime(), day: todayISO(),
      mode: "livraison", table: null, status: "PENDING",
      items: [
        line(find("b-welldone"), 2, ["Formule frites + boisson soft", "Ice Tea", "Ketchup"], 3),
        line(find("a-onion"), 1),
        line(find("d-cookie"), 1),
      ],
      subtotal: 33.0, discount: 0, total: 33.0,
      payment_method: "carte", paid: true,
      customer: { name: "Karim B.", phone: "06 12 34 56 78", city: "Sevran", address: "12 rue des Lilas" },
      eta_at: t + 32 * 60000,
    },
  ];
};

/* ----------------------- Flux temps réel ----------------------- */

/* Un onglet en veille cesse de recevoir les évènements `storage` : on double
   l'écoute d'une interrogation périodique et d'une resynchronisation sur
   visibilitychange / focus / online, faute de quoi la cuisine découvre les
   commandes avec plusieurs minutes de retard. */
export function useOrders(ms = 2000) {
  const [orders, setOrders] = useState(readOrders);
  const sync = useCallback(() => setOrders(readOrders()), []);
  useEffect(() => {
    const i = setInterval(sync, ms);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("online", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearInterval(i);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("online", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [ms, sync]);
  return [orders, sync];
}

export const ensureSeed = () => {
  const existing = readOrders();
  if (existing.length === 0) {
    writeOrders(seedOrders());
    logActivity("🍔", "Service ouvert — 2 commandes de démonstration chargées", "system");
  }
};
