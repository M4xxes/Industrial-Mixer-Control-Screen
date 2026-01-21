import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const db = new sqlite3.Database('./database.sqlite');

const run = promisify(db.run.bind(db));
const all = promisify(db.all.bind(db));

async function initDatabase() {
  try {
    console.log('Initialisation de la base de données...');

    // Table users
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('Admin', 'Operator', 'Viewer')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `);

    // Table mixers (pour les informations en temps réel des malaxeurs)
    await run(`
      CREATE TABLE IF NOT EXISTS mixers (
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

    // Table recipes
    await run(`
      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Table recipe_steps
    await run(`
      CREATE TABLE IF NOT EXISTS recipe_steps (
        id TEXT PRIMARY KEY,
        recipe_id TEXT NOT NULL,
        step_number INTEGER NOT NULL,
        function TEXT NOT NULL,
        arm TEXT CHECK(arm IN ('GV', 'PV')),
        screw TEXT CHECK(screw IN ('GV', 'PV')),
        duration INTEGER NOT NULL,
        product TEXT,
        weight REAL,
        vacuum REAL,
        critere TEXT,
        status TEXT DEFAULT 'Reversible',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
      )
    `);

    // Table batches
    await run(`
      CREATE TABLE IF NOT EXISTS batches (
        id TEXT PRIMARY KEY,
        batch_number TEXT UNIQUE NOT NULL,
        mixer_id INTEGER NOT NULL,
        recipe_id TEXT NOT NULL,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        status TEXT NOT NULL CHECK(status IN ('En cours', 'Terminé', 'Interrompu', 'Erreur', 'Succès', 'Alerte')),
        operator_id TEXT,
        formule TEXT,
        designation TEXT,
        fabricant TEXT,
        temps_restant_sec INTEGER,
        produit_consigne REAL,
        produit_mesure REAL,
        prochain_appel_operateur_min INTEGER,
        appel_preparation_vide_min INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (mixer_id) REFERENCES mixers(id),
        FOREIGN KEY (recipe_id) REFERENCES recipes(id),
        FOREIGN KEY (operator_id) REFERENCES users(id)
      )
    `);

    // Table batch_distribution
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

    // Table batch_steps
    await run(`
      CREATE TABLE IF NOT EXISTS batch_steps (
        id TEXT PRIMARY KEY,
        batch_id TEXT NOT NULL,
        step_number INTEGER NOT NULL,
        planned_weight REAL,
        actual_weight REAL,
        planned_duration INTEGER NOT NULL,
        actual_duration INTEGER,
        started_at DATETIME,
        completed_at DATETIME,
        status TEXT CHECK(status IN ('OK', 'Écart')),
        deviation_percent REAL,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
      )
    `);

    // Table inventory
    await run(`
      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        product_name TEXT UNIQUE NOT NULL,
        current_quantity REAL NOT NULL DEFAULT 0,
        max_capacity REAL NOT NULL,
        min_threshold REAL NOT NULL,
        unit TEXT NOT NULL CHECK(unit IN ('Kg', 'L')),
        category TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('Normal', 'Bas', 'Critique')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table inventory_transactions
    await run(`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id TEXT PRIMARY KEY,
        inventory_id TEXT NOT NULL,
        batch_id TEXT,
        transaction_type TEXT NOT NULL CHECK(transaction_type IN ('Consumption', 'Replenishment')),
        quantity REAL NOT NULL,
        previous_quantity REAL NOT NULL,
        new_quantity REAL NOT NULL,
        operator_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inventory_id) REFERENCES inventory(id),
        FOREIGN KEY (batch_id) REFERENCES batches(id),
        FOREIGN KEY (operator_id) REFERENCES users(id)
      )
    `);

    // Table alarms
    await run(`
      CREATE TABLE IF NOT EXISTS alarms (
        id TEXT PRIMARY KEY,
        mixer_id INTEGER NOT NULL,
        alarm_code TEXT NOT NULL,
        description TEXT NOT NULL,
        level TEXT NOT NULL CHECK(level IN ('Info', 'Warning', 'Critique')),
        status TEXT NOT NULL CHECK(status IN ('Active', 'Acquittée')),
        occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        acknowledged_at DATETIME,
        acknowledged_by TEXT,
        FOREIGN KEY (mixer_id) REFERENCES mixers(id),
        FOREIGN KEY (acknowledged_by) REFERENCES users(id)
      )
    `);

    // Table batch_metrics
    await run(`
      CREATE TABLE IF NOT EXISTS batch_metrics (
        id TEXT PRIMARY KEY,
        batch_id TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        temperature REAL,
        speed REAL,
        power REAL,
        pressure REAL,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
      )
    `);

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

    console.log('Tables créées avec succès');

    // Insérer des données initiales
    await insertInitialData();

    console.log('Base de données initialisée avec succès !');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
  } finally {
    db.close();
  }
}

async function insertInitialData() {
  // Créer un utilisateur admin par défaut
  const adminId = uuidv4();
  await run(`
    INSERT OR IGNORE INTO users (id, username, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `, [adminId, 'admin', 'admin@supervision.local', 'hashed_password_here', 'Admin']);

  // Insérer les 6 malaxeurs
  const mixers = [
    { id: 1, name: 'Malaxeur B1', status: 'Production', motor_arm: 'Marche', motor_screw: 'Marche' },
    { id: 2, name: 'Malaxeur B2', status: 'Production', motor_arm: 'Marche', motor_screw: 'Marche' },
    { id: 3, name: 'Malaxeur B3', status: 'Arrêt', motor_arm: 'Arrêt', motor_screw: 'Arrêt' },
    { id: 4, name: 'Malaxeur B5', status: 'Production', motor_arm: 'Marche', motor_screw: 'Marche' },
    { id: 5, name: 'Malaxeur B6', status: 'Alarme', motor_arm: 'Défaut', motor_screw: 'Arrêt' },
    { id: 6, name: 'Malaxeur B7', status: 'Pause', motor_arm: 'Maintenance', motor_screw: 'Maintenance' },
  ];

  for (const mixer of mixers) {
    await run(`
      INSERT OR REPLACE INTO mixers (id, name, status, temperature, pressure, speed, power, motor_arm, motor_screw)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      mixer.id,
      mixer.name,
      mixer.status,
      25.0,
      0,
      0,
      0,
      mixer.motor_arm,
      mixer.motor_screw
    ]);
  }

  console.log('Données initiales insérées');
}

initDatabase();

