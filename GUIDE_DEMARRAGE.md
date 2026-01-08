# Guide de Démarrage

## ⚠️ Important : Ordre de démarrage

Le système nécessite **2 serveurs** qui doivent être démarrés dans l'ordre :

1. **Backend (API)** sur le port 3001
2. **Frontend (React)** sur le port 5173

## 🚀 Démarrage Rapide

### Option 1 : Démarrage Automatique (Recommandé)

```bash
./start.sh
```

### Option 2 : Démarrage Manuel

#### Étape 1 : Backend (Terminal 1)

```bash
cd server
npm install  # Si première fois
npm run init-db  # Si première fois
node seed-data.js  # Si première fois
npm start
```

Vous devriez voir :
```
🚀 Serveur API démarré sur http://localhost:3001
📊 Base de données: database.sqlite
🌐 Testez l'API: http://localhost:3001/api/mixers
```

#### Étape 2 : Frontend (Terminal 2)

```bash
# Dans le dossier racine du projet
npm install  # Si première fois
npm run dev
```

Vous devriez voir :
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

#### Étape 3 : Ouvrir le navigateur

Accédez à : **http://localhost:5173**

⚠️ **NE PAS** accéder à http://localhost:3001 directement - c'est l'API backend, pas l'interface web !

## 🔍 Vérification

### Vérifier que le backend fonctionne

Ouvrez dans votre navigateur ou avec curl :
- http://localhost:3001/ → Devrait afficher les informations de l'API
- http://localhost:3001/api/mixers → Devrait retourner la liste des malaxeurs (JSON)

### Vérifier que le frontend fonctionne

- http://localhost:5173 → Devrait afficher l'interface de supervision

## ❌ Erreurs Courantes

### "Cannot GET /"

**Cause** : Vous essayez d'accéder à http://localhost:3001/ directement

**Solution** : 
- Le backend est une API, pas une interface web
- Accédez à http://localhost:5173 pour l'interface
- Ou testez http://localhost:3001/api/mixers pour voir les données JSON

### "Failed to fetch" ou erreurs réseau dans le frontend

**Cause** : Le backend n'est pas démarré

**Solution** :
1. Vérifiez que le backend tourne sur le port 3001
2. Vérifiez dans la console du navigateur l'URL appelée
3. Assurez-vous que le fichier `.env` contient : `VITE_API_URL=http://localhost:3001/api`

### "Port 3001 already in use"

**Cause** : Un autre processus utilise le port 3001

**Solution** :
```bash
# Trouver le processus
lsof -ti:3001

# Tuer le processus (remplacer PID par le numéro trouvé)
kill -9 PID
```

### "database.sqlite not found"

**Cause** : La base de données n'a pas été initialisée

**Solution** :
```bash
cd server
npm run init-db
node seed-data.js
```

## 📝 Configuration

### Fichier .env (optionnel)

Créez un fichier `.env` à la racine du projet frontend :

```
VITE_API_URL=http://localhost:3001/api
```

Si ce fichier n'existe pas, l'application utilisera `http://localhost:3001/api` par défaut.

## 🛑 Arrêter les serveurs

### Si vous avez utilisé start.sh

Appuyez sur `Ctrl+C` dans le terminal

### Si vous avez démarré manuellement

- Terminal backend : `Ctrl+C`
- Terminal frontend : `Ctrl+C`

## 🔄 Redémarrage

Si vous modifiez le code backend, redémarrez le serveur :
```bash
cd server
npm start
```

Si vous modifiez le code frontend, Vite recharge automatiquement (Hot Module Replacement).

