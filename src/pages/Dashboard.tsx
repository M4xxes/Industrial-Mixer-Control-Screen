import { Link, Navigate, useLocation } from 'react-router-dom';
import { useMixers } from '../hooks/useMixers';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { inventoryAPI, alarmsAPI, batchesAPI } from '../services/api';
import { Inventory, Alarm, Batch } from '../types';
import MixerVisual from '../components/MixerVisual';
import { Package, AlertTriangle, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const { mixers, loading: mixersLoading } = useMixers();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const lastPathRef = useRef<string>(''); // Pour éviter les scrolls multiples sur la même route

  // Rediriger si pas admin
  if (!isAdmin()) {
    return <Navigate to="/alarms" replace />;
  }

  // Scroll uniquement lors d'un changement de route vers Dashboard, pas à chaque rafraîchissement
  useEffect(() => {
    // Ne scroller que si on vient d'une autre page (changement de route)
    if (location.pathname === '/' && lastPathRef.current !== location.pathname) {
      window.scrollTo(0, 0);
      lastPathRef.current = location.pathname;
    }
  }, [location.pathname]); // Seulement quand la route change

  useEffect(() => {
    let fetching = false; // Flag pour éviter les requêtes multiples simultanées
    
    const fetchData = async () => {
      // Éviter les requêtes multiples simultanées
      if (fetching) {
        return;
      }
      
      fetching = true;
      try {
        const [invData, alarmsData, batchesData] = await Promise.all([
          inventoryAPI.getAll().catch(() => []),
          alarmsAPI.getAll().catch(() => []),
          batchesAPI.getAll().catch(() => []),
        ]);
        setInventory(invData || []);
        setAlarms(alarmsData || []);
        setBatches(batchesData || []);
      } catch (error) {
        // Ne pas logger les erreurs réseau répétées pour éviter le spam
        if (!(error instanceof Error && error.message?.includes('Failed to fetch'))) {
          console.error('Error fetching data:', error);
          // Afficher un message d'erreur si le backend n'est pas disponible
          if (error instanceof Error && error.message.includes('fetch')) {
            console.warn('⚠️ Le serveur backend n\'est peut-être pas démarré. Vérifiez que le serveur tourne sur http://localhost:3001');
          }
        }
      } finally {
        setLoading(false);
        fetching = false;
      }
    };
    fetchData();
    // Rafraîchissement automatique désactivé - les données ne se rafraîchissent que manuellement
    // const interval = setInterval(fetchData, 5000);
    // return () => clearInterval(interval);
  }, []);

  // Fonction pour obtenir le N° de lot actuel d'un malaxeur
  const getCurrentBatchNumber = (mixerId: number) => {
    const batch = batches.find(b => b.mixerId === mixerId && (b.status === 'En cours' || b.status === 'Terminé'));
    return batch?.batchNumber || '-';
  };

  if (mixersLoading || loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  // Afficher un message si aucune donnée n'est disponible
  if (mixers.length === 0 && !mixersLoading) {
    return (
      <div className="text-center py-8">
        <div className="card max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-4 text-red-600">⚠️ Erreur de connexion</h2>
          <p className="text-gray-600 mb-4">
            Impossible de charger les données des malaxeurs.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Vérifiez que le serveur backend est démarré sur <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:3001</code>
          </p>
          <div className="text-left bg-gray-50 p-4 rounded">
            <p className="text-sm font-semibold mb-2">Pour démarrer le backend :</p>
            <code className="text-xs block bg-white p-2 rounded">
              cd server<br />
              npm start
            </code>
          </div>
        </div>
      </div>
    );
  }

  const activeMixers = mixers.filter(m => m.status === 'Production').length;
  
  // Calculer la consommation totale par produit
  const getConsumptionByProduct = (productName: string) => {
    // Pour l'instant, on calcule depuis les batches terminés/en cours
    // On pourrait améliorer cela avec les transactions d'inventaire
    const productBatches = batches.filter(b => {
      const dist = b.distribution?.find(d => d.productName === productName);
      return dist && dist.qteDosee > 0;
    });
    return productBatches.reduce((sum, b) => {
      const dist = b.distribution?.find(d => d.productName === productName);
      return sum + (dist?.qteDosee || 0);
    }, 0);
  };

  const consumptionD10 = getConsumptionByProduct('Napvis D10');
  const consumptionD200 = getConsumptionByProduct('Napvis D200');
  const consumptionHuile = getConsumptionByProduct('Huile HM');
  const consumptionPoudres = getConsumptionByProduct('Hydrocarb');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Vue d'ensemble</h1>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Malaxeurs en production</p>
              <p className="text-2xl font-bold text-gray-900">{activeMixers}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Alarmes actives</p>
              <p className="text-2xl font-bold text-red-600">{alarms.filter(a => a.status === 'Active').length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Carré alarmes sur toute la largeur */}
      {alarms.filter(a => a.status === 'Active').length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Alarmes actives
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alarms.filter(a => a.status === 'Active').map((alarm) => (
              <div
                key={alarm.id}
                className={`p-3 rounded-lg border ${
                  alarm.level === 'Critique' ? 'bg-red-50 border-red-200' :
                  alarm.level === 'Warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-gray-900">{alarm.alarmCode}</div>
                    <div className="text-sm text-gray-600 mt-1">{alarm.description}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    alarm.level === 'Critique' ? 'bg-red-100 text-red-800' :
                    alarm.level === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alarm.level}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Malaxeur {alarm.mixerId} • {new Date(alarm.occurredAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Consommation par produit */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">D10</p>
              <p className="text-2xl font-bold text-gray-900">{consumptionD10.toFixed(2)} Kg</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">D200</p>
              <p className="text-2xl font-bold text-gray-900">{consumptionD200.toFixed(2)} Kg</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Huile minérale</p>
              <p className="text-2xl font-bold text-gray-900">{consumptionHuile.toFixed(2)} Kg</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Poudres</p>
              <p className="text-2xl font-bold text-gray-900">{consumptionPoudres.toFixed(2)} Kg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grille des malaxeurs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Malaxeurs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mixers.map((mixer) => {
            const batch = batches.find(b => b.mixerId === mixer.id && (b.status === 'En cours' || b.status === 'Terminé'));
            // Déterminer la route de production selon le nom du malaxeur (plus fiable que l'ID)
            const getProductionRoute = (mixer: { id: number; name: string }) => {
              // Extraire le numéro depuis le nom (ex: "Malaxeur B5" -> 5, "Malaxeur B6" -> 6)
              const mixerNumber = mixer.name.match(/B(\d+)/)?.[1];
              if (mixerNumber) {
                const num = parseInt(mixerNumber, 10);
                if ([1, 2].includes(num)) return '/production/B1-2';
                if ([3, 5].includes(num)) return '/production/B3-5';
                if ([6, 7].includes(num)) return '/production/B6-7';
              }
              // Fallback: utiliser l'ID si le nom ne contient pas de numéro
              if ([1, 2].includes(mixer.id)) return '/production/B1-2';
              if ([3, 5].includes(mixer.id)) return '/production/B3-5';
              if ([6, 7].includes(mixer.id)) return '/production/B6-7';
              return `/mixer/${mixer.id}`;
            };
            return (
              <Link
                key={mixer.id}
                to={getProductionRoute(mixer)}
                className="card hover:shadow-lg transition-shadow"
              >
                <MixerVisual mixer={mixer} size="small" />
                <div className="mt-4 space-y-2">
                  {/* Toujours afficher nom de la recette, lot et fabricant */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Recette</span>
                    <span className="font-medium">{mixer.recipe?.name || batch?.recipeName || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">N° de lot</span>
                    <span className="font-medium">{batch?.batchNumber || getCurrentBatchNumber(mixer.id) || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fabricant</span>
                    <span className="font-medium">{batch?.fabricant || batch?.operatorId || '-'}</span>
                  </div>
                  
                  {mixer.recipe && mixer.status === 'Production' && (
                    <>
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span className="text-gray-600">Formule</span>
                        <span className="font-medium">{batch?.formule || mixer.recipe.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Heure de début</span>
                        <span className="font-medium">
                          {batch?.startedAt ? new Date(batch.startedAt).toLocaleTimeString() : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span className="text-gray-600">Étape</span>
                        <span className="font-medium">
                          {mixer.currentStep || 0} / {mixer.recipe.steps?.length || 0}
                        </span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progression</span>
                          <span>{mixer.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${mixer.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {mixer.recipe && mixer.status !== 'Production' && (
                    <>
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span className="text-gray-600">Étape</span>
                        <span className="font-medium">
                          {mixer.currentStep || 0} / {mixer.recipe.steps?.length || 0}
                        </span>
                      </div>
                    </>
                  )}
                  {!mixer.recipe && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">État</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        mixer.status === 'Production' ? 'bg-green-100 text-green-800' :
                        mixer.status === 'Pause' ? 'bg-yellow-100 text-yellow-800' :
                        mixer.status === 'Alarme' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {mixer.status}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

