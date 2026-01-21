import { useState } from 'react';
import { X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Batch, BatchStep } from '../types';

interface BatchHistoryDialogProps {
  batchId: string;
  onClose: () => void;
}

export default function BatchHistoryDialog({ batchId, onClose }: BatchHistoryDialogProps) {
  // const [activeTab, setActiveTab] = useState<'steps' | 'charts'>('steps'); // Graphiques masqués

  // Données simulées
  const batch: Batch = {
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

  const avgTemperature = batch.metrics?.reduce((sum, m) => sum + m.temperature, 0) / (batch.metrics?.length || 1);
  const maxTemperature = Math.max(...(batch.metrics?.map(m => m.temperature) || [0]));
  const avgSpeed = batch.metrics?.reduce((sum, m) => sum + m.speed, 0) / (batch.metrics?.length || 1);
  const avgPower = batch.metrics?.reduce((sum, m) => sum + m.power, 0) / (batch.metrics?.length || 1);
  const plannedDuration = batch.steps.reduce((sum, s) => sum + s.plannedDuration, 0);
  const actualDuration = batch.completedAt && batch.startedAt
    ? (new Date(batch.completedAt).getTime() - new Date(batch.startedAt).getTime()) / 1000
    : plannedDuration;

  const totalPlannedWeight = batch.steps.reduce((sum, s) => sum + (s.plannedWeight || 0), 0);
  const totalActualWeight = batch.steps.reduce((sum, s) => sum + (s.actualWeight || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl max-h-[95vh] w-full overflow-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">{batch.batchNumber}</h2>
            <p className="text-sm text-gray-600">{batch.recipeName}</p>
            <p className="text-sm text-gray-500">
              {new Date(batch.startedAt).toLocaleString('fr-FR')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              batch.status === 'Succès' ? 'bg-green-100 text-green-800' :
              batch.status === 'Alerte' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {batch.status}
            </span>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Résumé des performances */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                      <th className="text-right p-2">Poids prévu (Kg)</th>
                      <th className="text-right p-2">Poids dosé (Kg)</th>
                      <th className="text-right p-2">Écart (%)</th>
                      <th className="text-right p-2">Durée prévue (s)</th>
                      <th className="text-right p-2">Durée réelle (s)</th>
                      <th className="text-left p-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batch.steps.map((step) => (
                      <tr key={step.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{step.stepNumber}</td>
                        <td className="p-2 text-right">{step.plannedWeight?.toFixed(1) || '-'}</td>
                        <td className="p-2 text-right">{step.actualWeight?.toFixed(1) || '-'}</td>
                        <td className="p-2 text-right">
                          {step.deviationPercent !== undefined
                            ? `${step.deviationPercent > 0 ? '+' : ''}${step.deviationPercent.toFixed(1)}%`
                            : '-'}
                        </td>
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
                    ))}
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

