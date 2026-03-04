import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMixers } from '../hooks/useMixers';
import { recipesAPI, mixersAPI, alarmsAPI, batchesAPI, etapesExecutionAPI, automateAPI } from '../services/api';
import { Recipe, Alarm, Batch, EtapesExecution } from '../types';
import { Play, Square, Check, AlertTriangle, ChevronDown, ChevronUp, Hand, X, Power, Thermometer, Gauge, RotateCcw, Settings } from 'lucide-react';
import MixerVisual from '../components/MixerVisual';

export default function ProductionPage() {
  const { pair } = useParams<{ pair: string }>();
  const { isAdmin } = useAuth();
  const { mixers, loading: mixersLoading, error: mixersError } = useMixers();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [etapesExecution, setEtapesExecution] = useState<EtapesExecution[]>([]);
  const [operatorNames, setOperatorNames] = useState<{ [key: number]: string }>({});
  const [selectedRecipeId, setSelectedRecipeId] = useState<{ [key: number]: string }>({});
  const [batchNumbers, setBatchNumbers] = useState<{ [key: number]: string }>({});
  const [batchNumberInput, setBatchNumberInput] = useState<{ [key: number]: string }>({});
  const [activeTab, setActiveTab] = useState<'production'>('production');
  const [showLoading, setShowLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const fetchingRef = useRef(false); // Pour éviter les requêtes multiples simultanées
  const [showSteps, setShowSteps] = useState<{ [key: number]: boolean }>({}); // État pour afficher/masquer les étapes par malaxeur

  // Fenêtres Mode manuel : plusieurs possibles, déplaçables (position x,y par fenêtre)
  type ManualModeWindow = { id: string; singleMixerId: number | null; x: number; y: number };
  const [manualModeWindows, setManualModeWindows] = useState<ManualModeWindow[]>([]);
  const manualModeDragRef = useRef<{ id: string; startX: number; startY: number; startLeft: number; startTop: number } | null>(null);
  const [manualSelectedMixerId1, setManualSelectedMixerId1] = useState<number | null>(null);
  const [manualSelectedMixerId2, setManualSelectedMixerId2] = useState<number | null>(null);
  const [manualConsignes, setManualConsignes] = useState<Record<number, Record<string, { total: string; dose: string }>>>({});
  const [dosageConfirm, setDosageConfirm] = useState<{
    open: boolean;
    mixerId: number;
    productName: string;
    total: string;
    dose: string;
  } | null>(null);
  const [poidsBascule, setPoidsBascule] = useState<Record<number, number>>({});
  const [batchNumberManual, setBatchNumberManual] = useState<Record<number, string>>({});

  // Helpers variables automate
  const getMixerCode = (mixerId: number): string => {
    const mixer = mixers.find(m => m.id === mixerId);
    const mixerNumber = mixer?.name.match(/B(\d+)/)?.[1];
    if (mixerNumber) return `B${mixerNumber}`;
    return `B${mixerId}`;
  };

  const getProductCodes = (productName: string): { product: string; razProduct: string } => {
    switch (productName) {
      case 'HYDROCARB':
        return { product: 'Hydrocarb', razProduct: 'Hydrocarbure' };
      case 'D10':
        return { product: 'D10', razProduct: 'D10' };
      case 'D200':
        return { product: 'D200', razProduct: 'D200' };
      case 'HUILE MINERALE':
        return { product: 'Huile', razProduct: 'Huile' };
      default:
        return { product: productName, razProduct: productName };
    }
  };

  const writeAutomateVariable = async (variable: string, value: any = true) => {
    try {
      await automateAPI.writeVariable(variable, value);
    } catch (error) {
      console.error('Erreur écriture variable automate', variable, error);
    }
  };

  // Ouvrir une fenêtre Mode manuel (plusieurs possibles, positions décalées)
  const openManualModeWindow = (singleMixerId: number | null) => {
    setManualModeWindows(prev => {
      const n = prev.length;
      return [...prev, { id: `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`, singleMixerId, x: 40 + n * 50, y: 40 + n * 45 }];
    });
    if (singleMixerId != null) setManualSelectedMixerId1(singleMixerId);
  };
  const closeManualModeWindow = (id: string) => {
    setManualModeWindows(prev => prev.filter(w => w.id !== id));
  };

  // Drag des fenêtres Mode manuel (écoute globale)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!manualModeDragRef.current) return;
      const { id, startX, startY, startLeft, startTop } = manualModeDragRef.current;
      setManualModeWindows(prev => prev.map(w => w.id !== id ? w : { ...w, x: Math.max(0, startLeft + (e.clientX - startX)), y: Math.max(0, startTop + (e.clientY - startY)) }));
    };
    const onUp = () => { manualModeDragRef.current = null; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, []);

  // Déterminer les IDs des malaxeurs selon la paire (mémorisé pour éviter les re-renders)
  const mixerIds = useMemo(() => {
    if (!pair) return [];
    switch (pair) {
      case 'B1-2': return [1, 2];
      case 'B3-5': return [3, 5]; // B3 et B5 seulement (pas B4, pas B6)
      case 'B6-7': return [6, 7]; // B6 et B7
      default: return [];
    }
  }, [pair]);

  const displayedMixers = useMemo(() => {
    // Filtrer par ID ET par nom pour éviter les problèmes de base de données
    // Exemple: si B6 a l'ID 5 dans la base, il ne doit pas apparaître dans B3-5
    const filtered = mixers.filter(m => {
      if (!m) return false;
      
      // Extraire le numéro du malaxeur depuis le nom (ex: "Malaxeur B6" -> "6")
      const mixerNumber = m.name.match(/B(\d+)/)?.[1];
      
      if (mixerNumber) {
        const mixerNum = parseInt(mixerNumber, 10);
        // Vérifier que le numéro dans le nom correspond à un ID attendu
        if (mixerIds.includes(mixerNum)) {
          // Vérifier aussi que l'ID correspond (double vérification)
          // Si l'ID ne correspond pas mais le nom oui, on l'inclut quand même
          // (pour gérer les cas où la base de données a des IDs incorrects)
          return true;
        }
        // Si le numéro dans le nom ne correspond pas, exclure même si l'ID correspond
        // (ex: B6 avec ID 5 ne doit pas apparaître dans B3-5)
        return false;
      }
      
      // Si pas de numéro dans le nom, utiliser seulement l'ID (comportement par défaut)
      return mixerIds.includes(m.id);
    });
    
    // Debug désactivé pour éviter le spam console
    // Les logs sont maintenant gérés par le message d'avertissement visuel sur la page
    // if (import.meta.env.DEV && pair && (filtered.length !== mixerIds.length)) {
    //   console.log(`[${pair}] ⚠️ Malaxeurs manquants:`, {
    //     attendus: mixerIds,
    //     trouvés: filtered.map(m => ({ id: m.id, name: m.name })),
    //     disponibles: mixers.map(m => ({ id: m.id, name: m.name }))
    //   });
    // }
    return filtered;
  }, [mixers, mixerIds, pair]);

  // Afficher automatiquement les étapes si une recette est en cours
  useEffect(() => {
    // Attendre que les mixers soient chargés
    if (mixersLoading) return;
    
    // Utiliser un délai pour s'assurer que mixer.recipe est bien chargé après le reload
    const timeout = setTimeout(() => {
      displayedMixers.forEach((mixer) => {
        if (mixer && mixer.recipe && mixer.status === 'Production') {
          setShowSteps(prev => {
            // Toujours afficher les étapes si une recette est en cours
            if (prev[mixer.id] !== true) {
              return { ...prev, [mixer.id]: true };
            }
            return prev;
          });
        }
      });
    }, 300); // Délai un peu plus long pour s'assurer que mixer.recipe est chargé
    
    return () => clearTimeout(timeout);
  }, [displayedMixers, mixersLoading]);
  
  // Vérifier aussi après le chargement des recettes
  useEffect(() => {
    if (mixersLoading || recipes.length === 0) return;
    
    const timeout = setTimeout(() => {
      displayedMixers.forEach((mixer) => {
        if (mixer && mixer.recipe && mixer.status === 'Production') {
          setShowSteps(prev => {
            if (prev[mixer.id] !== true) {
              return { ...prev, [mixer.id]: true };
            }
            return prev;
          });
        }
      });
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [displayedMixers, mixersLoading, recipes.length]);

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

  // Debug: Log désactivé pour éviter le spam console
  // useEffect(() => {
  //   if (import.meta.env.DEV) {
  //     console.log('ProductionPage Debug:', {
  //       pair,
  //       mixerIds,
  //       totalMixers: mixers.length,
  //       displayedMixersCount: displayedMixers.length
  //     });
  //   }
  // }, [pair]);

  // Initialiser les malaxeurs du mode manuel (popup) quand les mixers sont chargés
  useEffect(() => {
    if (mixers.length > 0) {
      if (manualSelectedMixerId1 == null) setManualSelectedMixerId1(mixers[0].id);
      if (manualSelectedMixerId2 == null && mixers.length > 1) setManualSelectedMixerId2(mixers[1].id);
    }
  }, [mixers, manualSelectedMixerId1, manualSelectedMixerId2]);

  // Scroll uniquement au changement de paire, pas à chaque rafraîchissement
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pair]); // Seulement quand la paire change

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
    if (!pair || mixerIds.length === 0 || mixersLoading) {
      return;
    }

    const fetchData = async () => {
      // Éviter les requêtes multiples simultanées
      if (fetchingRef.current) {
        return;
      }
      
      fetchingRef.current = true;
      try {
        const [recipesData, alarmsData, batchesData] = await Promise.all([
          recipesAPI.getAll().catch(err => {
            // Ne pas logger les erreurs réseau répétées pour éviter le spam
            if (!err.message?.includes('Failed to fetch')) {
              console.error('Error fetching recipes:', err);
            }
            return [];
          }),
          alarmsAPI.getAll().catch(err => {
            if (!err.message?.includes('Failed to fetch')) {
              console.error('Error fetching alarms:', err);
            }
            return [];
          }),
          batchesAPI.getAll().catch(err => {
            if (!err.message?.includes('Failed to fetch')) {
              console.error('Error fetching batches:', err);
            }
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
            // Ne pas logger les erreurs réseau répétées
            if (!(error instanceof Error && error.message?.includes('Failed to fetch'))) {
              console.error('Error fetching etapes execution:', error);
            }
            setEtapesExecution([]);
          }
        } else {
          setEtapesExecution([]);
        }
      } catch (error) {
        // Ne pas logger les erreurs réseau répétées
        if (!(error instanceof Error && error.message?.includes('Failed to fetch'))) {
          console.error('Error fetching data:', error);
        }
      } finally {
        fetchingRef.current = false;
      }
    };
    
    // Premier chargement
    fetchData();
    
    // Rafraîchissement automatique désactivé - les données ne se rafraîchissent que manuellement
    // const interval = setInterval(fetchData, 5000);
    // return () => clearInterval(interval);
  }, [pair, mixerIds.length, mixersLoading]); // Utiliser mixerIds.length au lieu de mixerIds pour éviter les re-renders

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
      await writeAutomateVariable(`Depart_Cycle_${getMixerCode(mixerId)}`, true);
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
      await writeAutomateVariable(`Fin_Recette_${getMixerCode(mixerId)}`, true);
      window.location.reload();
    } catch (error) {
      console.error('Error ending recipe:', error);
      alert('Erreur lors de la fin de la recette');
    }
  };

  const handleValidateStep = async (mixerId: number, stepNumber: number) => {
    try {
      await mixersAPI.validateStep(mixerId, stepNumber);
      await writeAutomateVariable(`Valider_Etape_${getMixerCode(mixerId)}`, true);
      window.location.reload();
    } catch (error) {
      console.error('Error validating step:', error);
      alert('Erreur lors de la validation de l\'étape');
    }
  };

  const handleDefaut = (mixerId: number) => {
    const mixer = mixers.find(m => m.id === mixerId);
    const label = mixer?.name || `B${mixerId}`;
    alert(`Afficher les défauts du ${label}`);
    // TODO: Implémenter l'affichage des défauts
  };

  const handleAcquitDefauts = async (mixerId: number) => {
    const mixer = mixers.find(m => m.id === mixerId);
    const label = mixer?.name || `B${mixerId}`;
    if (!confirm(`Êtes-vous sûr de vouloir acquitter tous les défauts du ${label} ?`)) return;
    
    try {
      // Acquitter toutes les alarmes actives pour ce malaxeur
      const mixerAlarms = alarms.filter(a => a.mixerId === mixerId && a.status === 'Active');
      await Promise.all(mixerAlarms.map(a => alarmsAPI.acknowledge(a.id)));
      await writeAutomateVariable(`Acquit_Defaut_${getMixerCode(mixerId)}`, true);
      alert('Défauts acquittés avec succès');
      window.location.reload();
    } catch (error) {
      console.error('Error acknowledging defects:', error);
      alert('Erreur lors de l\'acquittement des défauts');
    }
  };

  const handleAppelOperateur = (mixerId: number) => {
    const mixer = mixers.find(m => m.id === mixerId);
    const label = mixer?.name || `B${mixerId}`;
    alert(`Appel opérateur pour le ${label}`);
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

  // Rendu d'une colonne du popup Mode manuel (gauche ou droite). Si fixedMixerId est défini, pas de sélecteur de malaxeur.
  const renderManualModeColumn = (mixer: typeof mixers[0] | null | undefined, mixerNumber: 1 | 2, fixedMixerId?: number | null) => {
    const isFixed = fixedMixerId != null;
    const selectedMixerId = isFixed ? fixedMixerId : (mixerNumber === 1 ? manualSelectedMixerId1 : manualSelectedMixerId2);
    const setSelectedMixerId = mixerNumber === 1 ? setManualSelectedMixerId1 : setManualSelectedMixerId2;

    const getCurrentBatch = (mixerId: number) =>
      batches.find(b => b.mixerId === mixerId && (b.status === 'En cours' || b.status === 'Terminé'));
    const getDistribution = (batch?: Batch) => {
      if (!batch?.distribution?.length) {
        return [
          { productName: 'Hydrocarb', qteFormule: 0, qteDosee: 0, dose: 0 },
          { productName: 'Napvis D10', qteFormule: 0, qteDosee: 0, dose: 0 },
          { productName: 'Napvis D200', qteFormule: 0, qteDosee: 0, dose: 0 },
          { productName: 'Huile HM', qteFormule: 0, qteDosee: 0, dose: 0 },
        ];
      }
      const productOrder = ['Hydrocarb', 'Napvis D10', 'Napvis D200', 'Huile HM'];
      const map = new Map(batch.distribution.map((d: any) => [d.productName, d]));
      return productOrder.map(name => map.get(name) || { productName: name, qteFormule: 0, qteDosee: 0, dose: 0 });
    };
    const getProductData = (productName: string, batch: Batch | undefined, distribution: any[]) => {
      const item = distribution.find((d: any) => {
        if (productName === 'HYDROCARB') return d.productName === 'Hydrocarb';
        if (productName === 'D10') return d.productName === 'Napvis D10';
        if (productName === 'D200') return d.productName === 'Napvis D200';
        if (productName === 'HUILE MINERALE') return d.productName === 'Huile HM';
        return false;
      });
      return item || { productName: productName, qteFormule: 0, qteDosee: 0, dose: 0 };
    };
    const formatWeight = (value: number | null | undefined) => (value == null ? '0.0' : value.toFixed(1));

    return (
      <div className="space-y-6" style={{ fontSize: 'clamp(12px, 1.5vw, 16px)' }}>
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">N° Lot</label>
          <input
            type="text"
            value={selectedMixerId != null ? (batchNumberManual[selectedMixerId] ?? '') : ''}
            onChange={(e) => selectedMixerId != null && setBatchNumberManual((prev) => ({ ...prev, [selectedMixerId]: e.target.value }))}
            placeholder="Numéro de lot"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        {!isFixed && (
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner un malaxeur {mixerNumber === 1 ? '(Gauche)' : '(Droite)'}</label>
            <select
              value={selectedMixerId ?? ''}
              onChange={(e) => setSelectedMixerId(parseInt(e.target.value) || null)}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Sélectionner --</option>
              {mixers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}
        {mixer && (
          <>
            <div className="card">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{mixer.name}</h2>
                <span className={`px-3 py-1 rounded text-sm font-semibold ${
                  mixer.status === 'Production' ? 'bg-green-100 text-green-800' :
                  mixer.status === 'Pause' ? 'bg-yellow-100 text-yellow-800' :
                  mixer.status === 'Alarme' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>{mixer.status}</span>
              </div>
              <MixerVisual mixer={mixer} size="medium" />
            </div>
            <div className="card space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Données temps réel</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <RotateCcw className="w-4 h-4" />
                    Vitesse Vis
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{mixer.speed} tr/min</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Power className="w-4 h-4" />
                    Intensité Bras
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{mixer.power.toFixed(1)} A</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Power className="w-4 h-4" />
                    Intensité Vis
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{mixer.power.toFixed(1)} A</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Thermometer className="w-4 h-4" />
                    Température Malaxeur
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{mixer.temperature.toFixed(1)}°C</div>
                </div>
              </div>
              <div className="border-t pt-3 text-sm text-gray-700">
                <h3 className="font-semibold text-gray-900 mb-2">MESURES hydrauliques / vide</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Pression Hyd. Vis</span>
                    <span className="font-medium">{mixer.pressure.toFixed(1)} bar</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pression Hyd. Bras 1</span>
                    <span className="font-medium">{mixer.pressure.toFixed(1)} bar</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pression Hyd. Bras 2</span>
                    <span className="font-medium">{mixer.pressure.toFixed(1)} bar</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vide Malaxeur</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">État des moteurs</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm text-gray-600">Bras:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                      mixer.motorArm === 'Marche' ? 'bg-green-100 text-green-800' :
                      mixer.motorArm === 'Défaut' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>{mixer.motorArm}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Vis:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                      mixer.motorScrew === 'Marche' ? 'bg-green-100 text-green-800' :
                      mixer.motorScrew === 'Défaut' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>{mixer.motorScrew}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center border-b pb-2">DOSAGES MANUELS {mixer.name.toUpperCase()}</h2>
              {(['HYDROCARB', 'D10', 'D200', 'HUILE MINERALE'] as const).map((productName) => {
                const batch = getCurrentBatch(mixer.id);
                const distribution = getDistribution(batch);
                const data = getProductData(productName, batch, distribution);
                const csgTotal = data.qteFormule || 0;
                const csgDose = data.dose || 0;
                const poidsDose = data.qteDosee || 0;
                const poidsRest = Math.max(0, csgTotal - poidsDose);
                const basculeValue = poidsBascule[mixer.id] ?? 0;
                const key = productName.replace(' ', '_');
                const cs = manualConsignes[mixer.id]?.[key] ?? { total: String(csgTotal), dose: String(csgDose) };
                const isD200 = productName === 'D200';
                const temperatureD200 = isD200 ? mixer.temperature.toFixed(1) : undefined;
                return (
                  <div key={productName} className="border-b pb-4 mb-4 last:border-b-0 last:mb-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-md font-semibold text-gray-900">DISTRIBUTION {productName}</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3 text-sm">
                        <div>
                          <label className="block text-gray-700 mb-1">Consigne total (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={cs.total}
                            onChange={(e) => setManualConsignes((prev) => ({
                              ...prev,
                              [mixer.id]: { ...(prev[mixer.id] ?? {}), [key]: { ...(prev[mixer.id]?.[key] ?? { total: '', dose: '' }), total: e.target.value } },
                            }))}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 mb-1">Consigne dose (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={cs.dose}
                            onChange={(e) => setManualConsignes((prev) => ({
                              ...prev,
                              [mixer.id]: { ...(prev[mixer.id] ?? {}), [key]: { ...(prev[mixer.id]?.[key] ?? { total: '', dose: '' }), dose: e.target.value } },
                            }))}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-gray-900"
                          />
                        </div>
                        <div className="flex justify-between pt-1 border-t">
                          <span className="text-gray-700">Poids Bascule:</span>
                          <span className="font-medium">{formatWeight(basculeValue)} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Poids Dosé:</span>
                          <span className="font-medium">{formatWeight(poidsDose)} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Poids Rest:</span>
                          <span className="font-medium">{formatWeight(poidsRest)} kg</span>
                        </div>
                        {isD200 && (
                          <div className="flex justify-between">
                            <span className="text-gray-700">T° D200:</span>
                            <span className="font-medium">{temperatureD200} °C</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-start">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const mixerCode = getMixerCode(mixer.id);
                              const { product } = getProductCodes(productName);
                              writeAutomateVariable(`Mode_Manu_Dosage_${product}_${mixerCode}`, true);
                              setDosageConfirm({ open: true, mixerId: mixer.id, productName, total: cs.total, dose: cs.dose });
                            }}
                            className="px-3 py-2 bg-primary-600 text-white rounded text-sm font-medium hover:bg-primary-700"
                          >
                            DOSAGE
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const mixerCode = getMixerCode(mixer.id);
                              const { product } = getProductCodes(productName);
                              writeAutomateVariable(`Mode_Manu_Init_${product}_${mixerCode}`, true);
                            }}
                            className="px-3 py-2 bg-primary-600 text-white rounded text-sm font-medium hover:bg-primary-700"
                          >
                            INITIALISATION
                          </button>
                          {productName !== 'HUILE MINERALE' && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  const mixerCode = getMixerCode(mixer.id);
                                  const { product } = getProductCodes(productName);
                                  writeAutomateVariable(`Mode_Manu_Remplisage_${product}_${mixerCode}`, true);
                                }}
                                className="px-3 py-2 bg-primary-600 text-white rounded text-sm font-medium hover:bg-primary-700"
                              >
                                REMPLISSAGE
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const mixerCode = getMixerCode(mixer.id);
                                  const { product } = getProductCodes(productName);
                                  writeAutomateVariable(`Mode_Manu_Remp_Auto_${product}_${mixerCode}`, true);
                                }}
                                className="px-3 py-2 bg-gray-500 text-white rounded text-sm font-medium hover:bg-gray-600"
                              >
                                AUTO
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const mixerCode = getMixerCode(mixer.id);
                                  const { product } = getProductCodes(productName);
                                  writeAutomateVariable(`Mode_Manu_Remp_Manu_${product}_${mixerCode}`, true);
                                }}
                                className="px-3 py-2 bg-gray-500 text-white rounded text-sm font-medium hover:bg-gray-600 col-span-2"
                              >
                                MANU
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t text-xs text-gray-700 space-y-1">
                      <div className="flex justify-between">
                        <span>État Dosage :</span>
                        <span className="font-semibold">-</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Grafcet Dosage :</span>
                        <span className="font-semibold">-</span>
                      </div>
                      <div className="flex justify-between">
                        <span>État Remplissage :</span>
                        <span className="font-semibold">-</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Grafcet Remplissage :</span>
                        <span className="font-semibold">-</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Silo utilisé :</span>
                        <span className="font-semibold">-</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  // TOUJOURS afficher le contenu principal, même si les malaxeurs ne sont pas trouvés
  // Cela garantit qu'il y a toujours quelque chose à l'écran
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2">
        <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold text-gray-900">Production - {pair?.replace('B', 'BUTYL') || pair}</h1>
        {isAdmin() && (
          <button
            type="button"
            onClick={() => openManualModeWindow(null)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
          >
            <Hand className="w-5 h-5" />
            Mode manuel (tous)
          </button>
        )}
      </div>

      {activeTab === 'production' && (
        displayedMixers.length === 0 ? (
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
        <>
          {/* Message d'information si certains malaxeurs manquent */}
          {displayedMixers.length < mixerIds.length && (
            <div className="card bg-yellow-50 border-yellow-200 border-2">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600 text-xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-1">Malaxeurs manquants</h3>
                  <p className="text-sm text-yellow-800">
                    Pour la paire <strong>{pair}</strong>, {mixerIds.length} malaxeur{mixerIds.length > 1 ? 's sont' : ' est'} attendu{mixerIds.length > 1 ? 's' : ''} (IDs: {mixerIds.join(', ')}) mais seulement {displayedMixers.length} {displayedMixers.length > 1 ? 'sont' : 'est'} affiché{displayedMixers.length > 1 ? 's' : ''}.
                  </p>
                  <p className="text-sm text-yellow-800 mt-2">
                    Malaxeurs trouvés: {displayedMixers.map(m => `B${m.id}`).join(', ') || 'Aucun'}
                  </p>
                  <p className="text-sm text-yellow-800 mt-1">
                    Malaxeurs manquants: {mixerIds.filter(id => !displayedMixers.some(m => m.id === id)).map(id => `B${id}`).join(', ') || 'Aucun'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6" style={{ fontSize: 'clamp(12px, 1.5vw, 16px)' }}>
          {displayedMixers.map((mixer) => {
          if (!mixer) return null;
          
          const batch = getCurrentBatch(mixer.id);
          const mixerAlarms = getMixerAlarms(mixer.id);
          // Utiliser la recette du mixer si disponible, sinon la recette sélectionnée dans le dropdown
          const selectedRecipe = selectedRecipeId[mixer.id] 
            ? recipes.find(r => r.id === selectedRecipeId[mixer.id])
            : null;
          const activeRecipe = mixer.recipe || selectedRecipe;
          const currentStep = activeRecipe?.steps?.[(mixer.currentStep || 1) - 1];
          const currentEtapeExec = batch && mixer.currentStep 
            ? getCurrentEtapeExecution(batch.id, mixer.currentStep) 
            : null;

          return (
            <div key={mixer.id} className="card space-y-3 sm:space-y-4">
              {/* En-tête avec nom malaxeur */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b pb-3">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{mixer.name}</h2>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Voyants ronds uniquement */}
                  <div className="flex items-center gap-3" title="Défaut">
                    <div
                      className={`w-4 h-4 rounded-full shrink-0 ${
                        mixerAlarms.length > 0 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-red-300'
                      }`}
                    />
                    <span className="text-xs font-medium text-gray-700">Défaut</span>
                  </div>
                  <div className="flex items-center gap-1.5" title="Appel opérateur">
                    <div className="w-4 h-4 rounded-full shrink-0 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                    <span className="text-xs font-medium text-gray-700">Appel opérateur</span>
                  </div>
                  <button
                    onClick={() => handleAcquitDefauts(mixer.id)}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs sm:text-sm font-medium"
                  >
                    ACQUIT DEFAUTS
                  </button>
                  {isAdmin() && (
                    <button
                      type="button"
                      onClick={() => openManualModeWindow(mixer.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary-600 text-white rounded hover:bg-primary-700 text-xs sm:text-sm font-medium"
                    >
                      <Hand className="w-4 h-4" />
                      Mode manuel
                    </button>
                  )}
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
              <div className="grid grid-cols-1 xs:grid-cols-3 gap-2">
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
                    {mixer.currentStep || 0} / {activeRecipe?.steps?.length || 0}
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
                
                {(() => {
                  const consigneKg =
                    currentStep?.weight ??
                    (batch?.produitConsigne !== undefined && batch.produitConsigne !== null
                      ? batch.produitConsigne
                      : null);
                  if (consigneKg === null || consigneKg === undefined) return null;
                  return (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Consigne en Kg:</span>
                      <span className="font-medium text-gray-900">
                        {consigneKg.toFixed(2)} Kg
                      </span>
                    </div>
                  );
                })()}
                
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

              {/* Tableau détaillé des étapes de la recette en cours */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Étapes de la recette</h3>
                  <button
                    onClick={() => setShowSteps(prev => ({ ...prev, [mixer.id]: !prev[mixer.id] }))}
                    disabled={!activeRecipe}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {showSteps[mixer.id] ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Masquer les détails
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Afficher les détails
                      </>
                    )}
                  </button>
                </div>
                {!activeRecipe ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">Aucune recette sélectionnée</p>
                    <p className="text-sm">Sélectionnez une recette dans le menu déroulant ci-dessus pour voir les étapes</p>
                  </div>
                ) : !showSteps[mixer.id] && mixer.status !== 'Production' ? (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm mb-2">Cliquez sur "Afficher les détails" pour voir les {activeRecipe.steps?.length || 0} étapes de la recette</p>
                  </div>
                ) : mixer.status === 'Production' && mixer.recipe && !showSteps[mixer.id] ? (
                  <div className="text-center py-4 text-blue-600">
                    <p className="text-sm">Chargement des étapes...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-64 sm:max-h-80 md:max-h-96 overflow-y-auto -mx-2 sm:mx-0">
                    <table className="w-full text-xs sm:text-sm min-w-[600px]">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr className="border-b">
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
                        {activeRecipe.steps.map((step, index) => {
                          const stepNum = index + 1;
                          const isCompleted = stepNum < (mixer.currentStep || 0);
                          const isCurrent = stepNum === (mixer.currentStep || 0);
                          const stepExec = batch ? getCurrentEtapeExecution(batch.id, stepNum) : null;
                          
                          // Couleur de fond selon le statut
                          let rowClass = '';
                          if (isCompleted || stepExec?.statut === 'TERMINE') {
                            rowClass = 'bg-green-50'; // Vert (finie)
                          } else if (isCurrent || stepExec?.statut === 'EN_COURS') {
                            rowClass = 'bg-gray-100'; // Gris (en cours)
                          } else {
                            rowClass = 'bg-white'; // Blanc (pas faite)
                          }
                          
                          // Calculer la durée réelle depuis l'étape d'exécution
                          let dureeReelle = '-';
                          if (stepExec?.dateDebut && stepExec?.dateFin) {
                            const debut = new Date(stepExec.dateDebut);
                            const fin = new Date(stepExec.dateFin);
                            dureeReelle = Math.round((fin.getTime() - debut.getTime()) / 1000).toString();
                          } else if (stepExec?.dateDebut && isCurrent) {
                            const debut = new Date(stepExec.dateDebut);
                            const maintenant = new Date();
                            dureeReelle = Math.round((maintenant.getTime() - debut.getTime()) / 1000).toString();
                          }
                          
                          return (
                            <tr key={step.id} className={`border-b hover:bg-gray-50 ${rowClass}`}>
                              <td className="p-2 font-medium">{stepNum}</td>
                              <td className="p-2">{step.function}</td>
                              <td className="p-2">{step.arm || '-'}</td>
                              <td className="p-2">{step.screw || '-'}</td>
                              <td className="p-2">{step.ref || '-'}</td>
                              <td className="p-2">{step.product || '-'}</td>
                              <td className="p-2 text-right">{step.weight?.toFixed(2) || '-'}</td>
                              <td className="p-2 text-right">{stepExec?.quantiteDosee?.toFixed(2) || '-'}</td>
                              <td className="p-2 text-right">{step.vacuum ? `${step.vacuum}%` : '-'}</td>
                              <td className="p-2 text-right">{step.mesure || '-'}</td>
                              <td className="p-2">{step.critere || '-'}</td>
                              <td className="p-2 text-right">{step.duration || '-'}</td>
                              <td className="p-2 text-right">{dureeReelle}</td>
                              <td className="p-2">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  isCompleted || stepExec?.statut === 'TERMINE' ? 'bg-green-100 text-green-800' :
                                  isCurrent || stepExec?.statut === 'EN_COURS' ? 'bg-gray-200 text-gray-800' :
                                  'bg-white text-gray-600'
                                }`}>
                                  {isCompleted || stepExec?.statut === 'TERMINE' ? 'Terminée' :
                                   isCurrent || stepExec?.statut === 'EN_COURS' ? 'En cours' :
                                   'En attente'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Données temps réel principales */}
              <div className="border-t pt-4 space-y-2 text-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Données Temps Réel</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vitesse Vis:</span>
                    <span className="text-gray-900">{(mixer.speed || 0).toFixed(0)} tr/min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Intensité Bras:</span>
                    <span className="text-gray-900">{(mixer.power || 0).toFixed(1)} A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Intensité Vis:</span>
                    <span className="text-gray-900">{(mixer.power || 0).toFixed(1)} A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vide Malaxeur:</span>
                    <span className="text-gray-900">0</span>
                  </div>
                </div>
              </div>

              {/* Zone d'alarmes et défauts */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-gray-900">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Alarmes et défauts ({mixerAlarms.length})
                </h3>
                {mixerAlarms.length > 0 ? (
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
                ) : (
                  <div className="text-sm text-gray-500 italic">Aucun défaut actif</div>
                )}
              </div>
            </div>
          );
        })}
        </div>
        </>
      ) )}

      {/* Fenêtres Mode manuel : déplaçables, plusieurs possibles */}
      {manualModeWindows.map((win, index) => (
        <div
          key={win.id}
          className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{
            left: win.x,
            top: win.y,
            width: win.singleMixerId != null ? 'min(580px, 95vw)' : 'min(1150px, 95vw)',
            maxHeight: '90vh',
            zIndex: 50 + index,
          }}
        >
          {/* Barre de titre : zone de drag + fermer */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-primary-600 text-white cursor-grab active:cursor-grabbing select-none border-b border-primary-700"
            onMouseDown={(e) => {
              if ((e.target as HTMLElement).closest('button')) return;
              manualModeDragRef.current = { id: win.id, startX: e.clientX, startY: e.clientY, startLeft: win.x, startTop: win.y };
            }}
          >
            <h2 className="text-lg font-bold truncate pr-2">
              Mode manuel
              {win.singleMixerId != null && (() => {
                const m = mixers.find(mx => mx.id === win.singleMixerId!);
                return m ? ` – ${m.name}` : '';
              })()}
            </h2>
            <button
              type="button"
              onClick={() => closeManualModeWindow(win.id)}
              className="p-1.5 rounded hover:bg-primary-700 text-white shrink-0"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Contenu scrollable */}
          <div className={`overflow-y-auto flex-1 p-4 ${win.singleMixerId != null ? 'grid grid-cols-1' : 'grid grid-cols-1 xl:grid-cols-2 gap-4'}`} style={{ minHeight: 440 }}>
            {win.singleMixerId != null ? (
              renderManualModeColumn(mixers.find(m => m.id === win.singleMixerId!) ?? null, 1, win.singleMixerId)
            ) : (
              <>
                {renderManualModeColumn(mixers.find(m => m.id === manualSelectedMixerId1) ?? null, 1)}
                {renderManualModeColumn(mixers.find(m => m.id === manualSelectedMixerId2) ?? null, 2)}
              </>
            )}
          </div>
        </div>
      ))}

      {/* Pop-up de validation dosage (au-dessus du modal) */}
      {dosageConfirm?.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirmer le dosage</h3>
              <button type="button" onClick={() => setDosageConfirm(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-2">Produit : <strong>{dosageConfirm.productName}</strong></p>
            <p className="text-sm text-gray-600 mb-2">Consigne total : <strong>{dosageConfirm.total} kg</strong></p>
            <p className="text-sm text-gray-600 mb-4">Consigne dose : <strong>{dosageConfirm.dose} kg</strong></p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setDosageConfirm(null)} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  const mixerCode = getMixerCode(dosageConfirm.mixerId);
                  const { product } = getProductCodes(dosageConfirm.productName);
                  const totalValue = parseFloat(dosageConfirm.total) || 0;
                  const doseValue = parseFloat(dosageConfirm.dose) || 0;
                  await Promise.all([
                    writeAutomateVariable(`Validation_Consigne_${product}_${mixerCode}`, true),
                    writeAutomateVariable(`Consigne_Total_${product}_${mixerCode}`, totalValue),
                    writeAutomateVariable(`Consigne_Dose_${product}_${mixerCode}`, doseValue),
                  ]);
                  setDosageConfirm(null);
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded text-sm font-medium hover:bg-primary-700"
              >
                Valider le dosage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
