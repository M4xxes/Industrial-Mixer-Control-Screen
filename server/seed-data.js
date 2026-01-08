import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const db = new sqlite3.Database('./database.sqlite');

const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));

async function seedData() {
  try {
    console.log('Insertion des données de test...');

    // Créer des recettes avec étapes
    const recipe1Id = uuidv4();
    await run(`
      INSERT OR REPLACE INTO recipes (id, name, description, is_active)
      VALUES (?, ?, ?, ?)
    `, [recipe1Id, 'Recette A - Standard', 'Recette standard de production', 1]);

    // Insérer 32 étapes pour la recette 1
    const functions = [
      { type: 'Démarrage', duration: 10 },
      { type: 'Dosage Automatique', duration: 120, product: 'NAPVIS D200', weight: 50 },
      { type: 'Mélange', duration: 300 },
      { type: 'Dosage Automatique', duration: 180, product: 'Hydrocarbure OG', weight: 30 },
      { type: 'Mélange', duration: 240 },
      { type: 'Introduction Manuelle', duration: 60, product: 'Additif A', weight: 5 },
      { type: 'Mélange', duration: 180 },
      { type: 'Dosage Automatique', duration: 150, product: 'Catalyseur', weight: 2 },
      { type: 'Mélange', duration: 200 },
      { type: 'Prépa mise au vide', duration: 30 },
      { type: 'Mise au vide', duration: 600 },
      { type: 'Mélange', duration: 300 },
      { type: 'Dosage Automatique', duration: 120, product: 'Polymère B', weight: 40 },
      { type: 'Mélange', duration: 240 },
      { type: 'Introduction Manuelle', duration: 60, product: 'Additif B', weight: 3 },
      { type: 'Mélange', duration: 180 },
      { type: 'Dosage Automatique', duration: 100, product: 'Huile', weight: 10 },
      { type: 'Mélange', duration: 200 },
      { type: 'Prépa mise au vide', duration: 30 },
      { type: 'Mise au vide', duration: 600 },
      { type: 'Mélange', duration: 300 },
      { type: 'Dosage Automatique', duration: 140, product: 'Composant C', weight: 25 },
      { type: 'Mélange', duration: 240 },
      { type: 'Introduction Manuelle', duration: 60, product: 'Additif C', weight: 4 },
      { type: 'Mélange', duration: 180 },
      { type: 'Dosage Automatique', duration: 110, product: 'D10', weight: 15 },
      { type: 'Mélange', duration: 200 },
      { type: 'Prépa mise au vide', duration: 30 },
      { type: 'Mise au vide', duration: 600 },
      { type: 'Mélange', duration: 300 },
      { type: 'Extrusion', duration: 1200 },
    ];

    for (let i = 0; i < functions.length; i++) {
      const func = functions[i];
      const stepId = uuidv4();
      await run(`
        INSERT OR REPLACE INTO recipe_steps 
        (id, recipe_id, step_number, function, arm, screw, duration, product, weight)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        stepId,
        recipe1Id,
        i + 1,
        func.type,
        i % 2 === 0 ? 'GV' : 'PV',
        i % 3 === 0 ? 'GV' : 'PV',
        func.duration,
        func.product || null,
        func.weight || null,
      ]);
    }

    // Mettre à jour les mixers avec des recettes
    await run(`UPDATE mixers SET recipe_id = ?, current_step = 5, progress = 65, temperature = 85.5, pressure = 1.2, speed = 45, power = 12.5, batch_progress = 15.5 WHERE id = 1`, [recipe1Id]);
    await run(`UPDATE mixers SET recipe_id = ?, current_step = 3, progress = 45, temperature = 78.2, pressure = 0.9, speed = 38, power = 10.2, batch_progress = 12.3 WHERE id = 2`, [recipe1Id]);
    await run(`UPDATE mixers SET recipe_id = ?, current_step = 8, progress = 75, temperature = 92.1, pressure = 1.5, speed = 52, power = 14.8, batch_progress = 25.0 WHERE id = 4`, [recipe1Id]);
    await run(`UPDATE mixers SET recipe_id = ?, current_step = 2, progress = 20, temperature = 45.0, pressure = 0.3, speed = 0, power = 0 WHERE id = 5`, [recipe1Id]);

    // Insérer des produits en stock
    const inventoryItems = [
      { name: 'NAPVIS D200', quantity: 450, max: 1000, min: 100, unit: 'L', category: 'Composant' },
      { name: 'Hydrocarbure OG', quantity: 320, max: 800, min: 80, unit: 'L', category: 'Composant' },
      { name: 'Huile', quantity: 25, max: 200, min: 20, unit: 'L', category: 'Composant' },
      { name: 'D10', quantity: 8, max: 100, min: 10, unit: 'L', category: 'Composant' },
      { name: 'Polymère A', quantity: 1200, max: 2000, min: 200, unit: 'Kg', category: 'Polymère' },
      { name: 'Polymère B', quantity: 850, max: 2000, min: 200, unit: 'Kg', category: 'Polymère' },
      { name: 'Additif A', quantity: 45, max: 100, min: 10, unit: 'Kg', category: 'Additif' },
      { name: 'Additif B', quantity: 5, max: 100, min: 10, unit: 'Kg', category: 'Additif' },
      { name: 'Catalyseur', quantity: 12, max: 50, min: 5, unit: 'Kg', category: 'Catalyseur' },
      { name: 'Composant C', quantity: 180, max: 500, min: 50, unit: 'Kg', category: 'Composant' },
    ];

    for (const item of inventoryItems) {
      let status = 'Normal';
      if (item.quantity <= item.min) {
        status = 'Critique';
      } else if (item.quantity <= item.max * 0.25) {
        status = 'Bas';
      }

      await run(`
        INSERT OR REPLACE INTO inventory 
        (id, product_name, current_quantity, max_capacity, min_threshold, unit, category, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [uuidv4(), item.name, item.quantity, item.max, item.min, item.unit, item.category, status]);
    }

    // Insérer des alarmes
    await run(`
      INSERT OR REPLACE INTO alarms (id, mixer_id, alarm_code, description, level, status, occurred_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-1 hour'))
    `, [uuidv4(), 5, 'ERR-001', 'Surchauffe moteur bras', 'Critique', 'Active']);

    await run(`
      INSERT OR REPLACE INTO alarms (id, mixer_id, alarm_code, description, level, status, occurred_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-30 minutes'))
    `, [uuidv4(), 2, 'WARN-002', 'Température élevée', 'Warning', 'Active']);

    // Insérer le catalogue de défauts
    console.log('Insertion du catalogue de défauts...');
    const defauts = [
      [1,'MB12','DRKBR1NOR','MB1 Défaut Retour Contacteur Bras Sens Normal',3],
      [2,'MB12','DRKBR1INV','MB1 Défaut Retour Contacteur Bras Sens Inverse',3],
      [3,'MB12','DRKVI1MAL','MB1 Défaut Retour Contacteur Vis Sens Malaxage',3],
      [4,'MB12','DRKVI1EXT','MB1 Défaut Retour Contacteur Vis Sens Extrusion',3],
      [5,'MB12','DVIDMB1','MB1 Défaut Mise au Vide Malaxeur',2],
      [6,'MB12','DISLBR1','MB1 Défaut Intensité Basse Moteur Bras',1],
      [7,'MB12','DISLVI1','MB1 Défaut Intensité Basse Moteur Vis',1],
      [8,'MB12','DATTREP1','MB1 Défaut Attente Reprise Malaxage',1],
      [9,'MB12','DRKBR2NOR','MB2 Défaut Retour Contacteur Bras Sens Normal',3],
      [10,'MB12','DRKBR2INV','MB2 Défaut Retour Contacteur Bras Sens Inverse',3],
      [11,'MB12','DRKVI2MAL','MB2 Défaut Retour Contacteur Vis Sens Malaxage',3],
      [12,'MB12','DRKVI2EXT','MB2 Défaut Retour Contacteur Vis Sens Extrusion',3],
      [13,'MB12','DVIDMB2','MB2 Défaut Mise au Vide Malaxeur',2],
      [14,'MB12','DISLBR2','MB2 Défaut Intensité Basse Moteur Bras',1],
      [15,'MB12','DISLVI2','MB2 Défaut Intensité Basse Moteur Vis',1],
      [16,'MB12','DATTREP2','MB2 Défaut Attente Reprise Malaxage',1],
      [17,'MB35','DRKBR3NOR','MB3 Défaut Retour Contacteur Bras Sens Normal',3],
      [18,'MB35','DRKBR3INV','MB3 Défaut Retour Contacteur Bras Sens Inverse',3],
      [19,'MB35','DRKVI3MAL','MB3 Défaut Retour Contacteur Vis Sens Malaxage',3],
      [20,'MB35','DRKVI3EXT','MB3 Défaut Retour Contacteur Vis Sens Extrusion',3],
      [21,'MB35','DVIDMB3','MB3 Défaut Mise au Vide Malaxeur',2],
      [22,'MB35','DISLBR3','MB3 Défaut Intensité Basse Moteur Bras',1],
      [23,'MB35','DISLVI3','MB3 Défaut Intensité Basse Moteur Vis',1],
      [24,'MB35','DATTREP3','MB3 Défaut Attente Reprise Malaxage',1],
      [25,'MB35','DRKBR5NOR','MB5 Défaut Retour Contacteur Bras Sens Normal',3],
      [26,'MB35','DRKBR5INV','MB5 Défaut Retour Contacteur Bras Sens Inverse',3],
      [27,'MB35','DRKVI5MAL','MB5 Défaut Retour Contacteur Vis Sens Malaxage',3],
      [28,'MB35','DRKVI5EXT','MB5 Défaut Retour Contacteur Vis Sens Extrusion',3],
      [29,'MB35','DVIDMB5','MB5 Défaut Mise au Vide Malaxeur',2],
      [30,'MB35','DISLBR5','MB5 Défaut Intensité Basse Moteur Bras',1],
      [31,'MB35','DISLVI5','MB5 Défaut Intensité Basse Moteur Vis',1],
      [32,'MB35','DATTREP5','MB5 Défaut Attente Reprise Malaxage',1],
      [33,'MB67','DRKBR6NOR','MB6 Défaut Retour Contacteur Bras Sens Normal',3],
      [34,'MB67','DRKBR6INV','MB6 Défaut Retour Contacteur Bras Sens Inverse',3],
      [35,'MB67','DRKVI6MAL','MB6 Défaut Retour Contacteur Vis Sens Malaxage',3],
      [36,'MB67','DRKVI6EXT','MB6 Défaut Retour Contacteur Vis Sens Extrusion',3],
      [37,'MB67','DVIDMB6','MB6 Défaut Mise au Vide Malaxeur',2],
      [38,'MB67','DISLBR6','MB6 Défaut Intensité Basse Moteur Bras',1],
      [39,'MB67','DISLVI6','MB6 Défaut Intensité Basse Moteur Vis',1],
      [40,'MB67','DATTREP6','MB6 Défaut Attente Reprise Malaxage',1],
      [41,'MB67','DRKBR7NOR','MB7 Défaut Retour Contacteur Bras Sens Normal',3],
      [42,'MB67','DRKBR7INV','MB7 Défaut Retour Contacteur Bras Sens Inverse',3],
      [43,'MB67','DRKVI7MAL','MB7 Défaut Retour Contacteur Vis Sens Malaxage',3],
      [44,'MB67','DRKVI7EXT','MB7 Défaut Retour Contacteur Vis Sens Extrusion',3],
      [45,'MB67','DVIDMB7','MB7 Défaut Mise au Vide Malaxeur',2],
      [46,'MB67','DISLBR7','MB7 Défaut Intensité Basse Moteur Bras',1],
      [47,'MB67','DISLVI7','MB7 Défaut Intensité Basse Moteur Vis',1],
      [48,'MB67','DATTREP7','MB7 Défaut Attente Reprise Malaxage',1],
    ];

    // Insérer seulement les premiers défauts (malaxeurs) pour éviter un fichier trop long
    // Les défauts liquides et poudres peuvent être ajoutés plus tard si nécessaire
    for (const defaut of defauts) {
      await run(`
        INSERT OR REPLACE INTO defauts_catalogue 
        (id_defaut, automate, code_defaut, description, priorite, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, defaut);
    }

    console.log('Données de test insérées avec succès !');
  } catch (error) {
    console.error('Erreur lors de l\'insertion des données:', error);
  } finally {
    db.close();
  }
}

seedData();

