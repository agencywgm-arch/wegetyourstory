import React, { useState, useEffect, useMemo, useRef } from "react";
import QRCode from "qrcode";
import { W, FONT, display, label, glass, goldText } from "./theme.js";
import { Screen, Panel, Btn, Chip, Field, Sheet, Stat, PageHead, SectionLabel, Empty, Segmented, Dish } from "./ui.jsx";
import { Logo } from "./Logo.jsx";
import {
  BRAND, TABLES, CATEGORIES, MODE_META, STATUS_META, DELIVERY_ZONES,
  readMenu, writeMenu, readCustomers, readActivity, readScans,
  advanceOrder, shiftEta, useOrders, ensureSeed,
} from "./data.js";
import { fmtEuro, todayISO, timeAgo, saveFile, useTick, useWindowWidth, useToast } from "../shared/ui.jsx";
import { Icon, MODE_ICON } from "./icons.jsx";

export const tablePortalPath = (t) => {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  if (import.meta.env.VITE_HASH_ROUTING === "1") return `${base}/#/r/${BRAND.slug}/t/${t}`;
  return `${base}/r/${BRAND.slug}/t/${t}`;
};
export const tablePortalUrl = (t) => `${window.location.origin}${tablePortalPath(t)}`;

/* ==========================================================================
   TABLEAU DE BORD — regroupé par métier pour qu'aucune fonction ne se cherche.
   ========================================================================== */

const NAV = [
  {
    group: "Service",
    items: [
      { id: "overview", label: "Vue d'ensemble", icon: "chart" },
      { id: "orders", label: "Commandes", icon: "orders", live: true },
    ],
  },
  {
    group: "Vente",
    items: [
      { id: "billing", label: "Caisse", icon: "cash" },
      { id: "menu", label: "La carte", icon: "menu" },
    ],
  },
  {
    group: "Clients",
    items: [
      { id: "crm", label: "Fichier clients", icon: "users" },
      { id: "delivery", label: "Livraison", icon: "delivery" },
    ],
  },
  {
    group: "Installation",
    items: [
      { id: "qr", label: "QR des tables", icon: "qr" },
      { id: "activity", label: "Journal", icon: "journal" },
    ],
  },
];

