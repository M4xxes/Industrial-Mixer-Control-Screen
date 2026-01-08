import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./database.sqlite');
const run = promisify(db.run.bind(db));

async function migrateRecipeSteps() {
  try {
    console.log('Migration de la table recipe_steps...');

    // Vérifier si les colonnes existent déjà
    const tableInfo = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(recipe_steps)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const columns = tableInfo.map(col => col.name);
    
    // Ajouter la colonne vacuum si elle n'existe pas
    if (!columns.includes('vacuum')) {
      await run(`ALTER TABLE recipe_steps ADD COLUMN vacuum REAL`);
      console.log('Colonne vacuum ajoutée');
    }

    // Ajouter la colonne critere si elle n'existe pas
    if (!columns.includes('critere')) {
      await run(`ALTER TABLE recipe_steps ADD COLUMN critere TEXT`);
      console.log('Colonne critere ajoutée');
    }

    // Ajouter la colonne status si elle n'existe pas
    if (!columns.includes('status')) {
      await run(`ALTER TABLE recipe_steps ADD COLUMN status TEXT DEFAULT 'Reversible'`);
      console.log('Colonne status ajoutée');
    }

    // Mettre à jour le statut des mixers pour correspondre au nouveau cahier des charges
    // D'abord mettre à jour les données
    await run(`UPDATE mixers SET status = 'Production' WHERE status = 'Marche'`);
    await run(`UPDATE mixers SET status = 'Alarme' WHERE status = 'Erreur'`);
    await run(`UPDATE mixers SET status = 'Arrêt' WHERE status = 'Maintenance'`);
    console.log('Statuts des mixers mis à jour');
    
    // Ensuite recréer la table avec la nouvelle contrainte
    await run(`
      CREATE TABLE IF NOT EXISTS mixers_new (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('Arrêt', 'Production', 'Pause', 'Alarme')),
        recipe_id TEXT,
        current_step INTEGER,
        progress REAL DEFAULT 0,
        temperature REAL DEFAULT 0,
        pressure REAL DEFAULT 0,
        speed REAL DEFAULT 0,
        power REAL DEFAULT 0,
        motor_arm TEXT CHECK(motor_arm IN ('Arrêt', 'Marche', 'Défaut', 'Maintenance')),
        motor_screw TEXT CHECK(motor_screw IN ('Arrêt', 'Marche', 'Défaut', 'Maintenance')),
        batch_progress REAL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id)
      )
    `);
    
    await run(`INSERT INTO mixers_new SELECT * FROM mixers`);
    await run(`DROP TABLE mixers`);
    await run(`ALTER TABLE mixers_new RENAME TO mixers`);
    console.log('Contrainte CHECK de mixers mise à jour');

    console.log('Migration terminée avec succès !');
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  } finally {
    db.close();
  }
}

migrateRecipeSteps();

