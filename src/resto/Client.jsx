import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  C, FF, fmtEuro, uid, useTick, useToast,
  Surface, Btn, Tag, InputField, Stepper, Modal, SectionTitle, playBeep,
} from "../shared/ui.jsx";
import {
  BRAND, CATEGORIES, MODE_META, STATUS_META, DELIVERY_ZONES, ALL_CITIES,
  zoneForCity, applyPromo, readMenu, readOrders, placeOrder, readCart, writeCart,
  linkScanToOrder, useOrders,
} from "./data.js";
import { readLS, writeLS } from "../shared/ui.jsx";

const KEY_TRACK = "wgm_resto_track";

/* ==========================================================================
   PORTAIL CLIENT WELL DONE — /r/well-done/t/{table}
   Choix du mode, carte, composition, panier, paiement, suivi temps réel.
   ========================================================================== */

/* ----------------------- Identité de marque ----------------------- */

export function WDLogo({ size = 34, light }) {
  const ink = light ? "#FFF" : BRAND.ink;
  return (
    <div style={{ ...FF, lineHeight: 0.88, userSelect: "none" }} translate="no">
      <div style={{ fontSize: size, fontWeight: 900, color: BRAND.gold, letterSpacing: size * 0.08 }}>
        WELL
      </div>
      <div style={{ fontSize: size, fontWeight: 900, color: ink, letterSpacing: size * 0.06, display: "flex", alignItems: "center", gap: size * 0.04 }}>
        <span>D</span>
        <span style={{ fontSize: size * 0.72, transform: "translateY(-4%)" }}>🍔</span>
        <span>NE</span>
      </div>
      <div style={{ fontSize: size * 0.2, fontWeight: 700, color: light ? "rgba(255,255,255,.7)" : C.textSecondary, letterSpacing: size * 0.1, marginTop: size * 0.16 }}>
        {BRAND.tagline}
      </div>
    </div>
  );
}

function AngusStamp({ style }) {
  return (
    <div
      style={{
        ...FF, border: `2.5px solid ${BRAND.green}`, color: BRAND.green,
        borderRadius: 6, padding: "5px 10px", fontSize: 10.5, fontWeight: 900,
        letterSpacing: 1.2, transform: "rotate(-6deg)", textTransform: "uppercase",
        display: "inline-block", ...style,
      }}
    >
      Black Angus Beef
    </div>
  );
}

/* ----------------------- Options composables ----------------------- */

const visibleGroups = (item, sel) =>
  (item.options || []).filter(
    (g) => !g.dependsOn || sel[g.dependsOn.key] === g.dependsOn.value
  );

const valOf = (g, sel) =>
  g.type === "single" ? sel[g.key] ?? g.choices[0].id : sel[g.key] || [];

function optionsPrice(item, sel) {
  return visibleGroups(item, sel).reduce((sum, g) => {
    if (g.type === "single") {
      const c = g.choices.find((x) => x.id === valOf(g, sel));
      return sum + (c?.price || 0);
    }
    return sum + valOf(g, sel).reduce((s, id) => {
      const c = g.choices.find((x) => x.id === id);
      return s + (c?.price || 0);
    }, 0);
  }, 0);
}

