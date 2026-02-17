import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Scale, Plus, Save } from 'lucide-react';
import { manualWeightsAPI } from '../services/api';

interface ManualWeightEntry {
  id: string;
  productName: string;
  weight: number;
  timestamp: string;
  sequence: number; // Pesage en plusieurs fois : numéro de la pesée
}

export default function BalanceManuelPage() {
  const { isAdmin } = useAuth();
  const [productName, setProductName] = useState('');
  const [weight, setWeight] = useState('');
  const [entries, setEntries] = useState<ManualWeightEntry[]>([]);
  const [sequenceByProduct, setSequenceByProduct] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!isAdmin()) {
    return <Navigate to="/alarms" replace />;
  }

  const handleAddWeight = () => {
    const w = parseFloat(weight);
    if (!productName.trim() || isNaN(w) || w <= 0) {
      alert('Saisir un produit et un poids valide.');
      return;
    }
    const seq = (sequenceByProduct[productName] ?? 0) + 1;
    setSequenceByProduct((prev) => ({ ...prev, [productName]: seq }));
    setEntries((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        productName: productName.trim(),
        weight: w,
        timestamp: new Date().toISOString(),
        sequence: seq,
      },
    ]);
    setWeight('');
  };

  const handleSave = async () => {
    if (entries.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      await manualWeightsAPI.save(
        entries.map((e) => ({ productName: e.productName, weight: e.weight, sequence: e.sequence }))
      );
      setEntries([]);
      setSequenceByProduct({});
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const totalByProduct = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.productName] = (acc[e.productName] ?? 0) + e.weight;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Scale className="w-8 h-8" />
          Balance manuel
        </h1>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Pesage manuel des produits</h2>
        <p className="text-sm text-gray-600 mb-4">
          Saisir les poids manuels. Prévoir le pesage en plusieurs fois : ajoutez une pesée à chaque fois, le total par produit est calculé automatiquement.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Produit</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ex: D10, D200, Huile..."
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Poids (kg)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddWeight}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              <Plus className="w-4 h-4" />
              Ajouter la pesée
            </button>
          </div>
        </div>
        {saveError && (
          <p className="text-red-600 text-sm mb-2">{saveError}</p>
        )}
        <button
          onClick={handleSave}
          disabled={entries.length === 0 || saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Enregistrement…' : 'Enregistrer les poids'}
        </button>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Totaux par produit</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          {Object.entries(totalByProduct).map(([name, total]) => (
            <div key={name} className="px-4 py-2 bg-gray-100 rounded-lg">
              <span className="text-sm text-gray-600">{name}</span>
              <span className="ml-2 font-bold">{total.toFixed(2)} kg</span>
            </div>
          ))}
          {Object.keys(totalByProduct).length === 0 && (
            <span className="text-gray-500 text-sm">Aucune pesée ajoutée</span>
          )}
        </div>

        <h3 className="font-semibold mb-2">Historique des pesées (en plusieurs fois)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2">Produit</th>
                <th className="text-right p-2">Poids (kg)</th>
                <th className="text-left p-2">N° pesée</th>
                <th className="text-left p-2">Date et heure</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    Aucune pesée. Ajoutez des pesées ci-dessus.
                  </td>
                </tr>
              ) : (
                [...entries].reverse().map((e) => (
                  <tr key={e.id} className="border-b">
                    <td className="p-2 font-medium">{e.productName}</td>
                    <td className="p-2 text-right">{e.weight.toFixed(2)}</td>
                    <td className="p-2">{e.sequence}</td>
                    <td className="p-2 text-gray-600">{new Date(e.timestamp).toLocaleString('fr-FR')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
