// Script pour importer la base de données MySQL
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function importDatabase() {
  // Configuration MySQL depuis les variables d'environnement
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };

  let connection;
  try {
    console.log('🔌 Connexion à MySQL...');
    connection = await mysql.createConnection(config);

    console.log('📖 Lecture du fichier mysql.sql...');
    const sqlFile = readFileSync(join(__dirname, '..', 'mysql.sql'), 'utf8');

    console.log('📥 Import de la base de données (cela peut prendre quelques instants)...');
    await connection.query(sqlFile);

    console.log('✅ Base de données importée avec succès !');
    console.log('');
    console.log('Bases de données créées :');
    console.log('  - supervision');
    console.log('  - malaxeur_db');
  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

importDatabase();
