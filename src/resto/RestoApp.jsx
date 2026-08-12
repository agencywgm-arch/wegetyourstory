import React, { useState } from "react";
import { C, FF, fmtEuro, Surface, Btn, Tag } from "../shared/ui.jsx";
import { BRAND, CATEGORIES, DELIVERY_ZONES, WELL_DONE_MENU, ensureSeed } from "./data.js";
import { WDLogo } from "./Client.jsx";
import Manager, { tablePortalUrl } from "./Manager.jsx";

/* ==========================================================================
   WELL DONE — vitrine de démonstration + accès au tableau de bord
   ========================================================================== */

function Landing({ onDemo }) {
  const highlights = WELL_DONE_MENU.filter((m) =>
    ["b-welldone", "b-smoky", "c-pilipli", "h-ny"].includes(m.id)
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      {/* Barre */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,.9)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${C.border}`, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <WDLogo size={20} />
        <Btn size="sm" onClick={onDemo} style={{ background: BRAND.green, color: "#FFF" }}>
          Tableau de bord →
        </Btn>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 940, margin: "0 auto", padding: "56px 20px 30px", textAlign: "center" }}>
        <div style={{ display: "inline-block" }}><WDLogo size={64} /></div>
        <h1 style={{ ...FF, fontSize: 40, fontWeight: 900, color: C.text, marginTop: 34, lineHeight: 1.1 }}>
          Le smash burger,<br />
          <span style={{ color: BRAND.green }}>commandé au QR code.</span>
        </h1>
        <p style={{ ...FF, fontSize: 17, color: C.textSecondary, marginTop: 16, lineHeight: 1.55, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
          Le client scanne le QR de sa table, compose son burger et paie depuis son
          téléphone. La cuisine reçoit la commande dans la seconde, la caisse suit
          en direct. Aucune application à installer.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 28 }}>
          <Btn size="lg" onClick={onDemo} style={{ background: BRAND.green, color: "#FFF" }}>
            🚀 Voir la démo
          </Btn>
          <Btn size="lg" variant="subtle" onClick={() => window.open(tablePortalUrl(4), "_blank")}>
            📱 Portail client — table 4
          </Btn>
        </div>
        <div style={{ ...FF, fontSize: 12.5, color: C.textTertiary, marginTop: 14 }}>
          Démonstration hors ligne : tout l'état vit dans ce navigateur.
        </div>
      </section>

      {/* Trois interfaces */}
      <section style={{ maxWidth: 940, margin: "0 auto", padding: "20px 20px 10px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
          {[
            { e: "📱", t: "Client", d: "QR de table, carte illustrée, composition du burger, panier, paiement, suivi temps réel avec compte à rebours." },
            { e: "👨‍🍳", t: "Cuisine", d: "Kanban temps réel, alarme sonore qui ne s'arrête qu'à l'acceptation, ETA ajustable ±5 min." },
            { e: "🖥️", t: "Gestion", d: "Commandes live, caisse et rapport Z, carte, QR imprimables, CRM, zones de livraison, journal d'activité." },
          ].map((x) => (
            <Surface key={x.t} className="wgm-tile" style={{ padding: 20 }}>
              <div style={{ fontSize: 30 }}>{x.e}</div>
              <div style={{ ...FF, fontSize: 17, fontWeight: 900, color: C.text, marginTop: 10 }}>{x.t}</div>
              <div style={{ ...FF, fontSize: 13.5, color: C.textSecondary, marginTop: 6, lineHeight: 1.5 }}>{x.d}</div>
            </Surface>
          ))}
        </div>
      </section>

      {/* Aperçu de la carte */}
      <section style={{ maxWidth: 940, margin: "0 auto", padding: "36px 20px 10px" }}>
        <h2 style={{ ...FF, fontSize: 24, fontWeight: 900, color: C.text, textAlign: "center" }}>
          La carte, déjà chargée
        </h2>
        <p style={{ ...FF, fontSize: 14.5, color: C.textSecondary, textAlign: "center", marginTop: 8 }}>
          <span translate="no">{WELL_DONE_MENU.length} articles</span> répartis en {CATEGORIES.length} catégories, avec formules,
          sauces incluses et suppléments.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12, marginTop: 20 }}>
          {highlights.map((m) => (
            <Surface key={m.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ ...FF, fontSize: 15, fontWeight: 800, color: C.text }}>{m.emoji} {m.name}</span>
                <b style={{ ...FF, fontSize: 14.5, fontWeight: 900, color: BRAND.green }} translate="no">{fmtEuro(m.price)}</b>
              </div>
              <div style={{ ...FF, fontSize: 12.5, color: C.textSecondary, marginTop: 6, lineHeight: 1.45 }}>{m.desc}</div>
            </Surface>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 18 }}>
          {CATEGORIES.map((c) => (
            <Tag key={c.id} color={BRAND.gold}>{c.emoji} {c.label}</Tag>
          ))}
        </div>
      </section>

      {/* Zones */}
      <section style={{ maxWidth: 940, margin: "0 auto", padding: "36px 20px 60px" }}>
        <h2 style={{ ...FF, fontSize: 22, fontWeight: 900, color: C.text, textAlign: "center", marginBottom: 18 }}>
          🛵 Minimum de livraison selon zone
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
          {DELIVERY_ZONES.map((z) => (
            <Surface key={z.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b style={{ ...FF, fontSize: 15, fontWeight: 900, color: C.text }}>{z.label}</b>
                <Tag color={BRAND.green}><span translate="no">min. {fmtEuro(z.min)}</span></Tag>
              </div>
              <div style={{ ...FF, fontSize: 12.5, color: C.textSecondary, marginTop: 8, lineHeight: 1.5 }}>
                {z.cities.length ? z.cities.join(", ") : "Toute autre commune"}
              </div>
            </Surface>
          ))}
        </div>

        <div style={{ ...FF, fontSize: 13, color: C.textTertiary, textAlign: "center", marginTop: 34, lineHeight: 1.7 }}>
          👻 {BRAND.snapchat} · 📸 {BRAND.instagram}
          <br />
          <a href="./hotel" style={{ color: C.textTertiary }}>Voir aussi la démo hôtelière Wegemo →</a>
        </div>
      </section>
    </div>
  );
}

export default function RestoApp() {
  const [screen, setScreen] = useState("landing");
  if (screen === "dashboard") {
    ensureSeed();
    return <Manager onExit={() => setScreen("landing")} />;
  }
  return <Landing onDemo={() => setScreen("dashboard")} />;
}
