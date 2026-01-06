import { useState } from 'react';
import BatchHistoryDialog from '../components/BatchHistoryDialog';
import { BatchStatus } from '../types';
import { Download } from 'lucide-react';

export default function HistoryPage() {
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    mixer: 'all',
    recipe: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  });

  // Données simulées
  const batchHistory = [
    {
      id: '1',
      batchNumber: 'BATCH-2024-001',
      mixerId: 1,
      recipeName: 'Recette A - Standard',
      startedAt: new Date(Date.now() - 86400000).toISOString(),
      completedAt: new Date(Date.now() - 82800000).toISOString(),
      status: 'Succès' as BatchStatus,
      operatorId: 'op1',
    },
    {
      id: '2',
      batchNumber: 'BATCH-2024-002',
      mixerId: 2,
      recipeName: 'Recette B - Rapide',
      startedAt: new Date(Date.now() - 172800000).toISOString(),
      completedAt: new Date(Date.now() - 169200000).toISOString(),
      status: 'Alerte' as BatchStatus,
      operatorId: 'op2',
    },
    {
      id: '3',
      batchNumber: 'BATCH-2024-003',
      mixerId: 3,
      recipeName: 'Recette C - Précision',
      startedAt: new Date(Date.now() - 259200000).toISOString(),
      completedAt: new Date(Date.now() - 255600000).toISOString(),
      status: 'Succès' as BatchStatus,
      operatorId: 'op1',
    },
    {
      id: '4',
      batchNumber: 'BATCH-2024-004',
      mixerId: 1,
      recipeName: 'Recette A - Standard',
      startedAt: new Date(Date.now() - 345600000).toISOString(),
      completedAt: new Date(Date.now() - 342000000).toISOString(),
      status: 'Erreur' as BatchStatus,
      operatorId: 'op3',
    },
    {
      id: '5',
      batchNumber: 'BATCH-2024-005',
      mixerId: 4,
      recipeName: 'Recette B - Rapide',
      startedAt: new Date(Date.now() - 432000000).toISOString(),
      completedAt: new Date(Date.now() - 428400000).toISOString(),
      status: 'Succès' as BatchStatus,
      operatorId: 'op2',
    },
  ];

  const filteredBatches = batchHistory.filter(batch => {
    if (filters.mixer !== 'all' && batch.mixerId !== parseInt(filters.mixer)) return false;
    if (filters.recipe !== 'all' && batch.recipeName !== filters.recipe) return false;
    if (filters.status !== 'all' && batch.status !== filters.status) return false;
    if (filters.dateFrom && new Date(batch.startedAt) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(batch.startedAt) > new Date(filters.dateTo)) return false;
    return true;
  });

  const getStatusColor = (status: BatchStatus) => {
    switch (status) {
      case 'Succès':
        return 'bg-green-100 text-green-800';
      case 'Alerte':
        return 'bg-orange-100 text-orange-800';
      case 'Erreur':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExport = () => {
    // Simulation d'export CSV
    const csv = [
      ['Numéro de lot', 'Malaxeur', 'Recette', 'Date début', 'Date fin', 'Statut', 'Opérateur'],
      ...filteredBatches.map(b => [
        b.batchNumber,
        `B${b.mixerId}`,
        b.recipeName,
        new Date(b.startedAt).toLocaleString('fr-FR'),
        b.completedAt ? new Date(b.completedAt).toLocaleString('fr-FR') : '',
        b.status,
        b.operatorId || '',
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const uniqueRecipes = Array.from(new Set(batchHistory.map(b => b.recipeName)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Historique des Cycles</h1>
        <button onClick={handleExport} className="btn-primary">
          <Download className="w-4 h-4 inline mr-2" />
          Exporter en CSV
        </button>
      </div>

      {/* Filtres */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Filtres de recherche</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Malaxeur
            </label>
            <select
              value={filters.mixer}
              onChange={(e) => setFilters({ ...filters, mixer: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="all">Tous</option>
              {[1, 2, 3, 4, 5, 6, 7].map(id => (
                <option key={id} value={id.toString()}>Malaxeur B{id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recette
            </label>
            <select
              value={filters.recipe}
              onChange={(e) => setFilters({ ...filters, recipe: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="all">Toutes</option>
              {uniqueRecipes.map(recipe => (
                <option key={recipe} value={recipe}>{recipe}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="all">Tous</option>
              <option value="Succès">Succès</option>
              <option value="Alerte">Alerte</option>
              <option value="Erreur">Erreur</option>
              <option value="Terminé">Terminé</option>
              <option value="Interrompu">Interrompu</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date début
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date fin
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Liste des cycles */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">
          Cycles de production ({filteredBatches.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2">Numéro de lot</th>
                <th className="text-left p-2">Malaxeur</th>
                <th className="text-left p-2">Recette</th>
                <th className="text-left p-2">Date début</th>
                <th className="text-left p-2">Date fin</th>
                <th className="text-left p-2">Durée</th>
                <th className="text-left p-2">Statut</th>
                <th className="text-left p-2">Opérateur</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-gray-500">
                    Aucun cycle trouvé
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const duration = batch.completedAt && batch.startedAt
                    ? Math.round((new Date(batch.completedAt).getTime() - new Date(batch.startedAt).getTime()) / 60000)
                    : null;

                  return (
                    <tr key={batch.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{batch.batchNumber}</td>
                      <td className="p-2">Malaxeur B{batch.mixerId}</td>
                      <td className="p-2">{batch.recipeName}</td>
                      <td className="p-2">
                        {new Date(batch.startedAt).toLocaleString('fr-FR')}
                      </td>
                      <td className="p-2">
                        {batch.completedAt ? new Date(batch.completedAt).toLocaleString('fr-FR') : '-'}
                      </td>
                      <td className="p-2">
                        {duration !== null ? `${duration} min` : '-'}
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(batch.status)}`}>
                          {batch.status}
                        </span>
                      </td>
                      <td className="p-2">{batch.operatorId || '-'}</td>
                      <td className="p-2">
                        <button
                          onClick={() => setSelectedBatch(batch.id)}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          Voir détails
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBatch && (
        <BatchHistoryDialog
          batchId={selectedBatch}
          onClose={() => setSelectedBatch(null)}
        />
      )}
    </div>
  );
}

