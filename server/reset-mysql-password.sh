#!/bin/bash
# Script pour réinitialiser le mot de passe MySQL root à mysql123

echo "🔄 Réinitialisation du mot de passe MySQL..."
echo ""
echo "⚠️  Cette procédure va arrêter MySQL temporairement"
echo ""

# Arrêter MySQL
echo "1️⃣  Arrêt de MySQL..."
brew services stop mysql 2>/dev/null || sudo /usr/local/mysql/support-files/mysql.server stop 2>/dev/null
sleep 2

# Démarrer MySQL en mode sûr
echo "2️⃣  Démarrage de MySQL en mode sûr..."
mysqld_safe --skip-grant-tables --skip-networking &
MYSQL_PID=$!
sleep 3

# Réinitialiser le mot de passe
echo "3️⃣  Réinitialisation du mot de passe..."
mysql -u root << 'EOF'
USE mysql;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'mysql123';
FLUSH PRIVILEGES;
EXIT;
EOF

# Arrêter MySQL en mode sûr
echo "4️⃣  Arrêt du mode sûr..."
kill $MYSQL_PID 2>/dev/null
sleep 2

# Redémarrer MySQL normalement
echo "5️⃣  Redémarrage de MySQL..."
brew services start mysql 2>/dev/null || sudo /usr/local/mysql/support-files/mysql.server start 2>/dev/null
sleep 3

# Tester la connexion
echo ""
echo "6️⃣  Test de la connexion..."
if mysql -u root -pmysql123 -e "SELECT 1;" 2>/dev/null; then
    echo "✅ Mot de passe réinitialisé avec succès !"
    echo "   Vous pouvez maintenant utiliser mysql123 comme mot de passe"
else
    echo "❌ Échec de la réinitialisation"
    echo "   Essayez manuellement ou consultez server/RESOLVE_MYSQL_PASSWORD.md"
fi
