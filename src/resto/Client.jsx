import React, { useState, useEffect, useMemo, useRef } from "react";
import { W, FONT, display, label, glass, goldText } from "./theme.js";
import { Screen, Panel, Btn, Chip, Field, Select, Sheet, Stepper, SectionLabel, Empty, Dish } from "./ui.jsx";
import { Logo, Tagline, BurgerGlyph } from "./Logo.jsx";
import {
  BRAND, CATEGORIES, MODE_META, STATUS_META, DELIVERY_ZONES,
  zoneForCity, applyPromo, readMenu, placeOrder, readCart, writeCart,
  linkScanToOrder, useOrders,
} from "./data.js";
import { fmtEuro, uid, useTick, useToast, playBeep, readLS, writeLS } from "../shared/ui.jsx";
import { Icon, MODE_ICON } from "./icons.jsx";

const KEY_TRACK = "wgm_resto_track";

/* ==========================================================================
   PORTAIL CLIENT — /r/well-done/t/{table}
   ========================================================================== */

/* ----------------------- Options composables ----------------------- */

const visibleGroups = (item, sel) =>
  (item.options || []).filter((g) => !g.dependsOn || sel[g.dependsOn.key] === g.dependsOn.value);

const valOf = (g, sel) => (g.type === "single" ? sel[g.key] ?? g.choices[0].id : sel[g.key] || []);

function optionsPrice(item, sel) {
  return visibleGroups(item, sel).reduce((sum, g) => {
    if (g.type === "single") {
      const c = g.choices.find((x) => x.id === valOf(g, sel));
      return sum + (c?.price || 0);
    }
    return sum + valOf(g, sel).reduce((s, id) => s + (g.choices.find((x) => x.id === id)?.price || 0), 0);
  }, 0);
}

function optionLabels(item, sel) {
  const out = [];
  visibleGroups(item, sel).forEach((g) => {
    if (g.type === "single") {
      const c = g.choices.find((x) => x.id === valOf(g, sel));
      // « Seul » est la valeur par défaut : inutile de l'imprimer en cuisine.
      if (c && c.id !== "seul") out.push(c.label);
    } else {
      valOf(g, sel).forEach((id) => {
        const c = g.choices.find((x) => x.id === id);
        if (c) out.push(c.price ? `${c.label} (+${fmtEuro(c.price)})` : c.label);
      });
    }
  });
  return out;
}

/* ----------------------- En-tête ----------------------- */