function optionLabels(item, sel) {
  const out = [];
  visibleGroups(item, sel).forEach((g) => {
    if (g.type === "single") {
      const c = g.choices.find((x) => x.id === valOf(g, sel));
      // « Seul » est l'option par défaut : inutile de l'afficher en cuisine.
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

function PortalHeader({ table, mode, onBack, right }) {
  return (
    <div
      style={{
        position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,.92)",
        backdropFilter: "blur(14px)", borderBottom: `1px solid ${C.border}`,
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          style={{ ...FF, border: "none", background: C.surfaceAlt, borderRadius: 999, width: 34, height: 34, fontSize: 15, cursor: "pointer", color: C.text, flexShrink: 0 }}
          aria-label="Retour"
        >
          ←
        </button>
      )}
      <WDLogo size={19} />
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        {right}
        {table && !mode && <Tag color={BRAND.green}>Table {table}</Tag>}
        {mode && (
          <Tag color={BRAND.green}>
            {MODE_META[mode].emoji} {MODE_META[mode].label}
            {mode === "sur_place" && table ? ` · T${table}` : ""}
          </Tag>
        )}
      </div>
    </div>
  );
}

/* ----------------------- 1. Choix du mode ----------------------- */

function ModeChoice({ table, onPick }) {
  const modes = [
    { id: "sur_place", title: "Sur place", sub: table ? `Service à la table ${table}` : "Service à table", emoji: "🍽️", disabled: !table },
    { id: "emporter", title: "À emporter", sub: "Prêt en ~15 min au comptoir", emoji: "🥡" },
    { id: "livraison", title: "Livraison", sub: "Minimum selon la zone", emoji: "🛵" },
  ];
  return (
    <div className="wgm-view" style={{ padding: "28px 18px 40px", maxWidth: 520, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <WDLogo size={40} />
        <AngusStamp style={{ marginTop: 8 }} />
      </div>

      <div style={{ ...FF, fontSize: 24, fontWeight: 900, color: C.text, marginTop: 30 }}>
        Bienvenue 👋
      </div>
      <div style={{ ...FF, fontSize: 15, color: C.textSecondary, marginTop: 6, lineHeight: 1.5 }}>
        Commandez en quelques secondes, sans installer d'application.
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
        {modes.map((m) => (
          <Surface
            key={m.id}
            className="wgm-tile"
            onClick={() => !m.disabled && onPick(m.id)}
            style={{
              display: "flex", alignItems: "center", gap: 15, cursor: m.disabled ? "default" : "pointer",
              opacity: m.disabled ? 0.42 : 1, padding: 17,
            }}
          >
            <span style={{ fontSize: 30 }}>{m.emoji}</span>
            <span style={{ flex: 1 }}>
              <span style={{ ...FF, display: "block", fontSize: 16.5, fontWeight: 800, color: C.text }}>{m.title}</span>
              <span style={{ ...FF, display: "block", fontSize: 13, color: C.textSecondary, marginTop: 2 }}>
                {m.disabled ? "Scannez le QR d'une table" : m.sub}
              </span>
            </span>
            {!m.disabled && <span style={{ ...FF, fontSize: 20, color: C.textTertiary }}>›</span>}
          </Surface>
        ))}
      </div>

      <Surface style={{ marginTop: 20, background: BRAND.green + "12", border: `1px solid ${BRAND.green}33` }}>
        <div style={{ ...FF, fontSize: 13, fontWeight: 800, color: BRAND.green, marginBottom: 8 }}>
          🛵 Minimum de livraison selon zone
        </div>
        {DELIVERY_ZONES.map((z) => (
          <div key={z.id} style={{ ...FF, fontSize: 12.5, color: C.textSecondary, marginBottom: 4, lineHeight: 1.45 }}>
            <b style={{ color: C.text }} translate="no">{z.label} (min. {fmtEuro(z.min)})</b>
            {z.cities.length ? ` — ${z.cities.join(", ")}` : ""}
          </div>
        ))}
      </Surface>
    </div>
  );
}

/* ----------------------- 2. La carte ----------------------- */

function MenuView({ menu, mode, table, cart, openItem, goCart, back }) {
  const [cat, setCat] = useState(CATEGORIES[0].id);
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const total = cart.reduce((s, l) => s + l.total, 0);
  const refs = useRef({});

  const jump = (id) => {
    setCat(id);
    refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ paddingBottom: count ? 96 : 24 }}>
      <PortalHeader table={table} mode={mode} onBack={back} />

      {/* Onglets de catégories */}
      <div
        style={{
          position: "sticky", top: 59, zIndex: 40, background: "rgba(255,255,255,.94)",
          backdropFilter: "blur(14px)", borderBottom: `1px solid ${C.border}`,
          display: "flex", gap: 8, overflowX: "auto", padding: "10px 16px",
        }}
      >
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => jump(c.id)}
            style={{
              ...FF, flexShrink: 0, borderRadius: 999, padding: "8px 14px", fontSize: 13.5, fontWeight: 800,
              cursor: "pointer", border: `1px solid ${cat === c.id ? BRAND.green : C.border}`,
              background: cat === c.id ? BRAND.green : C.surface,
              color: cat === c.id ? "#FFF" : C.textSecondary,
            }}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div className="wgm-view" style={{ maxWidth: 560, margin: "0 auto", padding: "4px 16px 20px" }}>
        {CATEGORIES.map((c) => {
          const items = menu.filter((m) => m.category === c.id && m.available !== false);
          if (!items.length) return null;
          return (
            <section key={c.id} ref={(el) => (refs.current[c.id] = el)} style={{ scrollMarginTop: 112 }}>
              <SectionTitle style={{ color: C.text, fontSize: 15, textTransform: "none", letterSpacing: 0 }}>
                {c.emoji} {c.label}
              </SectionTitle>
              {c.note && (
                <div style={{ ...FF, fontSize: 12.5, fontWeight: 700, color: BRAND.green, marginTop: -6, marginBottom: 10 }} translate="no">
                  {c.note}
                </div>
              )}
              <div style={{ display: "grid", gap: 10 }}>
                {items.map((m) => (
                  <Surface
                    key={m.id}
                    className="wgm-tile"
                    onClick={() => openItem(m)}
                    style={{ display: "flex", gap: 13, cursor: "pointer", padding: 15, alignItems: "flex-start" }}
                  >
                    <span style={{ fontSize: 27, lineHeight: 1 }}>{m.emoji}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <b style={{ ...FF, fontSize: 15.5, fontWeight: 800, color: C.text }}>{m.name}</b>
                        {m.badge && <Tag color={BRAND.gold} style={{ fontSize: 10.5, padding: "2px 8px" }}>{m.badge}</Tag>}
                      </span>
                      {m.desc && (
                        <span style={{ ...FF, display: "block", fontSize: 12.8, color: C.textSecondary, marginTop: 4, lineHeight: 1.45 }}>
                          {m.desc}
                        </span>
                      )}
                    </span>
                    <span style={{ ...FF, fontSize: 15, fontWeight: 900, color: C.text, flexShrink: 0 }} translate="no">
                      {fmtEuro(m.price)}
                    </span>
                  </Surface>
                ))}
              </div>
            </section>
          );
        })}

        <div style={{ ...FF, fontSize: 12, color: C.textTertiary, textAlign: "center", marginTop: 26, lineHeight: 1.6 }}>
          Sauces incluses : ketchup, moutarde, mayonnaise, barbecue.<br />
          Snap {BRAND.snapchat} · Insta {BRAND.instagram}
        </div>
      </div>

      {count > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px calc(12px + env(safe-area-inset-bottom))", background: "rgba(255,255,255,.94)", backdropFilter: "blur(14px)", borderTop: `1px solid ${C.border}`, zIndex: 60 }}>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <Btn full size="lg" onClick={goCart} style={{ background: BRAND.green, color: "#FFF" }}>
              <span style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                <span>🛒 Voir le panier · {count} article{count > 1 ? "s" : ""}</span>
                <span translate="no">{fmtEuro(total)}</span>
              </span>
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------- 3. Composition d'un article ----------------------- */

function ItemComposer({ item, onClose, onAdd }) {
  const [sel, setSel] = useState({});
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const groups = visibleGroups(item, sel);
  const unit = item.price + optionsPrice(item, sel);
  const labels = optionLabels(item, sel);

  const toggleMulti = (g, id) => {
    setSel((s) => {
      const cur = s[g.key] || [];
      if (cur.includes(id)) return { ...s, [g.key]: cur.filter((x) => x !== id) };
      if (g.max && cur.length >= g.max) return s;
      return { ...s, [g.key]: [...cur, id] };
    });
  };

  return (
    <Modal title={`${item.emoji} ${item.name}`} onClose={onClose} maxWidth={460}>
      {item.desc && (
        <div style={{ ...FF, fontSize: 13.5, color: C.textSecondary, lineHeight: 1.5, marginBottom: 6 }}>
          {item.desc}
        </div>
      )}

      {groups.map((g) => (
        <div key={g.key} style={{ marginTop: 18 }}>
          <div style={{ ...FF, fontSize: 13, fontWeight: 800, color: C.text }}>
            {g.label}
            {g.hint && (
              <span style={{ fontWeight: 600, color: C.textTertiary }} translate="no"> · {g.hint}</span>
            )}
            {g.max && (
              <span style={{ fontWeight: 600, color: C.textTertiary }}> · {(sel[g.key] || []).length}/{g.max}</span>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 9 }}>
            {g.choices.map((c) => {
              const on = g.type === "single"
                ? valOf(g, sel) === c.id
                : (sel[g.key] || []).includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() =>
                    g.type === "single"
                      ? setSel((s) => ({ ...s, [g.key]: c.id }))
                      : toggleMulti(g, c.id)
                  }
                  style={{
                    ...FF, borderRadius: 999, padding: "8px 13px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    border: `1.5px solid ${on ? BRAND.green : C.borderStrong}`,
                    background: on ? BRAND.green + "16" : C.surface,
                    color: on ? BRAND.green : C.textSecondary,
                  }}
                >
                  {c.label}
                  {c.price > 0 && <span translate="no"> +{fmtEuro(c.price)}</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ marginTop: 18 }}>
        <InputField
          label="Remarque pour la cuisine"
          value={note}
          onChange={setNote}
          placeholder="Sans oignon, bien cuit…"
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
        <Stepper value={qty} onChange={setQty} max={20} />
        <Btn
          size="lg"
          onClick={() => {
            onAdd({
              key: uid(),
              item_id: item.id,
              name: item.name,
              emoji: item.emoji,
              qty,
              unit,
              total: Math.round(unit * qty * 100) / 100,
              opts: labels,
              note: note.trim(),
            });
          }}
          style={{ background: BRAND.green, color: "#FFF", flex: 1, minWidth: 180 }}
        >
          Ajouter · <span translate="no">{fmtEuro(unit * qty)}</span>
        </Btn>
      </div>
    </Modal>
  );
}

/* ----------------------- 4. Panier ----------------------- */

function CartView({ cart, setCart, mode, table, back, goCheckout }) {
  const subtotal = cart.reduce((s, l) => s + l.total, 0);
  const setQty = (key, qty) =>
    setCart(
      cart
        .map((l) => (l.key === key ? { ...l, qty, total: Math.round(l.unit * qty * 100) / 100 } : l))
        .filter((l) => l.qty > 0)
    );

  return (
    <div>
      <PortalHeader table={table} mode={mode} onBack={back} />
      <div className="wgm-view" style={{ maxWidth: 520, margin: "0 auto", padding: "18px 16px 40px" }}>
        <div style={{ ...FF, fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 16 }}>🛒 Votre panier</div>

        {cart.length === 0 && (
          <Surface style={{ textAlign: "center", padding: 30 }}>
            <div style={{ ...FF, color: C.textSecondary, fontSize: 14 }}>Votre panier est vide.</div>
            <Btn onClick={back} style={{ marginTop: 14 }}>Voir la carte</Btn>
          </Surface>
        )}

        {cart.map((l) => (
          <Surface key={l.key} style={{ marginBottom: 10, padding: 15 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 24 }}>{l.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...FF, fontSize: 15, fontWeight: 800, color: C.text }}>{l.name}</div>
                {l.opts.length > 0 && (
                  <div style={{ ...FF, fontSize: 12.5, color: C.textSecondary, marginTop: 3, lineHeight: 1.45 }}>
                    {l.opts.join(" · ")}
                  </div>
                )}
                {l.note && (
                  <div style={{ ...FF, fontSize: 12.5, color: BRAND.gold, marginTop: 3, fontWeight: 700 }}>
                    ✏️ {l.note}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 10 }}>
                  <Stepper value={l.qty} onChange={(q) => setQty(l.key, q)} min={0} max={20} />
                  <b style={{ ...FF, fontSize: 15, fontWeight: 900, color: C.text }} translate="no">{fmtEuro(l.total)}</b>
                </div>
              </div>
            </div>
          </Surface>
        ))}

        {cart.length > 0 && (
          <>
            <Surface style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ ...FF, fontSize: 16, fontWeight: 800, color: C.text }}>Sous-total</span>
              <span style={{ ...FF, fontSize: 20, fontWeight: 900, color: C.text }} translate="no">{fmtEuro(subtotal)}</span>
            </Surface>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <Btn variant="subtle" onClick={back} style={{ flex: 1 }}>Ajouter</Btn>
              <Btn size="lg" onClick={goCheckout} style={{ flex: 2, background: BRAND.green, color: "#FFF" }}>
                Commander →
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ----------------------- 5. Paiement ----------------------- */

function CheckoutView({ cart, mode, table, back, onDone, toast }) {
  const [f, setF] = useState({ name: "", phone: "", email: "", address: "", city: ALL_CITIES[0], nif: "" });
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState(null);
  const [pay, setPay] = useState("carte");
  const [busy, setBusy] = useState(false);

  const subtotal = cart.reduce((s, l) => s + l.total, 0);
  const discount = promo?.discount || 0;
  const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

  const zone = mode === "livraison" ? zoneForCity(f.city) : null;
  const belowMin = zone ? subtotal < zone.min : false;

  const tryPromo = () => {
    const r = applyPromo(promoInput, subtotal);
    if (!r.ok) {
      setPromo(null);
      toast.error(r.reason);
      return;
    }
    setPromo(r);
    toast.success(`${r.promo.label} appliqué`);
  };

  const submit = () => {
    if (!f.name.trim()) return toast.error("Votre nom est nécessaire pour l'appel en cuisine");
    if (mode === "livraison" && !f.address.trim()) return toast.error("Adresse de livraison manquante");
    if (mode === "livraison" && !f.phone.trim()) return toast.error("Téléphone nécessaire pour la livraison");
    if (belowMin) return toast.error(`Minimum ${fmtEuro(zone.min)} en ${zone.label}`);
    setBusy(true);
    // Paiement simulé : la démo ne contacte aucun service externe.
    setTimeout(() => {
      const order = placeOrder({
        mode,
        table: mode === "sur_place" ? table : null,
        items: cart,
        subtotal,
        discount,
        promo_code: promo?.promo.code || null,
        total,
        payment_method: pay,
        paid: pay === "carte",
        zone: zone?.label || null,
        customer: {
          name: f.name.trim(),
          phone: f.phone.trim(),
          email: f.email.trim(),
          address: f.address.trim(),
          city: mode === "livraison" ? f.city : "",
          nif: f.nif.trim(),
        },
      });
      setBusy(false);
      onDone(order);
    }, 900);
  };

  return (
    <div>
      <PortalHeader table={table} mode={mode} onBack={back} />
      <div className="wgm-view" style={{ maxWidth: 520, margin: "0 auto", padding: "18px 16px 40px" }}>
        <div style={{ ...FF, fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 16 }}>Finaliser</div>

        <Surface>
          <div style={{ display: "grid", gap: 12 }}>
            <InputField label="Nom" value={f.name} onChange={(v) => setF({ ...f, name: v })} placeholder="Prénom ou nom" required />
            <InputField label="Téléphone" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} placeholder="06 12 34 56 78" type="tel" required={mode === "livraison"} />
            <InputField label="Email (reçu numérique)" value={f.email} onChange={(v) => setF({ ...f, email: v })} placeholder="vous@email.com" type="email" />
            {mode === "livraison" && (
              <>
                <InputField label="Adresse" value={f.address} onChange={(v) => setF({ ...f, address: v })} placeholder="12 rue des Lilas" required />
                <label style={{ display: "block" }}>
                  <div style={{ ...FF, fontSize: 12.5, fontWeight: 700, color: C.textSecondary, marginBottom: 6 }}>Commune</div>
                  <select
                    value={f.city}
                    onChange={(e) => setF({ ...f, city: e.target.value })}
                    style={{ ...FF, width: "100%", padding: "11px 14px", borderRadius: 12, border: `1px solid ${C.borderStrong}`, background: C.surface, fontSize: 15, color: C.text }}
                  >
                    {DELIVERY_ZONES.map((z) =>
                      z.cities.length ? (
                        <optgroup key={z.id} label={`${z.label} — min. ${z.min} €`}>
                          {z.cities.map((c) => <option key={c} value={c}>{c}</option>)}
                        </optgroup>
                      ) : (
                        <option key={z.id} value="Hors zone">Autre commune (hors zone — min. 50 €)</option>
                      )
                    )}
                  </select>
                </label>
              </>
            )}
          </div>
        </Surface>

        {mode === "livraison" && (
          <Surface style={{ marginTop: 12, background: belowMin ? C.accent + "12" : BRAND.green + "12", border: `1px solid ${belowMin ? C.accent : BRAND.green}33` }}>
            <div style={{ ...FF, fontSize: 13, fontWeight: 800, color: belowMin ? C.accent : BRAND.green }} translate="no">
              {belowMin
                ? `${zone.label} — il manque ${fmtEuro(zone.min - subtotal)} pour atteindre le minimum de ${fmtEuro(zone.min)}`
                : `${zone.label} — minimum de ${fmtEuro(zone.min)} atteint ✓`}
            </div>
          </Surface>
        )}

        <SectionTitle>Code promo</SectionTitle>
        <div style={{ display: "flex", gap: 8 }}>
          <InputField value={promoInput} onChange={setPromoInput} placeholder="WELLDONE10" style={{ flex: 1 }} />
          <Btn variant="subtle" onClick={tryPromo}>Appliquer</Btn>
        </div>

        <SectionTitle>Paiement</SectionTitle>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { id: "carte", label: "💳 Carte", sub: "Apple Pay / Google Pay" },
            { id: "especes", label: "💶 Espèces", sub: mode === "livraison" ? "À la livraison" : "Au comptoir" },
          ].map((p) => (
            <Surface
              key={p.id}
              onClick={() => setPay(p.id)}
              style={{
                flex: 1, cursor: "pointer", padding: 14, textAlign: "center",
                border: `1.5px solid ${pay === p.id ? BRAND.green : C.border}`,
                background: pay === p.id ? BRAND.green + "10" : C.surface,
              }}
            >
              <div style={{ ...FF, fontSize: 14.5, fontWeight: 800, color: C.text }}>{p.label}</div>
              <div style={{ ...FF, fontSize: 11.5, color: C.textSecondary, marginTop: 3 }}>{p.sub}</div>
            </Surface>
          ))}
        </div>

        <Surface style={{ marginTop: 18 }}>
          <Row label="Sous-total" value={fmtEuro(subtotal)} />
          {discount > 0 && <Row label={`Promo ${promo.promo.code}`} value={`− ${fmtEuro(discount)}`} color={BRAND.green} />}
          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 10, paddingTop: 10 }}>
            <Row label="Total" value={fmtEuro(total)} big />
          </div>
        </Surface>

        <Btn
          full size="lg" disabled={busy || cart.length === 0}
          onClick={submit}
          style={{ marginTop: 16, background: BRAND.green, color: "#FFF" }}
        >
          {busy ? "Paiement en cours…" : `Payer ${fmtEuro(total)}`}
        </Btn>
        <div style={{ ...FF, fontSize: 11.5, color: C.textTertiary, textAlign: "center", marginTop: 10 }}>
          Démonstration — aucun paiement réel n'est effectué.
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color, big }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" }}>
      <span style={{ ...FF, fontSize: big ? 16 : 13.5, fontWeight: big ? 800 : 600, color: color || C.textSecondary }}>{label}</span>
      <span style={{ ...FF, fontSize: big ? 20 : 14, fontWeight: big ? 900 : 700, color: color || C.text }} translate="no">{value}</span>
    </div>
  );
}

/* ----------------------- 6. Suivi temps réel ----------------------- */

function TrackView({ orderId, onNew }) {
  const [orders] = useOrders(2000);
  useTick(1000);
  const order = orders.find((o) => o.id === orderId);
  const alerted = useRef(false);

  useEffect(() => {
    if (order?.status === "READY" && !alerted.current) {
      alerted.current = true;
      playBeep(880, 400);
      setTimeout(() => playBeep(1180, 500), 450);
      navigator.vibrate?.([200, 90, 200, 90, 320]);
    }
  }, [order?.status]);

  if (!order) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ ...FF, color: C.textSecondary }}>Commande introuvable.</div>
        <Btn onClick={onNew} style={{ marginTop: 14 }}>Nouvelle commande</Btn>
      </div>
    );
  }

  const idx = ["PENDING", "PREPARING", "READY", "DONE"].indexOf(order.status);
  const left = Math.max(0, Math.round((order.eta_at - Date.now()) / 60000));
  const ready = order.status === "READY" || order.status === "DONE";

  return (
    <div>
      <PortalHeader table={order.table} mode={order.mode} />
      <div className="wgm-view" style={{ maxWidth: 520, margin: "0 auto", padding: "22px 16px 40px" }}>
        <Surface
          style={{
            textAlign: "center", padding: 26,
            background: ready ? BRAND.green : C.surface,
            border: `1px solid ${ready ? BRAND.green : C.border}`,
          }}
        >
          <div style={{ fontSize: 46 }}>{STATUS_META[order.status].emoji}</div>
          <div style={{ ...FF, fontSize: 21, fontWeight: 900, color: ready ? "#FFF" : C.text, marginTop: 8 }}>
            {order.status === "READY"
              ? order.mode === "livraison" ? "En route !" : "C'est prêt !"
              : STATUS_META[order.status].label}
          </div>
          <div style={{ ...FF, fontSize: 14, color: ready ? "rgba(255,255,255,.85)" : C.textSecondary, marginTop: 6 }}>
            Commande <b translate="no">{order.ref}</b>
            {order.table ? ` · table ${order.table}` : ""}
          </div>
          {!ready && (
            <div style={{ ...FF, fontSize: 13.5, color: C.textSecondary, marginTop: 12 }} translate="no">
              ⏱️ Prêt dans ~{left} min
            </div>
          )}
        </Surface>

        {/* Fil d'avancement */}
        <Surface style={{ marginTop: 14 }}>
          {["PENDING", "PREPARING", "READY", "DONE"].map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0" }}>
              <span
                style={{
                  width: 26, height: 26, borderRadius: 999, flexShrink: 0,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12,
                  background: i <= idx ? BRAND.green : C.surfaceAlt,
                  color: i <= idx ? "#FFF" : C.textTertiary,
                }}
              >
                {i <= idx ? "✓" : i + 1}
              </span>
              <span style={{ ...FF, fontSize: 14, fontWeight: i === idx ? 800 : 600, color: i <= idx ? C.text : C.textTertiary }}>
                {STATUS_META[s].label}
              </span>
            </div>
          ))}
        </Surface>

        {/* Ticket */}
        <Surface style={{ marginTop: 14 }}>
          <div style={{ ...FF, fontSize: 13, fontWeight: 800, color: C.textTertiary, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>
            🧾 Votre ticket
          </div>
          {order.items.map((l) => (
            <div key={l.key} style={{ padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span style={{ ...FF, fontSize: 13.5, fontWeight: 700, color: C.text }}>
                  <span translate="no">{l.qty}×</span> {l.name}
                </span>
                <span style={{ ...FF, fontSize: 13.5, fontWeight: 700, color: C.text }} translate="no">{fmtEuro(l.total)}</span>
              </div>
              {l.opts?.length > 0 && (
                <div style={{ ...FF, fontSize: 12, color: C.textSecondary, marginTop: 2 }}>{l.opts.join(" · ")}</div>
              )}
              {l.note && <div style={{ ...FF, fontSize: 12, color: BRAND.gold, marginTop: 2 }}>✏️ {l.note}</div>}
            </div>
          ))}
          <div style={{ marginTop: 10 }}>
            {order.discount > 0 && <Row label={`Promo ${order.promo_code}`} value={`− ${fmtEuro(order.discount)}`} color={BRAND.green} />}
            <Row label="Total" value={fmtEuro(order.total)} big />
            <div style={{ ...FF, fontSize: 12, color: C.textSecondary, marginTop: 6 }}>
              {order.payment_method === "carte" ? "💳 Payé par carte" : "💶 À régler en espèces"}
              {order.zone ? ` · ${order.zone}` : ""}
            </div>
          </div>
        </Surface>

        <Btn variant="subtle" full onClick={onNew} style={{ marginTop: 16 }}>
          Passer une nouvelle commande
        </Btn>
      </div>
    </div>
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

  if (view === "track" && orderId) {
    return <TrackView orderId={orderId} onNew={startOver} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      {view === "mode" && (
        <ModeChoice
          table={table}
          onPick={(m) => {
            setMode(m);
            setView("menu");
          }}
        />
      )}

      {view === "menu" && (
        <MenuView
          menu={menu}
          mode={mode}
          table={table}
          cart={cart}
          openItem={setComposing}
          goCart={() => setView("cart")}
          back={() => setView("mode")}
        />
      )}

      {view === "cart" && (
        <CartView
          cart={cart}
          setCart={setCart}
          mode={mode}
          table={table}
          back={() => setView("menu")}
          goCheckout={() => setView("checkout")}
        />
      )}

      {view === "checkout" && (
        <CheckoutView
          cart={cart}
          mode={mode}
          table={table}
          toast={toast}
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
        <ItemComposer
          item={composing}
          onClose={() => setComposing(null)}
          onAdd={(line) => {
            setCart((c) => [...c, line]);
            setComposing(null);
            toast.success(`${line.name} ajouté`);
          }}
        />
      )}
    </div>
  );
}
