// Script de test de connexion MySQL
import 'dotenv/config';
import mysql from 'mysql2/promise';

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'mysql123',
};

async function testConnection() {
  try {
    console.log('🔌 Test de connexion MySQL...');
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   User: ${config.user}`);
    
    const connection = await mysql.createConnection(config);
    console.log('✅ Connexion réussie !');
    
    // Lister les bases de données
    const [databases] = await connection.query('SHOW DATABASES');
    console.log('\n📊 Bases de données disponibles:');
    databases.forEach(db => {
      console.log(`   - ${db.Database}`);
    });
    
    // Vérifier si supervision existe
    const supervisionExists = databases.some(db => db.Database === 'supervision');
    const malaxeurDbExists = databases.some(db => db.Database === 'malaxeur_db');
    
    console.log('\n📋 Statut:');
    console.log(`   supervision: ${supervisionExists ? '✅ Existe' : '❌ Manquante'}`);
    console.log(`   malaxeur_db: ${malaxeurDbExists ? '✅ Existe' : '❌ Manquante'}`);
    
    if (supervisionExists) {
      await connection.query('USE supervision');
      const [tables] = await connection.query('SHOW TABLES');
      console.log(`\n📋 Tables dans supervision (${tables.length}):`);
      tables.forEach(table => {
        console.log(`   - ${Object.values(table)[0]}`);
      });
    }
    
    await connection.end();
    
    if (!supervisionExists || !malaxeurDbExists) {
      console.log('\n⚠️  Action requise:');
      console.log('   Exécutez: mysql -u root -p < ../mysql.sql');
      console.log('   Ou utilisez MySQL Workbench pour importer mysql.sql');
    } else {
      console.log('\n✅ Les bases de données sont prêtes !');
    }
    
  } catch (error) {
    console.error('\n❌ Erreur de connexion:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Vérifiez votre mot de passe MySQL dans server/.env');
      console.log('   Ou modifiez les variables d\'environnement:');
      console.log('   export DB_PASSWORD=votre_mot_de_passe');
    }
    process.exit(1);
  }
}

testConnection();
