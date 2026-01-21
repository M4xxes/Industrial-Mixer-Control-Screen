// Script de diagnostic MySQL
import mysql from 'mysql2/promise';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testPassword(password) {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: password,
    });
    await connection.end();
    return true;
  } catch (error) {
    return false;
  }
}

async function checkMySQLRunning() {
  try {
    const { stdout } = await execAsync('brew services list | grep mysql || pgrep -f mysqld || echo "not_found"');
    return !stdout.includes('not_found');
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Diagnostic MySQL\n');

  // 1. Vérifier si MySQL est en cours d'exécution
  console.log('1️⃣  Vérification de MySQL...');
  const isRunning = await checkMySQLRunning();
  if (!isRunning) {
    console.log('   ❌ MySQL ne semble pas être en cours d\'exécution');
    console.log('   💡 Essayez: brew services start mysql');
    console.log('   💡 Ou: sudo /usr/local/mysql/support-files/mysql.server start\n');
  } else {
    console.log('   ✅ MySQL semble être en cours d\'exécution\n');
  }

  // 2. Tester différents mots de passe
  console.log('2️⃣  Test des mots de passe...');
  const passwords = ['mysql123', '', 'root', 'password', 'admin'];
  
  for (const pwd of passwords) {
    const result = await testPassword(pwd);
    if (result) {
      console.log(`   ✅ Mot de passe fonctionnel: "${pwd || '(vide)'}"`);
      console.log(`   💡 Utilisez ce mot de passe dans vos scripts\n`);
      return;
    }
  }
  
  console.log('   ❌ Aucun mot de passe standard ne fonctionne');
  console.log('   💡 Vous devez trouver votre mot de passe MySQL\n');

  // 3. Suggestions
  console.log('3️⃣  Solutions possibles:\n');
  console.log('   Option A: Se connecter sans mot de passe');
  console.log('      mysql -u root\n');
  
  console.log('   Option B: Utiliser un utilisateur différent');
  console.log('      mysql -u votre_user -p\n');
  
  console.log('   Option C: Réinitialiser le mot de passe root');
  console.log('      Voir: server/CONFIGURATION_MYSQL.md\n');
  
  console.log('   Option D: Vérifier avec MySQL Workbench ou phpMyAdmin\n');
}

main().catch(console.error);
