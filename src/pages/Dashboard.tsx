import { Link } from 'react-router-dom';
import { mockMixers, mockInventory, mockAlarms } from '../data/mockData';
import MixerVisual from '../components/MixerVisual';
import { Package, AlertTriangle, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const activeMixers = mockMixers.filter(m => m.status === 'Marche').length;
  const criticalAlarms = mockAlarms.filter(a => a.level === 'Critique' && a.status === 'Active').length;
  const criticalInventory = mockInventory.filter(i => i.status === 'Critique').length;
  const lowInventory = mockInventory.filter(i => i.status === 'Bas').length;
  const totalInventory = mockInventory.length;
  const totalConsumption = mockInventory.reduce((sum, inv) => sum + (inv.maxCapacity - inv.currentQuantity), 0);

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
                {totalConsumption.toFixed(0)} {mockInventory[0]?.unit || 'Kg'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grille des malaxeurs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Malaxeurs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockMixers.map((mixer) => (
            <Link
              key={mixer.id}
              to={`/mixer/${mixer.id}`}
              className="card hover:shadow-lg transition-shadow"
            >
              <MixerVisual mixer={mixer} size="small" />
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Température</span>
                  <span className="font-medium">{mixer.temperature.toFixed(1)}°C</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pression</span>
                  <span className="font-medium">{mixer.pressure.toFixed(1)} bar</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Vitesse</span>
                  <span className="font-medium">{mixer.speed} tr/min</span>
                </div>
                {mixer.recipe && (
                  <div className="pt-2 border-t">
                    <div className="text-sm text-gray-600">
                      {mixer.recipe.name} - {mixer.progress}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${mixer.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

