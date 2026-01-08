import { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';
import { Inventory } from '../types';
import { Plus, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Inventory | null>(null);
  const [replenishAmount, setReplenishAmount] = useState('');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const data = await inventoryAPI.getAll();
        // Transformer les données de l'API pour correspondre au type Inventory
        const transformedInventory: Inventory[] = data.map((item: any) => ({
          id: item.id,
          productName: item.productName || item.product_name,
          currentQuantity: item.currentQuantity || item.current_quantity,
          maxCapacity: item.maxCapacity || item.max_capacity,
          minThreshold: item.minThreshold || item.min_threshold,
          unit: item.unit as 'Kg' | 'L',
          category: item.category,
          status: item.status as 'Normal' | 'Bas' | 'Critique',
        }));
        setInventory(transformedInventory);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const criticalCount = inventory.filter(i => i.status === 'Critique').length;
  const lowCount = inventory.filter(i => i.status === 'Bas').length;
  const totalProducts = inventory.length;
  const totalConsumption = inventory.reduce((sum, inv) => sum + (inv.maxCapacity - inv.currentQuantity), 0);

  const openReplenishDialog = (product: Inventory) => {
    setSelectedProduct(product);
    setReplenishAmount('');
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedProduct(null);
    setReplenishAmount('');
  };

  const handleReplenish = async () => {
    if (!selectedProduct || !replenishAmount) return;

    const amount = parseFloat(replenishAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    const newQuantity = Math.min(selectedProduct.currentQuantity + amount, selectedProduct.maxCapacity);
    const newStatus = newQuantity <= selectedProduct.minThreshold ? 'Critique' :
                      newQuantity <= selectedProduct.maxCapacity * 0.25 ? 'Bas' : 'Normal';

    try {
      await inventoryAPI.update(selectedProduct.id, {
        current_quantity: newQuantity,
        status: newStatus,
      });
      
      // Recharger l'inventaire
      const data = await inventoryAPI.getAll();
      const transformedInventory: Inventory[] = data.map((item: any) => ({
        id: item.id,
        productName: item.productName || item.product_name,
        currentQuantity: item.currentQuantity || item.current_quantity,
        maxCapacity: item.maxCapacity || item.max_capacity,
        minThreshold: item.minThreshold || item.min_threshold,
        unit: item.unit as 'Kg' | 'L',
        category: item.category,
        status: item.status as 'Normal' | 'Bas' | 'Critique',
      }));
      setInventory(transformedInventory);

      alert(`Stock de ${selectedProduct.productName} réapprovisionné de ${amount} ${selectedProduct.unit}`);
      closeDialog();
    } catch (error) {
      console.error('Error updating inventory:', error);
      alert('Erreur lors du réapprovisionnement');
    }
  };

  const getStatusColor = (status: Inventory['status']) => {
    switch (status) {
      case 'Critique':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Bas':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const getStatusIcon = (status: Inventory['status']) => {
    if (status === 'Critique') {
      return <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />;
    }
    return null;
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Stocks</h1>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-gray-600">Total produits</div>
          <div className="text-2xl font-bold">{totalProducts}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Niveaux critiques</div>
          <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Niveaux bas</div>
          <div className="text-2xl font-bold text-orange-600">{lowCount}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Consommation totale</div>
          <div className="text-2xl font-bold">
            {totalConsumption.toFixed(0)} {inventory[0]?.unit || 'Kg'}
          </div>
        </div>
      </div>

      {/* Liste des produits */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Produits en stock</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventory.map((product) => {
            const percentage = (product.currentQuantity / product.maxCapacity) * 100;
            const isLow = percentage <= 25;
            const isCritical = product.currentQuantity <= product.minThreshold;

            return (
              <div
                key={product.id}
                className={cn(
                  'border rounded-lg p-4 hover:shadow-md transition-shadow',
                  isCritical && 'border-red-300 bg-red-50',
                  !isCritical && isLow && 'border-orange-300 bg-orange-50'
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{product.productName}</h3>
                    <p className="text-sm text-gray-600">{product.category}</p>
                  </div>
                  {getStatusIcon(product.status)}
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quantité actuelle</span>
                    <span className="font-medium">
                      {product.currentQuantity.toFixed(1)} {product.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Capacité max</span>
                    <span className="font-medium">
                      {product.maxCapacity.toFixed(1)} {product.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Seuil minimal</span>
                    <span className="font-medium">
                      {product.minThreshold.toFixed(1)} {product.unit}
                    </span>
                  </div>

                  {/* Barre de progression */}
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={cn(
                          'h-2 rounded-full transition-all',
                          isCritical ? 'bg-red-500' :
                          isLow ? 'bg-orange-500' : 'bg-green-500'
                        )}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {percentage.toFixed(0)}% de capacité
                    </div>
                  </div>

                  {/* Badge de statut */}
                  <div className="mt-2">
                    <span className={cn('px-2 py-1 rounded text-xs font-medium border', getStatusColor(product.status))}>
                      {product.status}
                    </span>
                  </div>

                  {/* Bouton réapprovisionnement */}
                  <button
                    onClick={() => openReplenishDialog(product)}
                    className="w-full mt-2 btn-primary text-sm"
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    Réapprovisionner
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dialogue de réapprovisionnement */}
      {isDialogOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              Réapprovisionner {selectedProduct.productName}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité à ajouter ({selectedProduct.unit})
                </label>
                <input
                  type="number"
                  value={replenishAmount}
                  onChange={(e) => setReplenishAmount(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="0"
                  min="0"
                  max={selectedProduct.maxCapacity - selectedProduct.currentQuantity}
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Capacité disponible : {(selectedProduct.maxCapacity - selectedProduct.currentQuantity).toFixed(1)} {selectedProduct.unit}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quantité actuelle</span>
                  <span className="font-medium">
                    {selectedProduct.currentQuantity.toFixed(1)} {selectedProduct.unit}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Nouvelle quantité</span>
                  <span className="font-medium">
                    {replenishAmount
                      ? Math.min(selectedProduct.currentQuantity + parseFloat(replenishAmount) || 0, selectedProduct.maxCapacity).toFixed(1)
                      : selectedProduct.currentQuantity.toFixed(1)} {selectedProduct.unit}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button onClick={closeDialog} className="btn-secondary">
                Annuler
              </button>
              <button onClick={handleReplenish} className="btn-primary">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

