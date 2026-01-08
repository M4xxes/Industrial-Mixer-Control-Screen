# Système de Supervision Multi-Malaxeurs

Application web moderne pour la supervision et le contrôle de 6 malaxeurs industriels.

## Fonctionnalités

- ✅ **Vue d'ensemble multi-malaxeurs** : Visualisation en temps réel de tous les malaxeurs avec indicateurs visuels
- ✅ **Gestion des recettes** : CRUD complet avec édition étape par étape (32 étapes par recette)
- ✅ **Mode manuel** : Contrôle étape par étape des recettes avec timer automatique
- ✅ **Gestion des stocks** : Suivi de 26 produits avec alertes automatiques (critique/bas/normal)
- ✅ **Suivi détaillé** : Affichage des poids dosés/à doser pour chaque étape
- ✅ **Historique complet** : Consultation des lots avec graphiques et analyses de performance
- ✅ **Page des alarmes** : Gestion centralisée avec filtres et acquittement
- ✅ **Interface moderne** : Design responsive avec images industrielles et indicateurs colorés

## Technologies

- **React 18** avec TypeScript
- **Vite** pour le build et le développement
- **React Router** pour la navigation
- **Tailwind CSS** pour le styling
- **Recharts** pour les graphiques
- **Lucide React** pour les icônes

## Installation

### Backend (Serveur API)

1. Aller dans le dossier server :
```bash
cd server
npm install
```

2. Initialiser la base de données :
```bash
npm run init-db
node seed-data.js
```

3. Démarrer le serveur :
```bash
npm start
```

Le serveur API sera accessible sur `http://localhost:3001`

### Frontend

1. Installer les dépendances :
```bash
npm install
```

2. Créer un fichier `.env` à la racine du projet :
```
VITE_API_URL=http://localhost:3001/api
```

3. Lancer le serveur de développement :
```bash
npm run dev
```

4. Ouvrir [http://localhost:5173](http://localhost:5173) dans le navigateur

## Structure du projet

```
src/
├── components/          # Composants réutilisables
│   ├── Layout.tsx      # Layout principal avec navigation
│   ├── MixerVisual.tsx # Composant visuel du malaxeur
│   ├── RecipeProgress.tsx # Suivi des étapes de recette
│   └── BatchHistoryDialog.tsx # Dialogue historique détaillé
├── pages/              # Pages de l'application
│   ├── Dashboard.tsx   # Vue d'ensemble
│   ├── RecipesPage.tsx # Gestion des recettes
│   ├── MixerDetail.tsx # Détail d'un malaxeur
│   ├── ManualModePage.tsx # Mode manuel
│   ├── InventoryPage.tsx # Gestion des stocks
│   ├── AlarmsPage.tsx  # Page des alarmes
│   └── HistoryPage.tsx # Historique des cycles
├── types/              # Définitions TypeScript
├── data/               # Données mockées
└── utils/              # Utilitaires
```

## Pages disponibles

- `/` - Vue d'ensemble (Dashboard)
- `/recipes` - Gestion des recettes
- `/mixer/:id` - Détail d'un malaxeur
- `/manual` - Mode manuel
- `/inventory` - Gestion des stocks
- `/alarms` - Page des alarmes
- `/history` - Historique des cycles

## Fonctionnalités détaillées

### Vue d'ensemble
- Affichage de tous les malaxeurs avec statut en temps réel
- Statistiques globales (malaxeurs en production, alarmes, stocks)
- Indicateurs visuels colorés pour chaque malaxeur

### Gestion des recettes
- Création, modification, suppression de recettes
- Édition complète des 32 étapes avec tous les paramètres
- Ajout/suppression d'étapes dynamiquement

### Mode manuel
- Sélection d'une recette
- Contrôle séquentiel des étapes (Lancer, Pause, Reprendre, Passer)
- Timer automatique pour chaque étape
- Barre de progression globale

### Gestion des stocks
- 26 produits avec suivi en temps réel
- Alertes automatiques (critique/bas/normal)
- Réapprovisionnement avec validation
- Barres de progression par produit

### Historique
- Filtres avancés (malaxeur, recette, statut, période)
- Détails complets avec graphiques
- Export CSV
- Analyse des écarts consigne/mesure

## Build pour production

```bash
npm run build
```

Les fichiers optimisés seront générés dans le dossier `dist/`.

## Base de Données

Le système utilise SQLite pour le développement, facilement migrable vers PostgreSQL en production.

### Structure de la base de données

- **mixers** : Informations en temps réel des 6 malaxeurs
- **recipes** : Recettes de production
- **recipe_steps** : Étapes des recettes (32 étapes par recette)
- **batches** : Lots de production
- **batch_steps** : Étapes exécutées avec écarts
- **batch_metrics** : Métriques temporelles (température, vitesse, puissance)
- **inventory** : Stocks des 26 produits
- **inventory_transactions** : Historique des transactions
- **alarms** : Alarmes du système
- **users** : Utilisateurs et droits

### Connexion à la base de données

Le frontend se connecte automatiquement à l'API backend qui gère la base de données. Les données sont rafraîchies automatiquement :
- Toutes les 5 secondes pour la liste des malaxeurs
- Toutes les 2 secondes pour le détail d'un malaxeur

## Notes

- ✅ Les données sont maintenant stockées en base de données SQLite
- ✅ API REST complète pour toutes les opérations
- ✅ Connexion frontend-backend opérationnelle
- Pour la production, migrer vers PostgreSQL et connecter Node-RED pour OPC UA
- L'authentification utilisateur est préparée dans la base de données mais pas encore implémentée dans l'interface

## Prochaines étapes

- [ ] Intégration avec l'API backend Node-RED
- [ ] Connexion à la base de données PostgreSQL
- [ ] Authentification utilisateur complète
- [ ] WebSocket pour les mises à jour en temps réel
- [ ] Tests unitaires et d'intégration

