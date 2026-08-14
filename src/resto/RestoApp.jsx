import React, { useState, useEffect } from "react";
import { W, FONT, display, label, glass, goldText, brandPattern } from "./theme.js";
import { Screen, Panel, Btn, Chip, Dish } from "./ui.jsx";
import { Logo, Tagline, BurgerGlyph, LogoBadge } from "./Logo.jsx";
import { BRAND, CATEGORIES, DELIVERY_ZONES, WELL_DONE_MENU, ensureSeed, useOrders } from "./data.js";
import Manager, { tablePortalUrl } from "./Manager.jsx";
import Kitchen from "./Kitchen.jsx";
import RestoPortal from "./Client.jsx";
import { todayISO } from "../shared/ui.jsx";
import { Icon } from "./icons.jsx";

/* ==========================================================================
   WELL DONE — vitrine et navigation entre les trois interfaces du produit.
   ========================================================================== */

const DEMO_TABLE = 4;

/* ----------------------- Barre de démonstration -----------------------
   Les trois écrans du produit sont des destinations à part entière : ils
   restent visibles et à un clic, quel que soit l'écran affiché. */

const DESTS = [
  { id: "client", label: "Vue client", icon: "phone" },
  { id: "cuisine", label: "Vue cuisine", icon: "kitchen" },
  { id: "gestion", label: "Vue gestion", icon: "desktop" },
];

