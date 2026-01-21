# 🚀 Commandes pour lancer l'application

## Commande unique (recommandée)

```bash
./start.sh
```

Cette commande :
- ✅ Libère les ports 3001 et 5173 si nécessaire
- ✅ Vérifie les dépendances
- ✅ Lance le backend sur http://localhost:3001
- ✅ Lance le frontend sur http://localhost:5173

---

## Commandes manuelles (si besoin)

### 1. Backend uniquement

```bash
cd server
npm start
```

### 2. Frontend uniquement

```bash
npm run dev
```

### 3. Les deux en arrière-plan

```bash
# Terminal 1 - Backend
cd server && npm start

# Terminal 2 - Frontend  
npm run dev
```

---

## ⚠️ Important : MySQL doit être configuré

Avant de lancer, assurez-vous que :

1. **MySQL est démarré** :
   ```bash
   brew services start mysql
   ```

2. **Le fichier `.env` existe** dans `server/.env` avec :
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=mysql123
   ```

3. **La base est importée** :
   ```bash
   mysql -u root -pmysql123 < mysql.sql
   ```

4. **Les tables manquantes sont créées** :
   ```bash
   cd server && npm run create-tables && cd ..
   ```

---

## 📍 URLs

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3001
- **API Test** : http://localhost:3001/api/mixers

---

## 🛑 Pour arrêter

Appuyez sur `Ctrl+C` dans le terminal où vous avez lancé `./start.sh`

Ou tuez les processus :
```bash
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```
