import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useMixers } from '../hooks/useMixers';
import { mixersAPI } from '../services/api';
import MixerVisual from '../components/MixerVisual';
import { Droplet, Power, Thermometer, Gauge, RotateCcw } from 'lucide-react';

export default function ManualModePage() {
  const { isAdmin } = useAuth();
  const { mixers } = useMixers();
  const [selectedMixerId, setSelectedMixerId] = useState<number | null>(null);
  const [dosagePopup, setDosagePopup] = useState<{ open: boolean; value?: string }>({ open: false });
  const [dosageValue, setDosageValue] = useState<string>('');

  // Rediriger si pas admin
  if (!isAdmin()) {
    return <Navigate to="/alarms" replace />;
  }

  // Initialiser avec le premier malaxeur disponible
  useEffect(() => {
    if (!selectedMixerId && mixers.length > 0) {
      setSelectedMixerId(mixers[0].id);
    }
  }, [mixers, selectedMixerId]);

  const selectedMixer = mixers.find(m => m.id === selectedMixerId);

  const handleDosageClick = () => {
    setDosagePopup({ open: true });
    setDosageValue('');
  };

  const handleDosageSubmit = () => {
    if (!dosageValue || isNaN(parseFloat(dosageValue))) {
      alert('Veuillez entrer une valeur numérique valide');
      return;
    }
    // Ici, vous pouvez appeler l'API pour déclencher le dosage
    alert(`Dosage de ${dosageValue} Kg demandé pour le malaxeur ${selectedMixer?.name}`);
    setDosagePopup({ open: false });
    setDosageValue('');
  };

  if (!selectedMixer && mixers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Mode Manuel</h1>
        </div>
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionner un malaxeur
          </label>
          <select
            value={selectedMixerId || ''}
            onChange={(e) => setSelectedMixerId(parseInt(e.target.value))}
            className="w-full border rounded-md px-3 py-2"
          >
            <option value="">-- Sélectionner --</option>
            {mixers.map((mixer) => (
              <option key={mixer.id} value={mixer.id}>
                {mixer.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Mode Manuel</h1>
      </div>

      {/* Sélection du malaxeur */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionner un malaxeur
        </label>
        <select
          value={selectedMixerId || ''}
          onChange={(e) => setSelectedMixerId(parseInt(e.target.value))}
          className="w-full border rounded-md px-3 py-2"
        >
          {mixers.map((mixer) => (
            <option key={mixer.id} value={mixer.id}>
              {mixer.name}
            </option>
          ))}
        </select>
      </div>

      {/* Affichage du malaxeur sélectionné */}
      {selectedMixer && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vue du malaxeur */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">{selectedMixer.name}</h2>
            <MixerVisual mixer={selectedMixer} size="medium" />
            <div className="mt-4 space-y-2">
              <div className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                selectedMixer.status === 'Production' ? 'bg-green-100 text-green-800' :
                selectedMixer.status === 'Pause' ? 'bg-yellow-100 text-yellow-800' :
                selectedMixer.status === 'Alarme' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {selectedMixer.status}
              </div>
            </div>
          </div>

          {/* Données et contrôles */}
          <div className="card space-y-4">
            <h2 className="text-xl font-semibold">Données temps réel</h2>
            
            {/* Données principales */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Thermometer className="w-4 h-4" />
                  Température
                </div>
                <div className="text-2xl font-bold">{selectedMixer.temperature.toFixed(1)}°C</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Gauge className="w-4 h-4" />
                  Pression
                </div>
                <div className="text-2xl font-bold">{selectedMixer.pressure.toFixed(1)} bar</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <RotateCcw className="w-4 h-4" />
                  Vitesse
                </div>
                <div className="text-2xl font-bold">{selectedMixer.speed} tr/min</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Power className="w-4 h-4" />
                  Intensité
                </div>
                <div className="text-2xl font-bold">{selectedMixer.power.toFixed(1)} A</div>
              </div>
            </div>

            {/* États des moteurs */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">État des moteurs</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-sm text-gray-600">Bras:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                    selectedMixer.motorArm === 'Marche' ? 'bg-green-100 text-green-800' :
                    selectedMixer.motorArm === 'Défaut' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedMixer.motorArm}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Vis:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                    selectedMixer.motorScrew === 'Marche' ? 'bg-green-100 text-green-800' :
                    selectedMixer.motorScrew === 'Défaut' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedMixer.motorScrew}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-gray-600">Refroidissement:</span>
                  <span className="ml-2 px-2 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
                    ON
                  </span>
                </div>
              </div>
            </div>

            {/* Dosages */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Dosages</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">D10:</span>
                  <span className="font-medium">- / -</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">D200:</span>
                  <span className="font-medium">- / -</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Huile:</span>
                  <span className="font-medium">- / -</span>
                </div>
              </div>
            </div>

            {/* Boutons de commande */}
            <div className="border-t pt-4 space-y-2">
              <button
                onClick={handleDosageClick}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Droplet className="w-5 h-5" />
                Dosage
              </button>
              {/* Les autres boutons selon le cahier des charges */}
              <div className="grid grid-cols-2 gap-2">
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                  Bouton 1
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                  Bouton 2
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup de dosage */}
      {dosagePopup.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Dosage manuel</h3>
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
                onClick={() => setDosagePopup({ open: false })}
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
