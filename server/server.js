import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { run, get, all } from './db.js';
import crypto from 'crypto';

// Fonction pour hasher un mot de passe (avec ou sans bcryptjs)
async function hashPassword(password) {
  try {
    // Essayer d'utiliser bcryptjs s'il est disponible
    const bcryptModule = await import('bcryptjs');
    const bcrypt = bcryptModule.default || bcryptModule;
    return await bcrypt.hash(password, 10);
  } catch (error) {
    // Fallback: utiliser crypto natif de Node.js (plus sécurisé que base64)
    console.warn('⚠️  bcryptjs non disponible, utilisation de crypto natif');
    console.warn('   Pour une meilleure sécurité, installez: npm install bcryptjs');
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }
}

// Fonction pour comparer un mot de passe
async function comparePassword(password, hash) {
  try {
    // Essayer d'utiliser bcryptjs s'il est disponible
    const bcryptModule = await import('bcryptjs');
    const bcrypt = bcryptModule.default || bcryptModule;
    return await bcrypt.compare(password, hash);
  } catch (error) {
    // Fallback: utiliser crypto natif
    if (hash.includes(':')) {
      // Format salt:hash
      const [salt, hashValue] = hash.split(':');
      const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
      return testHash === hashValue;
    }
    // Ancien format base64 (pour compatibilité)
    return Buffer.from(password).toString('base64') === hash;
  }
}

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
        users: '/api/users',
        ingredients: '/api/ingredients',
      },
  });
});

// ========== MIXERS API ==========

