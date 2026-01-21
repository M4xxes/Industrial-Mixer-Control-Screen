# Guide d'import de la base MySQL

## Méthode 1 : Via le script Node.js (recommandé)

```bash
cd server

# Définir les variables d'environnement (optionnel)
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=votre_mot_de_passe

# Importer la base
npm run import-mysql

# Créer les tables manquantes
npm run create-tables
```

## Méthode 2 : Via MySQL en ligne de commande

```bash
mysql -u root -p < ../mysql.sql
```

Ou si votre mot de passe est dans une variable :
```bash
mysql -u root -p"votre_mot_de_passe" < ../mysql.sql
```

## Méthode 3 : Via MySQL Workbench

1. Ouvrez MySQL Workbench
2. Connectez-vous à votre serveur
3. Menu : `File` → `Run SQL Script`
4. Sélectionnez le fichier `mysql.sql`
5. Cliquez sur "Run"

## Vérification

Une fois importé, vous devriez avoir deux bases :
- `supervision` (tables principales)
- `malaxeur_db` (défauts et paramètres)

Vérifiez avec :
```sql
SHOW DATABASES;
USE supervision;
SHOW TABLES;
```

## Création des tables manquantes

Après l'import, exécutez :
```bash
cd server
npm run create-tables
```

Cela créera les tables `mixers`, `inventory`, `alarms`, `batch_distribution`, etc. nécessaires pour le fonctionnement de l'application.
