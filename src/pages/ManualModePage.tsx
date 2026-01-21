import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useMixers } from '../hooks/useMixers';
import { mixersAPI } from '../services/api';
import MixerVisual from '../components/MixerVisual';
import { Droplet, Power, Thermometer, Gauge, RotateCcw, X } from 'lucide-react';

export default function ManualModePage() {
  const { isAdmin } = useAuth();
  const { mixers } = useMixers();
  const [selectedMixerId1, setSelectedMixerId1] = useState<number | null>(null);
  const [selectedMixerId2, setSelectedMixerId2] = useState<number | null>(null);
  const [dosagePopup, setDosagePopup] = useState<{ 
    open: boolean; 
    mixerId: number | null;
    product: string | null;
    value?: string 
  }>({ open: false, mixerId: null, product: null });
  const [dosageValue, setDosageValue] = useState<string>('');

  // Rediriger si pas admin
  if (!isAdmin()) {
    return <Navigate to="/alarms" replace />;
  }

  // Initialiser avec les deux premiers malaxeurs disponibles
  useEffect(() => {
    if (mixers.length > 0) {
      if (!selectedMixerId1) {
        setSelectedMixerId1(mixers[0].id);
      }
      if (!selectedMixerId2 && mixers.length > 1) {
        setSelectedMixerId2(mixers[1].id);
      }
    }
  }, [mixers, selectedMixerId1, selectedMixerId2]);

  const selectedMixer1 = mixers.find(m => m.id === selectedMixerId1);
  const selectedMixer2 = mixers.find(m => m.id === selectedMixerId2);

  const products = [
    { name: 'D10', label: 'Napvis D10' },
    { name: 'D200', label: 'Napvis D200' },
    { name: 'Huile', label: 'Huile HM' },
    { name: 'Poudres', label: 'Hydrocarb' },
  ];

  const handleDosageClick = (mixerId: number, product: string) => {
    setDosagePopup({ open: true, mixerId, product });
    setDosageValue('');
  };

  const handleDosageSubmit = () => {
    if (!dosageValue || isNaN(parseFloat(dosageValue))) {
      alert('Veuillez entrer une valeur numérique valide');
      return;
    }
    const mixer = mixers.find(m => m.id === dosagePopup.mixerId);
    alert(`Dosage de ${dosageValue} Kg de ${dosagePopup.product} demandé pour le malaxeur ${mixer?.name}`);
    setDosagePopup({ open: false, mixerId: null, product: null });
    setDosageValue('');
  };

  const closeDosagePopup = () => {
    setDosagePopup({ open: false, mixerId: null, product: null });
    setDosageValue('');
  };

  const renderMixerControls = (mixer: any, mixerNumber: number) => {
    const selectedMixerId = mixerNumber === 1 ? selectedMixerId1 : selectedMixerId2;
    const setSelectedMixerId = mixerNumber === 1 ? setSelectedMixerId1 : setSelectedMixerId2;

    return (
      <div className="space-y-6">
        {/* Sélection du malaxeur */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionner un malaxeur {mixerNumber === 1 ? '(Gauche)' : '(Droite)'}
          </label>
          <select
            value={selectedMixerId || ''}
            onChange={(e) => setSelectedMixerId(parseInt(e.target.value))}
            className="w-full border rounded-md px-3 py-2"
          >
            <option value="">-- Sélectionner --</option>
            {mixers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {mixer && (
          <>
            {/* Vue du malaxeur */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">{mixer.name}</h2>
              <MixerVisual mixer={mixer} size="medium" />
              <div className="mt-4">
                <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                  mixer.status === 'Production' ? 'bg-green-100 text-green-800' :
                  mixer.status === 'Pause' ? 'bg-yellow-100 text-yellow-800' :
                  mixer.status === 'Alarme' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {mixer.status}
                </span>
              </div>
            </div>

            {/* Données temps réel */}
            <div className="card space-y-4">
              <h2 className="text-xl font-semibold">Données temps réel</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Thermometer className="w-4 h-4" />
                    Température
                  </div>
                  <div className="text-2xl font-bold">{mixer.temperature.toFixed(1)}°C</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Gauge className="w-4 h-4" />
                    Pression
                  </div>
                  <div className="text-2xl font-bold">{mixer.pressure.toFixed(1)} bar</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <RotateCcw className="w-4 h-4" />
                    Vitesse
                  </div>
                  <div className="text-2xl font-bold">{mixer.speed} tr/min</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Power className="w-4 h-4" />
                    Intensité
                  </div>
                  <div className="text-2xl font-bold">{mixer.power.toFixed(1)} A</div>
                </div>
              </div>

              {/* États des moteurs */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">État des moteurs</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm text-gray-600">Bras:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                      mixer.motorArm === 'Marche' ? 'bg-green-100 text-green-800' :
                      mixer.motorArm === 'Défaut' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {mixer.motorArm}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Vis:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                      mixer.motorScrew === 'Marche' ? 'bg-green-100 text-green-800' :
                      mixer.motorScrew === 'Défaut' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {mixer.motorScrew}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons de dosage par produit */}
            <div className="card space-y-3">
              <h2 className="text-xl font-semibold">Dosages manuels</h2>
              {products.map((product) => (
                <div key={product.name} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">{product.label}</span>
                    <span className="text-sm text-gray-500">Poids: - / - Kg</span>
                  </div>
                  <button
                    onClick={() => handleDosageClick(mixer.id, product.name)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Droplet className="w-4 h-4" />
                    Dosage {product.label}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Mode Manuel</h1>
      </div>

      {/* Deux malaxeurs côte à côte */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderMixerControls(selectedMixer1, 1)}
        {renderMixerControls(selectedMixer2, 2)}
      </div>

      {/* Popup de dosage */}
      {dosagePopup.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Dosage manuel</h3>
              <button
                onClick={closeDosagePopup}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-2">
              <p className="text-sm text-gray-600">
                Malaxeur: {mixers.find(m => m.id === dosagePopup.mixerId)?.name}
              </p>
              <p className="text-sm text-gray-600">
                Produit: {dosagePopup.product}
              </p>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valeur à doser (Kg)
            </label>
            <input
              type="number"
              value={dosageValue}
              onChange={(e) => setDosageValue(e.target.value)}
              placeholder="Entrer la valeur"
              className="w-full border rounded-md px-3 py-2 mb-4"
              step="0.1"
              min="0"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={closeDosagePopup}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={handleDosageSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
