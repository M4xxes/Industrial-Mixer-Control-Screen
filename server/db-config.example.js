// Exemple de configuration de base de données
// Copiez ce fichier en db-config.js et remplissez vos informations

export const dbConfig = {
  // Pour SQLite (par défaut)
  type: 'sqlite',
  database: './database.sqlite',
  
  // Pour MySQL, décommentez et configurez :
  // type: 'mysql',
  // host: 'localhost',
  // port: 3306,
  // user: 'votre_utilisateur',
  // password: 'votre_mot_de_passe',
  // database: 'nom_de_la_base',
  // waitForConnections: true,
  // connectionLimit: 10,
  // queueLimit: 0
};
