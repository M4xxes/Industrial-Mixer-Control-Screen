import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { mockMixers, mockRecipes } from '../data/mockData';
import MixerVisual from '../components/MixerVisual';
import RecipeProgress from '../components/RecipeProgress';
import BatchHistoryDialog from '../components/BatchHistoryDialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MixerDetail() {
  const { id } = useParams<{ id: string }>();
  const mixerId = parseInt(id || '1');
  const mixer = mockMixers.find(m => m.id === mixerId) || mockMixers[0];
  const [activeTab, setActiveTab] = useState<'overview' | 'recipe' | 'history'>('overview');
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);

  // Données simulées pour les graphiques
  const metricsData = Array.from({ length: 20 }, (_, i) => ({
    time: `${i * 5}min`,
    temperature: 70 + Math.sin(i * 0.5) * 10 + Math.random() * 5,
    speed: 40 + Math.sin(i * 0.3) * 8 + Math.random() * 3,
    power: 10 + Math.sin(i * 0.4) * 4 + Math.random() * 2,
  }));

  // Historique simulé
  const batchHistory = [
    { id: '1', batchNumber: 'BATCH-2024-001', recipeName: mixer.recipe?.name || 'Recette A', startedAt: new Date(Date.now() - 86400000).toISOString(), status: 'Succès' as const },
    { id: '2', batchNumber: 'BATCH-2024-002', recipeName: mixer.recipe?.name || 'Recette A', startedAt: new Date(Date.now() - 172800000).toISOString(), status: 'Alerte' as const },
    { id: '3', batchNumber: 'BATCH-2024-003', recipeName: mixer.recipe?.name || 'Recette A', startedAt: new Date(Date.now() - 259200000).toISOString(), status: 'Succès' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{mixer.name}</h1>
      </div>

      {/* Onglets */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Vue d\'ensemble' },
            { id: 'recipe', label: 'Recette actuelle' },
            { id: 'history', label: 'Historique' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image du malaxeur */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Vue du malaxeur</h2>
              <MixerVisual mixer={mixer} size="medium" />
            </div>

            {/* Informations principales */}
            <div className="card space-y-4">
              <h2 className="text-lg font-semibold">Informations principales</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Statut</div>
                  <div className={`text-lg font-semibold ${
                    mixer.status === 'Marche' ? 'text-green-600' :
                    mixer.status === 'Erreur' ? 'text-red-600' :
                    mixer.status === 'Maintenance' ? 'text-orange-600' :
                    'text-gray-600'
                  }`}>
                    {mixer.status}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Recette</div>
                  <div className="text-lg font-semibold">{mixer.recipe?.name || 'Aucune'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Étape actuelle</div>
                  <div className="text-lg font-semibold">
                    {mixer.currentStep ? `${mixer.currentStep}/${mixer.recipe?.steps.length || 0}` : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Progression</div>
                  <div className="text-lg font-semibold">{mixer.progress || 0}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Température</div>
                  <div className="text-lg font-semibold">{mixer.temperature.toFixed(1)}°C</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Pression</div>
                  <div className="text-lg font-semibold">{mixer.pressure.toFixed(1)} bar</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Vitesse</div>
                  <div className="text-lg font-semibold">{mixer.speed} tr/min</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Puissance</div>
                  <div className="text-lg font-semibold">{mixer.power.toFixed(1)} kW</div>
                </div>
              </div>
            </div>
          </div>

          {/* Graphiques temps réel */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Graphiques temps réel</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="temperature" stroke="#ef4444" name="Température (°C)" />
                <Line type="monotone" dataKey="speed" stroke="#3b82f6" name="Vitesse (tr/min)" />
                <Line type="monotone" dataKey="power" stroke="#10b981" name="Puissance (kW)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'recipe' && mixer.recipe && (
        <RecipeProgress recipe={mixer.recipe} mixer={mixer} />
      )}

      {activeTab === 'history' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Historique des lots</h2>
          <div className="space-y-2">
            {batchHistory.map((batch) => (
              <div
                key={batch.id}
                className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedBatch(batch.id)}
              >
                <div>
                  <div className="font-medium">{batch.batchNumber}</div>
                  <div className="text-sm text-gray-600">{batch.recipeName}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(batch.startedAt).toLocaleString('fr-FR')}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  batch.status === 'Succès' ? 'bg-green-100 text-green-800' :
                  batch.status === 'Alerte' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {batch.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedBatch && (
        <BatchHistoryDialog
          batchId={selectedBatch}
          onClose={() => setSelectedBatch(null)}
        />
      )}
    </div>
  );
}

