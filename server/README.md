# Serveur Backend - Supervision Multi-Malaxeurs

Serveur Express avec SQLite pour la gestion des données des malaxeurs.

## Installation

```bash
cd server
npm install
```

## Initialisation de la base de données

```bash
npm run init-db
```

Cela créera toutes les tables nécessaires dans `database.sqlite`.

## Insertion des données de test

```bash
node seed-data.js
```

## Démarrage du serveur

```bash
npm start
```

Le serveur sera accessible sur `http://localhost:3001`

## API Endpoints

### Mixers
- `GET /api/mixers` - Liste tous les malaxeurs
- `GET /api/mixers/:id` - Détails d'un malaxeur
- `PUT /api/mixers/:id` - Mettre à jour un malaxeur

### Recipes
- `GET /api/recipes` - Liste toutes les recettes
- `GET /api/recipes/:id` - Détails d'une recette
- `POST /api/recipes` - Créer une recette
- `PUT /api/recipes/:id` - Modifier une recette
- `DELETE /api/recipes/:id` - Supprimer une recette

### Inventory
- `GET /api/inventory` - Liste tous les produits
- `PUT /api/inventory/:id` - Mettre à jour un produit

### Alarms
- `GET /api/alarms` - Liste toutes les alarmes
- `PUT /api/alarms/:id/acknowledge` - Acquitter une alarme

### Batches
- `GET /api/batches` - Liste tous les lots
- `GET /api/batches/:id` - Détails d'un lot

## Base de données

La base de données SQLite est stockée dans `database.sqlite` à la racine du dossier server.

### Tables
- `users` - Utilisateurs
- `mixers` - Malaxeurs (6 malaxeurs)
- `recipes` - Recettes
- `recipe_steps` - Étapes des recettes
- `batches` - Lots de production
- `batch_steps` - Étapes exécutées
- `batch_metrics` - Métriques de production
- `inventory` - Stocks
- `inventory_transactions` - Transactions de stock
- `alarms` - Alarmes

## Migration vers PostgreSQL

Pour migrer vers PostgreSQL en production, il suffit de :
1. Remplacer `sqlite3` par `pg` (PostgreSQL)
2. Modifier les requêtes SQL si nécessaire
3. Configurer les variables d'environnement pour la connexion

