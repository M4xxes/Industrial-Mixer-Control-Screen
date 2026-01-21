# 🔐 Résolution du problème de mot de passe MySQL

## Problème
Le mot de passe `mysql123` ne fonctionne pas pour l'utilisateur `root`.

## Solutions

### Solution 1 : Trouver le mot de passe existant

Si vous avez MySQL Workbench ou un autre outil graphique :
1. Ouvrez MySQL Workbench
2. Regardez les connexions sauvegardées
3. Le mot de passe peut être visible ou mémorisé

### Solution 2 : Réinitialiser le mot de passe root

**⚠️ Cette méthode arrête MySQL temporairement**

#### Sur macOS (Homebrew) :

```bash
# 1. Arrêter MySQL
brew services stop mysql

# 2. Démarrer MySQL en mode sûr (sans authentification)
mysqld_safe --skip-grant-tables --skip-networking &

# 3. Attendre quelques secondes que MySQL démarre
sleep 3

# 4. Se connecter (sans mot de passe)
mysql -u root

# 5. Dans l'invite MySQL, exécutez :
USE mysql;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'mysql123';
FLUSH PRIVILEGES;
EXIT;

# 6. Arrêter MySQL en mode sûr
killall mysqld
sleep 2

# 7. Redémarrer MySQL normalement
brew services start mysql

# 8. Tester la nouvelle connexion
mysql -u root -pmysql123
```

### Solution 3 : Créer un nouvel utilisateur (si root ne fonctionne pas)

Si vous pouvez vous connecter d'une autre manière, créez un utilisateur :

```bash
# Se connecter (remplacez par votre méthode)
mysql -u root -p

# Dans MySQL :
CREATE USER 'supervision'@'localhost' IDENTIFIED BY 'mysql123';
GRANT ALL PRIVILEGES ON supervision.* TO 'supervision'@'localhost';
GRANT ALL PRIVILEGES ON malaxeur_db.* TO 'supervision'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Puis modifiez `server/db.js` pour utiliser cet utilisateur.

### Solution 4 : Utiliser un fichier de configuration MySQL

Créez `~/.my.cnf` avec vos identifiants :

```ini
[client]
user=root
password=votre_vrai_mot_de_passe
```

Puis testez : `mysql` (sans options)

## Après avoir résolu le problème

Une fois que vous pouvez vous connecter :

```bash
# 1. Importer la base
mysql -u root -p < mysql.sql

# 2. Créer les tables manquantes
cd server
npm run create-tables

# 3. Tester
npm run test-connection

# 4. Démarrer
cd ..
./start.sh
```

## Vérifier votre version MySQL

```bash
mysql --version
```

Si vous avez MySQL 8.0+, la syntaxe de réinitialisation est différente :
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'mysql123';
```