function DemoBar({ screen, go }) {
  const [orders] = useOrders(3000);
  const pending = orders.filter((o) => o.day === todayISO() && o.status === "PENDING").length;

  return (
    <div
      style={{
        position: "sticky", top: 0, zIndex: 200, height: 46,
        background: "rgba(255,255,255,.92)", backdropFilter: "blur(22px)",
        borderBottom: `1px solid ${W.line}`,
        display: "flex", alignItems: "center", gap: 10, padding: "0 12px",
        overflowX: "auto",
      }}
      className="wd-scroll"
    >
      <button
        onClick={() => go("landing")}
        style={{
          ...FONT, display: "inline-flex", alignItems: "center", gap: 7, flexShrink: 0,
          background: "transparent", border: "none", cursor: "pointer", color: W.textDim,
          fontSize: 12, fontWeight: 800, padding: "6px 8px",
        }}
      >
        <BurgerGlyph size={15} color={W.gold} stroke={8} />
        <span style={{ ...label(9.5) }}>Démo</span>
      </button>

      <span style={{ width: 1, height: 20, background: W.lineSoft, flexShrink: 0 }} />

      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        {DESTS.map((d) => {
          const on = screen === d.id;
          return (
            <button
              key={d.id}
              onClick={() => go(d.id)}
              style={{
                ...FONT, display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap",
                borderRadius: 999, padding: "7px 13px", fontSize: 12.5, fontWeight: 800, cursor: "pointer",
                border: `1px solid ${on ? "transparent" : W.lineSoft}`,
                background: on ? `linear-gradient(135deg, ${W.goldLt}, ${W.gold})` : "rgba(22,36,26,.035)",
                color: on ? "#2A1B08" : W.textSoft,
              }}
            >
              <Icon name={d.icon} size={15} stroke={1.9} />
              {d.label}
              {d.id === "cuisine" && pending > 0 && (
                <span
                  style={{
                    background: on ? "#2A1B08" : W.danger, color: on ? W.goldLt : "#fff",
                    borderRadius: 999, fontSize: 10, fontWeight: 900, padding: "1px 6px",
                  }}
                  translate="no"
                >
                  {pending}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------- Vitrine ----------------------- */

function Hero({ go }) {
  return (
    <section style={{ position: "relative", overflow: "hidden", padding: "72px 20px 60px" }}>
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0,
          backgroundImage: brandPattern(0.9),
          backgroundSize: "200px 200px",
          opacity: 0.5,
          maskImage: "radial-gradient(70% 60% at 50% 20%, #000, transparent)",
          WebkitMaskImage: "radial-gradient(70% 60% at 50% 20%, #000, transparent)",
        }}
      />
      <div style={{ position: "relative", maxWidth: 980, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Logo size={62} />
        </div>
        <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
          <Tagline size={11} />
        </div>

        <h1 style={{ ...display(58), color: W.text, marginTop: 44, maxWidth: 820, marginLeft: "auto", marginRight: "auto" }}>
          Le smash burger,
          <br />
          <span style={goldText}>commandé au QR code.</span>
        </h1>

        <p style={{ ...FONT, fontSize: 17.5, color: W.textSoft, marginTop: 22, lineHeight: 1.6, maxWidth: 620, marginLeft: "auto", marginRight: "auto" }}>
          Le client scanne le QR de sa table, compose son burger et paie depuis son
          téléphone. La cuisine reçoit la commande dans la seconde. La caisse suit
          en direct. Aucune application à installer.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 34 }}>
          <Btn size="lg" onClick={() => go("client")}><Icon name="phone" size={17} /> Lancer la démo client</Btn>
          <Btn size="lg" variant="outline" onClick={() => go("gestion")}><Icon name="desktop" size={17} /> Tableau de bord</Btn>
        </div>

        <div style={{ ...FONT, fontSize: 12.5, color: W.textDim, marginTop: 18 }}>
          Démonstration hors ligne — tout l'état vit dans ce navigateur.
        </div>
      </div>
    </section>
  );
}

function Interfaces({ go }) {
  const cards = [
    {
      id: "client", icon: "phone", title: "Vue client", tone: W.green,
      sub: "Sur le téléphone du client",
      pts: ["Sur place, à emporter ou livraison", "Composition guidée : formule, sauces, suppléments", "Paiement et suivi temps réel"],
      cta: "Ouvrir le portail",
    },
    {
      id: "cuisine", icon: "kitchen", title: "Vue cuisine", tone: W.orange,
      sub: "Sur la tablette du passe",
      pts: ["Trois colonnes, gros caractères", "Minuterie qui vire au rouge", "Alarme jusqu'à acceptation"],
      cta: "Ouvrir l'écran cuisine",
    },
    {
      id: "gestion", icon: "desktop", title: "Vue gestion", tone: W.gold,
      sub: "Sur l'ordinateur du gérant",
      pts: ["Caisse, rapport Z, export CSV", "Carte, QR, fichier clients", "Zones de livraison et journal"],
      cta: "Ouvrir le tableau de bord",
    },
  ];

  return (
    <section style={{ maxWidth: 1120, margin: "0 auto", padding: "20px 20px 10px" }}>
      <div style={{ textAlign: "center", marginBottom: 34 }}>
        <div style={{ ...label(11), color: W.gold }}>Trois écrans, trois métiers</div>
        <h2 style={{ ...display(34), color: W.text, marginTop: 14 }}>Chacun sa vue, en un clic</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
        {cards.map((c) => (
          <Panel key={c.id} hover elev={2} pad={26} onClick={() => go(c.id)} style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                width: 52, height: 52, borderRadius: 16,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: c.tone + "1C", border: `1px solid ${c.tone}44`, color: c.tone,
              }}
            >
              <Icon name={c.icon} size={25} />
            </div>
            <div style={{ ...display(24), color: W.text, marginTop: 18 }}>{c.title}</div>
            <div style={{ ...FONT, fontSize: 13, color: c.tone, fontWeight: 700, marginTop: 6 }}>{c.sub}</div>

            <div style={{ marginTop: 18, flex: 1 }}>
              {c.pts.map((p) => (
                <div key={p} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 9 }}>
                  <span style={{ color: c.tone, fontSize: 12, marginTop: 2 }}>▸</span>
                  <span style={{ ...FONT, fontSize: 13.5, color: W.textSoft, lineHeight: 1.5 }}>{p}</span>
                </div>
              ))}
            </div>

            <Btn variant="outline" full style={{ marginTop: 20 }}>{c.cta} →</Btn>
          </Panel>
        ))}
      </div>
    </section>
  );
}

function MenuPreview() {
  const stars = WELL_DONE_MENU.filter((m) => ["b-welldone", "b-bigsmash", "c-avocado", "p-truffle"].includes(m.id));
  return (
    <section style={{ maxWidth: 1120, margin: "0 auto", padding: "64px 20px 10px" }}>
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <div style={{ ...label(11), color: W.gold }}>Carte pré-configurée</div>
        <h2 style={{ ...display(34), color: W.text, marginTop: 14 }}>
          <span translate="no">{WELL_DONE_MENU.length} articles</span> déjà en ligne
        </h2>
        <p style={{ ...FONT, fontSize: 15, color: W.textSoft, marginTop: 12 }}>
          Formules, sauces incluses et suppléments compris.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 14 }}>
        {stars.map((m) => (
          <Panel key={m.id} pad={20}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <Dish item={m} size={50} radius={15} fontSize={26} />
              <b style={{ ...display(19), ...goldText }} translate="no">{m.price.toFixed(2).replace(".", ",")} €</b>
            </div>
            <div style={{ ...display(18), color: W.text, marginTop: 14 }}>{m.name}</div>
            <div style={{ ...FONT, fontSize: 12.5, color: W.textSoft, marginTop: 8, lineHeight: 1.5 }}>{m.desc}</div>
          </Panel>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
        {CATEGORIES.map((c) => <Chip key={c.id} tone="dim"><Icon name={c.icon} size={12} /> {c.label}</Chip>)}
      </div>
    </section>
  );
}

function Zones() {
  return (
    <section style={{ maxWidth: 1120, margin: "0 auto", padding: "64px 20px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <div style={{ ...label(11), color: W.gold }}>Livraison</div>
        <h2 style={{ ...display(30), color: W.text, marginTop: 14 }}>Minimum de commande par zone</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 }}>
        {DELIVERY_ZONES.map((z) => (
          <Panel key={z.id} pad={20}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <b style={{ ...display(19), color: W.text }}>{z.label}</b>
              <Chip tone="gold"><span translate="no">{z.min} €</span></Chip>
            </div>
            <div style={{ ...FONT, fontSize: 12.5, color: W.textSoft, marginTop: 12, lineHeight: 1.55 }}>
              {z.cities.length ? z.cities.join(", ") : "Toute autre commune"}
            </div>
          </Panel>
        ))}
      </div>
    </section>
  );
}

function Footer({ go }) {
  return (
    <footer style={{ maxWidth: 1120, margin: "0 auto", padding: "60px 20px 70px" }}>
      <Panel elev={2} pad={38} style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <LogoBadge size={70} />
        </div>
        <h2 style={{ ...display(30), color: W.text }}>Prêt à voir le service tourner ?</h2>
        <p style={{ ...FONT, fontSize: 14.5, color: W.textSoft, marginTop: 12, maxWidth: 460, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
          Passez une commande depuis la vue client, puis regardez-la arriver en
          cuisine et dans la caisse en temps réel.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 26 }}>
          <Btn size="lg" onClick={() => go("client")}>Commencer par le client</Btn>
          <Btn size="lg" variant="outline" onClick={() => go("cuisine")}>Voir la cuisine</Btn>
        </div>
        <div style={{ ...FONT, fontSize: 12.5, color: W.textDim, marginTop: 30 }}>
          Snapchat {BRAND.snapchat} · Instagram {BRAND.instagram}
        </div>
      </Panel>
    </footer>
  );
}

function Landing({ go }) {
  return (
    <Screen>
      <Hero go={go} />
      <Interfaces go={go} />
      <MenuPreview />
      <Zones />
      <Footer go={go} />
    </Screen>
  );
}

/* ----------------------- Application ----------------------- */

export default function RestoApp() {
  const [screen, setScreen] = useState("landing");

  useEffect(() => { ensureSeed(); }, []);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [screen]);

  if (screen === "landing") return <Landing go={setScreen} />;

  return (
    // --wd-top décale les en-têtes collants des vues sous la barre de démo.
    <div style={{ "--wd-top": "46px" }}>
      <DemoBar screen={screen} go={setScreen} />
      {screen === "client" && <RestoPortal table={DEMO_TABLE} demo />}
      {screen === "cuisine" && <Kitchen />}
      {screen === "gestion" && (
        <Manager
          onExit={() => setScreen("landing")}
          onKitchen={() => setScreen("cuisine")}
          onClient={() => setScreen("client")}
        />
      )}
    </div>
  );
}

export { tablePortalUrl };
