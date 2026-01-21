# 🔧 Configuration MySQL

## Identifiants fournis
- **User**: `root`
- **Password**: `mysql123`

## 🧪 Test de connexion

### Méthode 1 : Via MySQL en ligne de commande
```bash
mysql -u root -pmysql123
```

Si ça fonctionne, vous verrez :
```
Welcome to the MySQL monitor...
mysql>
```

### Méthode 2 : Via le script Node.js
```bash
cd server
npm run test-connection
```

## ❌ Si vous avez une erreur "Access denied"

### Vérifier que MySQL est démarré
```bash
# macOS (si installé via Homebrew)
brew services list | grep mysql

# Démarrer MySQL si nécessaire
brew services start mysql
```

### Vérifier le mot de passe

Le mot de passe peut être différent. Essayez :

1. **Sans mot de passe** (si configuré comme ça) :
   ```bash
   mysql -u root
   ```

2. **Avec un autre mot de passe** :
   - Essayez votre mot de passe habituel
   - Ou réinitialisez-le si nécessaire

### Réinitialiser le mot de passe MySQL (si nécessaire)

**⚠️ Attention**: Cette procédure arrête MySQL temporairement

```bash
# Arrêter MySQL
brew services stop mysql

# Démarrer MySQL en mode sûr
mysqld_safe --skip-grant-tables &

# Se connecter (sans mot de passe)
mysql -u root

# Dans MySQL, changer le mot de passe
USE mysql;
UPDATE user SET authentication_string=PASSWORD('mysql123') WHERE User='root';
FLUSH PRIVILEGES;
EXIT;

# Redémarrer MySQL normalement
brew services restart mysql
```

## ✅ Une fois la connexion établie

### 1. Importer votre base de données
```bash
mysql -u root -pmysql123 < ../mysql.sql
```

### 2. Créer les tables manquantes
```bash
cd server
npm run create-tables
```

### 3. Vérifier que tout est OK
```bash
npm run test-connection
```

### 4. Démarrer le serveur
```bash
cd ..
./start.sh
```

## 📝 Configuration dans .env (optionnel)

Si vous préférez utiliser un fichier `.env`, créez `server/.env` :
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=mysql123
```

Le code utilise déjà `mysql123` par défaut, donc ce fichier est optionnel.
