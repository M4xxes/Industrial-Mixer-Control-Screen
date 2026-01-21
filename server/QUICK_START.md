# 🚀 Démarrage rapide

## Étape 1 : Configurer MySQL

### A. Trouver votre mot de passe MySQL

Essayez ces commandes dans l'ordre :

```bash
# 1. Sans mot de passe
mysql -u root

# 2. Avec le mot de passe fourni
mysql -u root -pmysql123

# 3. Demander le mot de passe
mysql -u root -p
```

**Si aucune ne fonctionne**, consultez `RESOLVE_MYSQL_PASSWORD.md` pour réinitialiser le mot de passe.

### B. Créer le fichier .env

Une fois que vous connaissez votre mot de passe, créez `server/.env` :

```bash
cd server
cp .env.example .env
# Éditez .env et mettez votre vrai mot de passe
```

Ou créez directement :
```bash
cat > server/.env << EOF
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_ici
EOF
```

## Étape 2 : Importer la base de données

```bash
# Depuis la racine du projet
mysql -u root -p < mysql.sql
# Entrez votre mot de passe quand demandé
```

## Étape 3 : Créer les tables manquantes

```bash
cd server
npm run create-tables
```

## Étape 4 : Tester la connexion

```bash
npm run test-connection
```

Vous devriez voir :
```
✅ Connexion réussie !
✅ Les bases de données sont prêtes !
```

## Étape 5 : Démarrer l'application

```bash
cd ..
./start.sh
```

---

## ⚠️ Dépannage

### "Access denied"
→ Vérifiez votre mot de passe dans `server/.env` ou utilisez `RESOLVE_MYSQL_PASSWORD.md`

### "Table doesn't exist"
→ Exécutez `npm run create-tables` dans le dossier `server/`

### "MySQL is not running"
→ Démarrez MySQL : `brew services start mysql` (macOS) ou votre méthode habituelle
