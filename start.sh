#!/bin/bash

echo "🚀 Démarrage du système de supervision multi-malaxeurs"
echo ""

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Libérer les ports si nécessaire
echo "🔍 Vérification des ports..."
if lsof -ti:3001 &> /dev/null; then
    echo "   ⚠️  Port 3001 déjà utilisé, libération..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    sleep 1
fi

if lsof -ti:5173 &> /dev/null; then
    echo "   ⚠️  Port 5173 déjà utilisé, libération..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null
    sleep 1
fi

# Vérifier et installer les dépendances du backend
echo ""
echo "📦 Vérification des dépendances backend..."
cd server
if [ ! -d "node_modules" ]; then
    echo "   📥 Installation des dépendances backend..."
    npm install
fi

# Vérifier la connexion MySQL
echo "🔍 Vérification de MySQL..."
if ! command -v mysql &> /dev/null; then
    echo "   ⚠️  MySQL n'est pas installé, mais le serveur peut fonctionner si MySQL est accessible"
fi
echo "   📝 Assurez-vous que votre base MySQL est importée (voir MYSQL_MIGRATION_COMPLETE.md)"
cd ..

# Vérifier et installer les dépendances du frontend
echo ""
echo "📦 Vérification des dépendances frontend..."
if [ ! -d "node_modules" ]; then
    echo "   📥 Installation des dépendances frontend..."
    npm install
fi

# Démarrer le backend
echo ""
echo "🔧 Démarrage du serveur backend..."
cd server
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Attendre que le backend démarre
echo "   ⏳ Attente du démarrage du backend..."
sleep 4

# Vérifier que le backend fonctionne
if ! curl -s http://localhost:3001/api/mixers > /dev/null 2>&1; then
    echo "   ❌ Erreur: Le backend n'a pas démarré correctement"
    echo "   📋 Consultez backend.log pour plus de détails"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi
echo "   ✅ Backend démarré sur http://localhost:3001"

# Démarrer le frontend
echo ""
echo "🌐 Démarrage du frontend..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Attendre un peu pour le frontend
sleep 2

# Vérifier que le frontend fonctionne
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "   ⚠️  Le frontend démarre, cela peut prendre quelques secondes..."
else
    echo "   ✅ Frontend démarré sur http://localhost:5173"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Système démarré avec succès !"
echo "   🔧 Backend:  http://localhost:3001"
echo "   🌐 Frontend: http://localhost:5173"
echo ""
echo "📝 Logs:"
echo "   - Backend:  tail -f backend.log"
echo "   - Frontend: tail -f frontend.log"
echo ""
echo "⚠️  Appuyez sur Ctrl+C pour arrêter les serveurs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Fonction de nettoyage à l'arrêt
cleanup() {
    echo ""
    echo "🛑 Arrêt des serveurs..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Serveurs arrêtés"
    exit 0
}

# Capturer Ctrl+C
trap cleanup INT TERM

# Attendre que les processus se terminent
wait

