import { describe, it, expect } from 'vitest';
import { getConsigne, calculateDeviation, isConsigneAtteinte } from '../doseDeviation';

describe('doseDeviation — calcul des écarts consigne/mesure', () => {
  it('utilise le poids de l\'étape de recette comme consigne en priorité', () => {
    const currentStep = { id: '1', stepNumber: 1, function: 'Dosage Automatique', arm: 'GV', screw: 'GV', duration: 30, weight: 12.5 } as any;
    const batch = { produitConsigne: 99 } as any;
    expect(getConsigne(currentStep, batch)).toBe(12.5);
  });

  it('retombe sur produitConsigne du batch si l\'étape n\'a pas de poids défini', () => {
    const currentStep = { id: '1', stepNumber: 1, function: 'Mélange', arm: 'GV', screw: 'GV', duration: 30 } as any;
    const batch = { produitConsigne: 8.2 } as any;
    expect(getConsigne(currentStep, batch)).toBe(8.2);
  });

  it('calcule un écart positif quand la mesure est en dessous de la consigne', () => {
    expect(calculateDeviation(10, 8.7)).toBe(1.3);
  });

  it('considère la consigne comme atteinte dans la tolérance, pas au-delà', () => {
    expect(isConsigneAtteinte(10, 9.98)).toBe(true);
    expect(isConsigneAtteinte(10, 9.5)).toBe(false);
  });
});
