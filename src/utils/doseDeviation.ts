import { RecipeStep, Batch } from '../types';

/**
 * Détermine la consigne (poids cible) applicable pour une étape en cours.
 * Reprend la logique utilisée dans ProductionPage.tsx : priorité à la
 * consigne de l'étape de recette (currentStep.weight), sinon repli sur la
 * consigne du batch (produitConsigne).
 */
export function getConsigne(
  currentStep: RecipeStep | undefined,
  batch: Pick<Batch, 'produitConsigne'> | undefined
): number | null {
  const consigne = currentStep?.weight ?? batch?.produitConsigne ?? null;
  return consigne;
}

/**
 * Calcule l'écart entre la consigne (poids attendu) et la mesure
 * (poids effectivement dosé) pour une étape de production.
 * Un écart positif signifie que la mesure est en dessous de la consigne.
 */
export function calculateDeviation(
  consigne: number | null,
  mesure: number | null | undefined
): number | null {
  if (consigne === null || mesure === null || mesure === undefined) {
    return null;
  }
  return Number((consigne - mesure).toFixed(2));
}

/**
 * Indique si la consigne est considérée comme atteinte, avec une tolérance
 * exprimée en Kg (tolérance par défaut : 0.05 Kg, cohérente avec la
 * précision d'affichage à 2 décimales utilisée dans l'application).
 */
export function isConsigneAtteinte(
  consigne: number | null,
  mesure: number | null | undefined,
  tolerance = 0.05
): boolean {
  const deviation = calculateDeviation(consigne, mesure);
  if (deviation === null) return false;
  return Math.abs(deviation) <= tolerance;
}
