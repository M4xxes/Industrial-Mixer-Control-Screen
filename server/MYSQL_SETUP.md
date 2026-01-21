# Guide de connexion à MySQL

## 📋 Vue d'ensemble

Le système supporte maintenant **SQLite** (par défaut) et **MySQL**. Vous pouvez basculer entre les deux facilement via les variables d'environnement.

## 🚀 Installation rapide

### Étape 1 : Installer les dépendances

```bash
cd server
npm install
```

Le package `mysql2` est maintenant inclus dans les dépendances.

### Étape 2 : Créer la base de données MySQL

Connectez-vous à MySQL et créez la base de données :

```sql
CREATE DATABASE supervision_malaxeurs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Étape 3 : Configuration via variables d'environnement

Créez un fichier `.env` dans le dossier `server/` :

```env
# Type de base de données
DB_TYPE=mysql

# Configuration MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe
DB_NAME=supervision_malaxeurs
```

Ou définissez les variables directement avant de lancer :

```bash
export DB_TYPE=mysql
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=votre_mot_de_passe
export DB_NAME=supervision_malaxeurs
npm start
```

### Étape 4 : Initialiser la base de données

```bash
node init-db.js
node seed-data.js
```

## ⚙️ Configuration avancée

### Utiliser SQLite (par défaut)

```env
DB_TYPE=sqlite
DB_PATH=./database.sqlite
```

Ou simplement ne rien définir, SQLite sera utilisé par défaut.

### Utiliser MySQL

```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=supervision_malaxeurs
```

## 📝 Notes importantes

1. **Syntaxe SQL** : La plupart des requêtes sont compatibles, mais certaines différences existent :
   - SQLite : `AUTOINCREMENT` 
   - MySQL : `AUTO_INCREMENT`
   - Le fichier `init-db.js` doit être adapté si vous utilisez MySQL

2. **Types de données** : MySQL est plus strict sur les types que SQLite

3. **Performance** : MySQL offre généralement de meilleures performances pour les applications en production

## 🔍 Vérification

Pour vérifier que la connexion fonctionne :

```bash
# Vérifier dans les logs du serveur
npm start

# Vous devriez voir :
# 📦 Connexion MySQL vers localhost:3306/supervision_malaxeurs
```

## 🛠️ Dépannage

**Erreur de connexion :**
- Vérifiez que MySQL est démarré : `mysql -u root -p`
- Vérifiez les identifiants dans `.env`
- Vérifiez que la base de données existe

**Erreur "Access denied" :**
- Vérifiez les permissions de l'utilisateur MySQL
- Créez un utilisateur dédié : 
  ```sql
  CREATE USER 'supervision'@'localhost' IDENTIFIED BY 'mot_de_passe';
  GRANT ALL PRIVILEGES ON supervision_malaxeurs.* TO 'supervision'@'localhost';
  FLUSH PRIVILEGES;
  ```
