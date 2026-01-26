// Script à exécuter dans la console du navigateur pour créer une recette de test pour B3
// Copiez-collez ce code dans la console de votre navigateur (F12) sur la page de l'application

(async function createRecipeB3() {
  const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3001/api';
  
  const recipeData = {
    name: 'Recette Test B3',
    description: 'Recette de test pour le malaxeur B3',
    mixerId: 3,
    mixerName: 'Malaxeur B3',
    steps: [
      {
        stepNumber: 1,
        function: 'Démarrage',
        arm: 'GV',
        screw: 'GV',
        duration: 30,
        status: 'Reversible'
      },
      {
        stepNumber: 2,
        function: 'Dosage Automatique',
        arm: 'GV',
        screw: 'GV',
        duration: 120,
        product: 'Napvis D200',
        weight: 50.0,
        status: 'Reversible'
      },
      {
        stepNumber: 3,
        function: 'Mélange',
        arm: 'GV',
        screw: 'GV',
        duration: 180,
        status: 'Reversible'
      },
      {
        stepNumber: 4,
        function: 'Dosage Automatique',
        arm: 'GV',
        screw: 'GV',
        duration: 90,
        product: 'Hydrocarb',
        weight: 30.0,
        status: 'Reversible'
      },
      {
        stepNumber: 5,
        function: 'Mélange',
        arm: 'GV',
        screw: 'GV',
        duration: 240,
        status: 'Reversible'
      },
      {
        stepNumber: 6,
        function: 'Prépa mise au vide',
        arm: 'GV',
        screw: 'GV',
        duration: 60,
        status: 'Reversible'
      },
      {
        stepNumber: 7,
        function: 'Mise au vide',
        arm: 'GV',
        screw: 'GV',
        duration: 300,
        vacuum: 80,
        status: 'Reversible'
      },
      {
        stepNumber: 8,
        function: 'Extrusion',
        arm: 'GV',
        screw: 'GV',
        duration: 120,
        status: 'Reversible'
      }
    ]
  };

  try {
    console.log('Création de la recette pour B3...');
    const response = await fetch(`${API_BASE_URL}/recipes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recipeData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Recette créée avec succès!');
    console.log('Résultat:', result);
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de la création de la recette:', error.message);
    throw error;
  }
})();
