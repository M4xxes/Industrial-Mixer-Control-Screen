import { useState } from 'react';
import { mockRecipes } from '../data/mockData';
import { Recipe, RecipeStep, RecipeFunction } from '../types';
import { Plus, Edit, Trash2, X } from 'lucide-react';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState(mockRecipes);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [formData, setFormData] = useState<Partial<Recipe>>({
    name: '',
    description: '',
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

  const openDialog = (recipe?: Recipe) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setFormData({
        name: recipe.name,
        description: recipe.description,
        steps: [...recipe.steps],
      });
    } else {
      setEditingRecipe(null);
      setFormData({
        name: '',
        description: '',
        steps: [],
      });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingRecipe(null);
    setFormData({ name: '', description: '', steps: [] });
  };

  const handleSave = () => {
    if (!formData.name || !formData.steps || formData.steps.length === 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (editingRecipe) {
      // Modifier recette existante
      setRecipes(recipes.map(r => 
        r.id === editingRecipe.id
          ? {
              ...r,
              name: formData.name!,
              description: formData.description,
              steps: formData.steps!,
              updatedAt: new Date().toISOString(),
            }
          : r
      ));
    } else {
      // Créer nouvelle recette
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        name: formData.name!,
        description: formData.description,
        steps: formData.steps!,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };
      setRecipes([...recipes, newRecipe]);
    }
    closeDialog();
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette recette ?')) {
      setRecipes(recipes.filter(r => r.id !== id));
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
    };
    setFormData({
      ...formData,
      steps: [...(formData.steps || []), newStep],
    });
  };

  const updateStep = (stepId: string, field: keyof RecipeStep, value: any) => {
    setFormData({
      ...formData,
      steps: formData.steps?.map((step, index) => {
        if (step.id === stepId) {
          const updated = { ...step, [field]: value };
          if (field === 'stepNumber') {
            // Réorganiser les numéros
            return updated;
          }
          return updated;
        }
        return step;
      }).map((step, index) => ({
        ...step,
        stepNumber: index + 1,
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Recettes</h1>
        <button
          onClick={() => openDialog()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvelle recette
        </button>
      </div>

      {/* Liste des recettes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{recipe.name}</h3>
                {recipe.description && (
                  <p className="text-sm text-gray-600 mt-1">{recipe.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openDialog(recipe)}
                  className="text-primary-600 hover:text-primary-700"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(recipe.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Nombre d'étapes</span>
                <span className="font-medium">{recipe.steps.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Statut</span>
                <span className={`font-medium ${recipe.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                  {recipe.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

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
                        <th className="border p-2 text-left">Durée (s)</th>
                        <th className="border p-2 text-left">Produit</th>
                        <th className="border p-2 text-left">Poids (Kg)</th>
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
    </div>
  );
}

