// Gestionnaire de base de données MySQL
import mysql from 'mysql2/promise';

// Configuration MySQL - utilisez les variables d'environnement ou modifiez ici
const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true, // Permet l'exécution de plusieurs requêtes
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Créer le pool de connexions (sans spécifier de base par défaut)
const db = mysql.createPool(mysqlConfig);

console.log(`📦 Connexion MySQL vers ${mysqlConfig.host}:${mysqlConfig.port}`);

// Helper functions pour MySQL avec support multi-base
export const run = async (query, params = [], database = 'supervision') => {
  const connection = await db.getConnection();
  try {
    await connection.query(`USE ${database}`);
    const [result] = await connection.execute(query, params);
    return {
      id: result.insertId,
      changes: result.affectedRows
    };
  } finally {
    connection.release();
  }
};

export const get = async (query, params = [], database = 'supervision') => {
  const connection = await db.getConnection();
  try {
    await connection.query(`USE ${database}`);
    const [rows] = await connection.execute(query, params);
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

export const all = async (query, params = [], database = 'supervision') => {
  const connection = await db.getConnection();
  try {
    await connection.query(`USE ${database}`);
    const [rows] = await connection.execute(query, params);
    return rows || [];
  } finally {
    connection.release();
  }
};

// Fonction pour fermer la connexion
export const close = async () => {
  await db.end();
};

export default db;
