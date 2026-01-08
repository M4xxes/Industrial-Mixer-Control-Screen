import { Link, Navigate } from 'react-router-dom';
import { useMixers } from '../hooks/useMixers';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { inventoryAPI, alarmsAPI, batchesAPI } from '../services/api';
import { Inventory, Alarm, Batch } from '../types';
import MixerVisual from '../components/MixerVisual';
import { Package, AlertTriangle, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const { mixers, loading: mixersLoading } = useMixers();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Rediriger si pas admin
  if (!isAdmin()) {
    return <Navigate to="/alarms" replace />;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invData, alarmsData, batchesData] = await Promise.all([
          inventoryAPI.getAll(),
          alarmsAPI.getAll(),
          batchesAPI.getAll(),
        ]);
        setInventory(invData);
        setAlarms(alarmsData);
        setBatches(batchesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Afficher un message d'erreur si le backend n'est pas disponible
        if (error instanceof Error && error.message.includes('fetch')) {
          console.warn('⚠️ Le serveur backend n\'est peut-être pas démarré. Vérifiez que le serveur tourne sur http://localhost:3001');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
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
  const criticalAlarms = alarms.filter(a => a.level === 'Critique' && a.status === 'Active').length;
  const criticalInventory = inventory.filter(i => i.status === 'Critique').length;
  const lowInventory = inventory.filter(i => i.status === 'Bas').length;
  const totalInventory = inventory.length;
  const totalConsumption = inventory.reduce((sum, inv) => sum + (inv.maxCapacity - inv.currentQuantity), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Vue d'ensemble</h1>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <p className="text-sm text-gray-600">Alarmes critiques</p>
              <p className="text-2xl font-bold text-red-600">{criticalAlarms}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stocks critiques</p>
              <p className="text-2xl font-bold text-red-600">{criticalInventory}</p>
            </div>
            <Package className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stocks bas</p>
              <p className="text-2xl font-bold text-orange-600">{lowInventory}</p>
            </div>
            <Package className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Statistiques stocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total produits en stock</p>
              <p className="text-2xl font-bold text-gray-900">{totalInventory}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Consommation totale</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalConsumption.toFixed(0)} {inventory[0]?.unit || 'Kg'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grille des malaxeurs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Malaxeurs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mixers.map((mixer) => (
            <Link
              key={mixer.id}
              to={`/mixer/${mixer.id}`}
              className="card hover:shadow-lg transition-shadow"
            >
              <MixerVisual mixer={mixer} size="small" />
              <div className="mt-4 space-y-2">
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
                {mixer.recipe && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Recette</span>
                      <span className="font-medium">{mixer.recipe.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">N° de lot</span>
                      <span className="font-medium">{getCurrentBatchNumber(mixer.id)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
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
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-gray-600">Température</span>
                  <span className="font-medium">{mixer.temperature.toFixed(1)}°C</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

