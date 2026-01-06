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

1. Installer les dépendances :
```bash
npm install
```

2. Lancer le serveur de développement :
```bash
npm run dev
```

3. Ouvrir [http://localhost:5173](http://localhost:5173) dans le navigateur

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

## Notes

- Les données sont actuellement mockées dans `src/data/mockData.ts`
- Pour la production, il faudra connecter l'API backend (Node-RED) et la base de données PostgreSQL
- L'authentification utilisateur n'est pas encore implémentée (simulée pour le mode admin)

## Prochaines étapes

- [ ] Intégration avec l'API backend Node-RED
- [ ] Connexion à la base de données PostgreSQL
- [ ] Authentification utilisateur complète
- [ ] WebSocket pour les mises à jour en temps réel
- [ ] Tests unitaires et d'intégration