function Bar({ onBack, mode, table, right }) {
  return (
    <header
      style={{
        position: "sticky", top: "var(--wd-top, 0px)", zIndex: 60, padding: "12px 16px",
        background: "rgba(10,26,13,.8)", backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${W.line}`, display: "flex", alignItems: "center", gap: 12,
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Retour"
          style={{
            ...FONT, border: `1px solid ${W.lineSoft}`, background: "rgba(0,0,0,.3)", borderRadius: 999,
            width: 36, height: 36, fontSize: 16, cursor: "pointer", color: W.text, flexShrink: 0,
          }}
        >
          ←
        </button>
      )}
      <Logo size={15} inline />
      <span style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
        {right}
        {mode && (
          <Chip tone="gold">
            <Icon name={MODE_ICON[mode]} size={13} /> {MODE_META[mode].label}
            {mode === "sur_place" && table ? ` · T${table}` : ""}
          </Chip>
        )}
      </span>
    </header>
  );
}

/* ----------------------- 1. Mode de commande ----------------------- */

function ModeChoice({ table, onPick }) {
  const modes = [
    { id: "sur_place", title: "Sur place", sub: table ? `Service à la table ${table}` : "Scannez le QR d'une table", icon: "dinein", off: !table },
    { id: "emporter", title: "À emporter", sub: "Prêt en ~15 min au comptoir", icon: "takeaway" },
    { id: "livraison", title: "Livraison", sub: "Minimum de commande selon la zone", icon: "delivery" },
  ];

  return (
    <Screen>
      <div className="wd-view" style={{ maxWidth: 540, margin: "0 auto", padding: "40px 20px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Logo size={40} />
            <div style={{ marginTop: 14 }}><Tagline size={9.5} /></div>
          </div>
          {table && (
            <div style={{ ...glass(2), padding: "12px 16px", borderRadius: 18, textAlign: "center" }}>
              <div style={{ ...label(9), color: W.textDim }}>Table</div>
              <div style={{ ...display(26), ...goldText, marginTop: 4 }} translate="no">{table}</div>
            </div>
          )}
        </div>

        <h1 style={{ ...display(34), color: W.text, marginTop: 44 }}>
          Bienvenue.<br />
          <span style={goldText}>Commandez en 30 secondes.</span>
        </h1>
        <p style={{ ...FONT, fontSize: 15, color: W.textSoft, marginTop: 14, lineHeight: 1.6 }}>
          Composez votre burger, payez depuis votre téléphone et suivez la préparation
          en direct. Aucune application à installer.
        </p>

        <div style={{ display: "grid", gap: 12, marginTop: 30 }}>
          {modes.map((m) => (
            <Panel
              key={m.id}
              hover={!m.off}
              pad={18}
              onClick={m.off ? undefined : () => onPick(m.id)}
              style={{ display: "flex", alignItems: "center", gap: 16, opacity: m.off ? 0.4 : 1 }}
            >
              <span
                style={{
                  width: 46, height: 46, borderRadius: 14, flexShrink: 0, color: W.gold,
                  background: "rgba(198,154,99,.11)", border: `1px solid ${W.line}`,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Icon name={m.icon} size={22} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ ...display(19), color: W.text, display: "block" }}>{m.title}</span>
                <span style={{ ...FONT, fontSize: 13, color: W.textSoft, display: "block", marginTop: 4 }}>{m.sub}</span>
              </span>
              {!m.off && <span style={{ ...display(20), color: W.gold }}>→</span>}
            </Panel>
          ))}
        </div>

        <Panel pad={18} style={{ marginTop: 22 }}>
          <div style={{ ...label(10.5), color: W.gold, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Icon name="delivery" size={15} /> Livraison — minimum par zone</div>
          {DELIVERY_ZONES.map((z, i) => (
            <div
              key={z.id}
              style={{
                display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0",
                borderBottom: i < DELIVERY_ZONES.length - 1 ? `1px solid ${W.lineSoft}` : "none",
              }}
            >
              <span style={{ ...FONT, fontSize: 12.5, color: W.textSoft, lineHeight: 1.45, flex: 1 }}>
                <b style={{ color: W.text }}>{z.label}</b>
                {z.cities.length ? ` — ${z.cities.join(", ")}` : " — toute autre commune"}
              </span>
              <b style={{ ...FONT, fontSize: 13, color: W.gold, whiteSpace: "nowrap" }} translate="no">
                {fmtEuro(z.min)}
              </b>
            </div>
          ))}
        </Panel>
      </div>
    </Screen>
  );
}

/* ----------------------- 2. La carte ----------------------- */

function MenuView({ menu, mode, table, cart, openItem, goCart, back }) {
  const [cat, setCat] = useState(CATEGORIES[0].id);
  const refs = useRef({});
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const total = cart.reduce((s, l) => s + l.total, 0);

  // La catégorie active suit le défilement.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setCat(vis[0].target.dataset.cat);
      },
      { rootMargin: "-140px 0px -70% 0px" }
    );
    Object.values(refs.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [menu]);

  return (
    <Screen>
      <Bar onBack={back} mode={mode} table={table} />

      <nav
        className="wd-scroll"
        style={{
          position: "sticky", top: "calc(var(--wd-top, 0px) + 61px)", zIndex: 55, display: "flex", gap: 8, overflowX: "auto",
          padding: "12px 16px", background: "rgba(10,26,13,.86)", backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${W.line}`,
        }}
      >
        {CATEGORIES.map((c) => {
          const on = cat === c.id;
          return (
            <button
              key={c.id}
              onClick={() => refs.current[c.id]?.scrollIntoView({ behavior: "smooth", block: "start" })}
              style={{
                ...FONT, flexShrink: 0, borderRadius: 999, padding: "9px 15px", fontSize: 13, fontWeight: 800,
                cursor: "pointer", whiteSpace: "nowrap",
                border: `1px solid ${on ? "transparent" : W.lineSoft}`,
                background: on ? `linear-gradient(135deg, ${W.goldLt}, ${W.gold})` : "rgba(255,255,255,.03)",
                color: on ? "#2A1B08" : W.textSoft,
              }}
            >
              {c.emoji} {c.label}
            </button>
          );
        })}
      </nav>

      <div className="wd-view" style={{ maxWidth: 620, margin: "0 auto", padding: `8px 16px ${count ? 110 : 40}px` }}>
        {CATEGORIES.map((c) => {
          const items = menu.filter((m) => m.category === c.id && m.available !== false);
          if (!items.length) return null;
          return (
            <section
              key={c.id}
              data-cat={c.id}
              ref={(el) => (refs.current[c.id] = el)}
              style={{ scrollMarginTop: "calc(var(--wd-top, 0px) + 124px)", paddingTop: 26 }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                <h2 style={{ ...display(23), color: W.text, margin: 0 }}>{c.emoji} {c.label}</h2>
              </div>
              {c.note && (
                <div style={{ ...FONT, fontSize: 12.5, fontWeight: 800, color: W.gold, marginBottom: 14 }} translate="no">
                  {c.note}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginTop: c.note ? 0 : 14 }}>
                {items.map((m) => (
                  <div
                    key={m.id}
                    className="wd-hover"
                    onClick={() => openItem(m)}
                    style={{ ...glass(1), padding: 0, overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column" }}
                  >
                    <div style={{ position: "relative", aspectRatio: "1 / 0.86", background: "rgba(198,154,99,.11)", flexShrink: 0 }}>
                      {m.image ? (
                        <img src={m.image} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42 }}>
                          {m.emoji}
                        </div>
                      )}
                      {m.badge && (
                        <span
                          style={{
                            ...FONT, position: "absolute", top: 8, left: 8, fontSize: 10, fontWeight: 800,
                            padding: "3px 9px", borderRadius: 999, background: "rgba(10,26,13,.78)",
                            color: W.orange, border: `1px solid ${W.orange}55`, backdropFilter: "blur(6px)",
                          }}
                        >
                          {m.badge}
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); openItem(m); }}
                        aria-label={`Ajouter ${m.name}`}
                        style={{
                          ...FONT, position: "absolute", right: 9, bottom: -15, width: 32, height: 32, borderRadius: 999,
                          background: `linear-gradient(135deg, ${W.goldLt}, ${W.gold})`, color: "#2A1B08",
                          border: `2.5px solid ${W.surfaceUp}`, display: "inline-flex", alignItems: "center",
                          justifyContent: "center", fontSize: 17, fontWeight: 900, cursor: "pointer", lineHeight: 1,
                          boxShadow: "0 6px 16px rgba(0,0,0,.4)",
                        }}
                      >
                        +
                      </button>
                    </div>
                    <div style={{ padding: "13px 12px 14px", flex: 1 }}>
                      <div style={{ ...display(14.5), color: W.text, lineHeight: 1.28 }}>{m.name}</div>
                      {m.desc && (
                        <div
                          style={{
                            ...FONT, fontSize: 11.5, color: W.textDim, marginTop: 4, lineHeight: 1.42,
                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                          }}
                        >
                          {m.desc}
                        </div>
                      )}
                      <div style={{ ...display(15.5), ...goldText, marginTop: 9 }} translate="no">{fmtEuro(m.price)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <div style={{ ...FONT, fontSize: 12, color: W.textDim, textAlign: "center", marginTop: 34, lineHeight: 1.7 }}>
          Sauces incluses : ketchup, moutarde, mayonnaise, barbecue.
          <br />👻 {BRAND.snapchat} · 📸 {BRAND.instagram}
        </div>
      </div>

      {count > 0 && (
        <div
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 70,
            padding: "14px 16px calc(14px + env(safe-area-inset-bottom))",
            background: "rgba(10,26,13,.9)", backdropFilter: "blur(20px)", borderTop: `1px solid ${W.line}`,
          }}
        >
          <div style={{ maxWidth: 620, margin: "0 auto" }}>
            <Btn full size="lg" onClick={goCart}>
              <span style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}><Icon name="cart" size={17} /> Panier · {count} article{count > 1 ? "s" : ""}</span>
                <span translate="no">{fmtEuro(total)}</span>
              </span>
            </Btn>
          </div>
        </div>
      )}
    </Screen>
  );
}

/* ----------------------- 3. Composition ----------------------- */

function Composer({ item, onClose, onAdd }) {
  const [sel, setSel] = useState({});
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const groups = visibleGroups(item, sel);
  const unit = item.price + optionsPrice(item, sel);

  const toggle = (g, id) =>
    setSel((s) => {
      const cur = s[g.key] || [];
      if (cur.includes(id)) return { ...s, [g.key]: cur.filter((x) => x !== id) };
      if (g.max && cur.length >= g.max) return s;
      return { ...s, [g.key]: [...cur, id] };
    });

  return (
    <Sheet
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Dish item={item} size={36} radius={11} fontSize={18} />
          {item.name}
        </span>
      }
      sub={item.desc}
      onClose={onClose}
      footer={
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Stepper value={qty} onChange={setQty} />
          <Btn
            size="lg"
            style={{ flex: 1 }}
            onClick={() =>
              onAdd({
                key: uid(), item_id: item.id, name: item.name, emoji: item.emoji, image: item.image, qty, unit,
                total: Math.round(unit * qty * 100) / 100,
                opts: optionLabels(item, sel), note: note.trim(),
              })
            }
          >
            Ajouter · <span translate="no">{fmtEuro(unit * qty)}</span>
          </Btn>
        </div>
      }
    >
      {groups.map((g) => (
        <div key={g.key} style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
            <span style={{ ...label(10.5), color: W.gold }}>{g.label}</span>
            {g.hint && <span style={{ ...FONT, fontSize: 11.5, color: W.textDim }} translate="no">{g.hint}</span>}
            {g.max && (
              <span style={{ ...FONT, fontSize: 11.5, color: W.textDim, marginLeft: "auto" }} translate="no">
                {(sel[g.key] || []).length}/{g.max}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {g.choices.map((c) => {
              const on = g.type === "single" ? valOf(g, sel) === c.id : (sel[g.key] || []).includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => (g.type === "single" ? setSel((s) => ({ ...s, [g.key]: c.id })) : toggle(g, c.id))}
                  style={{
                    ...FONT, borderRadius: 13, padding: "10px 14px", fontSize: 13.5, fontWeight: 700, cursor: "pointer",
                    border: `1px solid ${on ? W.green : W.lineSoft}`,
                    background: on ? "rgba(76,164,53,.16)" : "rgba(255,255,255,.03)",
                    color: on ? W.greenLt : W.textSoft,
                    display: "inline-flex", alignItems: "center", gap: 7,
                  }}
                >
                  {on && <span style={{ fontSize: 11 }}>✓</span>}
                  {c.label}
                  {c.price > 0 && (
                    <span style={{ color: on ? W.greenLt : W.gold, fontWeight: 800 }} translate="no">
                      +{fmtEuro(c.price)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <Field label="Remarque pour la cuisine" value={note} onChange={setNote} placeholder="Sans oignon, bien cuit…" />
    </Sheet>
  );
}

/* ----------------------- 4. Panier ----------------------- */

function CartView({ cart, setCart, mode, table, back, goCheckout }) {
  const subtotal = cart.reduce((s, l) => s + l.total, 0);
  const setQty = (key, qty) =>
    setCart(cart.map((l) => (l.key === key ? { ...l, qty, total: Math.round(l.unit * qty * 100) / 100 } : l)).filter((l) => l.qty > 0));

  return (
    <Screen>
      <Bar onBack={back} mode={mode} table={table} />
      <div className="wd-view" style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px 44px" }}>
        <h1 style={{ ...display(28), color: W.text, marginBottom: 20 }}>Votre panier</h1>

        {cart.length === 0 ? (
          <Panel>
            <Empty icon={<Icon name="cart" size={32} />} title="Panier vide" sub="Ajoutez un burger pour commencer." />
            <Btn full onClick={back}>Voir la carte</Btn>
          </Panel>
        ) : (
          <>
            <div style={{ display: "grid", gap: 10 }}>
              {cart.map((l) => (
                <Panel key={l.key} pad={16}>
                  <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                    <Dish item={l} size={40} radius={12} fontSize={20} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ ...display(17), color: W.text }}>{l.name}</div>
                      {l.opts.length > 0 && (
                        <div style={{ ...FONT, fontSize: 12.5, color: W.textSoft, marginTop: 4, lineHeight: 1.5 }}>{l.opts.join(" · ")}</div>
                      )}
                      {l.note && <div style={{ ...FONT, fontSize: 12.5, color: W.orange, marginTop: 4, fontWeight: 700 }}>✏️ {l.note}</div>}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, gap: 10 }}>
                        <Stepper value={l.qty} onChange={(q) => setQty(l.key, q)} min={0} />
                        <b style={{ ...display(17), ...goldText }} translate="no">{fmtEuro(l.total)}</b>
                      </div>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>

            <Panel pad={18} style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ ...label(11), color: W.textDim }}>Sous-total</span>
              <span style={{ ...display(26), color: W.text }} translate="no">{fmtEuro(subtotal)}</span>
            </Panel>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Btn variant="outline" onClick={back} style={{ flex: 1 }}>Ajouter</Btn>
              <Btn size="lg" onClick={goCheckout} style={{ flex: 2 }}>Commander →</Btn>
            </div>
          </>
        )}
      </div>
    </Screen>
  );
}

/* ----------------------- 5. Paiement ----------------------- */

function Line({ k, v, tone, big }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0" }}>
      <span style={{ ...FONT, fontSize: big ? 15 : 13.5, fontWeight: big ? 800 : 600, color: tone || W.textSoft }}>{k}</span>
      <span style={{ ...(big ? display(24) : FONT), fontSize: big ? 24 : 14, fontWeight: big ? 900 : 700, color: tone || W.text }} translate="no">{v}</span>
    </div>
  );
}

function CheckoutView({ cart, mode, table, back, onDone, toast }) {
  const [f, setF] = useState({ name: "", phone: "", email: "", address: "", city: DELIVERY_ZONES[0].cities[0] });
  const [code, setCode] = useState("");
  const [promo, setPromo] = useState(null);
  const [pay, setPay] = useState("carte");
  const [busy, setBusy] = useState(false);

  const subtotal = cart.reduce((s, l) => s + l.total, 0);
  const discount = promo?.discount || 0;
  const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);
  const zone = mode === "livraison" ? zoneForCity(f.city) : null;
  const below = zone ? subtotal < zone.min : false;

  const tryPromo = () => {
    const r = applyPromo(code, subtotal);
    if (!r.ok) { setPromo(null); return toast.error(r.reason); }
    setPromo(r);
    toast.success(`${r.promo.label} appliqué`);
  };

  const submit = () => {
    if (!f.name.trim()) return toast.error("Votre nom est nécessaire pour l'appel en cuisine");
    if (mode === "livraison" && !f.address.trim()) return toast.error("Adresse de livraison manquante");
    if (mode === "livraison" && !f.phone.trim()) return toast.error("Téléphone nécessaire pour la livraison");
    if (below) return toast.error(`Minimum ${fmtEuro(zone.min)} en ${zone.label}`);
    setBusy(true);
    // Paiement simulé : la démo ne contacte aucun service externe.
    setTimeout(() => {
      const order = placeOrder({
        mode, table: mode === "sur_place" ? table : null, items: cart,
        subtotal, discount, promo_code: promo?.promo.code || null, total,
        payment_method: pay, paid: pay === "carte", zone: zone?.label || null,
        customer: {
          name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim(),
          address: f.address.trim(), city: mode === "livraison" ? f.city : "",
        },
      });
      setBusy(false);
      onDone(order);
    }, 900);
  };

  return (
    <Screen>
      <Bar onBack={back} mode={mode} table={table} />
      <div className="wd-view" style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px 44px" }}>
        <h1 style={{ ...display(28), color: W.text, marginBottom: 20 }}>Finaliser</h1>

        <Panel>
          <div style={{ display: "grid", gap: 14 }}>
            <Field label="Nom" value={f.name} onChange={(v) => setF({ ...f, name: v })} placeholder="Prénom ou nom" required />
            <Field label="Téléphone" type="tel" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} placeholder="06 12 34 56 78" required={mode === "livraison"} />
            <Field label="Email (reçu numérique)" type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} placeholder="vous@email.com" />
            {mode === "livraison" && (
              <>
                <Field label="Adresse" value={f.address} onChange={(v) => setF({ ...f, address: v })} placeholder="12 rue des Lilas" required />
                <Select label="Commune" value={f.city} onChange={(v) => setF({ ...f, city: v })}>
                  {DELIVERY_ZONES.map((z) =>
                    z.cities.length ? (
                      <optgroup key={z.id} label={`${z.label} — min. ${z.min} €`}>
                        {z.cities.map((c) => <option key={c} value={c}>{c}</option>)}
                      </optgroup>
                    ) : (
                      <option key={z.id} value="Hors zone">Autre commune (hors zone — min. 50 €)</option>
                    )
                  )}
                </Select>
              </>
            )}
          </div>
        </Panel>

        {zone && (
          <Panel
            pad={15}
            style={{
              marginTop: 12,
              borderColor: below ? "rgba(255,77,77,.45)" : "rgba(76,164,53,.4)",
              background: below ? "rgba(255,77,77,.08)" : "rgba(76,164,53,.08)",
            }}
          >
            <div style={{ ...FONT, fontSize: 13, fontWeight: 800, color: below ? W.danger : W.greenLt }} translate="no">
              {below
                ? `${zone.label} — il manque ${fmtEuro(zone.min - subtotal)} pour atteindre le minimum de ${fmtEuro(zone.min)}`
                : `${zone.label} — minimum de ${fmtEuro(zone.min)} atteint ✓`}
            </div>
          </Panel>
        )}

        <SectionLabel>Code promo</SectionLabel>
        <div style={{ display: "flex", gap: 8 }}>
          <Field value={code} onChange={setCode} placeholder="WELLDONE10" style={{ flex: 1 }} />
          <Btn variant="outline" onClick={tryPromo}>Appliquer</Btn>
        </div>

        <SectionLabel>Paiement</SectionLabel>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { id: "carte", t: "Carte", s: "Apple Pay / Google Pay", e: "💳" },
            { id: "especes", t: "Espèces", s: mode === "livraison" ? "À la livraison" : "Au comptoir", e: "💶" },
          ].map((p) => (
            <Panel
              key={p.id}
              pad={15}
              onClick={() => setPay(p.id)}
              style={{
                flex: 1, textAlign: "center",
                borderColor: pay === p.id ? W.green : W.line,
                background: pay === p.id ? "rgba(76,164,53,.11)" : undefined,
              }}
            >
              <div style={{ fontSize: 19 }}>{p.e}</div>
              <div style={{ ...display(15), color: W.text, marginTop: 7 }}>{p.t}</div>
              <div style={{ ...FONT, fontSize: 11, color: W.textDim, marginTop: 3 }}>{p.s}</div>
            </Panel>
          ))}
        </div>

        <Panel style={{ marginTop: 18 }}>
          <Line k="Sous-total" v={fmtEuro(subtotal)} />
          {discount > 0 && <Line k={`Promo ${promo.promo.code}`} v={`− ${fmtEuro(discount)}`} tone={W.greenLt} />}
          <div style={{ borderTop: `1px solid ${W.lineSoft}`, marginTop: 12, paddingTop: 12 }}>
            <Line k="Total" v={fmtEuro(total)} big />
          </div>
        </Panel>

        <Btn full size="lg" disabled={busy || cart.length === 0} onClick={submit} style={{ marginTop: 18 }}>
          {busy ? "Paiement en cours…" : `Payer ${fmtEuro(total)}`}
        </Btn>
        <div style={{ ...FONT, fontSize: 11.5, color: W.textDim, textAlign: "center", marginTop: 12 }}>
          Démonstration — aucun paiement réel n'est effectué.
        </div>
      </div>
    </Screen>
  );
}

/* ----------------------- 6. Suivi ----------------------- */

const STEPS = ["PENDING", "PREPARING", "READY", "DONE"];

function TrackView({ orderId, onNew }) {
  const [orders] = useOrders(2000);
  useTick(1000);
  const order = orders.find((o) => o.id === orderId);
  const rang = useRef(false);

  useEffect(() => {
    if (order?.status === "READY" && !rang.current) {
      rang.current = true;
      playBeep(920, 380);
      setTimeout(() => playBeep(1240, 460), 420);
      navigator.vibrate?.([200, 90, 200, 90, 320]);
    }
  }, [order?.status]);

  if (!order) {
    return (
      <Screen>
        <Bar />
        <Empty icon={<Icon name="orders" size={32} />} title="Commande introuvable" />
        <div style={{ textAlign: "center" }}><Btn onClick={onNew}>Nouvelle commande</Btn></div>
      </Screen>
    );
  }

  const idx = STEPS.indexOf(order.status);
  const left = Math.max(0, Math.round((order.eta_at - Date.now()) / 60000));
  const ready = order.status === "READY" || order.status === "DONE";

  return (
    <Screen>
      <Bar mode={order.mode} table={order.table} />
      <div className="wd-view" style={{ maxWidth: 560, margin: "0 auto", padding: "26px 16px 44px" }}>
        {/* État principal */}
        <Panel
          elev={2}
          pad={30}
          style={{
            textAlign: "center",
            borderColor: ready ? "rgba(76,164,53,.55)" : W.line,
            background: ready
              ? `linear-gradient(160deg, rgba(76,164,53,.24), rgba(15,36,19,.9))`
              : undefined,
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <BurgerGlyph size={52} color={ready ? W.greenLt : W.gold} stroke={5} />
          </div>
          <div style={{ ...display(30), color: W.text }}>
            {order.status === "READY"
              ? order.mode === "livraison" ? "En route !" : "C'est prêt !"
              : STATUS_META[order.status].label}
          </div>
          <div style={{ ...FONT, fontSize: 14, color: W.textSoft, marginTop: 10 }}>
            Commande <b style={{ color: W.gold }} translate="no">{order.ref}</b>
            {order.table ? ` · table ${order.table}` : ""}
          </div>
          {!ready && (
            <div style={{ ...display(19), color: W.gold, marginTop: 18, display: "inline-flex", alignItems: "center", gap: 9 }} translate="no">
              <Icon name="clock" size={19} /> Prêt dans ~{left} min
            </div>
          )}
        </Panel>

        {/* Progression */}
        <Panel style={{ marginTop: 14 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
            {STEPS.map((s, i) => (
              <div
                key={s}
                style={{
                  flex: 1, height: 5, borderRadius: 99,
                  background: i <= idx ? `linear-gradient(90deg, ${W.greenLt}, ${W.green})` : "rgba(255,255,255,.08)",
                }}
              />
            ))}
          </div>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 13, padding: "8px 0" }}>
              <span
                style={{
                  width: 26, height: 26, borderRadius: 99, flexShrink: 0, fontSize: 11,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: i <= idx ? W.green : "rgba(255,255,255,.06)",
                  color: i <= idx ? "#08210C" : W.textDim, fontWeight: 900,
                }}
              >
                {i <= idx ? "✓" : i + 1}
              </span>
              <span style={{ ...FONT, fontSize: 14, fontWeight: i === idx ? 800 : 600, color: i <= idx ? W.text : W.textDim }}>
                {STATUS_META[s].label}
              </span>
            </div>
          ))}
        </Panel>

        {/* Ticket */}
        <Panel style={{ marginTop: 14 }}>
          <div style={{ ...label(10.5), color: W.gold, marginBottom: 14 }}>Votre ticket</div>
          {order.items.map((l) => (
            <div key={l.key} style={{ padding: "9px 0", borderBottom: `1px solid ${W.lineSoft}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span style={{ ...FONT, fontSize: 14, fontWeight: 700, color: W.text }}>
                  <span translate="no">{l.qty}×</span> {l.name}
                </span>
                <span style={{ ...FONT, fontSize: 14, fontWeight: 800, color: W.text }} translate="no">{fmtEuro(l.total)}</span>
              </div>
              {l.opts?.length > 0 && <div style={{ ...FONT, fontSize: 12, color: W.textDim, marginTop: 3 }}>{l.opts.join(" · ")}</div>}
              {l.note && <div style={{ ...FONT, fontSize: 12, color: W.orange, marginTop: 3 }}>✏️ {l.note}</div>}
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            {order.discount > 0 && <Line k={`Promo ${order.promo_code}`} v={`− ${fmtEuro(order.discount)}`} tone={W.greenLt} />}
            <Line k="Total" v={fmtEuro(order.total)} big />
            <div style={{ ...FONT, fontSize: 12, color: W.textDim, marginTop: 8 }}>
              {order.payment_method === "carte" ? "💳 Payé par carte" : "💶 À régler en espèces"}
              {order.zone ? ` · ${order.zone}` : ""}
            </div>
          </div>
        </Panel>

        <Btn variant="outline" full onClick={onNew} style={{ marginTop: 18 }}>Passer une nouvelle commande</Btn>
      </div>
    </Screen>
  );
}

/* ----------------------- Portail ----------------------- */

export default function RestoPortal({ table, scanId }) {
  const toast = useToast();
  const menu = useMemo(readMenu, []);
  const saved = readLS(KEY_TRACK, null);

  const [mode, setMode] = useState(null);
  const [view, setView] = useState(saved?.orderId ? "track" : "mode");
  const [cart, setCart] = useState(() => readCart()[table || "emporter"] || []);
  const [composing, setComposing] = useState(null);
  const [orderId, setOrderId] = useState(saved?.orderId || null);

  // Le panier survit au rafraîchissement de la page.
  useEffect(() => {
    const all = readCart();
    all[table || "emporter"] = cart;
    writeCart(all);
  }, [cart, table]);

  const startOver = () => {
    writeLS(KEY_TRACK, null);
    setOrderId(null);
    setCart([]);
    setMode(null);
    setView("mode");
  };

  if (view === "track" && orderId) return <TrackView orderId={orderId} onNew={startOver} />;

  return (
    <>
      {view === "mode" && <ModeChoice table={table} onPick={(m) => { setMode(m); setView("menu"); }} />}

      {view === "menu" && (
        <MenuView
          menu={menu} mode={mode} table={table} cart={cart}
          openItem={setComposing}
          goCart={() => setView("cart")}
          back={() => setView("mode")}
        />
      )}

      {view === "cart" && (
        <CartView
          cart={cart} setCart={setCart} mode={mode} table={table}
          back={() => setView("menu")}
          goCheckout={() => setView("checkout")}
        />
      )}

      {view === "checkout" && (
        <CheckoutView
          cart={cart} mode={mode} table={table} toast={toast}
          back={() => setView("cart")}
          onDone={(order) => {
            linkScanToOrder(scanId, order.id);
            writeLS(KEY_TRACK, { orderId: order.id });
            setOrderId(order.id);
            setCart([]);
            setView("track");
            toast.success(`Commande ${order.ref} envoyée en cuisine`);
          }}
        />
      )}

      {composing && (
        <Composer
          item={composing}
          onClose={() => setComposing(null)}
          onAdd={(line) => {
            setCart((c) => [...c, line]);
            setComposing(null);
            toast.success(`${line.name} ajouté`);
          }}
        />
      )}
    </>
  );
}
