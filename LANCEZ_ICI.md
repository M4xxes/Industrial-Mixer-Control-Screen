# 🚀 Guide de lancement rapide

## 📋 Prérequis

1. ✅ MySQL installé et démarré
2. ✅ Base de données importée (ou à importer)
3. ✅ Tables manquantes créées (ou à créer)

## 🎯 Lancer l'application en 3 étapes

### Option A : Si MySQL est déjà configuré et la base importée

```bash
./start.sh
```

C'est tout ! 🎉

---

### Option B : Première installation (si pas encore fait)

#### Étape 1 : Configurer MySQL

**A. Si vous ne connaissez pas votre mot de passe MySQL :**

```bash
# Essayez de vous connecter
mysql -u root -p
```

Si ça ne fonctionne pas, consultez `server/RESOLVE_MYSQL_PASSWORD.md` pour le réinitialiser.

**B. Créer le fichier de configuration :**

Une fois que vous connaissez votre mot de passe, créez `server/.env` :

```bash
cd server
cat > .env << EOF
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_ici
EOF
cd ..
```

#### Étape 2 : Importer la base MySQL

```bash
mysql -u root -p < mysql.sql
```

#### Étape 3 : Créer les tables manquantes

```bash
cd server
npm run create-tables
cd ..
```

#### Étape 4 : Tester que tout fonctionne

```bash
cd server
npm run test-connection
cd ..
```

Vous devriez voir : `✅ Les bases de données sont prêtes !`

#### Étape 5 : Lancer l'application

```bash
./start.sh
```

---

## 🐛 Problèmes courants

### "Access denied"
→ Vérifiez votre mot de passe dans `server/.env`

### "Can't connect to MySQL server"
→ Vérifiez que MySQL est démarré : `brew services start mysql` (macOS)

### "Table doesn't exist"
→ Exécutez : `cd server && npm run create-tables && cd ..`

### Port déjà utilisé
→ Le script `./start.sh` devrait les libérer automatiquement. Sinon :
```bash
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

---

## ✅ Une fois lancé

- **Backend** : http://localhost:3001
- **Frontend** : http://localhost:5173
- **API** : http://localhost:3001/api/mixers

Les logs apparaissent dans :
- `backend.log` (serveur)
- `frontend.log` (client)

Pour arrêter : `Ctrl+C` dans le terminal ou tuer les processus.
