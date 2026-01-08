#!/bin/bash

echo "🚀 Démarrage du système de supervision multi-malaxeurs"
echo ""

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Démarrer le backend
echo "📦 Démarrage du serveur backend..."
cd server
if [ ! -f "database.sqlite" ]; then
    echo "🔧 Initialisation de la base de données..."
    npm install
    npm run init-db
    node seed-data.js
fi
npm start &
BACKEND_PID=$!
cd ..

# Attendre que le backend démarre
sleep 3

# Démarrer le frontend
echo "🌐 Démarrage du frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Système démarré !"
echo "   - Backend: http://localhost:3001"
echo "   - Frontend: http://localhost:5173"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter les serveurs"

# Attendre l'interruption
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait

