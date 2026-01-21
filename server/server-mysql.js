import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { run, get, all } from './db.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Route racine pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
  res.json({
    message: 'API Supervision Multi-Malaxeurs',
    version: '1.0.0',
    endpoints: {
      mixers: '/api/mixers',
      recipes: '/api/recipes',
      inventory: '/api/inventory',
      alarms: '/api/alarms',
      batches: '/api/batches',
      defauts: '/api/defauts',
      etapesExecution: '/api/etapes-execution',
    },
  });
});

// ========== MIXERS API ==========

// GET /api/mixers - Liste tous les malaxeurs
app.get('/api/mixers', async (req, res) => {
  try {
    const mixers = await all(`
      SELECT m.*, r.nom as recipe_name
      FROM mixers m
      LEFT JOIN recettes r ON m.recipe_id = r.id
      ORDER BY m.id
    `, [], 'supervision');
    res.json(mixers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/mixers/:id - Détails d'un malaxeur
app.get('/api/mixers/:id', async (req, res) => {
  try {
    const mixer = await get('SELECT * FROM mixers WHERE id = ?', [req.params.id], 'supervision');
    if (!mixer) {
      return res.status(404).json({ error: 'Malaxeur non trouvé' });
    }
    
    // Récupérer la recette si elle existe
    if (mixer.recipe_id) {
      const recipe = await get('SELECT * FROM recettes WHERE id = ?', [mixer.recipe_id], 'supervision');
      if (recipe) {
        const steps = await all('SELECT * FROM etapes_recette WHERE recette_id = ? ORDER BY numero_etape', [recipe.id], 'supervision');
        mixer.recipe = { ...recipe, steps };
      }
    }
    
    res.json(mixer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/mixers/:id - Mettre à jour un malaxeur
app.put('/api/mixers/:id', async (req, res) => {
  try {
    const { status, recipe_id, current_step, progress, temperature, pressure, speed, power, motor_arm, motor_screw, batch_progress } = req.body;
    
    await run(`
      UPDATE mixers 
      SET status = COALESCE(?, status),
          recipe_id = COALESCE(?, recipe_id),
          current_step = COALESCE(?, current_step),
          progress = COALESCE(?, progress),
          temperature = COALESCE(?, temperature),
          pressure = COALESCE(?, pressure),
          speed = COALESCE(?, speed),
          power = COALESCE(?, power),
          motor_arm = COALESCE(?, motor_arm),
          motor_screw = COALESCE(?, motor_screw),
          batch_progress = COALESCE(?, batch_progress),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, recipe_id, current_step, progress, temperature, pressure, speed, power, motor_arm, motor_screw, batch_progress, req.params.id], 'supervision');
    
    const updated = await get('SELECT * FROM mixers WHERE id = ?', [req.params.id], 'supervision');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== RECIPES API ==========

// GET /api/recipes - Liste toutes les recettes
app.get('/api/recipes', async (req, res) => {
  try {
    const recipes = await all('SELECT * FROM recettes WHERE actif = 1 ORDER BY date_creation DESC', [], 'supervision');
    for (const recipe of recipes) {
      recipe.steps = await all('SELECT * FROM etapes_recette WHERE recette_id = ? ORDER BY numero_etape', [recipe.id], 'supervision');
    }
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/recipes/:id - Détails d'une recette
app.get('/api/recipes/:id', async (req, res) => {
  try {
    const recipe = await get('SELECT * FROM recettes WHERE id = ?', [req.params.id], 'supervision');
    if (!recipe) {
      return res.status(404).json({ error: 'Recette non trouvée' });
    }
    recipe.steps = await all('SELECT * FROM etapes_recette WHERE recette_id = ? ORDER BY numero_etape', [recipe.id], 'supervision');
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/recipes - Créer une recette
app.post('/api/recipes', async (req, res) => {
  try {
    const { name, description, mixerName, steps } = req.body;
    
    // Insérer la recette (MySQL utilise AUTO_INCREMENT, pas besoin d'UUID)
    const result = await run(`
      INSERT INTO recettes (code, nom, description, malaxeur, actif, date_creation, date_modification)
      VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [name, name, description || '', mixerName || 'MB6'], 'supervision');
    
    const recipeId = result.id;
    
    // Insérer les étapes
    for (const step of steps || []) {
      await run(`
        INSERT INTO etapes_recette 
        (recette_id, numero_etape, fonction, bras, vis, refroidissement, duree_maxi_sec, produit, consigne_kg, vide_pourcent, critere)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        recipeId, 
        step.stepNumber || step.numero_etape, 
        step.function || step.fonction, 
        step.arm || step.bras, 
        step.screw || step.vis,
        step.refroidissement || 'Non',
        step.duration || step.duree_maxi_sec, 
        step.product || step.produit || null, 
        step.weight || step.consigne_kg || null, 
        step.vacuum || step.vide_pourcent || null,
        step.critere || null
      ], 'supervision');
    }
    
    const recipe = await get('SELECT * FROM recettes WHERE id = ?', [recipeId], 'supervision');
    recipe.steps = await all('SELECT * FROM etapes_recette WHERE recette_id = ? ORDER BY numero_etape', [recipeId], 'supervision');
    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/recipes/:id - Modifier une recette
app.put('/api/recipes/:id', async (req, res) => {
  try {
    const { name, description, mixerName, steps } = req.body;
    
    await run(`
      UPDATE recettes 
      SET nom = ?, code = ?, description = ?, malaxeur = ?, date_modification = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, name, description || '', mixerName || 'MB6', req.params.id], 'supervision');
    
    // Supprimer les anciennes étapes
    await run('DELETE FROM etapes_recette WHERE recette_id = ?', [req.params.id], 'supervision');
    
    // Insérer les nouvelles étapes
    for (const step of steps || []) {
      await run(`
        INSERT INTO etapes_recette 
        (recette_id, numero_etape, fonction, bras, vis, refroidissement, duree_maxi_sec, produit, consigne_kg, vide_pourcent, critere)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        req.params.id, 
        step.stepNumber || step.numero_etape, 
        step.function || step.fonction, 
        step.arm || step.bras, 
        step.screw || step.vis,
        step.refroidissement || 'Non',
        step.duration || step.duree_maxi_sec, 
        step.product || step.produit || null, 
        step.weight || step.consigne_kg || null, 
        step.vacuum || step.vide_pourcent || null,
        step.critere || null
      ], 'supervision');
    }
    
    const recipe = await get('SELECT * FROM recettes WHERE id = ?', [req.params.id], 'supervision');
    recipe.steps = await all('SELECT * FROM etapes_recette WHERE recette_id = ? ORDER BY numero_etape', [recipe.id], 'supervision');
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/recipes/:id - Supprimer une recette (désactiver)
app.delete('/api/recipes/:id', async (req, res) => {
  try {
    await run('UPDATE recettes SET actif = 0 WHERE id = ?', [req.params.id], 'supervision');
    res.json({ message: 'Recette supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== INVENTORY API ==========

// GET /api/inventory - Liste tous les produits
app.get('/api/inventory', async (req, res) => {
  try {
    const inventory = await all('SELECT * FROM inventory ORDER BY product_name', [], 'supervision');
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/inventory/:id - Mettre à jour un produit
app.put('/api/inventory/:id', async (req, res) => {
  try {
    const { current_quantity } = req.body;
    const product = await get('SELECT * FROM inventory WHERE id = ?', [req.params.id], 'supervision');
    
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    // Calculer le nouveau statut
    let status = 'Normal';
    if (current_quantity <= product.min_threshold) {
      status = 'Critique';
    } else if (current_quantity <= product.max_capacity * 0.25) {
      status = 'Bas';
    }
    
    await run(`
      UPDATE inventory 
      SET current_quantity = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [current_quantity, status, req.params.id], 'supervision');
    
    const updated = await get('SELECT * FROM inventory WHERE id = ?', [req.params.id], 'supervision');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ALARMS API ==========

// GET /api/alarms - Liste toutes les alarmes
app.get('/api/alarms', async (req, res) => {
  try {
    const alarms = await all('SELECT * FROM alarms ORDER BY occurred_at DESC', [], 'supervision');
    res.json(alarms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/alarms/:id/acknowledge - Acquitter une alarme
app.put('/api/alarms/:id/acknowledge', async (req, res) => {
  try {
    await run(`
      UPDATE alarms 
      SET status = 'Acquittée', acknowledged_at = CURRENT_TIMESTAMP, acknowledged_by = ?
      WHERE id = ?
    `, [req.body.operator_id || 'admin', req.params.id], 'supervision');
    
    const alarm = await get('SELECT * FROM alarms WHERE id = ?', [req.params.id], 'supervision');
    res.json(alarm);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== DEFAUTS CATALOGUE API ==========

// GET /api/defauts - Liste tous les défauts du catalogue
app.get('/api/defauts', async (req, res) => {
  try {
    const { automate, code } = req.query;
    let query = 'SELECT * FROM defauts_catalogue WHERE 1=1';
    const params = [];

    if (automate) {
      query += ' AND automate = ?';
      params.push(automate);
    }
    if (code) {
      query += ' AND code_defaut = ?';
      params.push(code);
    }

    query += ' ORDER BY id_defaut';
    const defauts = await all(query, params, 'malaxeur_db');
    res.json(defauts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/defauts/:id - Détails d'un défaut
app.get('/api/defauts/:id', async (req, res) => {
  try {
    const defaut = await get('SELECT * FROM defauts_catalogue WHERE id_defaut = ?', [req.params.id], 'malaxeur_db');
    if (!defaut) {
      return res.status(404).json({ error: 'Défaut non trouvé' });
    }
    res.json(defaut);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ETAPES EXECUTION API ==========

// GET /api/etapes-execution - Liste les étapes d'exécution
app.get('/api/etapes-execution', async (req, res) => {
  try {
    const { cycle_id } = req.query;
    let query = 'SELECT * FROM etapes_execution WHERE 1=1';
    const params = [];

    if (cycle_id) {
      query += ' AND cycle_id = ?';
      params.push(cycle_id);
    }

    query += ' ORDER BY numero_etape';
    const etapes = await all(query, params, 'supervision');
    res.json(etapes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/etapes-execution - Créer une étape d'exécution
app.post('/api/etapes-execution', async (req, res) => {
  try {
    const { cycle_id, etape_recette_id, numero_etape, date_debut, statut } = req.body;
    
    const result = await run(`
      INSERT INTO etapes_execution 
      (cycle_id, etape_recette_id, numero_etape, date_debut, statut)
      VALUES (?, ?, ?, ?, ?)
    `, [cycle_id, etape_recette_id, numero_etape, date_debut || new Date().toISOString().slice(0, 19).replace('T', ' '), statut || 'EN_COURS'], 'supervision');
    
    const etape = await get('SELECT * FROM etapes_execution WHERE id = ?', [result.id], 'supervision');
    res.status(201).json(etape);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/etapes-execution/:id - Mettre à jour une étape d'exécution
app.put('/api/etapes-execution/:id', async (req, res) => {
  try {
    const { date_fin, duree_reelle_sec, quantite_dosee, consigne_atteinte, valeur_critere, statut, commentaire } = req.body;
    
    await run(`
      UPDATE etapes_execution 
      SET date_fin = COALESCE(?, date_fin),
          duree_reelle_sec = COALESCE(?, duree_reelle_sec),
          quantite_dosee = COALESCE(?, quantite_dosee),
          consigne_atteinte = COALESCE(?, consigne_atteinte),
          valeur_critere = COALESCE(?, valeur_critere),
          statut = COALESCE(?, statut),
          commentaire = COALESCE(?, commentaire)
      WHERE id = ?
    `, [date_fin, duree_reelle_sec, quantite_dosee, consigne_atteinte, valeur_critere, statut, commentaire, req.params.id], 'supervision');
    
    const etape = await get('SELECT * FROM etapes_execution WHERE id = ?', [req.params.id], 'supervision');
    res.json(etape);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== COMMANDES API ==========

// POST /api/mixers/:id/start-recipe - Démarrer une recette
app.post('/api/mixers/:id/start-recipe', async (req, res) => {
  try {
    const { recipe_id, operator_id, batch_number } = req.body;
    
    // Récupérer la recette pour obtenir le nom
    const recipe = await get('SELECT * FROM recettes WHERE id = ?', [recipe_id], 'supervision');
    
    // Déterminer le nom du malaxeur depuis le mixer
    const mixer = await get('SELECT * FROM mixers WHERE id = ?', [req.params.id], 'supervision');
    const malaxeurEnum = mixer.name.includes('B1') ? 'B1' : 
                         mixer.name.includes('B2') ? 'B2' :
                         mixer.name.includes('B3') ? 'B3' :
                         mixer.name.includes('B5') ? 'B5' :
                         mixer.name.includes('B6') ? 'B6' : 'B7';
    
    // Créer un nouveau cycle de production
    const result = await run(`
      INSERT INTO cycles_production (
        recette_id, malaxeur, date_debut, statut, operateur, code_formule
      )
      VALUES (?, ?, CURRENT_TIMESTAMP, 'EN_COURS', ?, ?)
    `, [recipe_id, malaxeurEnum, operator_id || '', recipe?.nom || ''], 'supervision');
    
    const cycleId = result.id;
    
    // Créer l'étape d'exécution pour la première étape
    const firstStep = await get('SELECT * FROM etapes_recette WHERE recette_id = ? AND numero_etape = 1', [recipe_id], 'supervision');
    if (firstStep) {
      await run(`
        INSERT INTO etapes_execution 
        (cycle_id, etape_recette_id, numero_etape, date_debut, statut)
        VALUES (?, ?, 1, CURRENT_TIMESTAMP, 'EN_COURS')
      `, [cycleId, firstStep.id], 'supervision');
    }
    
    // Créer les entrées de distribution par défaut
    const defaultProducts = ['Hydrocarb', 'Napvis D10', 'Napvis D200', 'Huile HM'];
    for (const productName of defaultProducts) {
      await run(`
        INSERT INTO batch_distribution (batch_id, product_name, qte_formule, qte_dosee, dose)
        VALUES (?, ?, 0, 0, 0)
      `, [cycleId, productName], 'supervision');
    }
    
    // Mettre à jour le malaxeur
    await run(`
      UPDATE mixers 
      SET recipe_id = ?, status = 'Production', current_step = 1, progress = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [recipe_id, req.params.id], 'supervision');
    
    const updatedMixer = await get('SELECT * FROM mixers WHERE id = ?', [req.params.id], 'supervision');
    res.json({ mixer: updatedMixer, batch_id: cycleId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/mixers/:id/end-recipe - Terminer une recette
app.post('/api/mixers/:id/end-recipe', async (req, res) => {
  try {
    const mixer = await get('SELECT * FROM mixers WHERE id = ?', [req.params.id], 'supervision');
    if (!mixer) {
      return res.status(404).json({ error: 'Malaxeur non trouvé' });
    }
    
    // Trouver le cycle en cours pour ce malaxeur
    const malaxeurEnum = mixer.name.includes('B1') ? 'B1' : 
                         mixer.name.includes('B2') ? 'B2' :
                         mixer.name.includes('B3') ? 'B3' :
                         mixer.name.includes('B5') ? 'B5' :
                         mixer.name.includes('B6') ? 'B6' : 'B7';
    
    const cycle = await get('SELECT * FROM cycles_production WHERE malaxeur = ? AND statut = ? ORDER BY date_debut DESC LIMIT 1', [malaxeurEnum, 'EN_COURS'], 'supervision');
    if (cycle) {
      await run(`
        UPDATE cycles_production 
        SET date_fin = CURRENT_TIMESTAMP, statut = 'TERMINE'
        WHERE id = ?
      `, [cycle.id], 'supervision');
    }
    
    // Réinitialiser le malaxeur
    await run(`
      UPDATE mixers 
      SET recipe_id = NULL, status = 'Arrêt', current_step = NULL, progress = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [req.params.id], 'supervision');
    
    const updated = await get('SELECT * FROM mixers WHERE id = ?', [req.params.id], 'supervision');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/mixers/:id/validate-step - Valider une étape
app.post('/api/mixers/:id/validate-step', async (req, res) => {
  try {
    const { step_number, quantite_dosee, consigne_atteinte, valeur_critere, commentaire } = req.body;
    const mixer = await get('SELECT * FROM mixers WHERE id = ?', [req.params.id], 'supervision');
    
    if (!mixer) {
      return res.status(404).json({ error: 'Malaxeur non trouvé' });
    }
    
    // Trouver le cycle en cours
    const malaxeurEnum = mixer.name.includes('B1') ? 'B1' : 
                         mixer.name.includes('B2') ? 'B2' :
                         mixer.name.includes('B3') ? 'B3' :
                         mixer.name.includes('B5') ? 'B5' :
                         mixer.name.includes('B6') ? 'B6' : 'B7';
    
    const cycle = await get('SELECT * FROM cycles_production WHERE malaxeur = ? AND statut = ? ORDER BY date_debut DESC LIMIT 1', [malaxeurEnum, 'EN_COURS'], 'supervision');
    
    if (cycle && step_number) {
      const recipeStep = await get('SELECT * FROM etapes_recette WHERE recette_id = ? AND numero_etape = ?', [mixer.recipe_id, step_number], 'supervision');
      
      if (recipeStep) {
        let etapeExec = await get('SELECT * FROM etapes_execution WHERE cycle_id = ? AND numero_etape = ?', [cycle.id, step_number], 'supervision');
        
        if (!etapeExec) {
          await run(`
            INSERT INTO etapes_execution 
            (cycle_id, etape_recette_id, numero_etape, date_debut, statut)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'EN_COURS')
          `, [cycle.id, recipeStep.id, step_number], 'supervision');
          etapeExec = await get('SELECT * FROM etapes_execution WHERE cycle_id = ? AND numero_etape = ?', [cycle.id, step_number], 'supervision');
        }
        
        const dateDebut = new Date(etapeExec.date_debut);
        const now = new Date();
        const dureeReelleSec = Math.floor((now.getTime() - dateDebut.getTime()) / 1000);
        
        if (etapeExec && etapeExec.id) {
          await run(`
            UPDATE etapes_execution 
            SET date_fin = CURRENT_TIMESTAMP,
                duree_reelle_sec = ?,
                quantite_dosee = COALESCE(?, quantite_dosee),
                consigne_atteinte = COALESCE(?, consigne_atteinte),
                valeur_critere = COALESCE(?, valeur_critere),
                commentaire = COALESCE(?, commentaire),
                statut = 'TERMINE'
            WHERE id = ?
          `, [dureeReelleSec, quantite_dosee, consigne_atteinte ? 1 : 0, valeur_critere, commentaire, etapeExec.id], 'supervision');
        }
      }
    }
    
    const nextStep = (mixer.current_step || 0) + 1;
    const totalSteps = mixer.recipe_id ? await get('SELECT COUNT(*) as count FROM etapes_recette WHERE recette_id = ?', [mixer.recipe_id], 'supervision') : null;
    const progress = totalSteps ? Math.round((nextStep / totalSteps.count) * 100) : 100;
    
    if (totalSteps && nextStep > totalSteps.count) {
      if (cycle) {
        await run(`UPDATE cycles_production SET date_fin = CURRENT_TIMESTAMP, statut = 'TERMINE' WHERE id = ?`, [cycle.id], 'supervision');
      }
      await run(`UPDATE mixers SET recipe_id = NULL, status = 'Arrêt', current_step = NULL, progress = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [req.params.id], 'supervision');
    } else {
      await run(`
        UPDATE mixers 
        SET current_step = ?, progress = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [nextStep, progress, req.params.id], 'supervision');
      
      if (cycle && mixer.recipe_id && nextStep <= totalSteps.count) {
        const nextRecipeStep = await get('SELECT * FROM etapes_recette WHERE recette_id = ? AND numero_etape = ?', [mixer.recipe_id, nextStep], 'supervision');
        if (nextRecipeStep) {
          await run(`
            INSERT INTO etapes_execution 
            (cycle_id, etape_recette_id, numero_etape, date_debut, statut)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'EN_COURS')
          `, [cycle.id, nextRecipeStep.id, nextStep], 'supervision');
        }
      }
    }
    
    const updated = await get('SELECT * FROM mixers WHERE id = ?', [req.params.id], 'supervision');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== BATCHES API ==========

// GET /api/batches - Liste tous les lots (cycles de production)
app.get('/api/batches', async (req, res) => {
  try {
    const batches = await all(`
      SELECT c.*, r.nom as recipe_name
      FROM cycles_production c
      LEFT JOIN recettes r ON c.recette_id = r.id
      ORDER BY c.date_debut DESC
      LIMIT 100
    `, [], 'supervision');
    
    // Pour chaque batch, récupérer la distribution si la table existe
    for (const batch of batches) {
      try {
        batch.distribution = await all('SELECT * FROM batch_distribution WHERE batch_id = ?', [batch.id], 'supervision');
      } catch (e) {
        batch.distribution = [];
      }
    }
    
    res.json(batches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/batches/:id - Détails d'un lot
app.get('/api/batches/:id', async (req, res) => {
  try {
    const batch = await get('SELECT * FROM cycles_production WHERE id = ?', [req.params.id], 'supervision');
    if (!batch) {
      return res.status(404).json({ error: 'Lot non trouvé' });
    }
    
    // Récupérer les étapes d'exécution
    batch.steps = await all('SELECT * FROM etapes_execution WHERE cycle_id = ? ORDER BY numero_etape', [batch.id], 'supervision');
    
    // Récupérer la distribution
    try {
      batch.distribution = await all('SELECT * FROM batch_distribution WHERE batch_id = ?', [batch.id], 'supervision');
    } catch (e) {
      batch.distribution = [];
    }
    
    res.json(batch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/batches/:id/distribution - Mettre à jour la distribution d'un lot
app.put('/api/batches/:id/distribution', async (req, res) => {
  try {
    const { distribution } = req.body;
    
    // Supprimer l'ancienne distribution
    await run('DELETE FROM batch_distribution WHERE batch_id = ?', [req.params.id], 'supervision');
    
    // Insérer la nouvelle distribution
    for (const item of distribution || []) {
      await run(`
        INSERT INTO batch_distribution 
        (batch_id, product_name, qte_formule, qte_dosee, dose, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
          qte_formule = VALUES(qte_formule),
          qte_dosee = VALUES(qte_dosee),
          dose = VALUES(dose),
          updated_at = CURRENT_TIMESTAMP
      `, [req.params.id, item.productName, item.qteFormule || 0, item.qteDosee || 0, item.dose || 0], 'supervision');
    }
    
    const updated = await all('SELECT * FROM batch_distribution WHERE batch_id = ?', [req.params.id], 'supervision');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.path,
    method: req.method,
    message: 'Cette route n\'existe pas. Consultez / pour voir les endpoints disponibles.',
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur API démarré sur http://localhost:${PORT}`);
  console.log(`📊 Base de données: MySQL (supervision & malaxeur_db)`);
  console.log(`🌐 Testez l'API: http://localhost:${PORT}/api/mixers`);
});
