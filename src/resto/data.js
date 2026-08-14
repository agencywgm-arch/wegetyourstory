import { useState, useEffect, useCallback } from "react";
import { readLS, writeLS, uid, nowTime, todayISO } from "../shared/ui.jsx";
import { MODE_ICON } from "./icons.jsx";

/* Photos produit fournies par l'enseigne (welldone-burger.com). Un article
   sans entrée ici reste illustré par l'icône de sa catégorie. */
import imgWellDone from "./dishes/well-done.jpg";
import imgCheese from "./dishes/cheese.jpg";
import imgSmokyBeef from "./dishes/smoky-beef.jpg";
import imgAvocado from "./dishes/avocado.jpg";
import imgSmokyChicn from "./dishes/smoky-chicn.jpg";
import imgFritesBacon from "./dishes/frites-cheddar-bacon.jpg";
import imgFrenchToast from "./dishes/french-toast.jpg";
import imgHotDog from "./dishes/hot-dog.jpg";
import imgBigSmash from "./dishes/big-smash.jpg";
import imgBahnMi from "./dishes/bahn-mi.jpg";
import imgFlaminChicn from "./dishes/flamin-chicn.jpg";
import imgSalade from "./dishes/salade.jpg";
import imgChicnPop from "./dishes/chicn-pop.jpg";
import imgCupDubai from "./dishes/cup-dubai.jpg";
import imgCookieGourmet from "./dishes/cookie-gourmet.jpg";
import imgTiramisu from "./dishes/tiramisu.jpg";
import imgTrayChicn from "./dishes/tray-chicn.jpg";
import imgTrayWellDone from "./dishes/tray-well-done.jpg";
import imgPhilyOriginal from "./dishes/phily-original.jpg";
import imgPhilyTruffle from "./dishes/phily-truffle.jpg";
import imgPhilyBoursin from "./dishes/phily-boursin.jpg";
import imgPhilyCrispyChicn from "./dishes/phily-crispy-chicn.jpg";

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
  { id: "smash", label: "Smash Burger", icon: "burger", note: "Black Angus Beef · Frites + boisson soft + 3 €" },
  { id: "chicken", label: "Chicken Burger", icon: "drumstick", note: "Frites + boisson soft + 3,50 €" },
  { id: "phillys", label: "Phily's", icon: "sandwich", note: "Cheesesteak — sandwich, à ne pas confondre avec le burger Phily" },
  { id: "trays", label: "Nos Trays", icon: "tray", note: "Formule complète : frites + boisson incluses" },
  { id: "hotdog", label: "Hot Dog", icon: "hotdog", note: "Frites + boisson soft + 3,50 €" },
  { id: "salade", label: "Salade", icon: "salad" },
  { id: "frites", label: "Nos frites", icon: "fries" },
  { id: "add", label: "Add", icon: "extras" },
  { id: "desserts", label: "Desserts", icon: "dessert" },
  { id: "boissons", label: "Boissons", icon: "drink" },
];

/* Articles absents de la carte papier mais présents sur welldone-burger.com :
   photographiés par l'enseigne, sans prix communiqué. Le prix est une
   estimation par comparaison avec des articles voisins de la carte —
   signalée par estimatedPrice et à valider avant mise en production. */
const est = (price) => ({ price, estimatedPrice: true });

