import React, { useState, useEffect, useMemo, useRef } from "react";
import QRCode from "qrcode";
import {
  C, FF, fmtEuro, todayISO, timeAgo, nowTime, saveFile, useTick, useWindowWidth, useToast,
  Surface, Btn, Tag, InputField, Modal, PageTitle, KPICard, SectionTitle, playBeep,
} from "../shared/ui.jsx";
import {
  BRAND, TABLES, CATEGORIES, MODE_META, STATUS_META, DELIVERY_ZONES,
  readMenu, writeMenu, readOrders, readCustomers, readActivity, readScans,
  advanceOrder, shiftEta, useOrders, ensureSeed,
} from "./data.js";
import { WDLogo } from "./Client.jsx";

const tablePortalPath = (t) => {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  if (import.meta.env.VITE_HASH_ROUTING === "1")
    return `${base}/#/r/${BRAND.slug}/t/${t}`;
  return `${base}/r/${BRAND.slug}/t/${t}`;
};
export const tablePortalUrl = (t) => `${window.location.origin}${tablePortalPath(t)}`;

/* ==========================================================================
   TABLEAU DE BORD GESTION — WELL DONE
   ========================================================================== */

const TABS = [
  { id: "overview", label: "Vue d'ensemble", emoji: "📊" },
  { id: "orders", label: "Commandes", emoji: "🔴" },
  { id: "kitchen", label: "Cuisine", emoji: "👨‍🍳" },
  { id: "billing", label: "Caisse", emoji: "💶" },
  { id: "menu", label: "Carte", emoji: "🍔" },
  { id: "qr", label: "QR Tables", emoji: "🔳" },
  { id: "crm", label: "CRM", emoji: "👥" },
  { id: "delivery", label: "Livraison", emoji: "🛵" },
  { id: "activity", label: "Activité", emoji: "🕑" },
];