export default function Manager({ onExit, onKitchen, onClient }) {
  const toast = useToast();
  const [tab, setTab] = useState("overview");
  const [orders, sync] = useOrders(3000);
  const [menu, setMenu] = useState(readMenu);
  const narrow = useWindowWidth() < 900;

  useEffect(() => { ensureSeed(); sync(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const today = orders.filter((o) => o.day === todayISO());
  const pending = today.filter((o) => o.status === "PENDING").length;
  const act = (id, to) => { advanceOrder(id, to); sync(); };

  const nav = (
    <>
      {NAV.map((g) => (
        <div key={g.group} style={{ marginBottom: narrow ? 0 : 18 }}>
          {!narrow && <div style={{ ...label(9.5), color: W.textDim, padding: "0 12px 8px" }}>{g.group}</div>}
          <div style={{ display: "flex", flexDirection: narrow ? "row" : "column", gap: 3 }}>
            {g.items.map((t) => {
              const on = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    ...FONT, display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap",
                    padding: narrow ? "9px 14px" : "10px 12px", borderRadius: 12, cursor: "pointer",
                    border: `1px solid ${on ? "rgba(198,154,99,.34)" : "transparent"}`,
                    background: on ? "rgba(198,154,99,.13)" : "transparent",
                    color: on ? W.gold : W.textSoft, fontSize: 13.5, fontWeight: on ? 800 : 600,
                    textAlign: "left", width: narrow ? "auto" : "100%",
                  }}
                >
                  <Icon name={t.icon} size={16} stroke={on ? 2 : 1.7} />
                  <span>{t.label}</span>
                  {t.live && pending > 0 && (
                    <span
                      style={{
                        ...FONT, marginLeft: "auto", background: W.danger, color: "#fff", borderRadius: 999,
                        fontSize: 10.5, fontWeight: 900, padding: "1px 7px",
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
      ))}
    </>
  );

  return (
    <Screen>
      <div style={{ display: narrow ? "block" : "flex", minHeight: "100dvh" }}>
        {/* Rail de navigation */}
        <aside
          style={{
            width: narrow ? "auto" : 244, flexShrink: 0,
            borderRight: narrow ? "none" : `1px solid ${W.line}`,
            borderBottom: narrow ? `1px solid ${W.line}` : "none",
            background: "rgba(10,26,13,.6)", backdropFilter: "blur(20px)",
            padding: narrow ? "12px 14px" : "22px 16px",
            position: "sticky", top: "var(--wd-top, 0px)", zIndex: 60,
            maxHeight: narrow ? "none" : "calc(100dvh - var(--wd-top, 0px))", overflowY: "auto",
          }}
          className="wd-scroll"
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: narrow ? 12 : 24, paddingLeft: 4 }}>
            <Logo size={narrow ? 15 : 19} inline={narrow} />
            {narrow && <Btn size="xs" variant="ghost" onClick={onExit}>Accueil</Btn>}
          </div>

          {!narrow && (
            <div style={{ ...label(9.5), color: W.gold, padding: "0 12px 10px" }}>Tableau de bord</div>
          )}

          <div style={{ display: narrow ? "flex" : "block", gap: 8, overflowX: narrow ? "auto" : "visible" }} className="wd-scroll">
            {nav}
          </div>

          {!narrow && (
            <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${W.lineSoft}`, display: "grid", gap: 8 }}>
              <div style={{ ...label(9.5), color: W.textDim, padding: "0 12px 4px" }}>Autres écrans</div>
              <Btn size="sm" variant={pending > 0 ? "gold" : "outline"} onClick={onKitchen} full>
                <Icon name="kitchen" size={16} /> Écran cuisine{pending > 0 ? ` · ${pending}` : ""}
              </Btn>
              <Btn size="sm" variant="outline" onClick={onClient} full><Icon name="phone" size={16} /> Vue client</Btn>
              <Btn size="sm" variant="ghost" onClick={onExit} full>← Accueil</Btn>
            </div>
          )}
        </aside>

        <main style={{ flex: 1, minWidth: 0, padding: narrow ? "20px 16px 44px" : "30px 34px 56px" }}>
          {narrow && (
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              <Btn size="sm" variant={pending > 0 ? "gold" : "outline"} onClick={onKitchen} style={{ flex: 1 }}>
                <Icon name="kitchen" size={15} /> Cuisine{pending > 0 ? ` · ${pending}` : ""}
              </Btn>
              <Btn size="sm" variant="outline" onClick={onClient} style={{ flex: 1 }}><Icon name="phone" size={15} /> Client</Btn>
            </div>
          )}

          <div className="wd-view" key={tab}>
            {tab === "overview" && <Overview orders={today} all={orders} onKitchen={onKitchen} pending={pending} />}
            {tab === "orders" && <Orders orders={today} act={act} sync={sync} />}
            {tab === "billing" && <Billing orders={today} toast={toast} />}
            {tab === "menu" && <MenuAdmin menu={menu} setMenu={(m) => { setMenu(m); writeMenu(m); }} toast={toast} />}
            {tab === "crm" && <CRM />}
            {tab === "delivery" && <Delivery orders={orders} />}
            {tab === "qr" && <QRTables toast={toast} />}
            {tab === "activity" && <Activity />}
          </div>
        </main>
      </div>
    </Screen>
  );
}

/* ----------------------- Vue d'ensemble ----------------------- */

function Overview({ orders, all, onKitchen, pending }) {
  useTick(5000);
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const scans = readScans().filter((s) => s.day === todayISO());
  const converted = scans.filter((s) => s.order_id).length;
  const rate = scans.length ? Math.round((converted / scans.length) * 100) : 0;

  const byMode = ["sur_place", "emporter", "livraison"].map((m) => {
    const l = orders.filter((o) => o.mode === m);
    return { m, n: l.length, ca: l.reduce((s, o) => s + o.total, 0) };
  });
  const maxCa = Math.max(1, ...byMode.map((b) => b.ca));

  const top = useMemo(() => {
    const m = {};
    all.forEach((o) => o.items.forEach((l) => { m[l.name] = (m[l.name] || 0) + l.qty; }));
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [all]);
  const maxTop = Math.max(1, ...top.map((t) => t[1]));

  return (
    <div>
      <PageHead
        title="Vue d'ensemble"
        sub={new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        right={<Chip tone="green">● Temps réel</Chip>}
      />

      {pending > 0 && (
        <Panel
          pad={16}
          style={{ marginBottom: 18, borderColor: "rgba(240,128,60,.45)", background: "rgba(240,128,60,.09)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}
        >
          <span style={{ ...display(17), color: W.orange, display: "inline-flex", alignItems: "center", gap: 9 }}><Icon name="bell" size={19} /> {pending} commande{pending > 1 ? "s" : ""} en attente</span>
          <span style={{ ...FONT, fontSize: 13, color: W.textSoft, flex: 1, minWidth: 180 }}>
            L'alarme sonne en cuisine jusqu'à acceptation.
          </span>
          <Btn size="sm" variant="gold" onClick={onKitchen}>Ouvrir l'écran cuisine</Btn>
        </Panel>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Stat label="CA du jour" value={fmtEuro(revenue)} tone="gold" sub={`${orders.length} commande(s)`} icon={<Icon name="cash" size={14} />} />
        <Stat label="Panier moyen" value={orders.length ? fmtEuro(revenue / orders.length) : "—"} icon={<Icon name="spark" size={14} />} />
        <Stat label="Scans QR" value={scans.length} sub={`${converted} converti(s)`} icon={<Icon name="qr" size={14} />} />
        <Stat label="Conversion" value={`${rate} %`} tone={rate >= 50 ? "green" : "orange"} sub="Scan → commande" icon={<Icon name="target" size={14} />} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14, marginTop: 16 }}>
        <Panel>
          <div style={{ ...label(10.5), color: W.gold, marginBottom: 16 }}>Répartition par mode</div>
          {byMode.map((b) => (
            <div key={b.m} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ ...FONT, fontSize: 13.5, fontWeight: 700, color: W.text, display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name={MODE_ICON[b.m]} size={15} color={W.gold} /> {MODE_META[b.m].label}
                </span>
                <span style={{ ...FONT, fontSize: 13, color: W.textSoft }} translate="no">
                  {b.n} · <b style={{ color: W.gold }}>{fmtEuro(b.ca)}</b>
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                <div style={{ width: `${(b.ca / maxCa) * 100}%`, height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${W.greenLt}, ${W.green})` }} />
              </div>
            </div>
          ))}
        </Panel>

        <Panel>
          <div style={{ ...label(10.5), color: W.gold, marginBottom: 16 }}>Meilleures ventes</div>
          {top.length === 0 && <div style={{ ...FONT, fontSize: 13, color: W.textDim }}>Aucune vente pour l'instant.</div>}
          {top.map(([name, n], i) => (
            <div key={name} style={{ marginBottom: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ ...FONT, fontSize: 13.5, fontWeight: 700, color: W.text }}>
                  <span style={{ color: W.textDim }} translate="no">{i + 1}.</span> {name}
                </span>
                <span style={{ ...FONT, fontSize: 13, fontWeight: 800, color: W.gold }} translate="no">{n}</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                <div style={{ width: `${(n / maxTop) * 100}%`, height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${W.goldLt}, ${W.gold})` }} />
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

/* ----------------------- Commandes ----------------------- */

const NEXT = { PENDING: "PREPARING", PREPARING: "READY", READY: "DONE" };
const NEXT_LABEL = { PENDING: "Accepter", PREPARING: "Marquer prête", READY: "Terminer" };

function OrderRow({ o, act, sync }) {
  useTick(1000);
  const left = Math.max(0, Math.round((o.eta_at - Date.now()) / 60000));
  const meta = STATUS_META[o.status];

  return (
    <Panel pad={0} style={{ overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", borderBottom: `1px solid ${W.lineSoft}`, flexWrap: "wrap" }}>
        <span style={{ ...display(18), color: W.text }} translate="no">{o.ref}</span>
        <Chip tone={o.status === "PENDING" ? "orange" : o.status === "READY" ? "green" : o.status === "DONE" ? "dim" : "info"}>
          <Icon name={meta.icon} size={12} /> {meta.label}
        </Chip>
        <Chip tone="dim">
          <Icon name={MODE_ICON[o.mode]} size={13} /> {o.table ? `Table ${o.table}` : MODE_META[o.mode].label}
        </Chip>
        <span style={{ marginLeft: "auto", ...FONT, fontSize: 12.5, color: W.textDim }} translate="no">{o.at}</span>
      </div>

      <div style={{ padding: "12px 16px" }}>
        {o.items.map((l) => (
          <div key={l.key} style={{ padding: "4px 0" }}>
            <span style={{ ...FONT, fontSize: 14, fontWeight: 700, color: W.text }}>
              <span style={{ color: W.gold }} translate="no">{l.qty}×</span> {l.name}
            </span>
            {l.opts?.length > 0 && (
              <span style={{ ...FONT, display: "block", fontSize: 12.5, color: W.textDim, marginLeft: 22 }}>{l.opts.join(" · ")}</span>
            )}
            {l.note && (
              <span style={{ ...FONT, display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: W.orange, marginLeft: 22, fontWeight: 700 }}><Icon name="edit" size={11} /> {l.note}</span>
            )}
          </div>
        ))}

        {(o.customer?.name || o.customer?.address) && (
          <div style={{ ...FONT, fontSize: 12.5, color: W.textDim, marginTop: 10, lineHeight: 1.5 }}>
            {o.customer.name}
            {o.customer.phone ? ` · ${o.customer.phone}` : ""}
            {o.customer.address ? ` · ${o.customer.address}, ${o.customer.city}` : ""}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderTop: `1px solid ${W.lineSoft}`, background: "rgba(0,0,0,.16)", flexWrap: "wrap" }}>
        <span style={{ ...display(18), ...goldText }} translate="no">{fmtEuro(o.total)}</span>
        <span style={{ ...FONT, fontSize: 12, color: W.textDim }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name={o.payment_method === "carte" ? "card" : "cash"} size={12} /> {o.payment_method === "carte" ? "payé" : "espèces"}</span>
        </span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
          {o.status !== "DONE" && (
            <>
              <Btn size="xs" variant="ghost" onClick={() => { shiftEta(o.id, -5); sync(); }}>−5</Btn>
              <Chip tone={left <= 3 ? "danger" : "dim"}><Icon name="clock" size={11} /> <span translate="no">{left}′</span></Chip>
              <Btn size="xs" variant="ghost" onClick={() => { shiftEta(o.id, 5); sync(); }}>+5</Btn>
            </>
          )}
          {NEXT[o.status] && (
            <Btn size="sm" variant={o.status === "PENDING" ? "gold" : "primary"} onClick={() => act(o.id, NEXT[o.status])}>
              {NEXT_LABEL[o.status]}
            </Btn>
          )}
        </span>
      </div>
    </Panel>
  );
}

function Orders({ orders, act, sync }) {
  const [filter, setFilter] = useState("live");
  const live = orders.filter((o) => o.status !== "DONE");
  const done = orders.filter((o) => o.status === "DONE");
  const list = filter === "live" ? live : filter === "done" ? done : orders;

  return (
    <div>
      <PageHead
        title="Commandes du jour"
        sub={`${live.length} en cours · ${done.length} terminée(s)`}
        right={
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { id: "live", label: `En cours ${live.length}` },
              { id: "done", label: `Terminées ${done.length}` },
              { id: "all", label: "Toutes" },
            ]}
          />
        }
      />
      {list.length === 0 ? (
        <Panel><Empty icon={<Icon name="orders" size={32} />} title="Aucune commande" sub="Les commandes arrivent ici en temps réel." /></Panel>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 14, alignItems: "start" }}>
          {list.map((o) => <OrderRow key={o.id} o={o} act={act} sync={sync} />)}
        </div>
      )}
    </div>
  );
}

/* ----------------------- Caisse ----------------------- */

function Billing({ orders, toast }) {
  const rows = orders.filter((o) => o.status !== "PENDING");
  const total = rows.reduce((s, o) => s + o.total, 0);
  const carte = rows.filter((o) => o.payment_method === "carte").reduce((s, o) => s + o.total, 0);
  const especes = total - carte;

  const exportCSV = async () => {
    const csv = [
      ["Réf", "Heure", "Mode", "Table", "Paiement", "Remise EUR", "Total EUR"],
      ...rows.map((o) => [o.ref, o.at, MODE_META[o.mode].label, o.table || "", o.payment_method, String(o.discount || 0).replace(".", ","), String(o.total).replace(".", ",")]),
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
      <style>body{font-family:system-ui,sans-serif;padding:36px;max-width:520px;color:#0F2413}
      h1{font-size:19px;letter-spacing:.06em}table{width:100%;border-collapse:collapse;font-size:14px;margin-top:18px}
      td{padding:8px 0;border-bottom:1px solid #eee}td:last-child{text-align:right;font-weight:700}</style></head><body>
      <h1>WELL DONE — RAPPORT Z</h1><div style="color:#777;font-size:13px">${new Date().toLocaleString("fr-FR")}</div>
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
      <PageHead
        title="Caisse"
        sub="Encaissements de la journée"
        right={
          <span style={{ display: "flex", gap: 8 }}>
            <Btn size="sm" variant="outline" onClick={exportCSV}><Icon name="download" size={15} /> CSV</Btn>
            <Btn size="sm" variant="outline" onClick={rapportZ}><Icon name="print" size={15} /> Rapport Z</Btn>
          </span>
        }
      />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <Stat label="Encaissé" value={fmtEuro(total)} tone="gold" />
        <Stat label="Carte" value={fmtEuro(carte)} />
        <Stat label="Espèces" value={fmtEuro(especes)} />
      </div>
      <Panel pad={0}>
        {rows.length === 0 ? (
          <Empty icon={<Icon name="cash" size={32} />} title="Aucun encaissement" />
        ) : (
          rows.map((o, i) => (
            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "14px 18px", borderBottom: i < rows.length - 1 ? `1px solid ${W.lineSoft}` : "none", flexWrap: "wrap" }}>
              <span style={{ ...FONT, fontSize: 13.5, color: W.text }}>
                <b translate="no">{o.ref}</b>
                <span style={{ color: W.textDim }}> · {MODE_META[o.mode].label}{o.table ? ` · T${o.table}` : ""}</span>
              </span>
              <span style={{ ...FONT, fontSize: 13, color: W.textDim }} translate="no">
                {o.at} · {o.payment_method} · <b style={{ color: W.gold }}>{fmtEuro(o.total)}</b>
              </span>
            </div>
          ))
        )}
      </Panel>
    </div>
  );
}

/* ----------------------- Carte ----------------------- */

function MenuAdmin({ menu, setMenu, toast }) {
  const [edit, setEdit] = useState(null);
  const [cat, setCat] = useState(CATEGORIES[0].id);
  const items = menu.filter((m) => m.category === cat);

  return (
    <div>
      <PageHead title="La carte" sub={`${menu.length} articles · ${CATEGORIES.length} catégories`} />
      <div className="wd-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 16 }}>
        {CATEGORIES.map((c) => {
          const on = cat === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              style={{
                ...FONT, flexShrink: 0, borderRadius: 999, padding: "9px 15px", fontSize: 13, fontWeight: 800, cursor: "pointer",
                border: `1px solid ${on ? "transparent" : W.lineSoft}`,
                background: on ? `linear-gradient(135deg, ${W.goldLt}, ${W.gold})` : "rgba(255,255,255,.03)",
                color: on ? "#2A1B08" : W.textSoft,
              }}
            >
              <Icon name={c.icon} size={13} /> {c.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 12 }}>
        {items.map((m) => {
          const off = m.available === false;
          return (
            <Panel key={m.id} pad={16} style={{ opacity: off ? 0.55 : 1 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <Dish item={m} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <b style={{ ...display(16), color: W.text }}>{m.name}</b>
                    <b style={{ ...display(16), ...goldText }} translate="no">{fmtEuro(m.price)}</b>
                  </div>
                  {m.desc && (
                    <div style={{ ...FONT, fontSize: 12, color: W.textDim, marginTop: 5, lineHeight: 1.45 }}>
                      {m.desc.length > 78 ? m.desc.slice(0, 78) + "…" : m.desc}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 7, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <Btn size="xs" variant="outline" onClick={() => setEdit(m)}>Modifier</Btn>
                    <Btn
                      size="xs"
                      variant={off ? "danger" : "ghost"}
                      onClick={() => setMenu(menu.map((x) => (x.id === m.id ? { ...x, available: off } : x)))}
                    >
                      {off ? "Épuisé" : "En vente"}
                    </Btn>
                    {m.estimatedPrice && <Chip tone="warn" style={{ fontSize: 10 }}>Prix à valider</Chip>}
                  </div>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      {edit && (
        <Sheet
          title={`Modifier — ${edit.name}`}
          onClose={() => setEdit(null)}
          footer={
            <Btn full size="lg" onClick={() => { setMenu(menu.map((m) => (m.id === edit.id ? edit : m))); setEdit(null); toast.success("Carte mise à jour ✓"); }}>
              Enregistrer
            </Btn>
          }
        >
          <div style={{ display: "grid", gap: 14 }}>
            <Field label="Nom" value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} />
            <Field label="Description" area value={edit.desc || ""} onChange={(v) => setEdit({ ...edit, desc: v })} />
            <Field label="Prix (€)" type="number" value={edit.price} onChange={(v) => setEdit({ ...edit, price: Number(v) || 0 })} />
          </div>
        </Sheet>
      )}
    </div>
  );
}

/* ----------------------- QR ----------------------- */

function QRTables({ toast }) {
  const [busy, setBusy] = useState(false);
  const canvases = useRef({});

  useEffect(() => {
    TABLES.forEach((t) => {
      const el = canvases.current[t];
      if (el) QRCode.toCanvas(el, tablePortalUrl(t), { width: 154, margin: 1, color: { dark: "#0F2413", light: "#F5F2EA" } }).catch(() => {});
    });
  }, []);

  const one = async (t) => {
    const url = await QRCode.toDataURL(tablePortalUrl(t), { width: 900, margin: 2, color: { dark: "#0F2413", light: "#FFFFFF" } });
    const blob = await (await fetch(url)).blob();
    if (await saveFile(blob, `qr-well-done-table-${t}.png`)) toast.success(`QR table ${t} téléchargé ✓`);
  };

  /* Planche dessinée en Canvas 2D natif : html2canvas rend une image blanche
     au-delà d'une certaine surface sur iOS, sans lever d'erreur. */
  const sheet = async () => {
    setBusy(true);
    try {
      const PER = 12, COLS = 3, PW = 2480, PH = 3508;
      const pages = Math.ceil(TABLES.length / PER);
      for (let p = 0; p < pages; p++) {
        const slice = TABLES.slice(p * PER, (p + 1) * PER);
        const cv = document.createElement("canvas");
        cv.width = PW; cv.height = PH;
        const x = cv.getContext("2d");

        x.fillStyle = "#0F2413"; x.fillRect(0, 0, PW, PH);
        x.textAlign = "center";
        x.fillStyle = "#F5F2EA";
        x.font = "400 92px Figtree, sans-serif";
        x.fillText("W E L L", PW / 2, 200);
        x.fillStyle = "#C69A63";
        x.font = "800 104px Figtree, sans-serif";
        x.fillText("D O N E", PW / 2, 310);
        x.fillStyle = "rgba(245,242,234,.55)";
        x.font = "700 32px Figtree, sans-serif";
        x.fillText("S C A N N E Z   ·   C O M M A N D E Z   ·   D É G U S T E Z", PW / 2, 380);

        const cellW = (PW - 200) / COLS, cellH = 690;
        for (let i = 0; i < slice.length; i++) {
          const t = slice[i];
          const cx = 100 + (i % COLS) * cellW + cellW / 2;
          const cy = 480 + Math.floor(i / COLS) * cellH;

          x.fillStyle = "#F5F2EA";
          roundRect(x, cx - 265, cy - 40, 530, 610, 34);
          x.fill();

          const png = await QRCode.toDataURL(tablePortalUrl(t), { width: 420, margin: 1, color: { dark: "#0F2413", light: "#F5F2EA" } });
          const img = new Image();
          await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = png; });
          x.drawImage(img, cx - 210, cy + 10, 420, 420);

          x.fillStyle = "#0F2413";
          x.font = "900 62px Figtree, sans-serif";
          x.fillText(`TABLE ${t}`, cx, cy + 510);
        }

        const blob = await new Promise((res) => cv.toBlob(res, "image/png"));
        const name = pages > 1 ? `qr-well-done-planche-${p + 1}sur${pages}.png` : "qr-well-done-planche.png";
        if (!(await saveFile(blob, name))) break; // partage annulé
      }
      toast.success("Planche prête à imprimer ✓");
    } catch {
      toast.error("Impossible de générer la planche");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHead
        title="QR des tables"
        sub="À coller sur chaque table — chaque code ouvre le portail avec le bon numéro"
        right={<Btn size="sm" variant="gold" onClick={sheet} disabled={busy}><Icon name="print" size={15} /> {busy ? "Génération…" : "Planche A4"}</Btn>}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
        {TABLES.map((t) => (
          <Panel key={t} pad={16} style={{ textAlign: "center" }}>
            <div style={{ ...label(10), color: W.gold, marginBottom: 12 }} translate="no">Table {t}</div>
            <canvas ref={(el) => (canvases.current[t] = el)} style={{ width: 154, height: 154, borderRadius: 12, background: W.cream }} />
            <div style={{ display: "flex", gap: 7, marginTop: 14 }}>
              <Btn size="xs" variant="outline" onClick={() => one(t)} full><Icon name="download" size={13} /> PNG</Btn>
              <Btn size="xs" variant="outline" onClick={() => window.open(tablePortalPath(t), "_blank")} full>Ouvrir</Btn>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ----------------------- CRM ----------------------- */

function CRM() {
  const list = readCustomers().slice().sort((a, b) => b.spent - a.spent);
  const total = list.reduce((s, c) => s + c.spent, 0);
  const orders = list.reduce((s, c) => s + c.orders, 0);

  return (
    <div>
      <PageHead title="Fichier clients" sub="Alimenté automatiquement à chaque commande identifiée" />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <Stat label="Fiches" value={list.length} />
        <Stat label="CA cumulé" value={fmtEuro(total)} tone="gold" />
        <Stat label="Panier moyen" value={orders ? fmtEuro(total / orders) : "—"} />
      </div>
      <Panel pad={0}>
        {list.length === 0 ? (
          <Empty icon={<Icon name="users" size={32} />} title="Aucun client encore" sub="Passez une commande depuis la vue client pour créer une fiche." />
        ) : (
          list.map((c, i) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "14px 18px", borderBottom: i < list.length - 1 ? `1px solid ${W.lineSoft}` : "none", flexWrap: "wrap" }}>
              <span>
                <b style={{ ...FONT, fontSize: 14, color: W.text }}>{c.name}</b>
                <span style={{ ...FONT, fontSize: 12.5, color: W.textDim, display: "block", marginTop: 3 }}>
                  {[c.phone, c.email, c.city].filter(Boolean).join(" · ") || "—"}
                </span>
              </span>
              <span style={{ textAlign: "right" }} translate="no">
                <b style={{ ...display(16), ...goldText }}>{fmtEuro(c.spent)}</b>
                <span style={{ ...FONT, fontSize: 12, color: W.textDim, display: "block", marginTop: 3 }}>
                  {c.orders} commande(s) · {c.last}
                </span>
              </span>
            </div>
          ))
        )}
      </Panel>
    </div>
  );
}

/* ----------------------- Livraison ----------------------- */

function Delivery({ orders }) {
  const list = orders.filter((o) => o.mode === "livraison");
  return (
    <div>
      <PageHead title="Livraison" sub="Zones desservies et minimum de commande" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12, marginBottom: 22 }}>
        {DELIVERY_ZONES.map((z) => {
          const n = list.filter((o) => o.zone === z.label).length;
          return (
            <Panel key={z.id} pad={17}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <b style={{ ...display(17), color: W.text }}>{z.label}</b>
                <Chip tone="gold"><span translate="no">min. {fmtEuro(z.min)}</span></Chip>
              </div>
              <div style={{ ...FONT, fontSize: 12.5, color: W.textSoft, marginTop: 10, lineHeight: 1.55 }}>
                {z.cities.length ? z.cities.join(", ") : "Toute autre commune"}
              </div>
              <div style={{ ...FONT, fontSize: 12, color: W.textDim, marginTop: 10 }} translate="no">
                {n} livraison(s) aujourd'hui
              </div>
            </Panel>
          );
        })}
      </div>

      <SectionLabel>Livraisons du jour</SectionLabel>
      <Panel pad={0}>
        {list.length === 0 ? (
          <Empty icon={<Icon name="delivery" size={32} />} title="Aucune livraison aujourd'hui" />
        ) : (
          list.map((o, i) => (
            <div key={o.id} style={{ padding: "14px 18px", borderBottom: i < list.length - 1 ? `1px solid ${W.lineSoft}` : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <b style={{ ...FONT, fontSize: 14, color: W.text }} translate="no">{o.ref} · {o.customer?.name}</b>
                <b style={{ ...FONT, fontSize: 14, color: W.gold }} translate="no">{fmtEuro(o.total)}</b>
              </div>
              <div style={{ ...FONT, fontSize: 12.5, color: W.textDim, marginTop: 4 }}>
                {o.customer?.address}, {o.customer?.city} · {o.zone} · {o.customer?.phone}
              </div>
            </div>
          ))
        )}
      </Panel>
    </div>
  );
}

/* ----------------------- Journal ----------------------- */

function Activity() {
  useTick(5000);
  const items = readActivity();
  return (
    <div>
      <PageHead title="Journal d'activité" sub="Chaque évènement du service, horodaté" />
      <Panel pad={0}>
        {items.length === 0 ? (
          <Empty icon={<Icon name="journal" size={32} />} title="Rien à afficher" />
        ) : (
          items.map((a, i) => (
            <div key={a.id} style={{ display: "flex", gap: 13, alignItems: "center", padding: "13px 18px", borderBottom: i < items.length - 1 ? `1px solid ${W.lineSoft}` : "none" }}>
              <Icon name={a.icon} size={16} color={W.gold} />
              <span style={{ ...FONT, flex: 1, fontSize: 13.5, color: W.text }}>{a.text}</span>
              <span style={{ ...FONT, fontSize: 12, color: W.textDim, flexShrink: 0 }} translate="no">{timeAgo(a.ts)}</span>
            </div>
          ))
        )}
      </Panel>
    </div>
  );
}
