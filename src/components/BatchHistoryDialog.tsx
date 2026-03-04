import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Batch, BatchStep, Recipe, RecipeStep, BatchStatus } from '../types';
import { batchesAPI, recipesAPI, etapesExecutionAPI, batchStepsAPI } from '../services/api';

interface BatchHistoryDialogProps {
  batchId: string;
  onClose: () => void;
}

export default function BatchHistoryDialog({ batchId, onClose }: BatchHistoryDialogProps) {
  const [batch, setBatch] = useState<Batch | null>(null);
  const [recipeSteps, setRecipeSteps] = useState<RecipeStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{
    batchNumber: string;
    mixerId: number;
    recipeId: string;
    startedAt: string;
    completedAt?: string;
    status: BatchStatus;
    operatorId?: string;
  } | null>(null);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  // const [activeTab, setActiveTab] = useState<'steps' | 'charts'>('steps'); // Graphiques masqués

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const batchData = await batchesAPI.getById(batchId);
        setBatch(batchData);
        setEditData({
          batchNumber: batchData.batchNumber,
          mixerId: batchData.mixerId,
          recipeId: batchData.recipeId,
          startedAt: batchData.startedAt,
          completedAt: batchData.completedAt,
          status: batchData.status,
          operatorId: batchData.operatorId || '',
        });
        
        // Récupérer les étapes de la recette
        if (batchData.recipeId) {
          try {
            const recipeData = await recipesAPI.getById(batchData.recipeId);
            setRecipeSteps(recipeData.steps || []);
          } catch (error) {
            console.error('Error fetching recipe:', error);
          }
        }

        // Charger la liste complète des recettes pour permettre de changer la recette du lot
        try {
          const all = await recipesAPI.getAll();
          setAllRecipes(all || []);
        } catch (error) {
          console.error('Error fetching all recipes for batch edit:', error);
        }
        
        // Récupérer les étapes d'exécution
        try {
          await etapesExecutionAPI.getAll(batchId);
          // Les étapes d'exécution seront utilisées pour afficher les données réelles
        } catch (error) {
          console.error('Error fetching etapes execution:', error);
        }
      } catch (error) {
        console.error('Error fetching batch:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [batchId]);

  if (loading || !batch || !editData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6">
          <div className="text-center">Chargement...</div>
        </div>
      </div>
    );
  }

  // Données simulées pour compatibilité (si pas de données réelles)
  const mockBatch: Batch = {
    id: batchId,
    batchNumber: 'BATCH-2024-001',
    mixerId: 1,
    recipeId: '1',
    recipeName: 'Recette A - Standard',
    startedAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date(Date.now() - 82800000).toISOString(),
    status: 'Succès',
    steps: Array.from({ length: 32 }, (_, i) => {
      const plannedWeight = Math.random() * 50;
      const actualWeight = plannedWeight * (0.95 + Math.random() * 0.1);
      const deviation = ((actualWeight - plannedWeight) / plannedWeight) * 100;
      return {
        id: `${i + 1}`,
        stepNumber: i + 1,
        plannedWeight: plannedWeight > 0 ? plannedWeight : undefined,
        actualWeight: actualWeight > 0 ? actualWeight : undefined,
        plannedDuration: 60 + i * 10,
        actualDuration: 60 + i * 10 + Math.random() * 20 - 10,
        startedAt: new Date(Date.now() - 86400000 + i * 60000).toISOString(),
        completedAt: new Date(Date.now() - 86400000 + (i + 1) * 60000).toISOString(),
        status: Math.abs(deviation) < 5 ? 'OK' : 'Écart',
        deviationPercent: plannedWeight > 0 ? deviation : undefined,
      } as BatchStep;
    }),
    metrics: Array.from({ length: 50 }, (_, i) => ({
      timestamp: new Date(Date.now() - 86400000 + i * 120000).toISOString(),
      temperature: 70 + Math.sin(i * 0.1) * 15 + Math.random() * 5,
      speed: 40 + Math.sin(i * 0.08) * 10 + Math.random() * 3,
      power: 10 + Math.sin(i * 0.12) * 5 + Math.random() * 2,
      pressure: 1.0 + Math.sin(i * 0.15) * 0.5 + Math.random() * 0.2,
    })),
  };

  // Utiliser les steps du batch pour les totaux, pour refléter les éventuelles corrections
  const plannedDuration = recipeSteps.length > 0 
    ? recipeSteps.reduce((sum, s) => sum + (s.duration || 0), 0)
    : (batch?.steps?.reduce((sum, s) => sum + (s.plannedDuration || 0), 0) || 0);
  const actualDuration = batch?.completedAt && batch?.startedAt
    ? (new Date(batch.completedAt).getTime() - new Date(batch.startedAt).getTime()) / 1000
    : plannedDuration;

  // Calculer poids total prévu et dosé depuis les steps du batch
  const totalPlannedWeight = batch?.steps?.reduce((sum, s) => sum + (s.plannedWeight || 0), 0) || 0;
  const totalActualWeight = batch?.steps?.reduce((sum, s) => sum + (s.actualWeight || 0), 0) || 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-7xl max-h-[95dvh] sm:max-h-[95vh] w-full overflow-auto">
        <div className="sticky top-0 bg-white border-b p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-xl font-semibold">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.batchNumber}
                  onChange={(e) => setEditData({ ...editData, batchNumber: e.target.value })}
                  className="border rounded px-2 py-1 text-sm"
                />
              ) : (
                batch?.batchNumber || 'N/A'
              )}
            </h2>
            <p className="text-sm text-gray-600">
              {isEditing ? (
                <select
                  value={editData.recipeId}
                  onChange={(e) => setEditData({ ...editData, recipeId: e.target.value })}
                  className="border rounded px-2 py-1 text-sm mt-1"
                >
                  <option value={batch.recipeId}>{batch.recipeName || 'Recette inconnue'}</option>
                  {(allRecipes || []).map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              ) : (
                batch?.recipeName || 'N/A'
              )}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {isEditing ? (
                <>
                  <label className="mr-1">Début:</label>
                  <input
                    type="datetime-local"
                    value={editData.startedAt ? new Date(editData.startedAt).toISOString().slice(0, 16) : ''}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        startedAt: e.target.value ? new Date(e.target.value).toISOString() : editData.startedAt,
                      })
                    }
                    className="border rounded px-1 py-0.5 text-xs mr-2"
                  />
                  <label className="mr-1">Fin:</label>
                  <input
                    type="datetime-local"
                    value={editData.completedAt ? new Date(editData.completedAt).toISOString().slice(0, 16) : ''}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        completedAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                      })
                    }
                    className="border rounded px-1 py-0.5 text-xs"
                  />
                </>
              ) : batch?.startedAt ? (
                new Date(batch.startedAt).toLocaleString('fr-FR')
              ) : (
                'N/A'
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end gap-1">
              <select
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value as BatchStatus })}
                className="px-3 py-1 rounded-full text-xs font-medium border bg-white"
              >
                {['Succès', 'Alerte', 'Erreur', 'Terminé', 'Interrompu', 'En cours'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={editData.operatorId || ''}
                onChange={(e) => setEditData({ ...editData, operatorId: e.target.value })}
                placeholder="Opérateur"
                className="border rounded px-2 py-1 text-xs w-full"
              />
            </div>
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditData({
                      batchNumber: batch.batchNumber,
                      mixerId: batch.mixerId,
                      recipeId: batch.recipeId,
                      startedAt: batch.startedAt,
                      completedAt: batch.completedAt,
                      status: batch.status,
                      operatorId: batch.operatorId || '',
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    try {
                      // Mettre à jour le lot (métadonnées)
                      await batchesAPI.update(batchId, {
                        batch_number: editData.batchNumber,
                        mixer_id: editData.mixerId,
                        recipe_id: editData.recipeId,
                        started_at: editData.startedAt,
                        completed_at: editData.completedAt,
                        status: editData.status,
                        operator_id: editData.operatorId,
                      });

                      // Mettre à jour la recette complète associée avec les steps modifiés
                      const recipeMeta =
                        allRecipes.find((r) => r.id === editData.recipeId) ||
                        ({
                          id: editData.recipeId,
                          name: batch.recipeName,
                          description: '',
                        } as any as Recipe);

                      await recipesAPI.update(editData.recipeId, {
                        name: recipeMeta.name,
                        description: recipeMeta.description || '',
                        steps: recipeSteps.map((s) => ({
                          id: s.id,
                          stepNumber: s.stepNumber,
                          function: s.function,
                          arm: s.arm,
                          screw: s.screw,
                          duration: s.duration,
                          product: s.product || null,
                          weight: s.weight || null,
                          vacuum: s.vacuum || null,
                          critere: s.critere || null,
                          status: s.status || 'Reversible',
                        })),
                      });

                      const updated = await batchesAPI.getById(batchId);
                      setBatch(updated);
                      setIsEditing(false);
                      setEditData({
                        batchNumber: updated.batchNumber,
                        mixerId: updated.mixerId,
                        recipeId: updated.recipeId,
                        startedAt: updated.startedAt,
                        completedAt: updated.completedAt,
                        status: updated.status,
                        operatorId: updated.operatorId || '',
                      });
                    } catch (error) {
                      console.error('Error updating batch or recipe:', error);
                      alert('Erreur lors de la mise à jour du lot / recette');
                    }
                  }}
                  className="text-primary-600 hover:text-primary-700 text-sm font-semibold"
                >
                  Enregistrer
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-primary-600 hover:text-primary-700 text-sm font-semibold"
              >
                Modifier
              </button>
            )}
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Résumé des performances */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="card">
              <div className="text-sm text-gray-600">Poids total prévu</div>
              <div className="text-2xl font-bold">{totalPlannedWeight.toFixed(2)} Kg</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-600">Poids total dosé</div>
              <div className="text-2xl font-bold">{totalActualWeight.toFixed(2)} Kg</div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-600">Durée réelle</div>
              <div className="text-2xl font-bold">{(actualDuration / 60).toFixed(0)} min</div>
              <div className="text-sm text-gray-500">Durée prévue: {(plannedDuration / 60).toFixed(0)} min</div>
            </div>
          </div>

          {/* Onglets - Graphiques masqués pour l'instant */}
          {/* <div className="border-b">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('steps')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'steps'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Étapes exécutées
              </button>
            </nav>
          </div> */}

          {/* {activeTab === 'steps' && ( */}
          <div>
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-2">Étape</th>
                      <th className="text-left p-2">Fonction</th>
                      <th className="text-left p-2">Bras</th>
                      <th className="text-left p-2">Vis</th>
                      <th className="text-left p-2">Ref</th>
                      <th className="text-left p-2">Produit</th>
                      <th className="text-right p-2">Poids prévu (Kg)</th>
                      <th className="text-right p-2">Poids dosé (Kg)</th>
                      <th className="text-right p-2">Vide (%)</th>
                      <th className="text-right p-2">Mesure</th>
                      <th className="text-left p-2">Critère</th>
                      <th className="text-right p-2">Durée prévue (s)</th>
                      <th className="text-right p-2">Durée réelle (s)</th>
                      <th className="text-left p-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipeSteps.length > 0 ? recipeSteps.map((step, index) => {
                      const batchStep = batch?.steps?.find(s => s.stepNumber === step.stepNumber);
                      return (
                        <tr key={step.id || index} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{step.stepNumber}</td>
                          <td className="p-2">
                            {isEditing ? (
                              <select
                                value={step.function}
                                onChange={(e) =>
                                  setRecipeSteps((prev) =>
                                    prev.map((s) =>
                                      s.stepNumber === step.stepNumber
                                        ? { ...s, function: e.target.value as any }
                                        : s
                                    )
                                  )
                                }
                                className="w-full border rounded px-2 py-1 text-xs"
                              >
                                {['Démarrage', 'Dosage Automatique', 'Introduction Manuelle', 'Mélange', 'Prépa mise au vide', 'Mise au vide', 'Extrusion'].map(
                                  (fn) => (
                                    <option key={fn} value={fn}>
                                      {fn}
                                    </option>
                                  )
                                )}
                              </select>
                            ) : (
                              step.function
                            )}
                          </td>
                          <td className="p-2">
                            {isEditing ? (
                              <select
                                value={step.arm}
                                onChange={(e) =>
                                  setRecipeSteps((prev) =>
                                    prev.map((s) =>
                                      s.stepNumber === step.stepNumber
                                        ? { ...s, arm: e.target.value as 'GV' | 'PV' }
                                        : s
                                    )
                                  )
                                }
                                className="w-full border rounded px-2 py-1 text-xs"
                              >
                                <option value="GV">GV</option>
                                <option value="PV">PV</option>
                              </select>
                            ) : (
                              step.arm
                            )}
                          </td>
                          <td className="p-2">
                            {isEditing ? (
                              <select
                                value={step.screw}
                                onChange={(e) =>
                                  setRecipeSteps((prev) =>
                                    prev.map((s) =>
                                      s.stepNumber === step.stepNumber
                                        ? { ...s, screw: e.target.value as 'GV' | 'PV' }
                                        : s
                                    )
                                  )
                                }
                                className="w-full border rounded px-2 py-1 text-xs"
                              >
                                <option value="GV">GV</option>
                                <option value="PV">PV</option>
                              </select>
                            ) : (
                              step.screw
                            )}
                          </td>
                          <td className="p-2">
                            {isEditing ? (
                              <input
                                type="text"
                                className="w-full border rounded px-2 py-1 text-xs"
                                value={step.ref || ''}
                                onChange={(e) =>
                                  setRecipeSteps((prev) =>
                                    prev.map((s) =>
                                      s.stepNumber === step.stepNumber
                                        ? { ...s, ref: e.target.value }
                                        : s
                                    )
                                  )
                                }
                              />
                            ) : (
                              step.ref || '-'
                            )}
                          </td>
                          <td className="p-2">
                            {isEditing ? (
                              <input
                                type="text"
                                className="w-full border rounded px-2 py-1 text-xs"
                                value={step.product || ''}
                                onChange={(e) =>
                                  setRecipeSteps((prev) =>
                                    prev.map((s) =>
                                      s.stepNumber === step.stepNumber
                                        ? { ...s, product: e.target.value }
                                        : s
                                    )
                                  )
                                }
                              />
                            ) : (
                              step.product || '-'
                            )}
                          </td>
                          <td className="p-2 text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.1"
                                className="w-20 border rounded px-1 py-0.5 text-right text-xs"
                                value={batchStep?.plannedWeight ?? step.weight ?? ''}
                                onChange={async (e) => {
                                  const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                  try {
                                    if (batchStep) {
                                      await batchStepsAPI.update(batchStep.id, {
                                        planned_weight: value,
                                      });
                                      setBatch((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              steps:
                                                prev.steps?.map((s) =>
                                                  s.id === batchStep.id ? { ...s, plannedWeight: value } : s
                                                ) || [],
                                            }
                                          : prev
                                      );
                                    }
                                    setRecipeSteps((prev) =>
                                      prev.map((s) =>
                                        s.stepNumber === step.stepNumber ? { ...s, weight: value } : s
                                      )
                                    );
                                  } catch (error) {
                                    console.error('Error updating planned weight:', error);
                                    alert('Erreur lors de la mise à jour du poids prévu');
                                  }
                                }}
                              />
                            ) : (
                              (batchStep?.plannedWeight ?? step.weight)?.toFixed(1) || '-'
                            )}
                          </td>
                          <td className="p-2 text-right">
                            {isEditing && batchStep ? (
                              <input
                                type="number"
                                step="0.1"
                                className="w-20 border rounded px-1 py-0.5 text-right text-xs"
                                value={batchStep.actualWeight ?? ''}
                                onChange={async (e) => {
                                  const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                  try {
                                    await batchStepsAPI.update(batchStep.id, {
                                      actual_weight: value,
                                    });
                                    setBatch((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            steps:
                                              prev.steps?.map((s) =>
                                                s.id === batchStep.id ? { ...s, actualWeight: value } : s
                                              ) || [],
                                          }
                                        : prev
                                    );
                                  } catch (error) {
                                    console.error('Error updating step weight:', error);
                                    alert('Erreur lors de la mise à jour du poids de l’étape');
                                  }
                                }}
                              />
                            ) : (
                              batchStep?.actualWeight?.toFixed(1) || '-'
                            )}
                          </td>
                          <td className="p-2 text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                step="1"
                                className="w-20 border rounded px-1 py-0.5 text-right text-xs"
                                value={step.vacuum ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                  setRecipeSteps((prev) =>
                                    prev.map((s) =>
                                      s.stepNumber === step.stepNumber ? { ...s, vacuum: value } : s
                                    )
                                  );
                                }}
                              />
                            ) : step.vacuum ? (
                              `${step.vacuum}%`
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="p-2 text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.1"
                                className="w-20 border rounded px-1 py-0.5 text-right text-xs"
                                value={step.mesure ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                  setRecipeSteps((prev) =>
                                    prev.map((s) =>
                                      s.stepNumber === step.stepNumber ? { ...s, mesure: value } : s
                                    )
                                  );
                                }}
                              />
                            ) : (
                              step.mesure ?? '-'
                            )}
                          </td>
                          <td className="p-2">
                            {isEditing ? (
                              <input
                                type="text"
                                className="w-full border rounded px-2 py-1 text-xs"
                                value={step.critere || ''}
                                onChange={(e) =>
                                  setRecipeSteps((prev) =>
                                    prev.map((s) =>
                                      s.stepNumber === step.stepNumber ? { ...s, critere: e.target.value } : s
                                    )
                                  )
                                }
                              />
                            ) : (
                              step.critere || '-'
                            )}
                          </td>
                          <td className="p-2 text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                step="1"
                                className="w-20 border rounded px-1 py-0.5 text-right text-xs"
                                value={step.duration ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                  setRecipeSteps((prev) =>
                                    prev.map((s) =>
                                      s.stepNumber === step.stepNumber ? { ...s, duration: value } : s
                                    )
                                  );
                                }}
                              />
                            ) : (
                              step.duration
                            )}
                          </td>
                          <td className="p-2 text-right">{batchStep?.actualDuration?.toFixed(0) || '-'}</td>
                          <td className="p-2">
                            {isEditing ? (
                              <select
                                value={step.status || 'Reversible'}
                                onChange={(e) =>
                                  setRecipeSteps((prev) =>
                                    prev.map((s) =>
                                      s.stepNumber === step.stepNumber
                                        ? { ...s, status: e.target.value as any }
                                        : s
                                    )
                                  )
                                }
                                className="border rounded px-2 py-1 text-xs"
                              >
                                <option value="Reversible">Reversible</option>
                                <option value="En attente">En attente</option>
                                <option value="En cours">En cours</option>
                                <option value="Terminée">Terminée</option>
                              </select>
                            ) : (
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  batchStep?.status === 'OK'
                                    ? 'bg-green-100 text-green-800'
                                    : batchStep?.status === 'Écart'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {batchStep?.status || step.status || '-'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    }) : (batch?.steps?.map((step) => (
                      <tr key={step.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{step.stepNumber}</td>
                        <td className="p-2">-</td>
                        <td className="p-2">-</td>
                        <td className="p-2">-</td>
                        <td className="p-2">-</td>
                        <td className="p-2">-</td>
                        <td className="p-2 text-right">{step.plannedWeight?.toFixed(1) || '-'}</td>
                        <td className="p-2 text-right">{step.actualWeight?.toFixed(1) || '-'}</td>
                        <td className="p-2 text-right">-</td>
                        <td className="p-2 text-right">-</td>
                        <td className="p-2">-</td>
                        <td className="p-2 text-right">{step.plannedDuration}</td>
                        <td className="p-2 text-right">{step.actualDuration?.toFixed(0) || '-'}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            step.status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {step.status}
                          </span>
                        </td>
                      </tr>
                    )) || [])}
                  </tbody>
                </table>
              </div>
              <div className="card bg-gray-50">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-gray-600">Total prévu</div>
                    <div className="text-lg font-bold">{totalPlannedWeight.toFixed(1)} Kg</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total dosé</div>
                    <div className="text-lg font-bold">{totalActualWeight.toFixed(1)} Kg</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Écart global</div>
                    <div className="text-lg font-bold">
                      {totalPlannedWeight > 0
                        ? `${(((totalActualWeight - totalPlannedWeight) / totalPlannedWeight) * 100).toFixed(1)}%`
                        : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* )} */}

          {/* Graphiques masqués pour l'instant */}
          {/* {activeTab === 'charts' && batch.metrics && (
            <div className="space-y-6">
              ... graphiques masqués ...
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
}

