import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useMixers } from '../hooks/useMixers';
import { recipesAPI, mixersAPI, alarmsAPI, batchesAPI, etapesExecutionAPI } from '../services/api';
import { Recipe, Alarm, Batch, EtapesExecution } from '../types';
import MixerVisual from '../components/MixerVisual';
import { Play, Square, Check, AlertTriangle, Clock, Bell, AlertCircle } from 'lucide-react';

export default function ProductionPage() {
  const { pair } = useParams<{ pair: string }>();
  const { mixers } = useMixers();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [etapesExecution, setEtapesExecution] = useState<EtapesExecution[]>([]);
  const [operatorName, setOperatorName] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState<{ [key: number]: string }>({});

  // Déterminer les IDs des malaxeurs selon la paire
  const getMixerIds = () => {
    switch (pair) {
      case 'B1-2': return [1, 2];
      case 'B3-5': return [3, 5];
      case 'B6-7': return [6, 7];
      default: return [];
    }
  };

  const mixerIds = getMixerIds();
  const displayedMixers = mixers.filter(m => mixerIds.includes(m.id));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recipesData, alarmsData, batchesData] = await Promise.all([
          recipesAPI.getAll(),
          alarmsAPI.getAll(),
          batchesAPI.getAll(),
        ]);
        setRecipes(recipesData);
        setAlarms(alarmsData);
        setBatches(batchesData);
        
        // Récupérer les étapes d'exécution pour tous les batches en cours (pour les malaxeurs affichés)
        const activeBatches = batchesData.filter((b: Batch) => 
          b.status === 'En cours' && mixerIds.includes(b.mixerId)
        );
        if (activeBatches.length > 0) {
          try {
            const etapesPromises = activeBatches.map((batch: Batch) => 
              etapesExecutionAPI.getAll(batch.id).catch(() => [])
            );
            const etapesArrays = await Promise.all(etapesPromises);
            const allEtapes = etapesArrays.flat();
            setEtapesExecution(allEtapes);
          } catch (error) {
            console.error('Error fetching etapes execution:', error);
          }
        } else {
          setEtapesExecution([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000); // Rafraîchissement toutes les 2 secondes
    return () => clearInterval(interval);
  }, [mixerIds]);

  const handleStartRecipe = async (mixerId: number) => {
    const recipeId = selectedRecipeId[mixerId];
    if (!recipeId) {
      alert('Veuillez sélectionner une recette');
      return;
    }
    if (!operatorName) {
      alert('Veuillez entrer le nom de l\'opérateur');
      return;
    }
    
    try {
      await mixersAPI.startRecipe(mixerId, {
        recipe_id: recipeId,
        operator_id: operatorName,
        batch_number: `BATCH-${Date.now()}`,
      });
      window.location.reload();
    } catch (error) {
      console.error('Error starting recipe:', error);
      alert('Erreur lors du démarrage de la recette');
    }
  };

  const handleEndRecipe = async (mixerId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir terminer la recette en cours ?')) return;
    
    try {
      await mixersAPI.endRecipe(mixerId);
      window.location.reload();
    } catch (error) {
      console.error('Error ending recipe:', error);
      alert('Erreur lors de la fin de la recette');
    }
  };

  const handleValidateStep = async (mixerId: number, stepNumber: number) => {
    try {
      await mixersAPI.validateStep(mixerId, stepNumber);
      window.location.reload();
    } catch (error) {
      console.error('Error validating step:', error);
      alert('Erreur lors de la validation de l\'étape');
    }
  };

  const handleDefaut = (mixerId: number) => {
    alert(`Afficher les défauts du malaxeur ${mixerId}`);
    // TODO: Implémenter l'affichage des défauts
  };

  const handleAppelOperateur = (mixerId: number) => {
    alert(`Appel opérateur pour le malaxeur ${mixerId}`);
    // TODO: Implémenter l'appel opérateur
  };

  const getCurrentBatch = (mixerId: number) => {
    return batches.find(b => b.mixerId === mixerId && (b.status === 'En cours' || b.status === 'Terminé'));
  };

  const getMixerAlarms = (mixerId: number) => {
    return alarms.filter(a => a.mixerId === mixerId && a.status === 'Active');
  };

  const getCurrentEtapeExecution = (batchId: string | undefined, stepNumber: number | undefined) => {
    if (!batchId || !stepNumber) return null;
    return etapesExecution.find(e => e.cycleId === batchId && e.numeroEtape === stepNumber) || null;
  };
  
  // Calculer le temps restant réel à partir de l'étape en cours
  const getTimeRemaining = (currentStep: any, currentEtapeExec: EtapesExecution | null, batch: Batch | undefined) => {
    if (batch?.tempsRestantSec !== undefined) {
      return batch.tempsRestantSec;
    }
    if (currentEtapeExec?.dateDebut && currentStep?.duration) {
      const dateDebut = new Date(currentEtapeExec.dateDebut);
      const now = new Date();
      const elapsedSec = Math.floor((now.getTime() - dateDebut.getTime()) / 1000);
      const remaining = Math.max(0, currentStep.duration - elapsedSec);
      return remaining;
    }
    return currentStep?.duration || 0;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeRemaining = (seconds?: number) => {
    if (!seconds) return '-';
    return `${formatDuration(seconds)}`;
  };

  // Données de distribution (récupérées depuis batch.distribution)
  const getDistribution = (batch?: Batch) => {
    if (!batch || !batch.distribution || batch.distribution.length === 0) {
      // Retourner les valeurs par défaut si pas de distribution
      return [
        { productName: 'Hydrocarb', qteFormule: 0, qteDosee: 0, dose: 0 },
        { productName: 'Napvis D10', qteFormule: 0, qteDosee: 0, dose: 0 },
        { productName: 'Napvis D200', qteFormule: 0, qteDosee: 0, dose: 0 },
        { productName: 'Huile HM', qteFormule: 0, qteDosee: 0, dose: 0 },
      ];
    }
    // S'assurer que tous les produits sont présents, dans l'ordre
    const productOrder = ['Hydrocarb', 'Napvis D10', 'Napvis D200', 'Huile HM'];
    const distributionMap = new Map(batch.distribution.map((d: any) => [d.productName, d]));
    
    return productOrder.map(productName => {
      const existing = distributionMap.get(productName);
      return existing || { productName, qteFormule: 0, qteDosee: 0, dose: 0 };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Production - {pair}</h1>
      </div>

      {/* Zone opérateur */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nom opérateur
        </label>
        <input
          type="text"
          value={operatorName}
          onChange={(e) => setOperatorName(e.target.value)}
          placeholder="Entrer le nom de l'opérateur"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Affichage des deux malaxeurs */}
      {displayedMixers.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-600">Aucun malaxeur trouvé pour la paire {pair}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayedMixers.map((mixer) => {
          const batch = getCurrentBatch(mixer.id);
          const mixerAlarms = getMixerAlarms(mixer.id);
          const currentStep = mixer.recipe?.steps?.[(mixer.currentStep || 1) - 1];
          const currentEtapeExec = batch && mixer.currentStep 
            ? getCurrentEtapeExecution(batch.id, mixer.currentStep) 
            : null;
          const distribution = getDistribution(batch);

          return (
            <div key={mixer.id} className="bg-gray-900 text-yellow-400 space-y-4 rounded-lg shadow-md p-6 border border-gray-700">
              {/* En-tête avec nom malaxeur */}
              <div className="flex justify-between items-center border-b border-yellow-400 pb-3">
                <h2 className="text-2xl font-bold text-pink-400">{mixer.name}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDefaut(mixer.id)}
                    className="px-4 py-2 bg-black border border-white text-white rounded hover:bg-gray-800 text-sm font-medium"
                  >
                    DEFAUT
                  </button>
                  <button
                    onClick={() => handleAppelOperateur(mixer.id)}
                    className="px-4 py-2 bg-black border border-white text-white rounded hover:bg-gray-800 text-sm font-medium"
                  >
                    APPEL OPERATEUR
                  </button>
                </div>
              </div>

              {/* Sélection de recette */}
              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">
                  Sélectionner une recette
                </label>
                <select
                  value={selectedRecipeId[mixer.id] || ''}
                  onChange={(e) => setSelectedRecipeId({ ...selectedRecipeId, [mixer.id]: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-yellow-400 text-yellow-400 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">-- Sélectionner --</option>
                  {recipes.map((recipe) => (
                    <option key={recipe.id} value={recipe.id} className="bg-gray-800">
                      {recipe.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Boutons de commande */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStartRecipe(mixer.id)}
                  disabled={mixer.status === 'Production'}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <Play className="w-4 h-4" />
                  Départ Cycle
                </button>
                <button
                  onClick={() => mixer.currentStep && handleValidateStep(mixer.id, mixer.currentStep)}
                  disabled={!mixer.currentStep || mixer.status !== 'Production'}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <Check className="w-4 h-4" />
                  Valide Etape
                </button>
              </div>

              {/* Paramètres du processus - TOUJOURS AFFICHÉS */}
              <div className="space-y-2 text-sm border-t border-yellow-400 pt-4">
                <div className="flex justify-between">
                  <span className="text-yellow-400">Formule:</span>
                  <span className="text-yellow-300 font-medium">
                    {batch?.formule || mixer.recipe?.name || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-400">Désignation:</span>
                  <span className="text-yellow-300 font-medium">
                    {batch?.designation || mixer.recipe?.description || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-400">N° Lot:</span>
                  <span className="text-yellow-300 font-medium">{batch?.batchNumber || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-400">Fabricant:</span>
                  <span className="text-yellow-300 font-medium">
                    {batch?.fabricant || batch?.operatorId || operatorName || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-400">Heure Début:</span>
                  <span className="text-yellow-300 font-medium">
                    {batch?.startedAt ? new Date(batch.startedAt).toLocaleTimeString() : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-400">Etape N°:</span>
                  <span className="text-yellow-300 font-medium">
                    {mixer.currentStep || 0} / {mixer.recipe?.steps?.length || 0}
                  </span>
                </div>
                {/* Fonction - toujours affichée */}
                <div className="flex justify-between">
                  <span className="text-yellow-400">Fonction:</span>
                  <span className="text-yellow-300 font-medium">
                    {currentStep?.function || '-'}
                  </span>
                </div>
                
                {/* Temps Restant - toujours affiché */}
                <div className="flex justify-between">
                  <span className="text-yellow-400">Tps Restant:</span>
                  <span className="text-yellow-300 font-medium">
                    {currentStep ? formatTimeRemaining(getTimeRemaining(currentStep, currentEtapeExec, batch)) : '-'} s
                  </span>
                </div>
                
                {/* Produit - toujours affiché */}
                <div className="flex justify-between">
                  <span className="text-yellow-400">Produit:</span>
                  <span className="text-yellow-300 font-medium">
                    {currentStep?.product || '-'}
                    {currentStep?.weight !== undefined && (
                      <> Consigne: {currentStep.weight.toFixed(2)} Kg</>
                    )}
                    {currentEtapeExec?.quantiteDosee !== undefined && (
                      <> Mesure: {currentEtapeExec.quantiteDosee.toFixed(2)} Kg</>
                    )}
                    {!currentEtapeExec && batch?.produitConsigne !== undefined && (
                      <> Consigne: {batch.produitConsigne.toFixed(2)} Kg</>
                    )}
                    {!currentEtapeExec && batch?.produitMesure !== undefined && (
                      <> Mesure: {batch.produitMesure.toFixed(2)} Kg</>
                    )}
                  </span>
                </div>
                
                {/* Valeur Critère - toujours affichée */}
                {currentEtapeExec?.valeurCritere && (
                  <div className="flex justify-between">
                    <span className="text-yellow-400">Valeur Critère:</span>
                    <span className="text-yellow-300 font-medium">{currentEtapeExec.valeurCritere}</span>
                  </div>
                )}
                
                {/* Consigne Atteinte - toujours affichée */}
                {currentEtapeExec?.consigneAtteinte !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-yellow-400">Consigne Atteinte:</span>
                    <span className={`font-medium ${currentEtapeExec.consigneAtteinte ? 'text-green-400' : 'text-yellow-300'}`}>
                      {currentEtapeExec.consigneAtteinte ? 'Oui' : 'Non'}
                    </span>
                  </div>
                )}
                
                {/* Commentaire - toujours affiché si présent */}
                {currentEtapeExec?.commentaire && (
                  <div className="flex justify-between">
                    <span className="text-yellow-400">Commentaire:</span>
                    <span className="text-yellow-300 font-medium text-xs">{currentEtapeExec.commentaire}</span>
                  </div>
                )}
                
                {/* Prochain Appel Opérateur - toujours affiché */}
                <div className="flex justify-between">
                  <span className="text-yellow-400">Prochain Appel Opérateur:</span>
                  <span className="text-yellow-300 font-medium">
                    {batch?.prochainAppelOperateurMin !== undefined ? `${batch.prochainAppelOperateurMin} mn` : '-'}
                  </span>
                </div>
                
                {/* Appel Préparation au Vide - toujours affiché */}
                <div className="flex justify-between">
                  <span className="text-yellow-400">Appel Préparation au Vide:</span>
                  <span className="text-yellow-300 font-medium">
                    {batch?.appelPreparationVideMin !== undefined ? `${batch.appelPreparationVideMin} mn` : '-'}
                  </span>
                </div>
              </div>

              {/* Section DISTRIBUTION - TOUJOURS AFFICHÉE */}
              <div className="border-t border-yellow-400 pt-4">
                <h3 className="text-lg font-semibold text-yellow-400 mb-3">DISTRIBUTION</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-yellow-400">
                        <th className="text-left py-2 pr-4 text-yellow-400 font-medium">Produit</th>
                        <th className="text-right py-2 px-2 text-yellow-400 font-medium">QTE FORMULE</th>
                        <th className="text-right py-2 px-2 text-yellow-400 font-medium">QTE DOSEE</th>
                        <th className="text-right py-2 px-2 text-yellow-400 font-medium">DOSE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distribution.map((item, index) => (
                        <tr key={index} className="border-b border-yellow-400/30">
                          <td className="py-2 pr-4 text-yellow-300 font-medium">{item.productName}:</td>
                          <td className="text-right py-2 px-2 text-yellow-300">
                            {item.qteFormule !== undefined && item.qteFormule !== null ? item.qteFormule.toFixed(2) : '-'}
                          </td>
                          <td className="text-right py-2 px-2 text-yellow-300">
                            {item.qteDosee !== undefined && item.qteDosee !== null ? item.qteDosee.toFixed(2) : '-'}
                          </td>
                          <td className="text-right py-2 px-2 text-yellow-300">
                            {item.dose !== undefined && item.dose !== null ? item.dose.toFixed(2) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Données temps réel (D10, D200, Huile) */}
              <div className="border-t border-yellow-400 pt-4 space-y-2 text-sm">
                <h3 className="font-semibold text-yellow-400 mb-2">Données Temps Réel</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-yellow-400">D10:</span>
                    <span className="text-yellow-300">- / -</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-400">D200:</span>
                    <span className="text-yellow-300">- / -</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-400">Huile:</span>
                    <span className="text-yellow-300">- / -</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-400">Température:</span>
                    <span className="text-yellow-300">{mixer.temperature.toFixed(1)}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-400">Intensité:</span>
                    <span className="text-yellow-300">{mixer.power.toFixed(1)} A</span>
                  </div>
                </div>
              </div>

              {/* Zone d'alarmes */}
              {mixerAlarms.length > 0 && (
                <div className="border-t border-yellow-400 pt-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2 text-yellow-400">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Alarmes actives ({mixerAlarms.length})
                  </h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {mixerAlarms.map((alarm) => (
                      <div
                        key={alarm.id}
                        className={`p-2 rounded text-sm border ${
                          alarm.level === 'Critique' ? 'bg-red-900/50 border-red-500 text-red-200' :
                          alarm.level === 'Warning' ? 'bg-yellow-900/50 border-yellow-500 text-yellow-200' :
                          'bg-blue-900/50 border-blue-500 text-blue-200'
                        }`}
                      >
                        <div className="font-semibold">{alarm.alarmCode}</div>
                        <div className="text-xs mt-1">{alarm.description}</div>
                        <div className="text-xs mt-1 opacity-75">
                          {new Date(alarm.occurredAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
