import { useState, useEffect } from 'react';
import { mockRecipes } from '../data/mockData';
import { Recipe, StepStatus } from '../types';
import { Play, Pause, SkipForward, CheckCircle2, Clock, Circle } from 'lucide-react';
import { cn } from '../utils/cn';

export default function ManualModePage() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(mockRecipes[0]);
  const [stepStatuses, setStepStatuses] = useState<Record<number, StepStatus>>({});
  const [stepTimers, setStepTimers] = useState<Record<number, number>>({});
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [isAdmin] = useState(true); // Simulé

  useEffect(() => {
    if (selectedRecipe) {
      const initialStatuses: Record<number, StepStatus> = {};
      selectedRecipe.steps.forEach(step => {
        initialStatuses[step.stepNumber] = 'En attente';
      });
      setStepStatuses(initialStatuses);
      setCurrentStep(null);
      setStepTimers({});
    }
  }, [selectedRecipe]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepTimers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(stepNum => {
          const step = selectedRecipe?.steps.find(s => s.stepNumber === parseInt(stepNum));
          if (step && stepStatuses[parseInt(stepNum)] === 'En cours') {
            updated[parseInt(stepNum)] = (updated[parseInt(stepNum)] || 0) + 1;
            if (updated[parseInt(stepNum)] >= step.duration) {
              setStepStatuses(prevStatus => ({
                ...prevStatus,
                [parseInt(stepNum)]: 'Terminée',
              }));
              setCurrentStep(null);
            }
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedRecipe, stepStatuses]);

  const handleStart = (stepNumber: number) => {
    if (!isAdmin) {
      alert('Seuls les administrateurs peuvent lancer les étapes');
      return;
    }

    // Vérifier que l'étape précédente est terminée
    if (stepNumber > 1) {
      const prevStep = stepStatuses[stepNumber - 1];
      if (prevStep !== 'Terminée') {
        alert('Vous devez terminer l\'étape précédente avant de commencer celle-ci');
        return;
      }
    }

    // Vérifier qu'aucune autre étape n'est en cours
    if (currentStep !== null) {
      alert('Une étape est déjà en cours. Veuillez la terminer ou la mettre en pause.');
      return;
    }

    setStepStatuses(prev => ({ ...prev, [stepNumber]: 'En cours' }));
    setCurrentStep(stepNumber);
    setStepTimers(prev => ({ ...prev, [stepNumber]: 0 }));
  };

  const handlePause = (stepNumber: number) => {
    if (!isAdmin) return;
    setStepStatuses(prev => ({ ...prev, [stepNumber]: 'En pause' }));
    setCurrentStep(null);
  };

  const handleResume = (stepNumber: number) => {
    if (!isAdmin) return;
    if (currentStep !== null && currentStep !== stepNumber) {
      alert('Une autre étape est en cours');
      return;
    }
    setStepStatuses(prev => ({ ...prev, [stepNumber]: 'En cours' }));
    setCurrentStep(stepNumber);
  };

  const handleSkip = (stepNumber: number) => {
    if (!isAdmin) return;
    setStepStatuses(prev => ({ ...prev, [stepNumber]: 'Terminée' }));
    setCurrentStep(null);
    setStepTimers(prev => ({ ...prev, [stepNumber]: 0 }));
  };

  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case 'Terminée':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'En cours':
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'En pause':
        return <Pause className="w-5 h-5 text-orange-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const completedSteps = Object.values(stepStatuses).filter(s => s === 'Terminée').length;
  const totalSteps = selectedRecipe?.steps.length || 0;
  const globalProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Mode Manuel</h1>
      </div>

      {/* Sélection de recette */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionner une recette
        </label>
        <select
          value={selectedRecipe?.id || ''}
          onChange={(e) => {
            const recipe = mockRecipes.find(r => r.id === e.target.value);
            setSelectedRecipe(recipe || null);
          }}
          className="w-full border rounded-md px-3 py-2"
        >
          {mockRecipes.map(recipe => (
            <option key={recipe.id} value={recipe.id}>
              {recipe.name}
            </option>
          ))}
        </select>
      </div>

      {selectedRecipe && (
        <>
          {/* Barre de progression globale */}
          <div className="card">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progression globale : {completedSteps} / {totalSteps} étapes</span>
              <span>{globalProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary-600 h-3 rounded-full transition-all"
                style={{ width: `${globalProgress}%` }}
              />
            </div>
          </div>

          {/* Tableau des étapes */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Étapes de la recette</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2">Statut</th>
                    <th className="text-left p-2">Étape</th>
                    <th className="text-left p-2">Fonction</th>
                    <th className="text-left p-2">Bras</th>
                    <th className="text-left p-2">Vis</th>
                    <th className="text-left p-2">Temps</th>
                    <th className="text-left p-2">Produit</th>
                    <th className="text-left p-2">Poids</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRecipe.steps.map((step) => {
                    const status = stepStatuses[step.stepNumber] || 'En attente';
                    const timer = stepTimers[step.stepNumber] || 0;
                    const canStart = step.stepNumber === 1 || stepStatuses[step.stepNumber - 1] === 'Terminée';
                    const isCurrent = currentStep === step.stepNumber;

                    return (
                      <tr
                        key={step.id}
                        className={cn(
                          'border-b hover:bg-gray-50',
                          status === 'Terminée' && 'bg-green-50',
                          status === 'En cours' && 'bg-blue-50'
                        )}
                      >
                        <td className="p-2">{getStepIcon(status)}</td>
                        <td className="p-2 font-medium">{step.stepNumber}</td>
                        <td className="p-2">{step.function}</td>
                        <td className="p-2">{step.arm}</td>
                        <td className="p-2">{step.screw}</td>
                        <td className="p-2">
                          {status === 'En cours' || status === 'En pause' ? (
                            <span className="font-mono">
                              {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')} / {Math.floor(step.duration / 60)}:{(step.duration % 60).toString().padStart(2, '0')}
                            </span>
                          ) : (
                            <span>{Math.floor(step.duration / 60)}:{(step.duration % 60).toString().padStart(2, '0')}</span>
                          )}
                          {status === 'En cours' && (
                            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                              <div
                                className="bg-blue-500 h-1 rounded-full transition-all"
                                style={{ width: `${(timer / step.duration) * 100}%` }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="p-2">{step.product || '-'}</td>
                        <td className="p-2">{step.weight ? `${step.weight} Kg` : '-'}</td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            {status === 'En attente' && (
                              <button
                                onClick={() => handleStart(step.stepNumber)}
                                disabled={!canStart || !isAdmin || currentStep !== null}
                                className={cn(
                                  'p-1 rounded text-white text-xs',
                                  canStart && isAdmin && currentStep === null
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-gray-400 cursor-not-allowed'
                                )}
                                title="Lancer"
                              >
                                <Play className="w-3 h-3" />
                              </button>
                            )}
                            {status === 'En cours' && (
                              <>
                                <button
                                  onClick={() => handlePause(step.stepNumber)}
                                  disabled={!isAdmin}
                                  className="p-1 rounded bg-orange-600 hover:bg-orange-700 text-white text-xs"
                                  title="Pause"
                                >
                                  <Pause className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleSkip(step.stepNumber)}
                                  disabled={!isAdmin}
                                  className="p-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                  title="Passer"
                                >
                                  <SkipForward className="w-3 h-3" />
                                </button>
                              </>
                            )}
                            {status === 'En pause' && (
                              <button
                                onClick={() => handleResume(step.stepNumber)}
                                disabled={!isAdmin || (currentStep !== null && currentStep !== step.stepNumber)}
                                className={cn(
                                  'p-1 rounded text-white text-xs',
                                  isAdmin && (currentStep === null || currentStep === step.stepNumber)
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-gray-400 cursor-not-allowed'
                                )}
                                title="Reprendre"
                              >
                                <Play className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

