import { Alarm, AlarmStatus } from '../types';

export interface AlarmFilters {
  mixer: string; // 'all' ou id du malaxeur en string
  level: string; // 'all' | AlarmLevel
  status: string; // 'all' | AlarmStatus
  period?: string; // nombre de jours en string, ex '7'
  dateFrom?: string; // yyyy-mm-dd
  dateTo?: string; // yyyy-mm-dd
}

/**
 * Filtrage multi-critères des alarmes, extrait de AlarmsPage.tsx.
 * Combine malaxeur, niveau, statut, fenêtre glissante (period) et
 * plage de dates explicite (dateFrom/dateTo).
 */
export function filterAlarms(alarms: Alarm[], filters: AlarmFilters): Alarm[] {
  return alarms.filter((alarm) => {
    if (filters.mixer !== 'all' && alarm.mixerId !== parseInt(filters.mixer)) return false;
    if (filters.level !== 'all' && alarm.level !== filters.level) return false;
    if (filters.status !== 'all' && alarm.status !== filters.status) return false;

    if (filters.period) {
      const alarmDate = new Date(alarm.occurredAt);
      const now = new Date();
      const periodDays = parseInt(filters.period);
      const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
      if (alarmDate < periodStart) return false;
    }

    if (filters.dateFrom) {
      const alarmDate = new Date(alarm.occurredAt);
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (alarmDate < fromDate) return false;
    }

    if (filters.dateTo) {
      const alarmDate = new Date(alarm.occurredAt);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (alarmDate > toDate) return false;
    }

    return true;
  });
}

/**
 * Acquitte une alarme unique (logique d'acquittement local, indépendante
 * de l'appel API), extraite de handleAcknowledge dans AlarmsPage.tsx.
 */
export function acknowledgeAlarm(
  alarm: Alarm,
  acknowledgedBy = 'admin',
  now: () => string = () => new Date().toISOString()
): Alarm {
  return {
    ...alarm,
    status: 'Acquittée' as AlarmStatus,
    acknowledgedAt: now(),
    acknowledgedBy,
  };
}

/**
 * Acquitte toutes les alarmes actives d'une liste, en laissant les
 * alarmes déjà acquittées inchangées. Extrait de handleAcknowledgeAll.
 */
export function acknowledgeAllActive(
  alarms: Alarm[],
  acknowledgedBy = 'admin',
  now: () => string = () => new Date().toISOString()
): Alarm[] {
  return alarms.map((a) => (a.status === 'Active' ? acknowledgeAlarm(a, acknowledgedBy, now) : a));
}
