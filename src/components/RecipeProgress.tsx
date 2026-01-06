import { Recipe, Mixer } from '../types';
import { CheckCircle2, Clock, Circle } from 'lucide-react';
import { cn } from '../utils/cn';

interface RecipeProgressProps {
  recipe: Recipe;
  mixer: Mixer;
}

export default function RecipeProgress({ recipe, mixer }: RecipeProgressProps) {
  const currentStepIndex = (mixer.currentStep || 1) - 1;
  const currentStep = recipe.steps[currentStepIndex];
  
  // Calcul des totaux
  const totalSteps = recipe.steps.length;
  const completedSteps = currentStepIndex;
  const totalWeightToDose = recipe.steps.reduce((sum, step) => sum + (step.weight || 0), 0);
  const totalWeightDosed = recipe.steps
    .slice(0, currentStepIndex)
    .reduce((sum, step) => sum + (step.weight || 0), 0);
  const currentStepWeightDosed = mixer.batchProgress 
    ? (currentStep?.weight || 0) * (mixer.batchProgress / 100)
    : 0;
  const totalWeightDosedWithCurrent = totalWeightDosed + currentStepWeightDosed;
  const remainingWeight = totalWeightToDose - totalWeightDosedWithCurrent;

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  const getStepProgress = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 100;
    if (stepIndex === currentStepIndex) return mixer.batchProgress || 0;
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Progression de la recette</h3>
        
        {/* Barre de progression globale */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Étapes complétées : {completedSteps} / {totalSteps}</span>
            <span>{Math.round((completedSteps / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary-600 h-3 rounded-full transition-all"
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Totaux poids */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalWeightToDose.toFixed(1)}</div>
            <div className="text-sm text-gray-600">À doser (Kg)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalWeightDosedWithCurrent.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Dosé (Kg)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{remainingWeight.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Restant (Kg)</div>
          </div>
        </div>
      </div>

      {/* Tableau détaillé des étapes */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Détail des étapes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Statut</th>
                <th className="text-left p-2">Étape</th>
                <th className="text-left p-2">Fonction</th>
                <th className="text-left p-2">Bras</th>
                <th className="text-left p-2">Vis</th>
                <th className="text-left p-2">Durée</th>
                <th className="text-left p-2">Produit</th>
                <th className="text-right p-2">À doser (Kg)</th>
                <th className="text-right p-2">Dosé (Kg)</th>
                <th className="text-left p-2">Progression</th>
              </tr>
            </thead>
            <tbody>
              {recipe.steps.map((step, index) => {
                const status = getStepStatus(index);
                const progress = getStepProgress(index);
                const stepWeightDosed = status === 'completed' 
                  ? (step.weight || 0)
                  : status === 'current'
                  ? (step.weight || 0) * (progress / 100)
                  : 0;

                return (
                  <tr
                    key={step.id}
                    className={cn(
                      'border-b hover:bg-gray-50',
                      status === 'completed' && 'bg-green-50',
                      status === 'current' && 'bg-blue-50'
                    )}
                  >
                    <td className="p-2">
                      {status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                      {status === 'current' && <Clock className="w-5 h-5 text-blue-500 animate-pulse" />}
                      {status === 'pending' && <Circle className="w-5 h-5 text-gray-400" />}
                    </td>
                    <td className="p-2 font-medium">{step.stepNumber}</td>
                    <td className="p-2">{step.function}</td>
                    <td className="p-2">{step.arm}</td>
                    <td className="p-2">{step.screw}</td>
                    <td className="p-2">{step.duration}s</td>
                    <td className="p-2">{step.product || '-'}</td>
                    <td className="p-2 text-right">{step.weight?.toFixed(1) || '-'}</td>
                    <td className="p-2 text-right">
                      {step.weight ? stepWeightDosed.toFixed(1) : '-'}
                    </td>
                    <td className="p-2">
                      {step.weight && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

