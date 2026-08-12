# 🍔 Wegemo — SaaS de commande par QR code

Démo produit complète et **100 % hors ligne** : aucun backend, aucune base de
données, aucun appel réseau. Tout l'état vit en React + `localStorage`, mais
l'application se comporte comme un produit en production — statuts qui avancent,
synchronisation client ↔ cuisine ↔ caisse, addition cohérente avec les commandes
réellement passées.

Deux verticales partagent le même design system :

| Verticale | Route | Contenu |
|---|---|---|
| **Well Done** (restaurant) | `/` | Carte réelle du restaurant, pré-configurée |
| **Wegemo Hôtel** | `/hotel` | Portail de chambre, check-in, room service, check-out |

---

## 🍔 Well Done — commande par QR de table

Le client scanne le QR collé sur sa table, compose son burger et paie depuis son
téléphone. La cuisine reçoit la commande dans la seconde avec alarme sonore, la
caisse suit en direct.

### Trois interfaces, trois destinations

La barre de démonstration en haut de l'écran donne accès aux trois vues à tout
moment — elles ne sont pas enfouies dans des onglets :

- **Vue client** — le téléphone du client, atteint par le QR de la table
- **Vue cuisine** — l'écran du passe, trois colonnes et une alarme
- **Vue gestion** — l'ordinateur du gérant, huit modules

### Parcours de démo (2 minutes)

1. Ouvrez `/` → **Lancer la démo client**
2. **Sur place** → la carte → un burger → **formule frites + boisson**, sauces, suppléments
3. **Panier** → **Commander** → nom, code promo `WELLDONE10`, carte ou espèces
4. Le **suivi temps réel** démarre : compte à rebours, alerte sonore + vibration à « prête »
5. Barre du haut → **Vue cuisine** : la commande est là, l'alarme sonne jusqu'à
   **Accepter** → le suivi côté client bascule tout seul
6. Barre du haut → **Vue gestion** : la vente est déjà dans la caisse et le CRM

> La synchronisation passe par le `localStorage` du navigateur : elle fonctionne
> entre onglets d'un même appareil (limite volontaire du « zéro backend »).

### La carte, pré-configurée

Reprise fidèle de la carte papier : **29 articles** en 7 catégories.

- **Smash Burger Angus Beef** — Well Done, Cheese, Smoky, Truffle, Phily
  · formule frites + boisson soft **+ 3 €**
- **Chicken Burger** — Chic'n, Avocado chic'n, Smoky chic'n, Pili pli · formule **+ 3,50 €**
- **Hot Dog** — New-yorkais, Spicy, Well Done · formule **+ 3,50 €**
- **Nos frites**, **Add** (nuggets, mozza sticks, tenders, oignon rings…)
- **Desserts**, **Boissons** (soft, prémium, Lemon Aid bio)

Options composables portées par l'article lui-même : sauces incluses (2 au choix),
sauces supplémentaires à 0,50 €, cheddar et bacon à 1 €, remarque libre pour la
cuisine. Choisir la formule fait apparaître le choix de la boisson.

**Zones de livraison** avec minimum de commande : Zone 1 (20 €), Zone 2 (30 €),
Zone 3 (35 €), hors zone (50 €). Le minimum est vérifié au paiement.

### Modules de gestion

Vue d'ensemble (CA, panier moyen, scans QR et taux de conversion, meilleures
ventes) · Commandes live · Cuisine en kanban · Caisse avec export CSV et rapport Z
imprimable · Carte (prix, description, mise en « épuisé ») · QR Tables avec
planche A4 imprimable · CRM alimenté automatiquement · Livraison par zone ·
Journal d'activité.

---

## 🏨 Wegemo Hôtel

Disponible sur `/hotel`. QR de chambre, check-in en ligne, room service,
petit-déjeuner, conciergerie, check-out express avec facture imprimable, ménage,
journal d'activité. Parcours détaillé dans l'historique du dépôt (PR #1 à #5).

---

## Direction artistique

La verticale Well Done reprend la charte de l'enseigne : **vert forêt** en fond,
**or bronze** pour la marque et les accents, **vert vif** pour les actions,
**orange** pour l'alerte. Surfaces en verre dépoli, typographie large et serrée,
motif géométrique de la marque en filigrane.

| Rôle | Hex |
|---|---|
| Fond profond | `#0A1A0D` |
| Vert forêt | `#0F2413` |
| Surface | `#16351A` |
| Or bronze | `#C69A63` |
| Vert vif (actions) | `#4CA435` |
| Orange (alerte) | `#F0803C` |
| Texte | `#F5F2EA` |

Le logo est reconstruit en SVG dans `src/resto/Logo.jsx` : « WELL » léger et
espacé au-dessus de « DONE », dont le O est un burger au trait. Toute
l'iconographie d'interface passe par `src/resto/icons.jsx` — une seule grille,
une seule graisse. Les emojis restent réservés aux plats.

## Stack

- **React 19 + Vite**, CSS-in-JS inline, police Figtree
- Seule dépendance : [`qrcode`](https://www.npmjs.com/package/qrcode)
- `localStorage` fait office de serveur

```
src/
├── shared/ui.jsx     # primitives communes aux deux verticales
├── Root.jsx          # aiguillage, titre et favicon par verticale
├── App.jsx           # verticale hôtel
└── resto/
    ├── theme.js      # palette et styles Well Done
    ├── Logo.jsx      # wordmark et pastille en SVG
    ├── icons.jsx     # jeu d'icônes au trait
    ├── ui.jsx        # primitives sombres : Panel, Btn, Sheet, Stat…
    ├── data.js       # carte, zones, promos, cycle de vie des commandes
    ├── Client.jsx    # portail client (QR de table)
    ├── Kitchen.jsx   # écran cuisine (KDS)
    ├── Manager.jsx   # tableau de bord gestion
    └── RestoApp.jsx  # vitrine + barre de navigation entre les trois vues
```

## Développement

```bash
npm install
npm run dev       # serveur de dev
npm run build     # build de production (dist/ + 404.html fallback SPA)
npm run preview   # prévisualiser le build
```

## Déploiement

### Vercel

[`vercel.json`](vercel.json) configure le projet : build Vite, sortie `dist/`, et
une règle de réécriture qui renvoie toutes les routes vers `index.html` (les
portails `/r/…` sont des routes côté client).

Import du dépôt sur Vercel, puis **rien à régler** : laisser `VITE_BASE_PATH` et
`VITE_HASH_ROUTING` non définis. L'app est servie à la racine du domaine et le
routage par chemin fonctionne grâce aux réécritures.

### GitHub Pages

Conservé en parallèle. À chaque push sur `main`, le workflow
[`deploy.yml`](.github/workflows/deploy.yml) construit l'app avec
`VITE_BASE_PATH=/wegetyourstory/` et publie `dist/` sur la branche `gh-pages`.

### Variables de build

- `VITE_BASE_PATH` : base path pour un déploiement en sous-dossier
  (Pages uniquement — à laisser vide sur Vercel)
- `VITE_HASH_ROUTING=1` : bascule les liens des portails en `#/r/…` pour les
  hébergeurs statiques sans fallback SPA (inutile sur Vercel)

## Routes

| Chemin | Vue |
|---|---|
| `/` | Vitrine Well Done → tableau de bord gestion |
| `/r/well-done/t/{table}` | Portail client Well Done (cible des QR de table) |
| `/hotel` | Démo hôtelière → dashboard réception |
| `/r/demo-hotel/t/{chambre}` | Portail chambre client |
