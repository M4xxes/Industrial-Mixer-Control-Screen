# Migration vers MySQL - Guide Complet

## 📋 Vue d'ensemble

Le système utilise maintenant **exclusivement MySQL** avec votre structure de base de données.

### Bases de données :
- **`supervision`** : Tables principales (recettes, cycles, étapes, ingrédients)
- **`malaxeur_db`** : Défauts et paramètres

## 🚀 Installation

### 1. Importer votre base de données

Vous avez deux options :

#### Option A : Via MySQL Workbench
1. Ouvrez MySQL Workbench
2. Connectez-vous à votre serveur
3. Ouvrez le fichier `mysql.sql`
4. Exécutez le script

#### Option B : Via ligne de commande
```bash
mysql -u root -p < mysql.sql
```

Ou utilisez le script fourni :
```bash
cd server
chmod +x import-mysql.sh
./import-mysql.sh
```

### 2. Configuration

Créez un fichier `.env` dans le dossier `server/` :

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
```

Ou définissez les variables d'environnement directement.

### 3. Installer les dépendances

```bash
cd server
npm install
```

### 4. Démarrer le serveur

```bash
npm start
```

## 📊 Structure des tables

### Base `supervision` :

- **`recettes`** : Recettes de production
  - Colonnes principales : `id`, `code`, `nom`, `description`, `malaxeur`, `actif`, `date_creation`, `date_modification`
  
- **`etapes_recette`** : Étapes des recettes
  - Colonnes principales : `id`, `recette_id`, `numero_etape`, `fonction`, `bras`, `vis`, `duree_maxi_sec`, `produit`, `consigne_kg`
  
- **`cycles_production`** : Cycles de production (équivalent aux batches)
  - Colonnes principales : `id`, `recette_id`, `malaxeur`, `date_debut`, `date_fin`, `statut`, `operateur`
  
- **`etapes_execution`** : Exécution des étapes
  - Colonnes principales : `id`, `cycle_id`, `etape_recette_id`, `numero_etape`, `date_debut`, `date_fin`, `duree_reelle_sec`, `quantite_dosee`
  
- **`ingredients`** : Ingrédients disponibles
  - Colonnes principales : `id`, `code`, `nom`, `description`, `unite`, `actif`

### Base `malaxeur_db` :

- **`defauts_catalogue`** : Catalogue des défauts
- **`defauts_historique`** : Historique des défauts
- **`parametres`** : Paramètres du système

## 🔄 Changements effectués

1. ✅ **Suppression du support SQLite** - Utilisation exclusive de MySQL
2. ✅ **Support multi-base** - Les fonctions `run`, `get`, `all` acceptent un paramètre `database`
3. ✅ **Anciens fichiers SQLite archivés** - Renommés en `.old`

## ⚠️ Notes importantes

- Les anciens fichiers SQLite ont été archivés (`.sqlite.old`)
- Le système nécessite maintenant MySQL pour fonctionner
- Assurez-vous que MySQL est démarré avant de lancer le serveur

## 🛠️ Prochaines étapes

Le fichier `server.js` devra être adapté pour utiliser les nouveaux noms de tables et colonnes. Les principales adaptations :

- `recipes` → `recettes`
- `recipe_steps` → `etapes_recette`
- `batches` → `cycles_production`
- `batch_steps` → `etapes_execution`

Les noms de colonnes doivent aussi être adaptés selon votre schéma MySQL.