export default function Manager({ onExit }) {
  const toast = useToast();
  const [tab, setTab] = useState("overview");
  const [orders, sync] = useOrders(3000);
  const [menu, setMenu] = useState(readMenu);
  const w = useWindowWidth();
  const narrow = w < 860;

  useEffect(() => { ensureSeed(); sync(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const today = orders.filter((o) => o.day === todayISO());
  const act = (id, to) => { advanceOrder(id, to); sync(); };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: narrow ? "block" : "flex" }}>
      {/* Navigation */}
      <aside
        style={{
          width: narrow ? "auto" : 232, flexShrink: 0, background: C.surface,
          borderRight: narrow ? "none" : `1px solid ${C.border}`,
          borderBottom: narrow ? `1px solid ${C.border}` : "none",
          padding: narrow ? "12px 14px" : "20px 14px",
          position: narrow ? "sticky" : "sticky", top: 0, zIndex: 60,
          maxHeight: narrow ? "none" : "100vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: narrow ? 10 : 22, paddingLeft: 6 }}>
          <WDLogo size={narrow ? 17 : 22} />
          <Btn variant="ghost" size="sm" onClick={onExit}>Quitter</Btn>
        </div>
        <nav style={{ display: "flex", flexDirection: narrow ? "row" : "column", gap: 4, overflowX: narrow ? "auto" : "visible" }}>
          {TABS.map((t) => {
            const on = tab === t.id;
            const badge = t.id === "orders" || t.id === "kitchen"
              ? today.filter((o) => o.status === "PENDING").length
              : 0;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  ...FF, display: "flex", alignItems: "center", gap: 9, whiteSpace: "nowrap",
                  padding: narrow ? "8px 12px" : "10px 12px", borderRadius: 12, border: "none",
                  background: on ? BRAND.green + "16" : "transparent",
                  color: on ? BRAND.green : C.textSecondary,
                  fontSize: 13.5, fontWeight: on ? 800 : 600, cursor: "pointer", textAlign: "left",
                }}
              >
                <span>{t.emoji}</span>
                {(!narrow || on) && <span>{t.label}</span>}
                {badge > 0 && (
                  <span style={{ ...FF, marginLeft: "auto", background: C.accent, color: "#FFF", borderRadius: 999, fontSize: 11, fontWeight: 800, padding: "1px 7px" }} translate="no">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      <main style={{ flex: 1, padding: narrow ? "18px 16px 40px" : "26px 30px 50px", minWidth: 0 }}>
        <div className="wgm-view" key={tab}>
          {tab === "overview" && <OverviewTab orders={today} allOrders={orders} />}
          {tab === "orders" && <OrdersTab orders={today} act={act} sync={sync} />}
          {tab === "kitchen" && <KitchenTab orders={today} act={act} sync={sync} />}
          {tab === "billing" && <BillingTab orders={today} toast={toast} />}
          {tab === "menu" && <MenuTab menu={menu} setMenu={(m) => { setMenu(m); writeMenu(m); }} toast={toast} />}
          {tab === "qr" && <QRTab toast={toast} />}
          {tab === "crm" && <CRMTab />}
          {tab === "delivery" && <DeliveryTab orders={orders} />}
          {tab === "activity" && <ActivityTab />}
        </div>
      </main>
    </div>
  );
}

/* ----------------------- Vue d'ensemble ----------------------- */

function OverviewTab({ orders, allOrders }) {
  useTick(5000);
  const paid = orders.filter((o) => o.status !== "PENDING" || o.paid);
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const count = orders.length;
  const scans = readScans().filter((s) => s.day === todayISO());
  const converted = scans.filter((s) => s.order_id).length;
  const rate = scans.length ? Math.round((converted / scans.length) * 100) : 0;
  const pending = orders.filter((o) => o.status === "PENDING");

  const byMode = ["sur_place", "emporter", "livraison"].map((m) => ({
    m,
    n: orders.filter((o) => o.mode === m).length,
    ca: orders.filter((o) => o.mode === m).reduce((s, o) => s + o.total, 0),
  }));

  const top = useMemo(() => {
    const m = {};
    allOrders.forEach((o) =>
      o.items.forEach((l) => {
        m[l.name] = (m[l.name] || 0) + l.qty;
      })
    );
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [allOrders]);

  return (
    <div>
      <PageTitle>📊 Vue d'ensemble — {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</PageTitle>

      {pending.length > 0 && (
        <Surface style={{ marginBottom: 16, background: C.accent + "12", border: `1px solid ${C.accent}44` }}>
          <div style={{ ...FF, fontSize: 14, fontWeight: 800, color: C.accent }}>
            🔔 {pending.length} commande{pending.length > 1 ? "s" : ""} en attente d'acceptation en cuisine
          </div>
        </Surface>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <KPICard label="CA du jour" value={fmtEuro(revenue)} color={BRAND.green} sub={`${count} commande(s)`} />
        <KPICard label="Panier moyen" value={count ? fmtEuro(revenue / count) : "—"} />
        <KPICard label="Scans QR" value={scans.length} sub={`${converted} converti(s)`} />
        <KPICard label="Taux de conversion" value={`${rate} %`} color={rate >= 50 ? BRAND.green : C.accentOrange} sub="Scan → commande" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
        <Surface>
          <SectionTitle style={{ margin: "0 0 12px" }}>Répartition par mode</SectionTitle>
          {byMode.map((b) => (
            <div key={b.m} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ ...FF, fontSize: 13.5, fontWeight: 700, color: C.text }}>
                {MODE_META[b.m].emoji} {MODE_META[b.m].label}
              </span>
              <span style={{ ...FF, fontSize: 13, color: C.textSecondary }} translate="no">
                {b.n} · <b style={{ color: C.text }}>{fmtEuro(b.ca)}</b>
              </span>
            </div>
          ))}
        </Surface>

        <Surface>
          <SectionTitle style={{ margin: "0 0 12px" }}>Meilleures ventes</SectionTitle>
          {top.length === 0 && <div style={{ ...FF, fontSize: 13, color: C.textTertiary }}>Aucune vente pour l'instant.</div>}
          {top.map(([name, n], i) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < top.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ ...FF, fontSize: 13.5, fontWeight: 700, color: C.text }}>{i + 1}. {name}</span>
              <Tag color={BRAND.gold}><span translate="no">{n} vendu{n > 1 ? "s" : ""}</span></Tag>
            </div>
          ))}
        </Surface>
      </div>
    </div>
  );
}

/* ----------------------- Commandes ----------------------- */

const NEXT = { PENDING: "PREPARING", PREPARING: "READY", READY: "DONE" };
const NEXT_LABEL = { PENDING: "Accepter", PREPARING: "Prête", READY: "Terminer" };

function OrderCard({ o, act, sync, compact }) {
  useTick(1000);
  const left = Math.max(0, Math.round((o.eta_at - Date.now()) / 60000));
  const meta = STATUS_META[o.status];
  return (
    <Surface style={{ padding: 15, borderLeft: `4px solid ${meta.color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <b style={{ ...FF, fontSize: 15.5, fontWeight: 900, color: C.text }} translate="no">{o.ref}</b>
          <Tag color={meta.color}>{meta.emoji} {meta.label}</Tag>
          <Tag color={C.textSecondary}>
            {MODE_META[o.mode].emoji} {MODE_META[o.mode].label}{o.table ? ` · T${o.table}` : ""}
          </Tag>
        </span>
        <span style={{ ...FF, fontSize: 12.5, color: C.textSecondary }} translate="no">{o.at}</span>
      </div>

      <div style={{ marginTop: 10 }}>
        {o.items.map((l) => (
          <div key={l.key} style={{ padding: "5px 0" }}>
            <div style={{ ...FF, fontSize: 14, fontWeight: 700, color: C.text }}>
              <span translate="no">{l.qty}×</span> {l.emoji} {l.name}
            </div>
            {l.opts?.length > 0 && (
              <div style={{ ...FF, fontSize: 12.5, color: C.textSecondary, marginLeft: 20 }}>{l.opts.join(" · ")}</div>
            )}
            {l.note && (
              <div style={{ ...FF, fontSize: 12.5, fontWeight: 800, color: C.accent, marginLeft: 20 }}>✏️ {l.note}</div>
            )}
          </div>
        ))}
      </div>

      {(o.customer?.name || o.customer?.address) && (
        <div style={{ ...FF, fontSize: 12.5, color: C.textSecondary, marginTop: 8, lineHeight: 1.5 }}>
          👤 {o.customer.name}
          {o.customer.phone ? ` · ${o.customer.phone}` : ""}
          {o.customer.address ? <><br />📍 {o.customer.address}, {o.customer.city}</> : ""}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <span style={{ ...FF, fontSize: 16, fontWeight: 900, color: C.text }} translate="no">
          {fmtEuro(o.total)}
          <span style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary }}>
            {" "}· {o.payment_method === "carte" ? "💳 payé" : "💶 espèces"}
          </span>
        </span>
        <span style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
          {o.status !== "DONE" && !compact && (
            <>
              <Btn variant="subtle" size="sm" onClick={() => { shiftEta(o.id, -5); sync(); }}>−5 min</Btn>
              <Tag color={C.accentOrange}><span translate="no">⏱️ {left} min</span></Tag>
              <Btn variant="subtle" size="sm" onClick={() => { shiftEta(o.id, 5); sync(); }}>+5 min</Btn>
            </>
          )}
          {NEXT[o.status] && (
            <Btn
              size="sm"
              onClick={() => act(o.id, NEXT[o.status])}
              style={{ background: o.status === "PENDING" ? C.accent : BRAND.green, color: "#FFF" }}
            >
              {NEXT_LABEL[o.status]}
            </Btn>
          )}
        </span>
      </div>
    </Surface>
  );
}

function OrdersTab({ orders, act, sync }) {
  const live = orders.filter((o) => o.status !== "DONE");
  const done = orders.filter((o) => o.status === "DONE");
  return (
    <div>
      <PageTitle right={<Tag color={BRAND.green}>🔄 Temps réel</Tag>}>🔴 Commandes du jour</PageTitle>
      {live.length === 0 && (
        <Surface style={{ textAlign: "center", padding: 30 }}>
          <div style={{ ...FF, color: C.textSecondary }}>Aucune commande en cours.</div>
        </Surface>
      )}
      <div style={{ display: "grid", gap: 12 }}>
        {live.map((o) => <OrderCard key={o.id} o={o} act={act} sync={sync} />)}
      </div>
      {done.length > 0 && (
        <>
          <SectionTitle>Terminées ({done.length})</SectionTitle>
          <div style={{ display: "grid", gap: 10 }}>
            {done.map((o) => <OrderCard key={o.id} o={o} act={act} sync={sync} compact />)}
          </div>
        </>
      )}
    </div>
  );
}

/* ----------------------- Cuisine (kanban + alarme) ----------------------- */

function KitchenTab({ orders, act, sync }) {
  const pending = orders.filter((o) => o.status === "PENDING");
  const alarmRef = useRef(null);

  /* Alarme volontairement insistante : elle ne s'arrête qu'une fois la
     commande acceptée, sinon un coup de feu la fait passer inaperçue. */
  useEffect(() => {
    if (pending.length > 0 && !alarmRef.current) {
      const ring = () => { playBeep(980, 260, 0.22); setTimeout(() => playBeep(760, 320, 0.22), 280); };
      ring();
      alarmRef.current = setInterval(ring, 3000);
    }
    if (pending.length === 0 && alarmRef.current) {
      clearInterval(alarmRef.current);
      alarmRef.current = null;
    }
    return () => {
      if (alarmRef.current && pending.length === 0) {
        clearInterval(alarmRef.current);
        alarmRef.current = null;
      }
    };
  }, [pending.length]);

  useEffect(() => () => { if (alarmRef.current) clearInterval(alarmRef.current); }, []);

  const cols = [
    { id: "PENDING", label: "Reçues" },
    { id: "PREPARING", label: "En préparation" },
    { id: "READY", label: "Prêtes" },
  ];

  return (
    <div>
      <PageTitle right={pending.length > 0 ? <Tag color={C.accent}>🔔 Alarme active</Tag> : <Tag color={BRAND.green}>✓ À jour</Tag>}>
        👨‍🍳 Cuisine
      </PageTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, alignItems: "start" }}>
        {cols.map((c) => {
          const list = orders.filter((o) => o.status === c.id);
          return (
            <div key={c.id}>
              <div style={{ ...FF, fontSize: 13, fontWeight: 800, color: C.textSecondary, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                <span>{STATUS_META[c.id].emoji} {c.label}</span>
                <span translate="no">{list.length}</span>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {list.map((o) => <OrderCard key={o.id} o={o} act={act} sync={sync} />)}
                {list.length === 0 && (
                  <div style={{ ...FF, fontSize: 12.5, color: C.textTertiary, padding: 16, textAlign: "center", border: `1px dashed ${C.borderStrong}`, borderRadius: 14 }}>
                    Vide
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ ...FF, fontSize: 12, color: C.textTertiary, marginTop: 18 }}>
        Astuce tablette : régler la mise en veille sur « jamais ». Un écran endormi coupe la synchronisation.
      </div>
    </div>
  );
}

/* ----------------------- Caisse ----------------------- */

function BillingTab({ orders, toast }) {
  const rows = orders.filter((o) => o.status !== "PENDING");
  const total = rows.reduce((s, o) => s + o.total, 0);
  const carte = rows.filter((o) => o.payment_method === "carte").reduce((s, o) => s + o.total, 0);
  const especes = total - carte;

  const exportCSV = async () => {
    const csv = [
      ["Réf", "Heure", "Mode", "Table", "Paiement", "Remise EUR", "Total EUR"],
      ...rows.map((o) => [
        o.ref, o.at, MODE_META[o.mode].label, o.table || "", o.payment_method,
        String(o.discount || 0).replace(".", ","), String(o.total).replace(".", ","),
      ]),
      ["", "", "", "", "TOTAL", "", String(Math.round(total * 100) / 100).replace(".", ",")],
    ].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    if (await saveFile(blob, `caisse-well-done-${todayISO()}.csv`)) toast.success("Export CSV téléchargé ✓");
  };

  const rapportZ = () => {
    const w = window.open("", "_blank");
    if (!w) return toast.error("Autorisez les fenêtres pop-up pour imprimer");
    w.document.write(`<!doctype html><html lang="fr" translate="no"><head><meta charset="utf-8">
      <title>Rapport Z — ${todayISO()}</title>
      <style>body{font-family:system-ui,sans-serif;padding:32px;max-width:520px}h1{font-size:20px}
      table{width:100%;border-collapse:collapse;font-size:14px;margin-top:16px}
      td{padding:6px 0;border-bottom:1px solid #eee}td:last-child{text-align:right;font-weight:700}</style></head><body>
      <h1>WELL DONE — Rapport Z</h1><div>${new Date().toLocaleString("fr-FR")}</div>
      <table>
        <tr><td>Commandes</td><td>${rows.length}</td></tr>
        <tr><td>Carte</td><td>${fmtEuro(carte)}</td></tr>
        <tr><td>Espèces</td><td>${fmtEuro(especes)}</td></tr>
        <tr><td><b>Total encaissé</b></td><td><b>${fmtEuro(total)}</b></td></tr>
      </table></body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div>
      <PageTitle
        right={
          <span style={{ display: "flex", gap: 8 }}>
            <Btn variant="subtle" size="sm" onClick={exportCSV}>⬇️ CSV</Btn>
            <Btn variant="subtle" size="sm" onClick={rapportZ}>🧾 Rapport Z</Btn>
          </span>
        }
      >
        💶 Caisse
      </PageTitle>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <KPICard label="Encaissé aujourd'hui" value={fmtEuro(total)} color={BRAND.green} />
        <KPICard label="Carte" value={fmtEuro(carte)} />
        <KPICard label="Espèces" value={fmtEuro(especes)} />
      </div>

      <Surface style={{ padding: "6px 18px" }}>
        {rows.length === 0 && (
          <div style={{ ...FF, padding: 14, color: C.textTertiary, fontSize: 14 }}>Aucun encaissement pour l'instant.</div>
        )}
        {rows.map((o, i) => (
          <div key={o.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none", flexWrap: "wrap" }}>
            <span style={{ ...FF, fontSize: 13.5, fontWeight: 600, color: C.text }}>
              <b translate="no">{o.ref}</b> · {MODE_META[o.mode].label}{o.table ? ` · T${o.table}` : ""}
            </span>
            <span style={{ ...FF, fontSize: 13, color: C.textSecondary }} translate="no">
              {o.at} · {o.payment_method} · <b style={{ color: C.text }}>{fmtEuro(o.total)}</b>
            </span>
          </div>
        ))}
      </Surface>
    </div>
  );
}

/* ----------------------- Carte (CRUD) ----------------------- */

function MenuTab({ menu, setMenu, toast }) {
  const [edit, setEdit] = useState(null);

  const toggle = (id) => {
    setMenu(menu.map((m) => (m.id === id ? { ...m, available: m.available === false } : m)));
  };

  return (
    <div>
      <PageTitle right={<Tag color={BRAND.gold}><span translate="no">{menu.length} articles</span></Tag>}>🍔 La carte</PageTitle>
      {CATEGORIES.map((c) => {
        const items = menu.filter((m) => m.category === c.id);
        if (!items.length) return null;
        return (
          <div key={c.id}>
            <SectionTitle>{c.emoji} {c.label}</SectionTitle>
            <Surface style={{ padding: "6px 16px" }}>
              {items.map((m, i) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : "none", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 20 }}>{m.emoji}</span>
                  <span style={{ flex: 1, minWidth: 160 }}>
                    <span style={{ ...FF, display: "block", fontSize: 14.5, fontWeight: 800, color: m.available === false ? C.textTertiary : C.text }}>
                      {m.name}
                    </span>
                    {m.desc && (
                      <span style={{ ...FF, display: "block", fontSize: 12, color: C.textTertiary, marginTop: 2 }}>
                        {m.desc.length > 70 ? m.desc.slice(0, 70) + "…" : m.desc}
                      </span>
                    )}
                  </span>
                  <b style={{ ...FF, fontSize: 14.5, fontWeight: 900, color: C.text }} translate="no">{fmtEuro(m.price)}</b>
                  <Btn variant="subtle" size="sm" onClick={() => setEdit(m)}>Modifier</Btn>
                  <Btn
                    variant={m.available === false ? "subtle" : "ghost"}
                    size="sm"
                    onClick={() => toggle(m.id)}
                    style={m.available === false ? { color: C.accent } : undefined}
                  >
                    {m.available === false ? "Épuisé" : "En vente"}
                  </Btn>
                </div>
              ))}
            </Surface>
          </div>
        );
      })}

      {edit && (
        <Modal title={`Modifier — ${edit.name}`} onClose={() => setEdit(null)}>
          <div style={{ display: "grid", gap: 12 }}>
            <InputField label="Nom" value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} />
            <InputField label="Description" value={edit.desc || ""} onChange={(v) => setEdit({ ...edit, desc: v })} />
            <InputField label="Prix (€)" type="number" value={edit.price} onChange={(v) => setEdit({ ...edit, price: Number(v) || 0 })} />
          </div>
          <Btn
            full size="lg"
            style={{ marginTop: 16, background: BRAND.green, color: "#FFF" }}
            onClick={() => {
              setMenu(menu.map((m) => (m.id === edit.id ? edit : m)));
              setEdit(null);
              toast.success("Carte mise à jour ✓");
            }}
          >
            Enregistrer
          </Btn>
        </Modal>
      )}
    </div>
  );
}

/* ----------------------- QR Tables ----------------------- */

function QRTab({ toast }) {
  const [dark, setDark] = useState(BRAND.ink);
  const [busy, setBusy] = useState(false);
  const canvases = useRef({});

  useEffect(() => {
    TABLES.forEach((t) => {
      const el = canvases.current[t];
      if (el) QRCode.toCanvas(el, tablePortalUrl(t), { width: 150, margin: 1, color: { dark, light: "#FFFFFF" } }).catch(() => {});
    });
  }, [dark]);

  const downloadOne = async (t) => {
    const dataUrl = await QRCode.toDataURL(tablePortalUrl(t), { width: 900, margin: 2, color: { dark, light: "#FFFFFF" } });
    const blob = await (await fetch(dataUrl)).blob();
    if (await saveFile(blob, `qr-well-done-table-${t}.png`)) toast.success(`QR table ${t} téléchargé ✓`);
  };

  /* Planche imprimable dessinée en Canvas 2D natif, page par page.
     html2canvas dépasse la limite de surface de Safari sur iOS et rend une
     image blanche sans lever d'erreur : on ne l'utilise pas. */
  const downloadSheet = async () => {
    setBusy(true);
    try {
      const PER_PAGE = 12, COLS = 3;
      const W = 2480, H = 3508; // A4 à 300 dpi
      const pages = Math.ceil(TABLES.length / PER_PAGE);
      for (let p = 0; p < pages; p++) {
        const slice = TABLES.slice(p * PER_PAGE, (p + 1) * PER_PAGE);
        const cv = document.createElement("canvas");
        cv.width = W; cv.height = H;
        const x = cv.getContext("2d");
        x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, W, H);

        x.fillStyle = BRAND.gold;
        x.font = "900 96px Figtree, sans-serif";
        x.textAlign = "center";
        x.fillText("WELL", W / 2, 190);
        x.fillStyle = BRAND.ink;
        x.fillText("D🍔NE", W / 2, 292);
        x.fillStyle = "#6E6E73";
        x.font = "700 34px Figtree, sans-serif";
        x.fillText("SCANNEZ · COMMANDEZ · DÉGUSTEZ", W / 2, 366);

        const cellW = (W - 220) / COLS;
        const cellH = 700;
        for (let i = 0; i < slice.length; i++) {
          const t = slice[i];
          const cx = 110 + (i % COLS) * cellW + cellW / 2;
          const cy = 470 + Math.floor(i / COLS) * cellH;
          const qrPng = await QRCode.toDataURL(tablePortalUrl(t), { width: 460, margin: 1, color: { dark, light: "#FFFFFF" } });
          const img = new Image();
          await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = qrPng; });
          x.drawImage(img, cx - 230, cy, 460, 460);
          x.fillStyle = BRAND.ink;
          x.font = "900 58px Figtree, sans-serif";
          x.fillText(`TABLE ${t}`, cx, cy + 550);
          x.strokeStyle = "#D2D2D7";
          x.lineWidth = 3;
          x.setLineDash([14, 14]);
          x.strokeRect(cx - 300, cy - 60, 600, 660);
          x.setLineDash([]);
        }

        const blob = await new Promise((res) => cv.toBlob(res, "image/png"));
        const name = pages > 1
          ? `qr-well-done-planche-${p + 1}sur${pages}.png`
          : "qr-well-done-planche.png";
        const ok = await saveFile(blob, name);
        if (!ok) break; // partage annulé : on n'enchaîne pas les pages
      }
      toast.success("Planche QR prête à imprimer ✓");
    } catch {
      toast.error("Impossible de générer la planche");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageTitle
        right={
          <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label style={{ ...FF, fontSize: 12.5, fontWeight: 700, color: C.textSecondary, display: "inline-flex", gap: 6, alignItems: "center" }}>
              Encre
              <input type="color" value={dark} onChange={(e) => setDark(e.target.value)} style={{ width: 30, height: 26, border: "none", background: "none", cursor: "pointer" }} />
            </label>
            <Btn size="sm" onClick={downloadSheet} disabled={busy} style={{ background: BRAND.green, color: "#FFF" }}>
              {busy ? "Génération…" : "🖨️ Planche imprimable"}
            </Btn>
          </span>
        }
      >
        🔳 QR Tables
      </PageTitle>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(196px,1fr))", gap: 14 }}>
        {TABLES.map((t) => (
          <Surface key={t} style={{ textAlign: "center", padding: 15 }}>
            <div style={{ ...FF, fontSize: 15, fontWeight: 900, color: C.text, marginBottom: 10 }} translate="no">Table {t}</div>
            <canvas ref={(el) => (canvases.current[t] = el)} style={{ width: 150, height: 150, borderRadius: 10 }} />
            <div style={{ display: "flex", gap: 7, marginTop: 12 }}>
              <Btn variant="subtle" size="sm" full onClick={() => downloadOne(t)}>⬇️ PNG</Btn>
              <Btn variant="subtle" size="sm" full onClick={() => window.open(tablePortalPath(t), "_blank")}>Ouvrir</Btn>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

/* ----------------------- CRM ----------------------- */

function CRMTab() {
  const customers = readCustomers().slice().sort((a, b) => b.spent - a.spent);
  const total = customers.reduce((s, c) => s + c.spent, 0);
  return (
    <div>
      <PageTitle>👥 Clients</PageTitle>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <KPICard label="Fiches clients" value={customers.length} />
        <KPICard label="Chiffre d'affaires cumulé" value={fmtEuro(total)} color={BRAND.green} />
        <KPICard label="Panier moyen" value={customers.length ? fmtEuro(total / customers.reduce((s, c) => s + c.orders, 0)) : "—"} />
      </div>
      <Surface style={{ padding: "6px 18px" }}>
        {customers.length === 0 && (
          <div style={{ ...FF, padding: 14, color: C.textTertiary, fontSize: 14 }}>
            Aucun client enregistré. Chaque commande identifiée crée une fiche automatiquement.
          </div>
        )}
        {customers.map((c, i) => (
          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: i < customers.length - 1 ? `1px solid ${C.border}` : "none", flexWrap: "wrap" }}>
            <span>
              <b style={{ ...FF, fontSize: 14, color: C.text }}>{c.name}</b>
              <span style={{ ...FF, fontSize: 12.5, color: C.textSecondary, display: "block", marginTop: 2 }}>
                {[c.phone, c.email, c.city].filter(Boolean).join(" · ") || "—"}
              </span>
            </span>
            <span style={{ ...FF, fontSize: 13, color: C.textSecondary, textAlign: "right" }} translate="no">
              <b style={{ color: C.text, fontSize: 14 }}>{fmtEuro(c.spent)}</b>
              <span style={{ display: "block" }}>{c.orders} commande(s) · {c.last}</span>
            </span>
          </div>
        ))}
      </Surface>
    </div>
  );
}

/* ----------------------- Livraison ----------------------- */

function DeliveryTab({ orders }) {
  const deliveries = orders.filter((o) => o.mode === "livraison");
  return (
    <div>
      <PageTitle>🛵 Livraison</PageTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 14, marginBottom: 20 }}>
        {DELIVERY_ZONES.map((z) => {
          const n = deliveries.filter((o) => o.zone === z.label).length;
          return (
            <Surface key={z.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b style={{ ...FF, fontSize: 15, fontWeight: 900, color: C.text }}>{z.label}</b>
                <Tag color={BRAND.green}><span translate="no">min. {fmtEuro(z.min)}</span></Tag>
              </div>
              <div style={{ ...FF, fontSize: 12.5, color: C.textSecondary, marginTop: 8, lineHeight: 1.5 }}>
                {z.cities.length ? z.cities.join(", ") : "Toute autre commune"}
              </div>
              <div style={{ ...FF, fontSize: 12.5, fontWeight: 700, color: C.textTertiary, marginTop: 8 }} translate="no">
                {n} livraison(s) aujourd'hui
              </div>
            </Surface>
          );
        })}
      </div>

      <SectionTitle>Livraisons du jour</SectionTitle>
      <Surface style={{ padding: "6px 18px" }}>
        {deliveries.length === 0 && (
          <div style={{ ...FF, padding: 14, color: C.textTertiary, fontSize: 14 }}>Aucune livraison aujourd'hui.</div>
        )}
        {deliveries.map((o, i) => (
          <div key={o.id} style={{ padding: "12px 0", borderBottom: i < deliveries.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <b style={{ ...FF, fontSize: 14, color: C.text }} translate="no">{o.ref} · {o.customer?.name}</b>
              <span style={{ ...FF, fontSize: 13.5, fontWeight: 800, color: C.text }} translate="no">{fmtEuro(o.total)}</span>
            </div>
            <div style={{ ...FF, fontSize: 12.5, color: C.textSecondary, marginTop: 3 }}>
              📍 {o.customer?.address}, {o.customer?.city} · {o.zone} · {o.customer?.phone}
            </div>
          </div>
        ))}
      </Surface>
    </div>
  );
}

/* ----------------------- Activité ----------------------- */

function ActivityTab() {
  useTick(5000);
  const items = readActivity();
  return (
    <div>
      <PageTitle>🕑 Journal d'activité</PageTitle>
      <Surface style={{ padding: "6px 18px" }}>
        {items.length === 0 && (
          <div style={{ ...FF, padding: 14, color: C.textTertiary, fontSize: 14 }}>Rien à afficher pour l'instant.</div>
        )}
        {items.map((a, i) => (
          <div key={a.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 0", borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ fontSize: 19 }}>{a.emoji}</span>
            <span style={{ ...FF, flex: 1, fontSize: 13.5, color: C.text }}>{a.text}</span>
            <span style={{ ...FF, fontSize: 12, color: C.textTertiary, flexShrink: 0 }} translate="no">{timeAgo(a.ts)}</span>
          </div>
        ))}
      </Surface>
    </div>
  );
}
