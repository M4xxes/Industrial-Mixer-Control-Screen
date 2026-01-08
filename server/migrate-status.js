import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./database.sqlite');
const run = promisify(db.run.bind(db));
const all = promisify(db.all.bind(db));

async function migrateStatus() {
  try {
    console.log('Migration des statuts des mixers...');

    // Désactiver les contraintes de clé étrangère temporairement
    await run('PRAGMA foreign_keys = OFF');

    // Sauvegarder les données
    const mixers = await all('SELECT * FROM mixers');
    
    // Recréer la table avec les nouveaux statuts
    await run('DROP TABLE IF EXISTS mixers_temp');
    await run(`
      CREATE TABLE mixers_temp (
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
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insérer les données avec conversion des statuts
    for (const mixer of mixers) {
      let newStatus = mixer.status;
      if (mixer.status === 'Marche') newStatus = 'Production';
      else if (mixer.status === 'Erreur') newStatus = 'Alarme';
      else if (mixer.status === 'Maintenance') newStatus = 'Arrêt';
      
      await run(`
        INSERT INTO mixers_temp 
        (id, name, status, recipe_id, current_step, progress, temperature, pressure, speed, power, motor_arm, motor_screw, batch_progress, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        mixer.id,
        mixer.name,
        newStatus,
        mixer.recipe_id,
        mixer.current_step,
        mixer.progress,
        mixer.temperature,
        mixer.pressure,
        mixer.speed,
        mixer.power,
        mixer.motor_arm,
        mixer.motor_screw,
        mixer.batch_progress,
        mixer.updated_at
      ]);
    }

    // Remplacer l'ancienne table
    await run('DROP TABLE mixers');
    await run('ALTER TABLE mixers_temp RENAME TO mixers');

    // Réactiver les contraintes
    await run('PRAGMA foreign_keys = ON');

    // Recréer la clé étrangère
    await run(`
      CREATE INDEX IF NOT EXISTS idx_mixers_recipe_id ON mixers(recipe_id)
    `);

    console.log('Migration des statuts terminée avec succès !');
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  } finally {
    db.close();
  }
}

migrateStatus();