// GET /api/mixers - Liste tous les malaxeurs
app.get('/api/mixers', async (req, res) => {
  try {
    const mixers = await all(`
      SELECT m.*, r.name as recipe_name
      FROM mixers m
      LEFT JOIN recipes r ON m.recipe_id = r.id
      ORDER BY m.id
    `);
    res.json(mixers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/mixers/:id - Détails d'un malaxeur
app.get('/api/mixers/:id', async (req, res) => {
  try {
    const mixer = await get('SELECT * FROM mixers WHERE id = ?', [req.params.id]);
    if (!mixer) {
      return res.status(404).json({ error: 'Malaxeur non trouvé' });
    }
    
    // Récupérer la recette si elle existe
    if (mixer.recipe_id) {
      const recipe = await get('SELECT * FROM recipes WHERE id = ?', [mixer.recipe_id]);
      if (recipe) {
        const steps = await all('SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number', [recipe.id]);
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
    `, [status, recipe_id, current_step, progress, temperature, pressure, speed, power, motor_arm, motor_screw, batch_progress, req.params.id]);
    
    const updated = await get('SELECT * FROM mixers WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== RECIPES API ==========

// GET /api/recipes - Liste toutes les recettes
app.get('/api/recipes', async (req, res) => {
  try {
    const recipes = await all('SELECT * FROM recipes ORDER BY created_at DESC');
    for (const recipe of recipes) {
      recipe.steps = await all('SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number', [recipe.id]);
    }
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/recipes/:id - Détails d'une recette
app.get('/api/recipes/:id', async (req, res) => {
  try {
    const recipe = await get('SELECT * FROM recipes WHERE id = ?', [req.params.id]);
    if (!recipe) {
      return res.status(404).json({ error: 'Recette non trouvée' });
    }
    recipe.steps = await all('SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number', [recipe.id]);
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/recipes - Créer une recette
app.post('/api/recipes', async (req, res) => {
  try {
    const { name, description, steps } = req.body;
    const recipeId = uuidv4();
    
    await run(`
      INSERT INTO recipes (id, name, description, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [recipeId, name, description]);
    
    // Insérer les étapes
    for (const step of steps || []) {
      const stepId = uuidv4();
      await run(`
        INSERT INTO recipe_steps (id, recipe_id, step_number, function, arm, screw, duration, product, weight, vacuum, critere, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [stepId, recipeId, step.stepNumber, step.function, step.arm, step.screw, step.duration, step.product || null, step.weight || null, step.vacuum || null, step.critere || null, step.status || 'Reversible']);
    }
    
    const recipe = await get('SELECT * FROM recipes WHERE id = ?', [recipeId]);
    recipe.steps = await all('SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number', [recipeId]);
    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/recipes/:id - Modifier une recette
app.put('/api/recipes/:id', async (req, res) => {
  try {
    const { name, description, steps } = req.body;
    
    await run(`
      UPDATE recipes 
      SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, description, req.params.id]);
    
    // Supprimer les anciennes étapes
    await run('DELETE FROM recipe_steps WHERE recipe_id = ?', [req.params.id]);
    
    // Insérer les nouvelles étapes
    for (const step of steps || []) {
      const stepId = uuidv4();
      await run(`
        INSERT INTO recipe_steps (id, recipe_id, step_number, function, arm, screw, duration, product, weight, vacuum, critere, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [stepId, req.params.id, step.stepNumber, step.function, step.arm, step.screw, step.duration, step.product || null, step.weight || null, step.vacuum || null, step.critere || null, step.status || 'Reversible']);
    }
    
    const recipe = await get('SELECT * FROM recipes WHERE id = ?', [req.params.id]);
    recipe.steps = await all('SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number', [req.params.id]);
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/recipes/:id - Supprimer une recette
app.delete('/api/recipes/:id', async (req, res) => {
  try {
    await run('DELETE FROM recipes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Recette supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== INVENTORY API ==========

// GET /api/inventory - Liste tous les produits
app.get('/api/inventory', async (req, res) => {
  try {
    const inventory = await all('SELECT * FROM inventory ORDER BY product_name');
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/inventory/:id - Mettre à jour un produit
app.put('/api/inventory/:id', async (req, res) => {
  try {
    const { current_quantity } = req.body;
    const product = await get('SELECT * FROM inventory WHERE id = ?', [req.params.id]);
    
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
    `, [current_quantity, status, req.params.id]);
    
    const updated = await get('SELECT * FROM inventory WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ALARMS API ==========

// GET /api/alarms - Liste toutes les alarmes
app.get('/api/alarms', async (req, res) => {
  try {
    const alarms = await all('SELECT * FROM alarms ORDER BY occurred_at DESC');
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
    `, [req.body.operator_id || 'admin', req.params.id]);
    
    const alarm = await get('SELECT * FROM alarms WHERE id = ?', [req.params.id]);
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
    const defauts = await all(query, params);
    res.json(defauts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/defauts/:id - Détails d'un défaut
app.get('/api/defauts/:id', async (req, res) => {
  try {
    const defaut = await get('SELECT * FROM defauts_catalogue WHERE id_defaut = ?', [req.params.id]);
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
    const etapes = await all(query, params);
    res.json(etapes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/etapes-execution - Créer une étape d'exécution
app.post('/api/etapes-execution', async (req, res) => {
  try {
    const { cycle_id, etape_recette_id, numero_etape, date_debut, statut } = req.body;
    
    await run(`
      INSERT INTO etapes_execution 
      (cycle_id, etape_recette_id, numero_etape, date_debut, statut)
      VALUES (?, ?, ?, ?, ?)
    `, [cycle_id, etape_recette_id, numero_etape, date_debut || new Date().toISOString(), statut || 'EN_COURS']);
    
    const etape = await get('SELECT * FROM etapes_execution WHERE id = last_insert_rowid()');
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
    `, [date_fin, duree_reelle_sec, quantite_dosee, consigne_atteinte, valeur_critere, statut, commentaire, req.params.id]);
    
    const etape = await get('SELECT * FROM etapes_execution WHERE id = ?', [req.params.id]);
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
    const batchId = uuidv4();
    
    // Récupérer la recette pour obtenir le nom et la description
    const recipe = await get('SELECT * FROM recipes WHERE id = ?', [recipe_id]);
    
    // Créer un nouveau lot avec les champs de production
    await run(`
      INSERT INTO batches (
        id, batch_number, mixer_id, recipe_id, started_at, status, operator_id,
        formule, designation, fabricant
      )
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 'En cours', ?, ?, ?, ?)
    `, [
      batchId, 
      batch_number || `BATCH-${Date.now()}`, 
      req.params.id, 
      recipe_id, 
      operator_id || '',
      recipe?.name || '', // Formule = nom de la recette
      recipe?.description || '', // Désignation = description de la recette
      operator_id || '' // Fabricant = opérateur
    ]);
    
    // Créer l'étape d'exécution pour la première étape
    const firstStep = await get('SELECT * FROM recipe_steps WHERE recipe_id = ? AND step_number = 1', [recipe_id]);
    if (firstStep) {
      await run(`
        INSERT INTO etapes_execution 
        (cycle_id, etape_recette_id, numero_etape, date_debut, statut)
        VALUES (?, ?, 1, CURRENT_TIMESTAMP, 'EN_COURS')
      `, [batchId, firstStep.id]);
    }
    
    // Créer les entrées de distribution par défaut
    const defaultProducts = ['Hydrocarb', 'Napvis D10', 'Napvis D200', 'Huile HM'];
    for (const productName of defaultProducts) {
      await run(`
        INSERT INTO batch_distribution (batch_id, product_name, qte_formule, qte_dosee, dose)
        VALUES (?, ?, 0, 0, 0)
      `, [batchId, productName]);
    }
    
    // Mettre à jour le malaxeur
    await run(`
      UPDATE mixers 
      SET recipe_id = ?, status = 'Production', current_step = 1, progress = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [recipe_id, req.params.id]);
    
    const mixer = await get('SELECT * FROM mixers WHERE id = ?', [req.params.id]);
    res.json({ mixer, batch_id: batchId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/mixers/:id/end-recipe - Terminer une recette
app.post('/api/mixers/:id/end-recipe', async (req, res) => {
  try {
    const mixer = await get('SELECT * FROM mixers WHERE id = ?', [req.params.id]);
    if (!mixer) {
      return res.status(404).json({ error: 'Malaxeur non trouvé' });
    }
    
    // Mettre à jour le lot en cours
    const batch = await get('SELECT * FROM batches WHERE mixer_id = ? AND status = ? ORDER BY started_at DESC LIMIT 1', [req.params.id, 'En cours']);
    if (batch) {
      await run(`
        UPDATE batches 
        SET completed_at = CURRENT_TIMESTAMP, status = 'Terminé'
        WHERE id = ?
      `, [batch.id]);
    }
    
    // Réinitialiser le malaxeur
    await run(`
      UPDATE mixers 
      SET recipe_id = NULL, status = 'Arrêt', current_step = NULL, progress = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [req.params.id]);
    
    const updated = await get('SELECT * FROM mixers WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/mixers/:id/validate-step - Valider une étape
app.post('/api/mixers/:id/validate-step', async (req, res) => {
  try {
    const { step_number, quantite_dosee, consigne_atteinte, valeur_critere, commentaire } = req.body;
    const mixer = await get('SELECT * FROM mixers WHERE id = ?', [req.params.id]);
    
    if (!mixer) {
      return res.status(404).json({ error: 'Malaxeur non trouvé' });
    }
    
    // Récupérer le batch en cours
    const batch = await get('SELECT * FROM batches WHERE mixer_id = ? AND status = ? ORDER BY started_at DESC LIMIT 1', [req.params.id, 'En cours']);
    
    if (batch && step_number) {
      // Récupérer l'étape de recette actuelle
      const recipeStep = await get('SELECT * FROM recipe_steps WHERE recipe_id = ? AND step_number = ?', [mixer.recipe_id, step_number]);
      
      if (recipeStep) {
        // Trouver ou créer l'étape d'exécution
        let etapeExec = await get('SELECT * FROM etapes_execution WHERE cycle_id = ? AND numero_etape = ?', [batch.id, step_number]);
        
        if (!etapeExec) {
          // Créer l'étape d'exécution
          await run(`
            INSERT INTO etapes_execution 
            (cycle_id, etape_recette_id, numero_etape, date_debut, statut)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'EN_COURS')
          `, [batch.id, recipeStep.id, step_number]);
          etapeExec = await get('SELECT * FROM etapes_execution WHERE cycle_id = ? AND numero_etape = ?', [batch.id, step_number]);
        }
        
        // Calculer la durée réelle
        const dateDebut = new Date(etapeExec.date_debut);
        const now = new Date();
        const dureeReelleSec = Math.floor((now.getTime() - dateDebut.getTime()) / 1000);
        
        // Mettre à jour l'étape d'exécution
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
          `, [dureeReelleSec, quantite_dosee, consigne_atteinte ? 1 : 0, valeur_critere, commentaire, etapeExec.id]);
        }
      }
    }
    
    const nextStep = (mixer.current_step || 0) + 1;
    const totalSteps = mixer.recipe_id ? await get('SELECT COUNT(*) as count FROM recipe_steps WHERE recipe_id = ?', [mixer.recipe_id]) : null;
    const progress = totalSteps ? Math.round((nextStep / totalSteps.count) * 100) : 100;
    
    // Si c'est la dernière étape, terminer le batch
    if (totalSteps && nextStep > totalSteps.count) {
      if (batch) {
        await run(`UPDATE batches SET completed_at = CURRENT_TIMESTAMP, status = 'Terminé' WHERE id = ?`, [batch.id]);
      }
      await run(`UPDATE mixers SET recipe_id = NULL, status = 'Arrêt', current_step = NULL, progress = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [req.params.id]);
    } else {
      // Mettre à jour le malaxeur pour la prochaine étape
      await run(`
        UPDATE mixers 
        SET current_step = ?, progress = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [nextStep, progress, req.params.id]);
      
      // Créer l'étape d'exécution pour la prochaine étape
      if (batch && mixer.recipe_id && nextStep <= totalSteps.count) {
        const nextRecipeStep = await get('SELECT * FROM recipe_steps WHERE recipe_id = ? AND step_number = ?', [mixer.recipe_id, nextStep]);
        if (nextRecipeStep) {
          await run(`
            INSERT INTO etapes_execution 
            (cycle_id, etape_recette_id, numero_etape, date_debut, statut)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'EN_COURS')
          `, [batch.id, nextRecipeStep.id, nextStep]);
        }
      }
    }
    
    const updated = await get('SELECT * FROM mixers WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== USERS API ==========

// GET /api/users - Liste tous les utilisateurs
app.get('/api/users', async (req, res) => {
  try {
    const users = await all(`
      SELECT id, username, email, role, created_at, last_login
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id - Détails d'un utilisateur
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await get(`
      SELECT id, username, email, role, created_at, last_login
      FROM users
      WHERE id = ?
    `, [req.params.id]);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users - Créer un utilisateur
app.post('/api/users', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Nom d\'utilisateur, email et mot de passe sont requis' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser) {
      return res.status(409).json({ error: 'Un utilisateur avec ce nom ou cet email existe déjà' });
    }
    
    // Hasher le mot de passe
    const passwordHash = await hashPassword(password);
    const userId = uuidv4();
    
    // Créer l'utilisateur
    await run(`
      INSERT INTO users (id, username, email, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [userId, username, email, passwordHash, role || 'Operator']);
    
    // Retourner l'utilisateur créé (sans le mot de passe)
    const newUser = await get(`
      SELECT id, username, email, role, created_at, last_login
      FROM users
      WHERE id = ?
    `, [userId]);
    
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:id - Modifier un utilisateur
app.put('/api/users/:id', async (req, res) => {
  try {
    const { username, email, role } = req.body;
    const userId = req.params.id;
    
    // Vérifier si l'utilisateur existe
    const existingUser = await get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Vérifier si le nom d'utilisateur ou l'email est déjà utilisé par un autre utilisateur
    if (username || email) {
      const conflictUser = await get(
        'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
        [username || '', email || '', userId]
      );
      if (conflictUser) {
        return res.status(409).json({ error: 'Un utilisateur avec ce nom ou cet email existe déjà' });
      }
    }
    
    // Mettre à jour l'utilisateur
    const updates = [];
    const params = [];
    
    if (username) {
      updates.push('username = ?');
      params.push(username);
    }
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
    }
    
    params.push(userId);
    await run(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);
    
    // Retourner l'utilisateur mis à jour
    const updatedUser = await get(`
      SELECT id, username, email, role, created_at, last_login
      FROM users
      WHERE id = ?
    `, [userId]);
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/:id - Supprimer un utilisateur
app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Vérifier si l'utilisateur existe
    const existingUser = await get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Supprimer l'utilisateur
    await run('DELETE FROM users WHERE id = ?', [userId]);
    
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:id/password - Changer le mot de passe
app.put('/api/users/:id/password', async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.params.id;
    
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }
    
    // Vérifier si l'utilisateur existe
    const existingUser = await get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Hasher le nouveau mot de passe
    const passwordHash = await hashPassword(password);
    
    // Mettre à jour le mot de passe
    await run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
    
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== BATCHES API ==========

// GET /api/batches - Liste tous les lots (avec distribution)
app.get('/api/batches', async (req, res) => {
  try {
    const batches = await all(`
      SELECT b.*, r.name as recipe_name
      FROM batches b
      LEFT JOIN recipes r ON b.recipe_id = r.id
      ORDER BY b.started_at DESC
      LIMIT 100
    `);
    
    // Pour chaque batch, récupérer la distribution
    for (const batch of batches) {
      batch.distribution = await all('SELECT * FROM batch_distribution WHERE batch_id = ?', [batch.id]);
    }
    
    res.json(batches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/batches/:id - Détails d'un lot
app.get('/api/batches/:id', async (req, res) => {
  try {
    const batch = await get('SELECT * FROM batches WHERE id = ?', [req.params.id]);
    if (!batch) {
      return res.status(404).json({ error: 'Lot non trouvé' });
    }
    
    batch.steps = await all('SELECT * FROM batch_steps WHERE batch_id = ? ORDER BY step_number', [batch.id]);
    batch.metrics = await all('SELECT * FROM batch_metrics WHERE batch_id = ? ORDER BY timestamp', [batch.id]);
    batch.distribution = await all('SELECT * FROM batch_distribution WHERE batch_id = ?', [batch.id]);
    
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
    await run('DELETE FROM batch_distribution WHERE batch_id = ?', [req.params.id]);
    
    // Insérer la nouvelle distribution
    for (const item of distribution || []) {
      await run(`
        INSERT OR REPLACE INTO batch_distribution 
        (batch_id, product_name, qte_formule, qte_dosee, dose, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [req.params.id, item.productName, item.qteFormule || 0, item.qteDosee || 0, item.dose || 0]);
    }
    
    const updated = await all('SELECT * FROM batch_distribution WHERE batch_id = ?', [req.params.id]);
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
  console.log(`📊 Base de données: database.sqlite`);
  console.log(`🌐 Testez l'API: http://localhost:${PORT}/api/mixers`);
});

