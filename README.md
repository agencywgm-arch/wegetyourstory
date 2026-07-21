# 🏨 Wegemo Hôtel — SaaS hôtelier en démo 100% offline

**Démo en ligne : https://agencywgm-arch.github.io/wegetyourstory/**

Un SaaS pour hôtels centré sur le **QR code de chambre** : le client scanne le QR collé
sur sa porte et accède au portail de sa chambre — check-in en ligne, room service,
petit-déjeuner, conciergerie, check-out express. La réception voit tout arriver en
direct sur son dashboard.

Version démo complète et autonome : **aucun backend, aucune base de données** —
tout l'état vit en React + `localStorage`, mais l'app se comporte comme un produit
en production (statuts qui avancent, note de chambre cohérente avec les vraies
commandes de la session, synchronisation client ↔ réception).

## Parcours de démo (2 minutes)

1. Ouvrez la démo → **🚀 Voir la démo hôtel** → dashboard réception
2. Onglet **🔳 QR Chambres** → « Ouvrir le portail → » (ou scannez le QR) → portail chambre 204
3. **Check-in en ligne** en 4 étapes → code d'accès `WGM-204-XXXX`
4. **Room service** → commande « 🛏️ Sur la note » → le statut avance tout seul
5. **🥐 Petit-déjeuner en chambre** → formule + créneau (+8 € plateau)
6. **🧳 Check-out express** → note détaillée (nuits × dates réelles + commandes de la session + taxe de séjour)
7. Retour au dashboard → onglet **🛎️ Check-in** : la fiche est là (tag 📲, identité, code, ligne 🧳 « vérifier la chambre puis confirmer »)
8. Onglet **🧳 Check-out** : checklist d'inspection (chambre + minibar) → **facture imprimable** → confirmation du départ → la chambre passe « à nettoyer » dans **🛏️ Chambres** (ménage → « Marquer propre »)
9. Onglet **🕑 Activité** : journal en temps réel de tout ce qui s'est passé (check-ins, commandes, demandes, avis ⭐) — l'avis laissé au check-out remonte aussi dans le KPI Satisfaction et le CRM

> La synchronisation passe par le `localStorage` du navigateur : elle fonctionne
> entre onglets d'un même appareil (limite volontaire du « zéro backend »).

## Stack

- **React 19 + Vite**, un seul fichier applicatif : [`src/App.jsx`](src/App.jsx)
- CSS-in-JS inline, palette iOS-like, police Figtree — aucune lib UI
- Seule dépendance : [`qrcode`](https://www.npmjs.com/package/qrcode) (génération des QR en canvas)
- `localStorage` fait office de serveur : clés `wgm_demo_checkins`, `wgm_demo_orders`,
  `wgm_demo_requests`, `wgm_demo_menu`, `wgm_demo_hotel`

## Développement

```bash
npm install
npm run dev       # serveur de dev
npm run build     # build de production (dist/ + 404.html fallback SPA)
npm run preview   # prévisualiser le build
```

## Déploiement

À chaque push sur `main`, le workflow [`deploy.yml`](.github/workflows/deploy.yml)
construit l'app avec `VITE_BASE_PATH=/wegetyourstory/` et publie `dist/` sur la
branche `gh-pages`, servie par GitHub Pages.

- `VITE_BASE_PATH` : base path pour un déploiement en sous-dossier
- `VITE_HASH_ROUTING=1` : bascule les liens du portail en `#/r/…` pour les
  hébergeurs statiques sans fallback SPA

## Routes

| Chemin | Vue |
|---|---|
| `/` | Landing → dashboard réception |
| `/r/demo-hotel/t/{chambre}` | Portail chambre client (cible des QR) |
