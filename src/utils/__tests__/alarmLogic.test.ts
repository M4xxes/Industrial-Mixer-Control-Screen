import { describe, it, expect } from 'vitest';
import { filterAlarms, acknowledgeAlarm, acknowledgeAllActive } from '../alarmLogic';
import { Alarm } from '../../types';

const baseAlarms: Alarm[] = [
  { id: '1', mixerId: 1, alarmCode: 'DEF-01', description: 'Défaut moteur bras', level: 'Critique', status: 'Active', occurredAt: '2026-08-01T10:00:00.000Z' },
  { id: '2', mixerId: 2, alarmCode: 'WARN-05', description: 'Appel opérateur', level: 'Warning', status: 'Acquittée', occurredAt: '2026-08-05T08:00:00.000Z', acknowledgedAt: '2026-08-05T08:05:00.000Z', acknowledgedBy: 'admin' },
  { id: '3', mixerId: 1, alarmCode: 'INFO-02', description: 'Fin de cycle', level: 'Info', status: 'Active', occurredAt: '2026-07-01T09:00:00.000Z' },
];

describe('alarmLogic — logique d\'acquittement des alarmes', () => {
  it('acquitte une alarme unique en fixant statut, date et auteur', () => {
    const acked = acknowledgeAlarm(baseAlarms[0], 'operateur1', () => '2026-08-10T12:00:00.000Z');
    expect(acked.status).toBe('Acquittée');
    expect(acked.acknowledgedBy).toBe('operateur1');
    expect(acked.acknowledgedAt).toBe('2026-08-10T12:00:00.000Z');
  });

  it('acquitte toutes les alarmes actives sans toucher aux alarmes déjà acquittées', () => {
    const result = acknowledgeAllActive(baseAlarms, 'admin', () => '2026-08-10T12:00:00.000Z');
    expect(result.filter((a) => a.status === 'Active')).toHaveLength(0);
    // L'alarme déjà acquittée conserve son horodatage d'origine
    expect(result.find((a) => a.id === '2')?.acknowledgedAt).toBe('2026-08-05T08:05:00.000Z');
  });
});

describe('alarmLogic — filtrage multi-critères des alarmes', () => {
  it('combine filtre malaxeur, niveau et statut', () => {
    const result = filterAlarms(baseAlarms, {
      mixer: '1',
      level: 'all',
      status: 'Active',
    });
    expect(result.map((a) => a.id)).toEqual(['1', '3']);
  });

  it('applique une fenêtre de dates explicite (dateFrom/dateTo)', () => {
    const result = filterAlarms(baseAlarms, {
      mixer: 'all',
      level: 'all',
      status: 'all',
      dateFrom: '2026-08-01',
      dateTo: '2026-08-31',
    });
    expect(result.map((a) => a.id).sort()).toEqual(['1', '2']);
  });
});
