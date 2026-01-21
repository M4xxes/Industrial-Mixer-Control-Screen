// Script pour créer les tables manquantes pour la compatibilité
import mysql from 'mysql2/promise';

// Configuration MySQL depuis les variables d'environnement
const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

// Helper pour exécuter des requêtes
async function run(query, params = [], database = 'supervision') {
  const connection = await mysql.createConnection({...mysqlConfig, database});
  try {
    const [result] = await connection.execute(query, params);
    return {
      id: result.insertId,
      changes: result.affectedRows
    };
  } finally {
    await connection.end();
  }
}

async function get(query, params = [], database = 'supervision') {
  const connection = await mysql.createConnection({...mysqlConfig, database});
  try {
    const [rows] = await connection.execute(query, params);
    return rows[0] || null;
  } finally {
    await connection.end();
  }
}

async function createMissingTables() {
  try {
    console.log('🔧 Création des tables manquantes...');

    // Table mixers (vue simplifiée des malaxeurs)
    await run(`
      CREATE TABLE IF NOT EXISTS mixers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL,
        status ENUM('Arrêt', 'Production', 'Pause', 'Alarme') DEFAULT 'Arrêt',
        recipe_id INT,
        current_step INT,
        progress REAL DEFAULT 0,
        temperature REAL DEFAULT 0,
        pressure REAL DEFAULT 0,
        speed REAL DEFAULT 0,
        power REAL DEFAULT 0,
        motor_arm VARCHAR(20),
        motor_screw VARCHAR(20),
        batch_progress REAL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (recipe_id) REFERENCES recettes(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `, [], 'supervision');

    // Insérer les 6 malaxeurs de base
    const mixersExist = await get('SELECT COUNT(*) as count FROM mixers', [], 'supervision');
    if (mixersExist && mixersExist.count === 0) {
      await run(`
        INSERT INTO mixers (id, name, status) VALUES
        (1, 'Malaxeur B1', 'Arrêt'),
        (2, 'Malaxeur B2', 'Arrêt'),
        (3, 'Malaxeur B3', 'Arrêt'),
        (4, 'Malaxeur B5', 'Arrêt'),
        (5, 'Malaxeur B6', 'Arrêt'),
        (6, 'Malaxeur B7', 'Arrêt')
      `, [], 'supervision');
      console.log('✅ 6 malaxeurs insérés');
    } else {
      console.log('ℹ️  Malaxeurs déjà présents');
    }

    // Table inventory (pour le stock)
    await run(`
      CREATE TABLE IF NOT EXISTS inventory (
        id VARCHAR(36) PRIMARY KEY,
        product_name VARCHAR(255) UNIQUE NOT NULL,
        current_quantity REAL NOT NULL DEFAULT 0,
        max_capacity REAL NOT NULL,
        min_threshold REAL NOT NULL,
        unit ENUM('Kg', 'L') NOT NULL,
        category VARCHAR(100),
        status ENUM('Normal', 'Bas', 'Critique') DEFAULT 'Normal',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `, [], 'supervision');

    // Table alarms (pour les alarmes)
    await run(`
      CREATE TABLE IF NOT EXISTS alarms (
        id VARCHAR(36) PRIMARY KEY,
        mixer_id INT,
        alarm_code VARCHAR(50),
        description TEXT,
        level ENUM('Info', 'Warning', 'Critique') DEFAULT 'Info',
        status ENUM('Active', 'Acquittée') DEFAULT 'Active',
        occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        acknowledged_at TIMESTAMP NULL,
        acknowledged_by VARCHAR(100),
        FOREIGN KEY (mixer_id) REFERENCES mixers(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `, [], 'supervision');

    // Table batch_distribution (pour la distribution des produits dans un cycle)
    await run(`
      CREATE TABLE IF NOT EXISTS batch_distribution (
        id INT PRIMARY KEY AUTO_INCREMENT,
        batch_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        qte_formule REAL DEFAULT 0,
        qte_dosee REAL DEFAULT 0,
        dose REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES cycles_production(id) ON DELETE CASCADE,
        UNIQUE KEY unique_batch_product (batch_id, product_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `, [], 'supervision');

    // Table batch_steps (pour les étapes de lot - simplifiée)
    await run(`
      CREATE TABLE IF NOT EXISTS batch_steps (
        id INT PRIMARY KEY AUTO_INCREMENT,
        batch_id INT NOT NULL,
        step_number INT NOT NULL,
        planned_weight REAL,
        actual_weight REAL,
        planned_duration INT NOT NULL,
        actual_duration INT,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        status ENUM('OK', 'Écart') DEFAULT 'OK',
        deviation_percent REAL,
        FOREIGN KEY (batch_id) REFERENCES cycles_production(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `, [], 'supervision');

    // Table batch_metrics (pour les métriques de lot)
    await run(`
      CREATE TABLE IF NOT EXISTS batch_metrics (
        id VARCHAR(36) PRIMARY KEY,
        batch_id INT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        temperature REAL,
        speed REAL,
        power REAL,
        pressure REAL,
        FOREIGN KEY (batch_id) REFERENCES cycles_production(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `, [], 'supervision');

    console.log('✅ Tables manquantes créées avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error.message);
    throw error;
  }
}

createMissingTables().then(() => {
  console.log('✅ Script terminé');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
