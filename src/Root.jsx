import React, { useState, useEffect } from "react";
import { ToastProvider, GlobalStyles } from "./shared/ui.jsx";
import HotelApp from "./App.jsx";
import RestoApp from "./resto/RestoApp.jsx";
import RestoPortal from "./resto/Client.jsx";
import { logScan, ensureSeed } from "./resto/data.js";

/* ==========================================================================
   Aiguillage entre les deux verticales de démonstration.

   /                      → Well Done (restaurant)
   /r/well-done/t/{table} → portail client Well Done
   /hotel                 → Wegemo Hôtel
   /r/demo-hotel/t/{room} → portail chambre (routé par App.jsx)
   ========================================================================== */

function parseRoute() {
  const hash = window.location.hash.match(/^#\/r\/([^/]+)\/t\/(\d+)/);
  if (hash) return { slug: hash[1], num: Number(hash[2]) };

  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  let path = window.location.pathname;
  if (base && path.startsWith(base)) path = path.slice(base.length);

  const m = path.match(/^\/r\/([^/]+)\/t\/(\d+)/);
  if (m) return { slug: m[1], num: Number(m[2]) };
  if (/^\/hotel\/?$/.test(path)) return { slug: "demo-hotel", num: null };
  return { slug: null, num: null };
}

/* Les deux verticales sont des produits distincts : elles ne doivent jamais
   partager ni titre d'onglet, ni favicon, ni données. */
const IDENTITY = {
  resto: {
    title: "Well Done — Le smash burger, commandé au QR code",
    emoji: "🍔",
  },
  hotel: {
    title: "Wegemo Hôtel — L'hôtel, réinventé par le QR code",
    emoji: "🏨",
  },
};

function applyIdentity(kind) {
  const id = IDENTITY[kind];
  document.title = id.title;
  const icon = document.querySelector("link[rel='icon']");
  if (icon) {
    icon.href =
      "data:image/svg+xml," +
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${id.emoji}</text></svg>`;
  }
}

function Routed() {
  const [route, setRoute] = useState(parseRoute);
  const [scanId, setScanId] = useState(null);

  useEffect(() => {
    const on = () => setRoute(parseRoute());
    window.addEventListener("popstate", on);
    window.addEventListener("hashchange", on);
    return () => {
      window.removeEventListener("popstate", on);
      window.removeEventListener("hashchange", on);
    };
  }, []);

  useEffect(() => {
    applyIdentity(route.slug === "demo-hotel" ? "hotel" : "resto");
  }, [route.slug]);

  // Un scan de QR est enregistré une fois par ouverture du portail.
  useEffect(() => {
    if (route.slug === "well-done" && route.num) {
      ensureSeed();
      setScanId(logScan(route.num));
    }
  }, [route.slug, route.num]);

  if (route.slug === "well-done" && route.num) {
    return <RestoPortal table={route.num} scanId={scanId} />;
  }
  if (route.slug === "demo-hotel") return <HotelApp />;
  return <RestoApp />;
}

export default function Root() {
  return (
    <ToastProvider>
      <GlobalStyles />
      <Routed />
    </ToastProvider>
  );
}
