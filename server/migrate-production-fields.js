import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./database.sqlite');
const run = promisify(db.run.bind(db));

async function migrateProductionFields() {
  try {
    console.log('Migration des champs de production...');

    // Vérifier si les colonnes existent déjà dans batches
    const batchInfo = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(batches)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const batchColumns = batchInfo.map(col => col.name);
    
    // Ajouter les colonnes manquantes dans batches
    const batchFields = [
      { name: 'formule', type: 'TEXT' },
      { name: 'designation', type: 'TEXT' },
      { name: 'fabricant', type: 'TEXT' },
      { name: 'temps_restant_sec', type: 'INTEGER' },
      { name: 'produit_consigne', type: 'REAL' },
      { name: 'produit_mesure', type: 'REAL' },
      { name: 'prochain_appel_operateur_min', type: 'INTEGER' },
      { name: 'appel_preparation_vide_min', type: 'INTEGER' },
    ];

    for (const field of batchFields) {
      if (!batchColumns.includes(field.name)) {
        await run(`ALTER TABLE batches ADD COLUMN ${field.name} ${field.type}`);
        console.log(`Colonne ${field.name} ajoutée à batches`);
      }
    }

    // Créer la table batch_distribution pour les dosages
    await run(`
      CREATE TABLE IF NOT EXISTS batch_distribution (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        qte_formule REAL DEFAULT 0,
        qte_dosee REAL DEFAULT 0,
        dose REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
        UNIQUE(batch_id, product_name)
      )
    `);
    console.log('Table batch_distribution créée');

    // Créer un index pour améliorer les performances
    await run(`
      CREATE INDEX IF NOT EXISTS idx_batch_distribution_batch_id 
      ON batch_distribution(batch_id)
    `);

    console.log('Migration terminée avec succès !');
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  } finally {
    db.close();
  }
}

migrateProductionFields();

