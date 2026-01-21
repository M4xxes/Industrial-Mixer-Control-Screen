# ✅ Migration vers MySQL - Terminée

## 📋 Résumé des modifications

✅ **Tous les fichiers ont été adaptés pour MySQL**

### Fichiers modifiés :
1. **`server/db.js`** - Adapté pour MySQL avec support multi-base (supervision & malaxeur_db)
2. **`server/server.js`** - Toutes les requêtes adaptées pour vos tables MySQL :
   - `recipes` → `recettes`
   - `recipe_steps` → `etapes_recette`
   - `batches` → `cycles_production`
   - Adaptation de tous les noms de colonnes
3. **`server/create-missing-tables.js`** - Script pour créer les tables manquantes
4. **`server/import-mysql.js`** - Script d'import de votre fichier SQL
5. **Anciens fichiers SQLite archivés** - Renommés en `.sqlite.old`

## 🚀 Démarrage rapide

### Étape 1 : Importer votre base MySQL

**Option A : Via MySQL Workbench**
1. Ouvrez MySQL Workbench
2. Connectez-vous à votre serveur MySQL
3. Menu : `File` → `Run SQL Script`
4. Sélectionnez le fichier `mysql.sql` à la racine du projet
5. Cliquez sur "Run"

**Option B : Via ligne de commande**
```bash
mysql -u root -p < mysql.sql
```

**Option C : Via le script Node.js**
```bash
cd server
export DB_PASSWORD=votre_mot_de_passe
npm run import-mysql
```

### Étape 2 : Créer les tables manquantes

Les tables suivantes n'existent pas dans votre SQL mais sont nécessaires :
- `mixers` (pour gérer les malaxeurs)
- `inventory` (pour le stock)
- `alarms` (pour les alarmes)
- `batch_distribution` (pour la distribution des produits)

Créez-les avec :
```bash
cd server
npm run create-tables
```

### Étape 3 : Configuration (optionnel)

Si votre MySQL nécessite des identifiants spécifiques, créez `server/.env` :
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
```

### Étape 4 : Démarrer le serveur

```bash
./start.sh
```

Ou manuellement :
```bash
cd server
npm start
```

## 📊 Structure des bases de données

### Base `supervision` :
- ✅ `recettes` - Vos recettes
- ✅ `etapes_recette` - Étapes des recettes
- ✅ `cycles_production` - Cycles de production (équivalent aux batches)
- ✅ `etapes_execution` - Exécution des étapes
- ✅ `ingredients` - Ingrédients
- ✅ `mixers` - Malaxeurs (créée par create-missing-tables.js)
- ✅ `inventory` - Stock (créée par create-missing-tables.js)
- ✅ `alarms` - Alarmes (créée par create-missing-tables.js)
- ✅ `batch_distribution` - Distribution des produits (créée par create-missing-tables.js)

### Base `malaxeur_db` :
- ✅ `defauts_catalogue` - Catalogue des défauts
- ✅ `defauts_historique` - Historique des défauts
- ✅ `parametres` - Paramètres du système

## 🔄 Correspondances des noms

| Ancien (SQLite) | Nouveau (MySQL) |
|----------------|-----------------|
| `recipes` | `recettes` |
| `recipe_steps` | `etapes_recette` |
| `batches` | `cycles_production` |
| `batch_steps` | `etapes_execution` |
| `name` | `nom` |
| `created_at` | `date_creation` |
| `updated_at` | `date_modification` |
| `step_number` | `numero_etape` |
| `duration` | `duree_maxi_sec` |
| `weight` | `consigne_kg` |
| `product` | `produit` |
| `vacuum` | `vide_pourcent` |
| `started_at` | `date_debut` |
| `completed_at` | `date_fin` |
| `status` | `statut` |
| `operator_id` | `operateur` |

## ⚠️ Notes importantes

1. **MySQL doit être démarré** avant de lancer l'application
2. **Les identifiants MySQL** doivent être configurés (via variables d'environnement ou .env)
3. **Les tables manquantes** doivent être créées avec `npm run create-tables`
4. **Les anciens fichiers SQLite** ont été archivés (`.sqlite.old`) mais ne sont plus utilisés

## 🐛 Dépannage

**Erreur de connexion :**
- Vérifiez que MySQL est démarré : `mysql -u root -p`
- Vérifiez les identifiants dans les variables d'environnement

**Erreur "Table doesn't exist" :**
- Exécutez `npm run create-tables` dans le dossier server/

**Erreur "Access denied" :**
- Vérifiez votre mot de passe MySQL
- Créez un fichier `.env` dans server/ avec vos identifiants

## 📝 Prochaines étapes

Une fois l'import terminé et les tables créées, lancez simplement :
```bash
./start.sh
```

L'application utilisera maintenant votre base MySQL au lieu de SQLite !
