import { describe, it, expect } from 'vitest';
import { getStepStatus, getStepProgress, calculateTotalWeightDosed } from '../recipeSteps';

describe('recipeSteps — transitions de la machine d\'états recette', () => {
  it('classe chaque étape en completed / current / pending selon sa position', () => {
    const currentStepIndex = 2;
    expect(getStepStatus(0, currentStepIndex)).toBe('completed');
    expect(getStepStatus(1, currentStepIndex)).toBe('completed');
    expect(getStepStatus(2, currentStepIndex)).toBe('current');
    expect(getStepStatus(3, currentStepIndex)).toBe('pending');
  });

  it('calcule la progression de l\'étape courante et le poids total dosé', () => {
    const steps = [
      { weight: 5 },
      { weight: 3 },
      { weight: 10 },
      { weight: 2 },
    ];
    const currentStepIndex = 2;
    const batchProgress = 50; // 50% de l'étape en cours

    expect(getStepProgress(1, currentStepIndex, batchProgress)).toBe(100); // étape terminée
    expect(getStepProgress(2, currentStepIndex, batchProgress)).toBe(50); // étape en cours
    expect(getStepProgress(3, currentStepIndex, batchProgress)).toBe(0); // étape à venir

    // 5 + 3 (étapes terminées) + 10 * 50% (étape en cours) = 13
    expect(calculateTotalWeightDosed(steps, currentStepIndex, batchProgress)).toBe(13);
  });
});
