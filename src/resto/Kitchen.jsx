import React, { useEffect, useRef, useState } from "react";
import { W, FONT, display, label, glass } from "./theme.js";
import { Btn, Chip, Empty, Screen } from "./ui.jsx";
import { Logo } from "./Logo.jsx";
import { MODE_META, advanceOrder, shiftEta, useOrders } from "./data.js";
import { useTick, playBeep, todayISO } from "../shared/ui.jsx";
import { Icon, MODE_ICON } from "./icons.jsx";

/* ==========================================================================
   ÉCRAN CUISINE (KDS) — pensé pour une tablette fixée au passe.
   Trois colonnes, gros caractères, minuterie qui vire au rouge, une seule
   action par commande. Aucune navigation parasite.
   ========================================================================== */

const COLS = [
  { id: "PENDING", title: "Nouvelles", accent: W.orange, action: "Accepter", next: "PREPARING" },
  { id: "PREPARING", title: "En préparation", accent: W.info, action: "Prête", next: "READY" },
  { id: "READY", title: "Prêtes", accent: W.green, action: "Remise au client", next: "DONE" },
];

/* Une commande qui traîne doit sauter aux yeux avant qu'un client ne râle. */
function ageTone(minutes, status) {
  if (status === "READY") return { c: W.green, urgent: false };
  if (minutes >= 12) return { c: W.danger, urgent: true };
  if (minutes >= 7) return { c: W.warn, urgent: false };
  return { c: W.green, urgent: false };
}

