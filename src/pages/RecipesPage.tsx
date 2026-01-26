import { useState, useEffect } from 'react';
import { recipesAPI, batchesAPI, ingredientsAPI } from '../services/api';
import { useMixers } from '../hooks/useMixers';
import { Recipe, RecipeStep, RecipeFunction, StepStatus, Batch, Ingredient } from '../types';
import { Plus, Edit, Trash2, X, BookOpen, Package } from 'lucide-react';

export default function RecipesPage() {
  const { mixers } = useMixers();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [recentRecipes, setRecentRecipes] = useState<Array<{recipe: Recipe, batch: Batch}>>([]);
  const [activeTab, setActiveTab] = useState<'recipes' | 'ingredients'>('recipes');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isIngredientDialogOpen, setIsIngredientDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [ingredientFormData, setIngredientFormData] = useState<Partial<Ingredient>>({
    name: '',
    description: '',
    category: '',
    unit: 'Kg',
    isActive: true,
  });
  const [formData, setFormData] = useState<Partial<Recipe>>({
    name: '',
    description: '',
    mixerId: undefined,
    mixerName: '',
    steps: [],
  });

  const recipeFunctions: RecipeFunction[] = [
    'Démarrage',
    'Dosage Automatique',
    'Introduction Manuelle',
    'Mélange',
    'Prépa mise au vide',
    'Mise au vide',
    'Extrusion',
  ];

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const data = await recipesAPI.getAll();
        // Logs désactivés pour éviter le spam console
        // console.log('Recettes reçues de l\'API:', data.length, data.map((r: any) => r.name));
        // Transformer les données de l'API pour correspondre au type Recipe
        const transformedRecipes: Recipe[] = data.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description || '',
          steps: (r.steps || []).map((s: any) => ({
            id: s.id,
            stepNumber: s.stepNumber || s.step_number,
            function: s.function as RecipeFunction,
            arm: s.arm as 'GV' | 'PV',
            screw: s.screw as 'GV' | 'PV',
            ref: s.ref || undefined,
            duration: s.duration,
            product: s.product || undefined,
            weight: s.weight || undefined,
            vacuum: s.vacuum || undefined,
            mesure: s.mesure || undefined,
            critere: s.critere || undefined,
            status: (s.status || 'Reversible') as StepStatus,
          })),
          createdAt: r.createdAt || r.created_at,
          updatedAt: r.updatedAt || r.updated_at,
          isActive: r.isActive !== undefined ? r.isActive : (r.is_active === 1 || r.is_active === true),
          mixerId: r.mixerId || r.mixer_id,
          mixerName: r.mixerName || r.mixer_name,
          createdBy: r.createdBy || r.created_by,
        }));
        
        // Éliminer les doublons en gardant la version la plus récente de chaque recette
        const uniqueRecipesMap = new Map<string, Recipe>();
        transformedRecipes.forEach(recipe => {
          const existing = uniqueRecipesMap.get(recipe.name);
          if (!existing || new Date(recipe.createdAt) > new Date(existing.createdAt)) {
            uniqueRecipesMap.set(recipe.name, recipe);
          }
        });
        
        const uniqueRecipes = Array.from(uniqueRecipesMap.values());
        // Logs désactivés pour éviter le spam console
        // console.log('Recettes uniques après filtrage:', uniqueRecipes.length, uniqueRecipes.map(r => r.name));
        setRecipes(uniqueRecipes);
      } catch (error) {
        console.error('Error fetching recipes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
    fetchRecentRecipes();
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const data = await ingredientsAPI.getAll();
      const transformedIngredients: Ingredient[] = data.map((i: any) => ({
        id: i.id,
        name: i.name,
        description: i.description || '',
        category: i.category || '',
        unit: (i.unit || 'Kg') as 'Kg' | 'L' | 'g',
        isActive: i.isActive !== undefined ? i.isActive : (i.is_active === 1 || i.is_active === true),
        createdAt: i.createdAt || i.created_at,
        updatedAt: i.updatedAt || i.updated_at,
      }));
      setIngredients(transformedIngredients);
    } catch (error) {
      // Ne pas logger les erreurs 404 pour ingredients (API n'existe pas encore)
      // Utiliser des données par défaut silencieusement
      if (!(error instanceof Error && (error.message?.includes('404') || error.message?.includes('Not Found')))) {
        console.error('Error fetching ingredients:', error);
      }
      setIngredients([
        { id: '1', name: 'Napvis D10', description: 'Napvis D10', category: 'Liquide', unit: 'Kg', isActive: true },
        { id: '2', name: 'Napvis D200', description: 'Napvis D200', category: 'Liquide', unit: 'Kg', isActive: true },
        { id: '3', name: 'Huile HM', description: 'Huile minérale', category: 'Liquide', unit: 'Kg', isActive: true },
        { id: '4', name: 'Hydrocarb', description: 'Hydrocarb', category: 'Poudre', unit: 'Kg', isActive: true },
      ]);
    }
  };

  const fetchRecentRecipes = async () => {
    try {
      const batches = await batchesAPI.getAll();
      // Trier par date de début (plus récent en premier) et prendre les 10 premiers
      const sortedBatches = batches
        .filter((b: Batch) => b.recipeId)
        .sort((a: Batch, b: Batch) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        .slice(0, 10);
      
      // Récupérer les recettes correspondantes
      const recipeIds = [...new Set(sortedBatches.map((b: Batch) => b.recipeId))];
      const allRecipes = await recipesAPI.getAll();
      
      const recent = sortedBatches.map((batch: Batch) => {
        const recipe = allRecipes.find((r: any) => r.id === batch.recipeId);
        if (recipe) {
          return {
            recipe: {
              id: recipe.id,
              name: recipe.name || recipe.name,
              description: recipe.description || '',
              steps: recipe.steps || [],
              createdAt: recipe.createdAt || recipe.created_at,
              updatedAt: recipe.updatedAt || recipe.updated_at,
              isActive: recipe.isActive !== undefined ? recipe.isActive : true,
              mixerId: recipe.mixerId || recipe.mixer_id,
              mixerName: recipe.mixerName || recipe.mixer_name,
              createdBy: recipe.createdBy || recipe.created_by,
            } as Recipe,
            batch,
          };
        }
        return null;
      }).filter(Boolean) as Array<{recipe: Recipe, batch: Batch}>;
      
      setRecentRecipes(recent);
    } catch (error) {
      console.error('Error fetching recent recipes:', error);
    }
  };

  // Compter les recettes par malaxeur
  const getRecipesByMixer = () => {
    const counts: { [key: number]: number } = {};
    recipes.forEach(recipe => {
      if (recipe.mixerId) {
        counts[recipe.mixerId] = (counts[recipe.mixerId] || 0) + 1;
      }
    });
    return counts;
  };

  const recipesByMixer = getRecipesByMixer();
  const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);

  const openDialog = (recipe?: Recipe) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setFormData({
        name: recipe.name,
        description: recipe.description,
        mixerId: recipe.mixerId,
        mixerName: recipe.mixerName || '',
        steps: [...recipe.steps],
      });
    } else {
      setEditingRecipe(null);
      setFormData({
        name: '',
        description: '',
        mixerId: undefined,
        mixerName: '',
        steps: [],
      });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingRecipe(null);
    setFormData({ name: '', description: '', mixerId: undefined, mixerName: '', steps: [] });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.steps || formData.steps.length === 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const recipeData: any = {
        name: formData.name!,
        description: formData.description || '',
        steps: formData.steps!.map(step => ({
          stepNumber: step.stepNumber,
          function: step.function,
          arm: step.arm,
          screw: step.screw,
          ref: step.ref || null,
          duration: step.duration,
          product: step.product || null,
          weight: step.weight || null,
          vacuum: step.vacuum || null,
          mesure: step.mesure || null,
          critere: step.critere || null,
          status: step.status || 'Reversible',
        })),
      };

      // Ajouter mixerId si sélectionné
      if (formData.mixerId) {
        recipeData.mixerId = formData.mixerId;
        const selectedMixer = mixers.find(m => m.id === formData.mixerId);
        if (selectedMixer) {
          recipeData.mixerName = selectedMixer.name;
        }
      } else if (formData.mixerName) {
        recipeData.mixerName = formData.mixerName;
      }

      if (editingRecipe) {
        await recipesAPI.update(editingRecipe.id, recipeData);
      } else {
        await recipesAPI.create(recipeData);
      }
      
      // Recharger les recettes
      const data = await recipesAPI.getAll();
      const transformedRecipes: Recipe[] = data.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        steps: (r.steps || []).map((s: any) => ({
          id: s.id,
          stepNumber: s.stepNumber || s.step_number,
          function: s.function as RecipeFunction,
          arm: s.arm as 'GV' | 'PV',
          screw: s.screw as 'GV' | 'PV',
          ref: s.ref || undefined,
          duration: s.duration,
          product: s.product || undefined,
          weight: s.weight || undefined,
          vacuum: s.vacuum || undefined,
          mesure: s.mesure || undefined,
          critere: s.critere || undefined,
          status: (s.status || 'Reversible') as StepStatus,
        })),
        createdAt: r.createdAt || r.created_at,
        updatedAt: r.updatedAt || r.updated_at,
        isActive: r.isActive !== undefined ? r.isActive : (r.is_active === 1 || r.is_active === true),
        mixerId: r.mixerId || r.mixer_id,
        mixerName: r.mixerName || r.mixer_name,
        createdBy: r.createdBy || r.created_by,
      }));
      setRecipes(transformedRecipes);
      closeDialog();
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Erreur lors de la sauvegarde de la recette');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette recette ?')) {
      try {
        await recipesAPI.delete(id);
        const data = await recipesAPI.getAll();
        const transformedRecipes: Recipe[] = data.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description || '',
          steps: (r.steps || []).map((s: any) => ({
            id: s.id,
            stepNumber: s.stepNumber || s.step_number,
            function: s.function as RecipeFunction,
            arm: s.arm as 'GV' | 'PV',
            screw: s.screw as 'GV' | 'PV',
            ref: s.ref || undefined,
            duration: s.duration,
            product: s.product || undefined,
            weight: s.weight || undefined,
            vacuum: s.vacuum || undefined,
            mesure: s.mesure || undefined,
            critere: s.critere || undefined,
            status: (s.status || 'Reversible') as StepStatus,
          })),
          createdAt: r.createdAt || r.created_at,
          updatedAt: r.updatedAt || r.updated_at,
          isActive: r.isActive !== undefined ? r.isActive : (r.is_active === 1 || r.is_active === true),
          mixerId: r.mixerId || r.mixer_id,
          mixerName: r.mixerName || r.mixer_name,
          createdBy: r.createdBy || r.created_by,
        }));
        setRecipes(transformedRecipes);
      } catch (error) {
        console.error('Error deleting recipe:', error);
        alert('Erreur lors de la suppression de la recette');
      }
    }
  };

  const addStep = () => {
    const newStep: RecipeStep = {
      id: Date.now().toString(),
      stepNumber: (formData.steps?.length || 0) + 1,
      function: 'Démarrage',
      arm: 'GV',
      screw: 'GV',
      duration: 60,
      status: 'Reversible',
    };
    setFormData({
      ...formData,
      steps: [...(formData.steps || []), newStep],
    });
  };

  const updateStep = (stepId: string, field: keyof RecipeStep, value: any) => {
    setFormData({
      ...formData,
      steps: formData.steps?.map((step) => {
        if (step.id === stepId) {
          const updated = { ...step, [field]: value };
          return updated;
        }
        return step;
      }).map((step, idx) => ({
        ...step,
        stepNumber: idx + 1,
      })),
    });
  };

  const removeStep = (stepId: string) => {
    setFormData({
      ...formData,
      steps: formData.steps?.filter(s => s.id !== stepId).map((step, index) => ({
        ...step,
        stepNumber: index + 1,
      })),
    });
  };

  const openIngredientDialog = (ingredient?: Ingredient) => {
    if (ingredient) {
      setEditingIngredient(ingredient);
      setIngredientFormData({
        name: ingredient.name,
        description: ingredient.description || '',
        category: ingredient.category || '',
        unit: ingredient.unit,
        isActive: ingredient.isActive,
      });
    } else {
      setEditingIngredient(null);
      setIngredientFormData({
        name: '',
        description: '',
        category: '',
        unit: 'Kg',
        isActive: true,
      });
    }
    setIsIngredientDialogOpen(true);
  };

  const closeIngredientDialog = () => {
    setIsIngredientDialogOpen(false);
    setEditingIngredient(null);
    setIngredientFormData({
      name: '',
      description: '',
      category: '',
      unit: 'Kg',
      isActive: true,
    });
  };

  const handleSaveIngredient = async () => {
    if (!ingredientFormData.name) {
      alert('Veuillez remplir le nom de l\'ingrédient');
      return;
    }

    try {
      const ingredientData = {
        name: ingredientFormData.name!,
        description: ingredientFormData.description || '',
        category: ingredientFormData.category || '',
        unit: ingredientFormData.unit || 'Kg',
        isActive: ingredientFormData.isActive !== undefined ? ingredientFormData.isActive : true,
      };

      if (editingIngredient) {
        await ingredientsAPI.update(editingIngredient.id, ingredientData);
      } else {
        await ingredientsAPI.create(ingredientData);
      }
      
      await fetchIngredients();
      closeIngredientDialog();
    } catch (error) {
      console.error('Error saving ingredient:', error);
      alert('Erreur lors de la sauvegarde de l\'ingrédient');
    }
  };

  const handleDeleteIngredient = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet ingrédient ?')) {
      try {
        await ingredientsAPI.delete(id);
        await fetchIngredients();
      } catch (error) {
        console.error('Error deleting ingredient:', error);
        alert('Erreur lors de la suppression de l\'ingrédient');
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Recettes et Ingrédients</h1>
        {activeTab === 'recipes' ? (
          <button
            onClick={() => openDialog()}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvelle recette
          </button>
        ) : (
          <button
            onClick={() => openIngredientDialog()}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvel ingrédient
          </button>
        )}
      </div>

      {/* Onglets */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('recipes')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'recipes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Recettes
          </button>
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'ingredients'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="w-4 h-4" />
            Ingrédients
          </button>
        </nav>
      </div>

      {activeTab === 'recipes' && (
        <>

      {/* Carré nombre de recettes par malaxeur */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Nombre de recettes par malaxeur</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {mixers.map((mixer) => (
            <div key={mixer.id} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">{mixer.name}</div>
              <div className="text-2xl font-bold text-primary-600 mt-1">
                {recipesByMixer[mixer.id] || 0}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Barre déroulante pour sélectionner une recette */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionner une recette à visualiser
        </label>
        <select
          value={selectedRecipeId}
          onChange={(e) => setSelectedRecipeId(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
        >
          <option value="">-- Sélectionner une recette --</option>
          {recipes.map((recipe) => (
            <option key={recipe.id} value={recipe.id}>
              {recipe.name} {recipe.mixerName ? `(${recipe.mixerName})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Liste des 10 dernières recettes utilisées */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">10 dernières recettes utilisées</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2">Nom</th>
                <th className="text-left p-2">Description</th>
                <th className="text-left p-2">Malaxeur</th>
                <th className="text-left p-2">Nombre d'étapes</th>
                <th className="text-left p-2">Dernière modification</th>
                <th className="text-left p-2">Personne</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentRecipes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-4 text-gray-500">
                    Aucune recette récente
                  </td>
                </tr>
              ) : (
                recentRecipes.map(({ recipe, batch }) => (
                  <tr key={recipe.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{recipe.name}</td>
                    <td className="p-2 text-sm text-gray-600">{recipe.description || '-'}</td>
                    <td className="p-2">{recipe.mixerName || '-'}</td>
                    <td className="p-2">{recipe.steps.length}</td>
                    <td className="p-2">
                      {recipe.updatedAt ? new Date(recipe.updatedAt).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="p-2">{recipe.createdBy || '-'}</td>
                    <td className="p-2">
                      <button
                        onClick={() => openDialog(recipe)}
                        className="text-primary-600 hover:text-primary-700 mr-2"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visualisation de la recette sélectionnée */}
      {selectedRecipe && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Visualisation: {selectedRecipe.name}</h2>
            <button
              onClick={() => openDialog(selectedRecipe)}
              className="btn-primary text-sm"
            >
              <Edit className="w-4 h-4 inline mr-1" />
              Modifier
            </button>
          </div>
          <div className="mb-4">
            <p className="text-gray-600 mb-2">{selectedRecipe.description || 'Pas de description'}</p>
            <p className="text-sm text-gray-500">
              Malaxeur: {selectedRecipe.mixerName || 'Non spécifié'} | 
              Nombre d'étapes: {selectedRecipe.steps.length}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Étape</th>
                  <th className="border p-2 text-left">Fonction</th>
                  <th className="border p-2 text-left">Bras</th>
                  <th className="border p-2 text-left">Vis</th>
                  <th className="border p-2 text-left">Référence</th>
                  <th className="border p-2 text-left">Durée (s)</th>
                  <th className="border p-2 text-left">Produit</th>
                  <th className="border p-2 text-left">Poids (Kg)</th>
                  <th className="border p-2 text-left">Vide (%)</th>
                  <th className="border p-2 text-left">Mesure</th>
                  <th className="border p-2 text-left">Critère</th>
                  <th className="border p-2 text-left">Statut</th>
                </tr>
              </thead>
              <tbody>
                {selectedRecipe.steps.map((step) => (
                  <tr key={step.id}>
                    <td className="border p-2">{step.stepNumber}</td>
                    <td className="border p-2">{step.function}</td>
                    <td className="border p-2">{step.arm}</td>
                    <td className="border p-2">{step.screw}</td>
                    <td className="border p-2">{step.ref || '-'}</td>
                    <td className="border p-2">{step.duration}</td>
                    <td className="border p-2">{step.product || '-'}</td>
                    <td className="border p-2">{step.weight || '-'}</td>
                    <td className="border p-2">{step.vacuum || '-'}</td>
                    <td className="border p-2">{step.mesure || '-'}</td>
                    <td className="border p-2">{step.critere || '-'}</td>
                    <td className="border p-2">{step.status || 'Reversible'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialogue de création/modification */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-7xl max-h-[95vh] w-full overflow-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {editingRecipe ? 'Modifier la recette' : 'Nouvelle recette'}
              </h2>
              <button onClick={closeDialog} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Informations générales */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la recette *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Ex: Recette A - Standard"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    rows={2}
                    placeholder="Description de la recette"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Malaxeur
                  </label>
                  <select
                    value={formData.mixerId || ''}
                    onChange={(e) => {
                      const mixerId = e.target.value ? parseInt(e.target.value) : undefined;
                      const mixer = mixers.find(m => m.id === mixerId);
                      setFormData({ 
                        ...formData, 
                        mixerId,
                        mixerName: mixer?.name || ''
                      });
                    }}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">-- Sélectionner un malaxeur --</option>
                    {mixers.map((mixer) => (
                      <option key={mixer.id} value={mixer.id}>
                        {mixer.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Étapes */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Étapes de la recette</h3>
                  <button onClick={addStep} className="btn-primary text-sm">
                    <Plus className="w-4 h-4 inline mr-1" />
                    Ajouter une étape
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Étape</th>
                        <th className="border p-2 text-left">Fonction</th>
                        <th className="border p-2 text-left">Bras</th>
                        <th className="border p-2 text-left">Vis</th>
                        <th className="border p-2 text-left">Référence</th>
                        <th className="border p-2 text-left">Durée (s)</th>
                        <th className="border p-2 text-left">Produit</th>
                        <th className="border p-2 text-left">Poids (Kg)</th>
                        <th className="border p-2 text-left">Vide (%)</th>
                        <th className="border p-2 text-left">Mesure</th>
                        <th className="border p-2 text-left">Critère</th>
                        <th className="border p-2 text-left">Statut</th>
                        <th className="border p-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.steps?.map((step) => (
                        <tr key={step.id}>
                          <td className="border p-2">{step.stepNumber}</td>
                          <td className="border p-2">
                            <select
                              value={step.function}
                              onChange={(e) => updateStep(step.id, 'function', e.target.value)}
                              className="w-full border rounded px-2 py-1"
                            >
                              {recipeFunctions.map((func) => (
                                <option key={func} value={func}>{func}</option>
                              ))}
                            </select>
                          </td>
                          <td className="border p-2">
                            <select
                              value={step.arm}
                              onChange={(e) => updateStep(step.id, 'arm', e.target.value)}
                              className="w-full border rounded px-2 py-1"
                            >
                              <option value="GV">GV</option>
                              <option value="PV">PV</option>
                            </select>
                          </td>
                          <td className="border p-2">
                            <select
                              value={step.screw}
                              onChange={(e) => updateStep(step.id, 'screw', e.target.value)}
                              className="w-full border rounded px-2 py-1"
                            >
                              <option value="GV">GV</option>
                              <option value="PV">PV</option>
                            </select>
                          </td>
                          <td className="border p-2">
                            <input
                              type="text"
                              value={step.ref || ''}
                              onChange={(e) => updateStep(step.id, 'ref', e.target.value)}
                              className="w-full border rounded px-2 py-1"
                              placeholder="Optionnel"
                            />
                          </td>
                          <td className="border p-2">
                            <input
                              type="number"
                              value={step.duration}
                              onChange={(e) => updateStep(step.id, 'duration', parseInt(e.target.value))}
                              className="w-full border rounded px-2 py-1"
                              min="0"
                            />
                          </td>
                          <td className="border p-2">
                            <input
                              type="text"
                              value={step.product || ''}
                              onChange={(e) => updateStep(step.id, 'product', e.target.value)}
                              className="w-full border rounded px-2 py-1"
                              placeholder="Optionnel"
                            />
                          </td>
                          <td className="border p-2">
                            <input
                              type="number"
                              value={step.weight || ''}
                              onChange={(e) => updateStep(step.id, 'weight', parseFloat(e.target.value))}
                              className="w-full border rounded px-2 py-1"
                              placeholder="Optionnel"
                              step="0.1"
                            />
                          </td>
                          <td className="border p-2">
                            <input
                              type="number"
                              value={step.vacuum || ''}
                              onChange={(e) => updateStep(step.id, 'vacuum', parseFloat(e.target.value))}
                              className="w-full border rounded px-2 py-1"
                              placeholder="Optionnel"
                              step="0.1"
                              min="0"
                              max="100"
                            />
                          </td>
                          <td className="border p-2">
                            <input
                              type="number"
                              value={step.mesure || ''}
                              onChange={(e) => updateStep(step.id, 'mesure', parseFloat(e.target.value))}
                              className="w-full border rounded px-2 py-1"
                              placeholder="Optionnel"
                              step="0.1"
                            />
                          </td>
                          <td className="border p-2">
                            <input
                              type="text"
                              value={step.critere || ''}
                              onChange={(e) => updateStep(step.id, 'critere', e.target.value)}
                              className="w-full border rounded px-2 py-1"
                              placeholder="Critère de fin"
                            />
                          </td>
                          <td className="border p-2">
                            <select
                              value={step.status || 'Reversible'}
                              onChange={(e) => updateStep(step.id, 'status', e.target.value)}
                              className="w-full border rounded px-2 py-1"
                            >
                              <option value="Reversible">Reversible</option>
                              <option value="En attente">En attente</option>
                              <option value="En cours">En cours</option>
                              <option value="Terminée">Terminée</option>
                            </select>
                          </td>
                          <td className="border p-2">
                            <button
                              onClick={() => removeStep(step.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button onClick={closeDialog} className="btn-secondary">
                  Annuler
                </button>
                <button onClick={handleSave} className="btn-primary">
                  {editingRecipe ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {activeTab === 'ingredients' && (
        <div className="space-y-6">
          {/* Liste des ingrédients */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Liste des ingrédients</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3">Nom</th>
                    <th className="text-left p-3">Description</th>
                    <th className="text-left p-3">Catégorie</th>
                    <th className="text-left p-3">Unité</th>
                    <th className="text-left p-3">Statut</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-4 text-gray-500">
                        Aucun ingrédient trouvé
                      </td>
                    </tr>
                  ) : (
                    ingredients.map((ingredient) => (
                      <tr key={ingredient.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{ingredient.name}</td>
                        <td className="p-3 text-sm text-gray-600">{ingredient.description || '-'}</td>
                        <td className="p-3">{ingredient.category || '-'}</td>
                        <td className="p-3">{ingredient.unit}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            ingredient.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {ingredient.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openIngredientDialog(ingredient)}
                              className="text-primary-600 hover:text-primary-700"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteIngredient(ingredient.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Dialogue de création/modification ingrédient */}
      {isIngredientDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {editingIngredient ? 'Modifier l\'ingrédient' : 'Nouvel ingrédient'}
              </h2>
              <button onClick={closeIngredientDialog} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'ingrédient *
                </label>
                <input
                  type="text"
                  value={ingredientFormData.name}
                  onChange={(e) => setIngredientFormData({ ...ingredientFormData, name: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Ex: Napvis D10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={ingredientFormData.description}
                  onChange={(e) => setIngredientFormData({ ...ingredientFormData, description: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  rows={2}
                  placeholder="Description de l'ingrédient"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <input
                  type="text"
                  value={ingredientFormData.category}
                  onChange={(e) => setIngredientFormData({ ...ingredientFormData, category: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Ex: Liquide, Poudre"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unité *
                </label>
                <select
                  value={ingredientFormData.unit}
                  onChange={(e) => setIngredientFormData({ ...ingredientFormData, unit: e.target.value as 'Kg' | 'L' | 'g' })}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="Kg">Kg</option>
                  <option value="L">L</option>
                  <option value="g">g</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={ingredientFormData.isActive}
                    onChange={(e) => setIngredientFormData({ ...ingredientFormData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Actif</span>
                </label>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button onClick={closeIngredientDialog} className="btn-secondary">
                  Annuler
                </button>
                <button onClick={handleSaveIngredient} className="btn-primary">
                  {editingIngredient ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
