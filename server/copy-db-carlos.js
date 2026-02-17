/**
 * Copie de la base de données pour Carlos
 * Crée une copie de database.sqlite dans le dossier backups/carlos avec la date.
 * Usage: node copy-db-carlos.js
 */
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'database.sqlite');
const backupDir = join(__dirname, 'backups', 'carlos');
const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const destPath = join(backupDir, `database_${dateStr}.sqlite`);

if (!existsSync(dbPath)) {
  console.error('❌ Fichier database.sqlite introuvable dans', __dirname);
  process.exit(1);
}

try {
  mkdirSync(backupDir, { recursive: true });
  copyFileSync(dbPath, destPath);
  console.log('✅ Copie BDD pour Carlos effectuée:', destPath);
} catch (err) {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
}
