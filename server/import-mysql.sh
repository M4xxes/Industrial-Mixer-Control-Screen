#!/bin/bash

# Script pour importer le fichier SQL MySQL

echo "📥 Import de la base de données MySQL..."
echo ""

# Vérifier si MySQL est installé
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Demander les informations de connexion
read -p "Host MySQL [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Port MySQL [3306]: " DB_PORT
DB_PORT=${DB_PORT:-3306}

read -p "Utilisateur MySQL [root]: " DB_USER
DB_USER=${DB_USER:-root}

read -s -p "Mot de passe MySQL: " DB_PASSWORD
echo ""

# Importer le fichier SQL
echo ""
echo "🔄 Import du fichier mysql.sql..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" < ../mysql.sql

if [ $? -eq 0 ]; then
    echo "✅ Base de données importée avec succès !"
else
    echo "❌ Erreur lors de l'import"
    exit 1
fi