function Ticket({ o, onAdvance, onEta, col }) {
  const mins = Math.floor((Date.now() - o.ts) / 60000);
  const tone = ageTone(mins, o.status);
  const mode = MODE_META[o.mode];
  const isNew = o.status === "PENDING";

  return (
    <div
      style={{
        ...glass(2),
        padding: 0,
        overflow: "hidden",
        borderColor: isNew ? "rgba(240,128,60,.5)" : tone.urgent ? "rgba(255,77,77,.5)" : W.line,
        animation: isNew ? "wdRing 1.8s ease-in-out infinite" : undefined,
      }}
    >
      {/* Bandeau : référence, origine, minuterie */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "13px 16px",
          background: `linear-gradient(90deg, ${col.accent}22, transparent)`,
          borderBottom: `1px solid ${W.lineSoft}`,
        }}
      >
        <span style={{ ...display(21), color: W.text }} translate="no">{o.ref}</span>
        <Chip tone={o.mode === "livraison" ? "gold" : "dim"} style={{ fontSize: 11.5 }}>
          <Icon name={MODE_ICON[o.mode]} size={13} /> {o.table ? `Table ${o.table}` : mode.label}
        </Chip>
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 8, height: 8, borderRadius: 99, background: tone.c,
              animation: tone.urgent ? "wdPulse 1s ease-in-out infinite" : undefined,
            }}
          />
          <span style={{ ...display(19), color: tone.c }} translate="no">{mins}′</span>
        </span>
      </div>

      {/* Lignes de préparation */}
      <div style={{ padding: "12px 16px" }}>
        {o.items.map((l) => (
          <div key={l.key} style={{ display: "flex", gap: 12, padding: "9px 0", borderBottom: `1px solid ${W.lineSoft}` }}>
            <span
              style={{
                ...display(17), color: W.forest, background: W.goldLt, borderRadius: 9,
                minWidth: 32, height: 32, display: "inline-flex", alignItems: "center",
                justifyContent: "center", flexShrink: 0,
              }}
              translate="no"
            >
              {l.qty}
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ ...FONT, display: "block", fontSize: 16.5, fontWeight: 800, color: W.text, letterSpacing: "-0.01em" }}>
                {l.name}
              </span>
              {l.opts?.length > 0 && (
                <span style={{ ...FONT, display: "block", fontSize: 13, color: W.textSoft, marginTop: 3, lineHeight: 1.45 }}>
                  {l.opts.join(" · ")}
                </span>
              )}
              {l.note && (
                <span
                  style={{
                    ...FONT, display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6, fontSize: 13, fontWeight: 800,
                    color: W.orange, background: W.orange + "1C", border: `1px solid ${W.orange}45`,
                    borderRadius: 8, padding: "3px 9px",
                  }}
                >
                  <Icon name="edit" size={12} /> {l.note}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Pied : client / adresse et action unique */}
      <div style={{ padding: "0 16px 14px" }}>
        {(o.customer?.name || o.customer?.address) && (
          <div style={{ ...FONT, fontSize: 12.5, color: W.textDim, marginBottom: 12, lineHeight: 1.5 }}>
            {o.customer.name}
            {o.customer.address ? ` · ${o.customer.address}, ${o.customer.city}` : ""}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {o.status !== "READY" && (
            <>
              <button onClick={() => onEta(o.id, -5)} style={etaBtn} aria-label="Avancer de 5 minutes">−5</button>
              <button onClick={() => onEta(o.id, 5)} style={etaBtn} aria-label="Retarder de 5 minutes">+5</button>
            </>
          )}
          <Btn
            full
            size="md"
            variant={isNew ? "gold" : col.id === "READY" ? "outline" : "primary"}
            onClick={() => onAdvance(o.id, col.next)}
          >
            {col.action}
          </Btn>
        </div>
      </div>
    </div>
  );
}

const etaBtn = {
  ...FONT, width: 46, height: 44, borderRadius: 14, flexShrink: 0,
  border: `1px solid ${W.lineStrong}`, background: "rgba(255,255,255,.04)",
  color: W.textSoft, fontSize: 14, fontWeight: 800, cursor: "pointer",
};

export default function Kitchen({ onExit }) {
  const [orders, sync] = useOrders(2000);
  useTick(1000);
  const [muted, setMuted] = useState(false);
  const alarm = useRef(null);

  const today = orders.filter((o) => o.day === todayISO());
  const pending = today.filter((o) => o.status === "PENDING");

  /* L'alarme ne s'arrête qu'une fois la commande acceptée : en plein coup de
     feu, un bip unique passe inaperçu. */
  useEffect(() => {
    const stop = () => { if (alarm.current) { clearInterval(alarm.current); alarm.current = null; } };
    if (pending.length > 0 && !muted && !alarm.current) {
      const ring = () => { playBeep(1020, 220, 0.2); setTimeout(() => playBeep(760, 300, 0.2), 240); };
      ring();
      alarm.current = setInterval(ring, 3200);
    }
    if ((pending.length === 0 || muted) && alarm.current) stop();
    return stop;
  }, [pending.length, muted]);

  const advance = (id, to) => { advanceOrder(id, to); sync(); };
  const eta = (id, m) => { shiftEta(id, m); sync(); };

  return (
    <Screen>
      {/* Barre de service */}
      <header
        style={{
          position: "sticky", top: "var(--wd-top, 0px)", zIndex: 40,
          background: "rgba(10,26,13,.82)", backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${W.line}`, padding: "13px 22px",
          display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
        }}
      >
        <Logo size={17} inline />
        <span style={{ width: 1, height: 26, background: W.lineSoft }} />
        <span style={{ ...label(12), color: W.gold }}>Écran cuisine</span>

        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {pending.length > 0 && (
            <Chip tone="danger" solid style={{ animation: "wdPulse 1.4s ease-in-out infinite" }}>
              <Icon name="bell" size={13} /> {pending.length} à accepter
            </Chip>
          )}
          <span style={{ ...display(19), color: W.text }} translate="no">
            {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <Btn size="xs" variant="outline" onClick={() => setMuted((m) => !m)}>
            <><Icon name="bell" size={14} /> {muted ? "Muet" : "Son actif"}</>
          </Btn>
          {onExit && <Btn size="xs" variant="ghost" onClick={onExit}>Quitter</Btn>}
        </span>
      </header>

      {/* Colonnes */}
      <div
        className="wd-view"
        style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
          gap: 18, padding: 22, alignItems: "start",
        }}
      >
        {COLS.map((col) => {
          const list = today
            .filter((o) => o.status === col.id)
            .sort((a, b) => a.ts - b.ts);
          return (
            <section key={col.id}>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
                  paddingBottom: 12, borderBottom: `2px solid ${col.accent}44`,
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: 99, background: col.accent }} />
                <span style={{ ...label(12), color: W.text }}>{col.title}</span>
                <span style={{ ...display(19), color: col.accent, marginLeft: "auto" }} translate="no">
                  {list.length}
                </span>
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                {list.map((o) => (
                  <Ticket key={o.id} o={o} col={col} onAdvance={advance} onEta={eta} />
                ))}
                {list.length === 0 && (
                  <div
                    style={{
                      ...FONT, fontSize: 13, color: W.textDim, textAlign: "center",
                      padding: "30px 16px", border: `1px dashed ${W.lineSoft}`, borderRadius: 20,
                    }}
                  >
                    Rien ici
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {today.length === 0 && (
        <Empty icon={<Icon name="orders" size={34} />} title="Aucune commande aujourd'hui" sub="Les nouvelles commandes apparaissent ici instantanément, avec alarme." />
      )}

      <div style={{ ...FONT, fontSize: 11.5, color: W.textDim, textAlign: "center", padding: "0 22px 30px" }}>
        Tablette : régler la mise en veille sur « jamais ». Un écran endormi coupe la synchronisation.
      </div>
    </Screen>
  );
}
