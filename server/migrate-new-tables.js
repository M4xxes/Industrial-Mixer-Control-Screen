import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./database.sqlite');

const run = promisify(db.run.bind(db));

async function migrateDatabase() {
  try {
    console.log('Migration de la base de données...');

    // Table defauts_catalogue (catalogue des défauts)
    await run(`
      CREATE TABLE IF NOT EXISTS defauts_catalogue (
        id_defaut INTEGER PRIMARY KEY,
        automate TEXT NOT NULL,
        code_defaut TEXT NOT NULL,
        description TEXT NOT NULL,
        priorite INTEGER DEFAULT 2,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Index pour defauts_catalogue
    await run(`CREATE INDEX IF NOT EXISTS idx_defauts_catalogue_automate ON defauts_catalogue(automate)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_defauts_catalogue_code ON defauts_catalogue(code_defaut)`);

    // Table etapes_execution (détail d'exécution de chaque étape de cycle)
    await run(`
      CREATE TABLE IF NOT EXISTS etapes_execution (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cycle_id TEXT NOT NULL,
        etape_recette_id TEXT NOT NULL,
        numero_etape INTEGER NOT NULL,
        date_debut DATETIME NOT NULL,
        date_fin DATETIME,
        duree_reelle_sec INTEGER,
        quantite_dosee REAL,
        consigne_atteinte INTEGER DEFAULT 0,
        valeur_critere TEXT,
        statut TEXT DEFAULT 'EN_COURS' CHECK(statut IN ('EN_COURS', 'TERMINE', 'ERREUR', 'INTERROMPU')),
        commentaire TEXT,
        FOREIGN KEY (cycle_id) REFERENCES batches(id) ON DELETE CASCADE,
        FOREIGN KEY (etape_recette_id) REFERENCES recipe_steps(id)
      )
    `);

    // Index pour etapes_execution
    await run(`CREATE INDEX IF NOT EXISTS idx_cycle ON etapes_execution(cycle_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_etape_recette ON etapes_execution(etape_recette_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_numero_etape ON etapes_execution(numero_etape)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_date_debut ON etapes_execution(date_debut)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_statut ON etapes_execution(statut)`);

    console.log('Migration terminée avec succès !');
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
  } finally {
    db.close();
  }
}

migrateDatabase();

