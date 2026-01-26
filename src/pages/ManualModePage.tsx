import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useMixers } from '../hooks/useMixers';
import { batchesAPI } from '../services/api';
import { Batch } from '../types';
import MixerVisual from '../components/MixerVisual';
import { Power, Thermometer, Gauge, RotateCcw } from 'lucide-react';

export default function ManualModePage() {
  const { isAdmin } = useAuth();
  const { mixers } = useMixers();
  const [selectedMixerId1, setSelectedMixerId1] = useState<number | null>(null);
  const [selectedMixerId2, setSelectedMixerId2] = useState<number | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);

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

  // Charger les batches pour obtenir les données de distribution
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const data = await batchesAPI.getAll();
        setBatches(data || []);
      } catch (error) {
        console.error('Error fetching batches:', error);
        setBatches([]);
      }
    };
    fetchBatches();
    // Rafraîchissement automatique désactivé - les données ne se rafraîchissent que manuellement
    // const interval = setInterval(fetchBatches, 2000);
    // return () => clearInterval(interval);
  }, []);

  // Rediriger si pas admin (APRÈS les hooks)
  if (!isAdmin()) {
    return <Navigate to="/alarms" replace />;
  }

  const selectedMixer1 = mixers.find(m => m.id === selectedMixerId1);
  const selectedMixer2 = mixers.find(m => m.id === selectedMixerId2);

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
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{mixer.name}</h2>
                <span className={`px-3 py-1 rounded text-sm font-semibold ${
                  mixer.status === 'Production' ? 'bg-green-100 text-green-800' :
                  mixer.status === 'Pause' ? 'bg-yellow-100 text-yellow-800' :
                  mixer.status === 'Alarme' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {mixer.status}
                </span>
              </div>
              <MixerVisual mixer={mixer} size="medium" />
            </div>

            {/* Données temps réel */}
            <div className="card space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Données temps réel</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Thermometer className="w-4 h-4" />
                    Température
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{mixer.temperature.toFixed(1)}°C</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Gauge className="w-4 h-4" />
                    Pression
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{mixer.pressure.toFixed(1)} bar</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <RotateCcw className="w-4 h-4" />
                    Vitesse
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{mixer.speed} tr/min</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Power className="w-4 h-4" />
                    Intensité
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{mixer.power.toFixed(1)} A</div>
                </div>
              </div>

              {/* États des moteurs */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">État des moteurs</h3>
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

            {/* Section DOSAGES MANUELS - Sections distinctes pour chaque produit */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center border-b pb-3">
                DOSAGES MANUELS {mixer.name.toUpperCase()}
              </h2>
              
              {(() => {
                // Récupérer le batch en cours pour ce malaxeur
                const getCurrentBatch = (mixerId: number) => {
                  return batches.find(b => b.mixerId === mixerId && (b.status === 'En cours' || b.status === 'Terminé'));
                };

                // Données de distribution (récupérées depuis batch.distribution)
                const getDistribution = (batch?: Batch) => {
                  if (!batch || !batch.distribution || batch.distribution.length === 0) {
                    return [
                      { productName: 'Hydrocarb', qteFormule: 0, qteDosee: 0, dose: 0 },
                      { productName: 'Napvis D10', qteFormule: 0, qteDosee: 0, dose: 0 },
                      { productName: 'Napvis D200', qteFormule: 0, qteDosee: 0, dose: 0 },
                      { productName: 'Huile HM', qteFormule: 0, qteDosee: 0, dose: 0 },
                    ];
                  }
                  const productOrder = ['Hydrocarb', 'Napvis D10', 'Napvis D200', 'Huile HM'];
                  const distributionMap = new Map(batch.distribution.map((d: any) => [d.productName, d]));
                  
                  return productOrder.map(productName => {
                    const existing = distributionMap.get(productName);
                    return existing || { productName, qteFormule: 0, qteDosee: 0, dose: 0 };
                  });
                };

                const batch = getCurrentBatch(mixer.id);
                const distribution = getDistribution(batch);

                const getProductData = (productName: string) => {
                  const item = distribution.find(d => {
                    if (productName === 'HYDROCARB') return d.productName === 'Hydrocarb';
                    if (productName === 'D10') return d.productName === 'Napvis D10';
                    if (productName === 'D200') return d.productName === 'Napvis D200';
                    if (productName === 'HUILE MINERALE') return d.productName === 'Huile HM';
                    return false;
                  });
                  return item || { productName, qteFormule: 0, qteDosee: 0, dose: 0 };
                };

                const formatWeight = (value: number | null | undefined) => {
                  if (value === null || value === undefined) return '0.0';
                  return value.toFixed(1);
                };

                const renderProductSection = (productName: string) => {
                  const data = getProductData(productName);
                  const csgTotal = data.qteFormule || 0;
                  const csgDose = data.dose || 0;
                  const poidsDose = data.qteDosee || 0;
                  const poidsRest = Math.max(0, csgTotal - poidsDose);
                  const poidsBascule = 0; // À récupérer depuis l'API si disponible

                  return (
                    <div key={productName} className="border-b pb-4 mb-4 last:border-b-0 last:mb-0">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">DISTRIBUTION {productName}</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {/* Colonne gauche : Poids */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-700">Csg Total :</span>
                            <span className="text-gray-900 font-medium">{formatWeight(csgTotal)} kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Csg Dose :</span>
                            <span className="text-gray-900 font-medium">{formatWeight(csgDose)} kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Poids Dosé:</span>
                            <span className="text-gray-900 font-medium">{formatWeight(poidsDose)} kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Poids Rest:</span>
                            <span className="text-gray-900 font-medium">{formatWeight(poidsRest)} kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Poids Bascule:</span>
                            <span className="text-gray-900 font-medium">{formatWeight(poidsBascule)} kg</span>
                          </div>
                        </div>

                        {/* Colonne droite : Boutons */}
                        <div className="flex flex-col justify-start">
                          <div className="grid grid-cols-2 gap-2">
                            <button className="px-3 py-2 bg-primary-600 text-white rounded text-sm font-medium hover:bg-primary-700">
                              DOSAGE
                            </button>
                            <button className="px-3 py-2 bg-primary-600 text-white rounded text-sm font-medium hover:bg-primary-700">
                              REMPLISSAGE
                            </button>
                            <button className="px-3 py-2 bg-primary-600 text-white rounded text-sm font-medium hover:bg-primary-700">
                              INITIALISATION
                            </button>
                            <button className="px-3 py-2 bg-gray-500 text-white rounded text-sm font-medium hover:bg-gray-600">
                              AUTO
                            </button>
                            <button className="px-3 py-2 bg-gray-500 text-white rounded text-sm font-medium hover:bg-gray-600 col-span-2">
                              MANU
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                };

                return (
                  <div className="space-y-4">
                    {renderProductSection('HYDROCARB')}
                    {renderProductSection('D10')}
                    {renderProductSection('D200')}
                    {renderProductSection('HUILE MINERALE')}
                  </div>
                );
              })()}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ fontSize: 'clamp(12px, 1.2vw, 16px)' }}>
        {renderMixerControls(selectedMixer1, 1)}
        {renderMixerControls(selectedMixer2, 2)}
      </div>

    </div>
  );
}