export const WELL_DONE_MENU = [
  /* --- Smash Burger Angus Beef --- */
  {
    id: "b-welldone", category: "smash", name: "Well Done", price: 9.5, image: imgWellDone,
    desc: "Bun's potato, black angus steak, cheddar américain, pickles, salade, tomate, sauce originale",
    badge: "Signature", options: optionsBurger(),
  },
  {
    id: "b-cheese", category: "smash", name: "Cheese", price: 8.9, image: imgCheese,
    desc: "Bun's potato, black angus steak, cheddar américain, pickles, oignon frais, ketchup, moutarde américaine",
    options: optionsBurger(),
  },
  {
    id: "b-smoky", category: "smash", name: "Smoky Beef", price: 10.9, image: imgSmokyBeef,
    desc: "Bun's potato, black angus steak, cheddar américain, bacon de bœuf, oignon caramélisé, salade, tomate, sauce barbecue",
    options: optionsBurger(),
  },
  {
    id: "b-truffle", category: "smash", name: "Truffle", price: 10.9,
    desc: "Bun's potato, black angus steak, cheddar mature, oignon caramélisé, salade, tomate, sauce à la truffe",
    options: optionsBurger(),
  },
  {
    id: "b-phily", category: "smash", name: "Phily", price: 11.9,
    desc: "Bun's potato, black angus steak, cheddar mature, champignon frais grillé, salade, tomate, philadelphia cheese",
    options: optionsBurger(),
  },
  {
    id: "b-bigsmash", category: "smash", name: "Big Smash", ...est(12.9), image: imgBigSmash,
    desc: "Bun's potato, quadruple steak black angus smashés, cheddar américain, oignon frais, pickles, salade",
    options: optionsBurger(),
  },
  {
    id: "b-bahnmi", category: "smash", name: "Bahn Mi", ...est(10.9), image: imgBahnMi,
    desc: "Un sandwich vietnamien en smash burger : porc caramélisé, carotte, concombre, coriandre, sauce épicée",
    options: optionsBurger(),
  },

  /* --- Chicken Burger --- */
  {
    id: "c-chicn", category: "chicken", name: "Chic'n", price: 8.5,
    desc: "Bun's potato, filet de poulet pané, cheddar américain, salade, tomate, mayonnaise américaine",
    options: optionsChicken(),
  },
  {
    id: "c-avocado", category: "chicken", name: "L'Avocado", price: 9.5, image: imgAvocado,
    desc: "Bun's potato, filet de poulet pané, cheddar américain, avocat, tomate, sauce basilic",
    options: optionsChicken(),
  },
  {
    id: "c-smoky", category: "chicken", name: "Smoky chic'n", price: 9.5, image: imgSmokyChicn,
    desc: "Bun's potato, filet de poulet pané, cheddar américain, bacon de bœuf, oignon caramélisé, sauce barbecue",
    options: optionsChicken(),
  },
  {
    id: "c-pilipli", category: "chicken", name: "Pili pli", price: 9.5,
    desc: "Bun's potato, filet de poulet pané, cheddar, jalapeños, tomates, sauce épicée",
    badge: "Épicé", options: optionsChicken(),
  },
  {
    id: "c-flamin", category: "chicken", name: "Flamin Chic'N", ...est(10.9), image: imgFlaminChicn,
    desc: "Bun's potato, filet de poulet pané, chips Cheetos flamin' hot, cheddar fondu, sauce épicée",
    badge: "Épicé", options: optionsChicken(),
  },

  /* --- Phily's (cheesesteak — différent du burger Phily) --- */
  {
    id: "p-original", category: "phillys", name: "The Original Phily's", ...est(10.9), image: imgPhilyOriginal,
    desc: "Bœuf effiloché, cheddar fondu, oignon caramélisé, salade, sauce originale — la vraie recette philly",
    options: optionsBurger(),
  },
  {
    id: "p-truffle", category: "phillys", name: "The Truffle Phily's", ...est(12.9), image: imgPhilyTruffle,
    desc: "Bœuf effiloché, champignons, cheddar fondu, roquette, sauce à la truffe",
    badge: "Premium", options: optionsBurger(),
  },
  {
    id: "p-boursin", category: "phillys", name: "Phily's Boursin", ...est(9.9), image: imgPhilyBoursin,
    desc: "Poulet mariné grillé, cheddar fondu, sauce boursin maison",
    options: optionsChicken(),
  },
  {
    id: "p-crispychicn", category: "phillys", name: "Phily's Crispy Chic'N", ...est(9.9), image: imgPhilyCrispyChicn,
    desc: "Filet de poulet croustillant, sauce maison, oignon frais, salade",
    options: optionsChicken(),
  },

  /* --- Nos Trays (formule plateau : frites + boisson incluses) --- */
  {
    id: "t-chicn", category: "trays", name: "Tray Chic'N", ...est(14.9), image: imgTrayChicn,
    desc: "Poulet pané avec une sauce fait maison au choix, des frites et une boisson",
    options: optionsSauceOnly(),
  },
  {
    id: "t-welldone", category: "trays", name: "Tray Well Done", ...est(15.9), image: imgTrayWellDone,
    desc: "Tenders, cheddar fondu, bacon de bœuf, frites et une boisson",
    options: optionsSauceOnly(),
  },

  /* --- Hot Dog --- */
  {
    id: "h-ny", category: "hotdog", name: "New-yorkais", price: 5.9, image: imgHotDog,
    desc: "Bun's potato hot dog, saucisse de bœuf, relish pickles, crispy oignon, ketchup, moutarde américaine",
    options: optionsHotdog(),
  },
  {
    id: "h-spicy", category: "hotdog", name: "Spicy", price: 6.5,
    desc: "Bun's potato hot dog, saucisse de bœuf, cheddar fondu, relish pickles, crispy oignon, jalapeños, sauce originale",
    options: optionsHotdog(),
  },
  {
    id: "h-welldone", category: "hotdog", name: "Well Done", price: 6.9,
    desc: "Bun's potato hotdog, saucisse de bœuf, bacon de bœuf, relish pickles, oignon caramélisé, cheddar fondu, sauce originale",
    options: optionsHotdog(),
  },

  /* --- Salade --- */
  {
    id: "sal-complete", category: "salade", name: "Salade Well Done", ...est(11.9), image: imgSalade,
    desc: "Tenders de poulet croustillant, bœuf pastrami, avocat, tomates cerises, jeunes pousses, vinaigrette maison",
  },

  /* --- Nos frites --- */
  { id: "f-nature", category: "frites", name: "Frites", price: 3, options: optionsSauceOnly() },
  { id: "f-cheddar", category: "frites", name: "Frites cheddar", price: 4, options: optionsSauceOnly() },
  { id: "f-jalapenos", category: "frites", name: "Frites cheddar jalapeños", price: 4.5, options: optionsSauceOnly() },
  { id: "f-bacon", category: "frites", name: "Frites cheddar bacon", price: 5, image: imgFritesBacon, options: optionsSauceOnly() },

  /* --- Add --- */
  { id: "a-nuggets", category: "add", name: "Chicken Nuggets ×5", price: 4.5, options: optionsSauceOnly() },
  { id: "a-chili", category: "add", name: "Chili cheese nuggets ×6", price: 4.5, options: optionsSauceOnly() },
  { id: "a-mozza", category: "add", name: "Mozza sticks ×4", price: 4.5, options: optionsSauceOnly() },
  { id: "a-tenders", category: "add", name: "Tenders ×3", price: 4.5, options: optionsSauceOnly() },
  { id: "a-chevre", category: "add", name: "Sticks chèvre miel ×4", price: 4.5, options: optionsSauceOnly() },
  { id: "a-onion", category: "add", name: "Oignon rings ×6", price: 4.5, options: optionsSauceOnly() },
  {
    id: "a-chicnpop", category: "add", name: "Chic'n Pop", ...est(6.9), image: imgChicnPop,
    desc: "Poulet pop-corn façon coréenne, sauce sucrée-épicée, sésame", options: optionsSauceOnly(),
  },

  /* --- Desserts --- */
  { id: "d-mousse", category: "desserts", name: "Mousse chocolat", price: 3.9 },
  { id: "d-cookie", category: "desserts", name: "Cookie façon brownie", price: 3.5 },
  { id: "d-cheesecake", category: "desserts", name: "Cheesecake framboise", price: 4.5 },
  {
    id: "d-brioche", category: "desserts", name: "French Toast", price: 3.5, image: imgFrenchToast,
    desc: "Pain perdu maison, sauce caramel beurre salé et chocolat, chantilly",
  },
  {
    id: "d-cookiegourmet", category: "desserts", name: "Cookie Gourmet", ...est(6.5), image: imgCookieGourmet,
    desc: "Cookie fondant et croustillant, glace vanille, éclats de biscuit, sauce caramel",
  },
  {
    id: "d-tiramisu", category: "desserts", name: "Tiramisu", ...est(4.9), image: imgTiramisu,
    desc: "Tiramisu maison en pot, biscuit imbibé, mascarpone",
  },
  {
    id: "d-cupdubai", category: "desserts", name: "Cup Dubai", ...est(6.9), image: imgCupDubai,
    desc: "Cup façon chocolat Dubaï : pistache, kadaïf croustillant, fraises fraîches",
    badge: "Tendance",
  },

  /* --- Boissons --- */
  {
    id: "s-soft", category: "boissons", name: "Soft", price: 2,
    desc: "33 cl",
    options: [{
      key: "parfum", label: "Au choix", type: "single", required: true,
      choices: SOFT_DRINKS.map((d) => ({ id: d, label: d, price: 0 })),
    }],
  },
  {
    id: "s-premium", category: "boissons", name: "Prémium", price: 2.5,
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
    id: "s-lemonaid", category: "boissons", name: "Lemon Aid", price: 2.9,
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

export const logActivity = (icon, text, type = "order") => {
  const l = readLS(KEY_ACTIVITY, []);
  l.push({ id: uid(), ts: Date.now(), at: nowTime(), icon, text, type });
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
  PENDING: { label: "Reçue", icon: "bell", color: "#FF9F0A" },
  PREPARING: { label: "En préparation", icon: "kitchen", color: "#0A84FF" },
  READY: { label: "Prête", icon: "check", color: "#30D158" },
  DONE: { label: "Terminée", icon: "flag", color: "#AEAEB2" },
};

export const MODE_META = {
  sur_place: { label: "Sur place", eta: 15 },
  emporter: { label: "À emporter", eta: 15 },
  livraison: { label: "Livraison", eta: 35 },
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
    MODE_ICON[order.mode],
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
  logActivity(STATUS_META[to].icon, `${o.ref} — ${STATUS_META[to].label}`, "order");
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
    category: item.category,
    image: item.image,
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
    logActivity("burger", "Service ouvert — 2 commandes de démonstration chargées", "system");
  }
};
