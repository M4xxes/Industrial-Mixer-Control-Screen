export type StepDisplayStatus = 'completed' | 'current' | 'pending';

/**
 * Détermine le statut d'affichage d'une étape de recette selon sa position
 * par rapport à l'étape courante. Machine d'états à 3 états, extraite de
 * RecipeProgress.tsx (getStepStatus).
 */
export function getStepStatus(stepIndex: number, currentStepIndex: number): StepDisplayStatus {
  if (stepIndex < currentStepIndex) return 'completed';
  if (stepIndex === currentStepIndex) return 'current';
  return 'pending';
}

/**
 * Détermine la progression (0-100) d'une étape : 100% si terminée,
 * la progression du batch en cours si c'est l'étape courante, 0% sinon.
 * Extrait de RecipeProgress.tsx (getStepProgress).
 */
export function getStepProgress(
  stepIndex: number,
  currentStepIndex: number,
  batchProgress: number | undefined
): number {
  if (stepIndex < currentStepIndex) return 100;
  if (stepIndex === currentStepIndex) return batchProgress || 0;
  return 0;
}

/**
 * Calcule le poids total déjà dosé sur l'ensemble de la recette : la somme
 * des étapes terminées, plus la part de l'étape en cours proportionnelle à
 * sa progression. Extrait de RecipeProgress.tsx.
 */
export function calculateTotalWeightDosed(
  steps: Array<{ weight?: number }>,
  currentStepIndex: number,
  batchProgress: number | undefined
): number {
  const totalWeightDosed = steps
    .slice(0, currentStepIndex)
    .reduce((sum, step) => sum + (step.weight || 0), 0);

  const currentStep = steps[currentStepIndex];
  const currentStepWeightDosed = batchProgress ? (currentStep?.weight || 0) * (batchProgress / 100) : 0;

  return totalWeightDosed + currentStepWeightDosed;
}
