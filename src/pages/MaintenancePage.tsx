import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { inventoryAPI, mixersAPI } from '../services/api';
import { Inventory } from '../types';
import { Wifi, WifiOff, TrendingUp, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';

export default function MaintenancePage() {
  const { isAdmin } = useAuth();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [mixers, setMixers] = useState<any[]>([]);
  const [totalConsumption, setTotalConsumption] = useState(0);

  // Rediriger si pas admin
  if (!isAdmin()) {
    return <Navigate to="/alarms" replace />;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invData, mixersData] = await Promise.all([
          inventoryAPI.getAll(),
          mixersAPI.getAll(),
        ]);
        setInventory(invData);
        setMixers(mixersData);

        // Calculer la consommation totale
        const consumption = invData.reduce((sum, inv) => {
          return sum + (inv.maxCapacity - inv.currentQuantity);
        }, 0);
        setTotalConsumption(consumption);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleResetConsumption = () => {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser la consommation totale ?')) return;
    
    // Réinitialiser la consommation (mettre tous les stocks au maximum)
    // Note: Cela nécessiterait une API pour réinitialiser les stocks
    alert('Fonctionnalité de réinitialisation à implémenter via l\'API');
  };

  // Simuler l'état des communications automates
  // Dans une vraie application, cela viendrait de l'API
  const automationStatus = [
    { name: 'Automate MB12 (B1/B2)', status: 'connected', lastUpdate: new Date().toLocaleTimeString() },
    { name: 'Automate MB35 (B3/B5)', status: 'connected', lastUpdate: new Date().toLocaleTimeString() },
    { name: 'Automate MB67 (B6/B7)', status: 'connected', lastUpdate: new Date().toLocaleTimeString() },
    { name: 'Automate Liquide', status: 'connected', lastUpdate: new Date().toLocaleTimeString() },
    { name: 'Automate Poudre', status: 'disconnected', lastUpdate: '--' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Maintenance</h1>
      </div>

      {/* État des communications automates */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">État des communications automates</h2>
        <div className="space-y-3">
          {automationStatus.map((automate, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {automate.status === 'connected' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <div className="font-medium">{automate.name}</div>
                  <div className="text-sm text-gray-500">
                    Dernière mise à jour: {automate.lastUpdate}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {automate.status === 'connected' ? (
                  <>
                    <Wifi className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Connecté</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-600">Déconnecté</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Consommation totale des produits */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Consommation totale des produits</h2>
          <button
            onClick={handleResetConsumption}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <RotateCcw className="w-4 h-4" />
            Reset consommation
          </button>
        </div>

        {/* Affichage de la consommation totale */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Consommation totale</div>
              <div className="text-3xl font-bold text-gray-900">
                {totalConsumption.toFixed(2)} {inventory[0]?.unit || 'Kg'}
              </div>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        {/* Détails par produit */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left">Produit</th>
                <th className="border p-3 text-left">Capacité max</th>
                <th className="border p-3 text-left">Stock actuel</th>
                <th className="border p-3 text-left">Consommé</th>
                <th className="border p-3 text-left">Pourcentage</th>
                <th className="border p-3 text-left">Statut</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((product) => {
                const consumed = product.maxCapacity - product.currentQuantity;
                const percentage = product.maxCapacity > 0 
                  ? (consumed / product.maxCapacity) * 100 
                  : 0;

                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="border p-3 font-medium">{product.productName}</td>
                    <td className="border p-3">
                      {product.maxCapacity.toFixed(2)} {product.unit}
                    </td>
                    <td className="border p-3">
                      {product.currentQuantity.toFixed(2)} {product.unit}
                    </td>
                    <td className="border p-3 font-medium">
                      {consumed.toFixed(2)} {product.unit}
                    </td>
                    <td className="border p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="border p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        product.status === 'Critique' ? 'bg-red-100 text-red-800' :
                        product.status === 'Bas' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Informations système */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Malaxeurs en production</div>
          <div className="text-2xl font-bold">
            {mixers.filter(m => m.status === 'Production').length} / {mixers.length}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Total produits</div>
          <div className="text-2xl font-bold">{inventory.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Taux de connexion</div>
          <div className="text-2xl font-bold">
            {Math.round((automationStatus.filter(a => a.status === 'connected').length / automationStatus.length) * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}

