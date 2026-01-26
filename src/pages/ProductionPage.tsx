import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useMixers } from '../hooks/useMixers';
import { recipesAPI, mixersAPI, alarmsAPI, batchesAPI, etapesExecutionAPI } from '../services/api';
import { Recipe, Alarm, Batch, EtapesExecution } from '../types';
import { Play, Square, Check, AlertTriangle, Package, ArrowRightLeft, Warehouse, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export default function ProductionPage() {
  const { pair } = useParams<{ pair: string }>();
  const { mixers, loading: mixersLoading, error: mixersError } = useMixers();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [etapesExecution, setEtapesExecution] = useState<EtapesExecution[]>([]);
  const [operatorNames, setOperatorNames] = useState<{ [key: number]: string }>({});
  const [selectedRecipeId, setSelectedRecipeId] = useState<{ [key: number]: string }>({});
  const [batchNumbers, setBatchNumbers] = useState<{ [key: number]: string }>({});
  const [batchNumberInput, setBatchNumberInput] = useState<{ [key: number]: string }>({});
  const [activeTab, setActiveTab] = useState<'production' | 'transfert' | 'stockage'>('production');
  const [showLoading, setShowLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // États pour le transfert de poudre
  const [transferStatus, setTransferStatus] = useState<{ [key: string]: 'actif' | 'arrêt' | 'erreur' }>({
    'Silo Principal': 'arrêt',
    'Convoyeur B1-B2': 'arrêt',
    'Convoyeur B3-B5': 'arrêt',
    'Convoyeur B6-B7': 'arrêt',
  });
  
  // États pour le stockage
  const [storageData] = useState([
    { id: 1, name: 'Silo Poudre A', currentLevel: 75, maxCapacity: 100, unit: '%', status: 'Normal' as 'Normal' | 'Bas' | 'Critique' },
    { id: 2, name: 'Silo Poudre B', currentLevel: 45, maxCapacity: 100, unit: '%', status: 'Normal' },
    { id: 3, name: 'Réservoir D10', currentLevel: 20, maxCapacity: 100, unit: '%', status: 'Bas' },
    { id: 4, name: 'Réservoir D200', currentLevel: 85, maxCapacity: 100, unit: '%', status: 'Normal' },
    { id: 5, name: 'Réservoir Huile', currentLevel: 10, maxCapacity: 100, unit: '%', status: 'Critique' },
  ]);

  // Déterminer les IDs des malaxeurs selon la paire
  const getMixerIds = () => {
    if (!pair) return [];
    switch (pair) {
      case 'B1-2': return [1, 2];
      case 'B3-5': return [3, 5];
      case 'B6-7': return [6, 7];
      default: return [];
    }
  };

  const mixerIds = getMixerIds();
  const displayedMixers = mixers.filter(m => m && mixerIds.includes(m.id));

  // Gérer l'affichage du chargement avec timeout
  useEffect(() => {
    // Si les mixers sont chargés, on peut afficher
    if (!mixersLoading) {
      setShowLoading(false);
      return;
    }
    
    // Timeout de sécurité : après 5 secondes, afficher quand même
    const timeout = setTimeout(() => {
      setShowLoading(false);
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [mixersLoading]);

  // Gérer les erreurs
  useEffect(() => {
    if (mixersError) {
      console.error('Error loading mixers:', mixersError);
      setHasError(true);
      setShowLoading(false);
    }
  }, [mixersError]);

  // Debug: Log pour vérifier les malaxeurs
  useEffect(() => {
    console.log('ProductionPage Debug:', {
      pair,
      mixerIds,
      totalMixers: mixers.length,
      mixerIdsInData: mixers.map(m => ({ id: m.id, name: m.name })),
      displayedMixers: displayedMixers.map(m => ({ id: m.id, name: m.name }))
    });
  }, [pair, mixerIds, mixers, displayedMixers]);

  // Réinitialiser l'onglet actif quand on change de page
  useEffect(() => {
    setActiveTab('production');
    // Réinitialiser aussi les sélections de recettes et numéros de lot
    setSelectedRecipeId({});
    setBatchNumbers({});
    setBatchNumberInput({});
    setOperatorNames({});
  }, [pair]);

  useEffect(() => {
    if (!pair || mixerIds.length === 0) {
      return;
    }

    const fetchData = async () => {
      try {
        const [recipesData, alarmsData, batchesData] = await Promise.all([
          recipesAPI.getAll().catch(err => {
            console.error('Error fetching recipes:', err);
            return [];
          }),
          alarmsAPI.getAll().catch(err => {
            console.error('Error fetching alarms:', err);
            return [];
          }),
          batchesAPI.getAll().catch(err => {
            console.error('Error fetching batches:', err);
            return [];
          }),
        ]);
        setRecipes(recipesData || []);
        setAlarms(alarmsData || []);
        setBatches(batchesData || []);
        
        // Récupérer les étapes d'exécution pour tous les batches en cours (pour les malaxeurs affichés)
        const activeBatches = (batchesData || []).filter((b: Batch) => 
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
            setEtapesExecution([]);
          }
        } else {
          setEtapesExecution([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    // Attendre un peu que les mixers soient chargés avant de charger les autres données
    if (!mixersLoading) {
      fetchData();
      const interval = setInterval(fetchData, 2000); // Rafraîchissement toutes les 2 secondes
      return () => clearInterval(interval);
    }
  }, [pair, mixerIds, mixersLoading]);

  const handleStartRecipe = async (mixerId: number) => {
    const recipeId = selectedRecipeId[mixerId];
    if (!recipeId) {
      alert('Veuillez sélectionner une recette');
      return;
    }
    const operatorName = operatorNames[mixerId];
    if (!operatorName || !operatorName.trim()) {
      alert('Veuillez entrer le nom de l\'opérateur');
      return;
    }
    
    const batchNumber = batchNumberInput[mixerId] || `BATCH-${Date.now()}`;
    
    try {
      await mixersAPI.startRecipe(mixerId, {
        recipe_id: recipeId,
        operator_id: operatorName,
        batch_number: batchNumber,
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


  // Gérer l'affichage du chargement avec timeout (TOUJOURS AVANT LES RETURNS)
  useEffect(() => {
    // Si les mixers sont chargés, on peut afficher
    if (!mixersLoading) {
      setShowLoading(false);
      return;
    }
    
    // Timeout de sécurité : après 2 secondes max, afficher quand même le contenu
    const timeout = setTimeout(() => {
      console.log('Timeout: Affichage du contenu même si chargement en cours');
      setShowLoading(false);
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [mixersLoading]);

  // Gérer les erreurs (TOUJOURS AVANT LES RETURNS)
  useEffect(() => {
    if (mixersError) {
      console.error('Error loading mixers:', mixersError);
      setHasError(true);
      setShowLoading(false);
    } else {
      setHasError(false);
    }
  }, [mixersError]);

  // Vérifier si la paire est valide
  if (!pair || mixerIds.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold text-red-600 mb-2">Page non trouvée</div>
          <div className="text-sm text-gray-500">
            La paire de malaxeurs "{pair}" n'est pas valide.
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Paires disponibles: B1-2, B3-5, B6-7
          </div>
        </div>
      </div>
    );
  }

  // Afficher le chargement UNIQUEMENT au tout début (première fois, pas de données du tout)
  // Après 3 secondes max, on affiche toujours le contenu même si les malaxeurs ne sont pas trouvés
  const isInitialLoading = showLoading && mixersLoading && mixers.length === 0 && !hasError;
  
  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-700 mb-2">Chargement...</div>
          <div className="text-sm text-gray-500">Chargement des données de production</div>
          <div className="text-xs text-gray-400 mt-2">Si cela persiste, vérifiez la connexion au serveur</div>
        </div>
      </div>
    );
  }

  // TOUJOURS afficher le contenu principal, même si les malaxeurs ne sont pas trouvés
  // Cela garantit qu'il y a toujours quelque chose à l'écran
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Production - {pair?.replace('B', 'BUTYL') || pair}</h1>
      </div>

      {/* Onglets communs */}
      <div className="border-b border-gray-300">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('production')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'production'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Production {pair?.replace('B', 'BUTYL') || pair}
          </button>
          <button
            onClick={() => setActiveTab('transfert')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transfert'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transfert Poudre
          </button>
          <button
            onClick={() => setActiveTab('stockage')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stockage'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Stockage
          </button>
        </nav>
      </div>

      {activeTab === 'production' && (
        <>
              {/* Affichage des deux malaxeurs */}
      {displayedMixers.length === 0 ? (
        <div className="card text-center py-8">
          <div className="max-w-3xl mx-auto">
            <div className="mb-4">
              <p className="text-red-600 mb-2 font-bold text-xl">⚠️ Aucun malaxeur trouvé pour la paire {pair}</p>
              <p className="text-gray-600 text-sm">Les malaxeurs avec les IDs {mixerIds.join(' et ')} ne sont pas présents dans la base de données.</p>
            </div>
            
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-left mt-6">
              <h3 className="font-semibold text-gray-800 mb-4">Informations de débogage :</h3>
              
              <div className="space-y-3 mb-4">
                <div>
                  <p className="font-medium text-gray-700 mb-1">
                    Malaxeurs attendus pour {pair} :
                  </p>
                  <div className="bg-white p-2 rounded border">
                    {mixerIds.map(id => (
                      <span key={id} className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded mr-2 mb-2">
                        ID {id}
                      </span>
                    ))}
                  </div>
                </div>
                
                {mixersLoading ? (
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-blue-700">🔄 Chargement des malaxeurs en cours...</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-gray-700 mb-2">
                      Malaxeurs disponibles dans la base ({mixers.length} trouvé{mixers.length > 1 ? 's' : ''}) :
                    </p>
                    {mixers.length > 0 ? (
                      <div className="bg-white p-3 rounded border max-h-48 overflow-y-auto">
                        <ul className="space-y-1">
                          {mixers.map(m => {
                            const isExpected = mixerIds.includes(m.id);
                            return (
                              <li 
                                key={m.id} 
                                className={`p-2 rounded ${isExpected ? 'bg-green-100 border border-green-300' : 'bg-gray-50'}`}
                              >
                                <span className={`font-medium ${isExpected ? 'text-green-800' : 'text-gray-700'}`}>
                                  ID {m.id}: {m.name}
                                </span>
                                {isExpected && <span className="ml-2 text-green-600">✓ Attendu</span>}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : (
                      <div className="bg-red-50 p-3 rounded border border-red-200">
                        <p className="text-red-700 font-medium">
                          ⚠️ Aucun malaxeur trouvé dans la base de données.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t-2 border-yellow-300">
                <p className="font-semibold text-gray-800 mb-3">🔧 Solutions :</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li className="mb-2">
                    <strong>Vérifiez que le serveur backend est démarré</strong>
                    <div className="ml-6 mt-1 text-sm text-gray-600">
                      Dans le dossier <code className="bg-gray-100 px-1 py-0.5 rounded">server</code>, exécutez : <code className="bg-gray-100 px-1 py-0.5 rounded">npm start</code>
                    </div>
                  </li>
                  <li className="mb-2">
                    <strong>Corrigez les IDs des malaxeurs</strong>
                    <div className="ml-6 mt-1 text-sm text-gray-600">
                      Exécutez : <code className="bg-gray-100 px-1 py-0.5 rounded">cd server && node fix-mixer-ids.js</code>
                    </div>
                  </li>
                  <li>
                    <strong>Ou réinitialisez complètement la base de données</strong>
                    <div className="ml-6 mt-1 text-sm text-gray-600">
                      Exécutez : <code className="bg-gray-100 px-1 py-0.5 rounded">cd server && npm run init-db</code>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ fontSize: 'clamp(12px, 1.2vw, 16px)' }}>
          {displayedMixers.map((mixer) => {
          if (!mixer) return null;
          
          const batch = getCurrentBatch(mixer.id);
          const mixerAlarms = getMixerAlarms(mixer.id);
          const currentStep = mixer.recipe?.steps?.[(mixer.currentStep || 1) - 1];
          const currentEtapeExec = batch && mixer.currentStep 
            ? getCurrentEtapeExecution(batch.id, mixer.currentStep) 
            : null;

          return (
            <div key={mixer.id} className="card space-y-4">
              {/* En-tête avec nom malaxeur */}
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-2xl font-bold text-gray-900">{mixer.name}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDefaut(mixer.id)}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
                  >
                    DEFAUT
                  </button>
                  <button
                    onClick={() => handleAppelOperateur(mixer.id)}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
                  >
                    APPEL OPERATEUR
                  </button>
                </div>
              </div>

              {/* Nom opérateur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom opérateur/Fabricant
                </label>
                <input
                  type="text"
                  value={operatorNames[mixer.id] || ''}
                  onChange={(e) => setOperatorNames({ ...operatorNames, [mixer.id]: e.target.value })}
                  placeholder="Entrer le nom de l'opérateur"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Sélection de recette */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner une recette
                </label>
                <select
                  value={selectedRecipeId[mixer.id] || ''}
                  onChange={(e) => setSelectedRecipeId({ ...selectedRecipeId, [mixer.id]: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Sélectionner --</option>
                  {recipes.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Boutons de commande */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleStartRecipe(mixer.id)}
                  disabled={mixer.status === 'Production'}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <Play className="w-4 h-4" />
                  Départ Cycle
                </button>
                <button
                  onClick={() => mixer.currentStep && handleValidateStep(mixer.id, mixer.currentStep)}
                  disabled={!mixer.currentStep || mixer.status !== 'Production'}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <Check className="w-4 h-4" />
                  Valide Etape
                </button>
                <button
                  onClick={() => handleEndRecipe(mixer.id)}
                  disabled={mixer.status !== 'Production'}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <Square className="w-4 h-4" />
                  Fin Recette
                </button>
              </div>

              {/* Paramètres du processus - TOUJOURS AFFICHÉS */}
              <div className="space-y-2 text-sm border-t pt-4">
                {/* N° Lot en premier avec case d'écriture + déroulant */}
                <div className="space-y-2">
                  <label className="text-gray-700 font-medium">N° Lot:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={batchNumberInput[mixer.id] || batch?.batchNumber || ''}
                      onChange={(e) => setBatchNumberInput({ ...batchNumberInput, [mixer.id]: e.target.value })}
                      placeholder="Numéro de lot"
                      className="flex-1 px-2 py-1 border border-gray-300 text-gray-900 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={mixer.status === 'Production'}
                    />
                    <select
                      value={batchNumbers[mixer.id] || ''}
                      onChange={(e) => {
                        setBatchNumbers({ ...batchNumbers, [mixer.id]: e.target.value });
                        if (e.target.value) {
                          setBatchNumberInput({ ...batchNumberInput, [mixer.id]: e.target.value });
                        }
                      }}
                      className="px-2 py-1 border border-gray-300 text-gray-900 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={mixer.status === 'Production'}
                    >
                      <option value="">Sélectionner</option>
                      {/* Pour l'instant liste vide, sera remplie depuis la base de données plus tard */}
                    </select>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Opérateur/Fabricant:</span>
                  <span className="text-gray-900 font-medium">
                    {batch?.fabricant || batch?.operatorId || operatorNames[mixer.id] || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Formule:</span>
                  <span className="text-gray-900 font-medium">
                    {batch?.formule || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Désignation:</span>
                  <span className="text-gray-900 font-medium">
                    {batch?.designation || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Heure Début:</span>
                  <span className="text-gray-900 font-medium">
                    {batch?.startedAt ? new Date(batch.startedAt).toLocaleTimeString() : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Etape N°:</span>
                  <span className="text-gray-900 font-medium">
                    {mixer.currentStep || 0} / {mixer.recipe?.steps?.length || 0}
                  </span>
                </div>
                {/* Fonction - toujours affichée */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Fonction:</span>
                  <span className="text-gray-900 font-medium">
                    {currentStep?.function || '-'}
                  </span>
                </div>
                
                {/* Temps Restant - toujours affiché */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tps Restant:</span>
                  <span className="text-gray-900 font-medium">
                    {currentStep ? formatTimeRemaining(getTimeRemaining(currentStep, currentEtapeExec, batch)) : '-'} s
                  </span>
                </div>
                
                {/* Produit - toujours affiché */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Produit:</span>
                  <span className="text-gray-900 font-medium">
                    {currentStep?.product || '-'}
                    {currentStep?.weight !== undefined && currentStep.weight !== null && (
                      <> Consigne: {currentStep.weight.toFixed(2)} Kg</>
                    )}
                    {currentEtapeExec?.quantiteDosee !== undefined && currentEtapeExec.quantiteDosee !== null && (
                      <> Mesure: {currentEtapeExec.quantiteDosee.toFixed(2)} Kg</>
                    )}
                    {!currentEtapeExec && batch?.produitConsigne !== undefined && batch?.produitConsigne !== null && (
                      <> Consigne: {batch.produitConsigne.toFixed(2)} Kg</>
                    )}
                    {!currentEtapeExec && batch?.produitMesure !== undefined && batch?.produitMesure !== null && (
                      <> Mesure: {batch.produitMesure.toFixed(2)} Kg</>
                    )}
                  </span>
                </div>
                
                {/* Valeur Critère - toujours affichée */}
                {currentEtapeExec?.valeurCritere && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valeur Critère:</span>
                    <span className="text-gray-900 font-medium">{currentEtapeExec.valeurCritere}</span>
                  </div>
                )}
                
                {/* Consigne Atteinte - toujours affichée */}
                {currentEtapeExec?.consigneAtteinte !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Consigne Atteinte:</span>
                    <span className={`font-medium ${currentEtapeExec.consigneAtteinte ? 'text-green-600' : 'text-gray-600'}`}>
                      {currentEtapeExec.consigneAtteinte ? 'Oui' : 'Non'}
                    </span>
                  </div>
                )}
                
                {/* Commentaire - toujours affiché si présent */}
                {currentEtapeExec?.commentaire && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commentaire:</span>
                    <span className="text-gray-900 font-medium text-xs">{currentEtapeExec.commentaire}</span>
                  </div>
                )}
                
                {/* Prochain Appel Opérateur - toujours affiché */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Prochain Appel Opérateur:</span>
                  <span className="text-gray-900 font-medium">
                    {batch?.prochainAppelOperateurMin !== undefined ? `${batch.prochainAppelOperateurMin} mn` : '-'}
                  </span>
                </div>
                
                {/* Appel Préparation au Vide - toujours affiché */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Appel Préparation au Vide:</span>
                  <span className="text-gray-900 font-medium">
                    {batch?.appelPreparationVideMin !== undefined ? `${batch.appelPreparationVideMin} mn` : '-'}
                  </span>
                </div>
              </div>

              {/* Liste des étapes de la recette en cours */}
              {mixer.recipe && mixer.status === 'Production' && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Étapes de la recette</h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {mixer.recipe.steps.map((step, index) => {
                      const stepNum = index + 1;
                      const isCompleted = stepNum < (mixer.currentStep || 0);
                      const isCurrent = stepNum === (mixer.currentStep || 0);
                      const stepExec = batch ? getCurrentEtapeExecution(batch.id, stepNum) : null;
                      
                      let bgColor = 'bg-gray-50'; // Blanc/par défaut (pas faite)
                      if (isCompleted || stepExec?.statut === 'TERMINE') {
                        bgColor = 'bg-green-50 border-green-200'; // Vert (finie)
                      } else if (isCurrent || stepExec?.statut === 'EN_COURS') {
                        bgColor = 'bg-blue-50 border-blue-200'; // Bleu (en cours)
                      }
                      
                      return (
                        <div
                          key={step.id}
                          className={`p-2 rounded text-sm border border-gray-200 ${bgColor}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-gray-900 font-medium">
                              Étape {stepNum}: {step.function}
                            </span>
                            <span className="text-gray-600 text-xs">
                              {step.duration}s
                            </span>
                          </div>
                          {step.product && (
                            <div className="text-gray-600 text-xs mt-1">
                              {step.product} {step.weight !== undefined && step.weight !== null ? `(${step.weight.toFixed(2)} Kg)` : ''}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Données temps réel (D10, D200, Huile) */}
              <div className="border-t pt-4 space-y-2 text-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Données Temps Réel</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">D10:</span>
                    <span className="text-gray-900">- / -</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">D200:</span>
                    <span className="text-gray-900">- / -</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Huile:</span>
                    <span className="text-gray-900">- / -</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Température:</span>
                    <span className="text-gray-900">{(mixer.temperature || 0).toFixed(1)}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Intensité:</span>
                    <span className="text-gray-900">{(mixer.power || 0).toFixed(1)} A</span>
                  </div>
                </div>
              </div>

              {/* Zone d'alarmes */}
              {mixerAlarms.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2 text-gray-900">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Alarmes actives ({mixerAlarms.length})
                  </h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {mixerAlarms.map((alarm) => (
                      <div
                        key={alarm.id}
                        className={`p-2 rounded text-sm border ${
                          alarm.level === 'Critique' ? 'bg-red-50 border-red-300 text-red-900' :
                          alarm.level === 'Warning' ? 'bg-yellow-50 border-yellow-300 text-yellow-900' :
                          'bg-blue-50 border-blue-300 text-blue-900'
                        }`}
                      >
                        <div className="font-semibold">{alarm.alarmCode}</div>
                        <div className="text-xs mt-1">{alarm.description}</div>
                        <div className="text-xs mt-1 text-gray-600">
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
        </>
      )}

      {activeTab === 'transfert' && (
        <div className="space-y-6">
          {/* État des systèmes de transfert */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              État des systèmes de transfert
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(transferStatus).map(([systemName, status]) => (
                <div key={systemName} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900">{systemName}</h3>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      status === 'actif' ? 'bg-green-100 text-green-800' :
                      status === 'erreur' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {status === 'actif' ? 'Actif' : status === 'erreur' ? 'Erreur' : 'Arrêt'}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setTransferStatus({ ...transferStatus, [systemName]: 'actif' })}
                      disabled={status === 'actif'}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      Démarrer
                    </button>
                    <button
                      onClick={() => setTransferStatus({ ...transferStatus, [systemName]: 'arrêt' })}
                      disabled={status === 'arrêt'}
                      className="flex-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      Arrêter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Informations sur les poudres */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Poudres disponibles
            </h2>
            
            <div className="space-y-3">
              <div className="border rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">Poudre A</h3>
                    <p className="text-sm text-gray-600">Silo Principal</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">850 kg</div>
                    <div className="text-xs text-gray-500">Capacité: 1000 kg</div>
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              
              <div className="border rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">Poudre B</h3>
                    <p className="text-sm text-gray-600">Silo Principal</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">620 kg</div>
                    <div className="text-xs text-gray-500">Capacité: 1000 kg</div>
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '62%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Historique des transferts */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Historique des transferts</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-3 text-left text-sm font-medium text-gray-700">Date/Heure</th>
                    <th className="border p-3 text-left text-sm font-medium text-gray-700">Système</th>
                    <th className="border p-3 text-left text-sm font-medium text-gray-700">Produit</th>
                    <th className="border p-3 text-left text-sm font-medium text-gray-700">Quantité</th>
                    <th className="border p-3 text-left text-sm font-medium text-gray-700">Destination</th>
                    <th className="border p-3 text-left text-sm font-medium text-gray-700">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="border p-3 text-sm">{new Date().toLocaleString('fr-FR')}</td>
                    <td className="border p-3 text-sm">Convoyeur B1-B2</td>
                    <td className="border p-3 text-sm">Poudre A</td>
                    <td className="border p-3 text-sm">50 kg</td>
                    <td className="border p-3 text-sm">Malaxeur B1</td>
                    <td className="border p-3 text-sm">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                        Terminé
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border p-3 text-sm">{new Date(Date.now() - 3600000).toLocaleString('fr-FR')}</td>
                    <td className="border p-3 text-sm">Silo Principal</td>
                    <td className="border p-3 text-sm">Poudre B</td>
                    <td className="border p-3 text-sm">75 kg</td>
                    <td className="border p-3 text-sm">Malaxeur B2</td>
                    <td className="border p-3 text-sm">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                        Terminé
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stockage' && (
        <div className="space-y-6">
          {/* Vue d'ensemble du stockage */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
              <Warehouse className="w-5 h-5" />
              État des réservoirs et silos
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storageData.map((storage) => (
                <div key={storage.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{storage.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {storage.currentLevel}{storage.unit} / {storage.maxCapacity}{storage.unit}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      storage.status === 'Critique' ? 'bg-red-100 text-red-800' :
                      storage.status === 'Bas' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {storage.status}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div 
                      className={`h-3 rounded-full ${
                        storage.status === 'Critique' ? 'bg-red-600' :
                        storage.status === 'Bas' ? 'bg-yellow-600' :
                        'bg-green-600'
                      }`}
                      style={{ width: `${storage.currentLevel}%` }}
                    ></div>
                  </div>
                  
                  {storage.status === 'Critique' && (
                    <div className="flex items-center gap-1 text-red-600 text-xs mt-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Niveau critique - Réapprovisionnement requis</span>
                    </div>
                  )}
                  {storage.status === 'Bas' && (
                    <div className="flex items-center gap-1 text-yellow-600 text-xs mt-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Niveau bas - Surveiller</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Détails par produit */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Détails par produit</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-3 text-left text-sm font-medium text-gray-700">Produit</th>
                    <th className="border p-3 text-left text-sm font-medium text-gray-700">Stock actuel</th>
                    <th className="border p-3 text-left text-sm font-medium text-gray-700">Capacité max</th>
                    <th className="border p-3 text-left text-sm font-medium text-gray-700">Seuil min</th>
                    <th className="border p-3 text-left text-sm font-medium text-gray-700">Niveau</th>
                    <th className="border p-3 text-left text-sm font-medium text-gray-700">Statut</th>
                    <th className="border p-3 text-left text-sm font-medium text-gray-700">Tendance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="border p-3 text-sm font-medium">Poudre A</td>
                    <td className="border p-3 text-sm">850 kg</td>
                    <td className="border p-3 text-sm">1000 kg</td>
                    <td className="border p-3 text-sm">100 kg</td>
                    <td className="border p-3 text-sm">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </td>
                    <td className="border p-3 text-sm">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                        Normal
                      </span>
                    </td>
                    <td className="border p-3 text-sm">
                      <TrendingDown className="w-4 h-4 text-gray-400 inline" />
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border p-3 text-sm font-medium">Poudre B</td>
                    <td className="border p-3 text-sm">620 kg</td>
                    <td className="border p-3 text-sm">1000 kg</td>
                    <td className="border p-3 text-sm">100 kg</td>
                    <td className="border p-3 text-sm">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '62%' }}></div>
                      </div>
                    </td>
                    <td className="border p-3 text-sm">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                        Normal
                      </span>
                    </td>
                    <td className="border p-3 text-sm">
                      <TrendingUp className="w-4 h-4 text-green-600 inline" />
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border p-3 text-sm font-medium">D10</td>
                    <td className="border p-3 text-sm">200 L</td>
                    <td className="border p-3 text-sm">1000 L</td>
                    <td className="border p-3 text-sm">100 L</td>
                    <td className="border p-3 text-sm">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                      </div>
                    </td>
                    <td className="border p-3 text-sm">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                        Bas
                      </span>
                    </td>
                    <td className="border p-3 text-sm">
                      <TrendingDown className="w-4 h-4 text-yellow-600 inline" />
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border p-3 text-sm font-medium">D200</td>
                    <td className="border p-3 text-sm">850 L</td>
                    <td className="border p-3 text-sm">1000 L</td>
                    <td className="border p-3 text-sm">100 L</td>
                    <td className="border p-3 text-sm">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </td>
                    <td className="border p-3 text-sm">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                        Normal
                      </span>
                    </td>
                    <td className="border p-3 text-sm">
                      <TrendingUp className="w-4 h-4 text-green-600 inline" />
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border p-3 text-sm font-medium">Huile</td>
                    <td className="border p-3 text-sm">100 L</td>
                    <td className="border p-3 text-sm">1000 L</td>
                    <td className="border p-3 text-sm">100 L</td>
                    <td className="border p-3 text-sm">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-red-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                    </td>
                    <td className="border p-3 text-sm">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">
                        Critique
                      </span>
                    </td>
                    <td className="border p-3 text-sm">
                      <TrendingDown className="w-4 h-4 text-red-600 inline" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Historique des mouvements */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">Historique des mouvements</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-3 text-left text-sm font-medium text-gray-700">Date/Heure</th>
                    <th className="border p-3 text-left text-sm font-medium text-gray-700">Type</th>
                    <th className="border p-3 text-left text-sm font-medium text-gray-700">Produit</th>
                    <th className="border p-3 text-left text-sm font-medium text-gray-700">Quantité</th>
                    <th className="border p-3 text-left text-sm font-medium text-gray-700">Stock avant</th>
                    <th className="border p-3 text-left text-sm font-medium text-gray-700">Stock après</th>
                    <th className="border p-3 text-left text-sm font-medium text-gray-700">Opérateur</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="border p-3 text-sm">{new Date().toLocaleString('fr-FR')}</td>
                    <td className="border p-3 text-sm">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">
                        Sortie
                      </span>
                    </td>
                    <td className="border p-3 text-sm">Huile</td>
                    <td className="border p-3 text-sm">-50 L</td>
                    <td className="border p-3 text-sm">150 L</td>
                    <td className="border p-3 text-sm">100 L</td>
                    <td className="border p-3 text-sm">Opérateur 1</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border p-3 text-sm">{new Date(Date.now() - 7200000).toLocaleString('fr-FR')}</td>
                    <td className="border p-3 text-sm">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                        Entrée
                      </span>
                    </td>
                    <td className="border p-3 text-sm">D200</td>
                    <td className="border p-3 text-sm">+200 L</td>
                    <td className="border p-3 text-sm">650 L</td>
                    <td className="border p-3 text-sm">850 L</td>
                    <td className="border p-3 text-sm">Opérateur 2</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border p-3 text-sm">{new Date(Date.now() - 10800000).toLocaleString('fr-FR')}</td>
                    <td className="border p-3 text-sm">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">
                        Sortie
                      </span>
                    </td>
                    <td className="border p-3 text-sm">Poudre A</td>
                    <td className="border p-3 text-sm">-50 kg</td>
                    <td className="border p-3 text-sm">900 kg</td>
                    <td className="border p-3 text-sm">850 kg</td>
                    <td className="border p-3 text-sm">Opérateur 1</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
