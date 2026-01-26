import { useState, useEffect } from 'react';
import { alarmsAPI } from '../services/api';
import { Alarm, AlarmLevel, AlarmStatus } from '../types';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../utils/cn';

export default function AlarmsPage() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    mixer: 'all',
    level: 'all',
    status: 'all',
    period: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    const fetchAlarms = async () => {
      try {
        setLoading(true);
        const data = await alarmsAPI.getAll();
        // Transformer les données de l'API
        const transformedAlarms: Alarm[] = data.map((a: any) => ({
          id: a.id,
          mixerId: a.mixerId || a.mixer_id,
          alarmCode: a.alarmCode || a.alarm_code,
          description: a.description,
          level: a.level as AlarmLevel,
          status: a.status as AlarmStatus,
          occurredAt: a.occurredAt || a.occurred_at,
          acknowledgedAt: a.acknowledgedAt || a.acknowledged_at,
          acknowledgedBy: a.acknowledgedBy || a.acknowledged_by,
        }));
        setAlarms(transformedAlarms);
      } catch (error) {
        console.error('Error fetching alarms:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlarms();
    // Rafraîchissement automatique désactivé - les données ne se rafraîchissent que manuellement
    // const interval = setInterval(fetchAlarms, 5000);
    // return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (alarmId: string) => {
    try {
      await alarmsAPI.acknowledge(alarmId);
      // Mettre à jour l'alarme localement
      setAlarms(alarms.map(a =>
        a.id === alarmId
          ? { ...a, status: 'Acquittée' as AlarmStatus, acknowledgedAt: new Date().toISOString(), acknowledgedBy: 'admin' }
          : a
      ));
    } catch (error) {
      console.error('Error acknowledging alarm:', error);
      alert('Erreur lors de l\'acquittement de l\'alarme');
    }
  };

  const handleAcknowledgeAll = async () => {
    if (!confirm('Acquitter toutes les alarmes actives ?')) return;
    
    try {
      const activeAlarmsToAcknowledge = alarms.filter(a => a.status === 'Active');
      await Promise.all(activeAlarmsToAcknowledge.map(a => alarmsAPI.acknowledge(a.id)));
      
      // Mettre à jour toutes les alarmes localement
      setAlarms(alarms.map(a =>
        a.status === 'Active'
          ? { ...a, status: 'Acquittée' as AlarmStatus, acknowledgedAt: new Date().toISOString(), acknowledgedBy: 'admin' }
          : a
      ));
    } catch (error) {
      console.error('Error acknowledging all alarms:', error);
      alert('Erreur lors de l\'acquittement des alarmes');
    }
  };

  const filteredAlarms = alarms.filter(alarm => {
    if (filters.mixer !== 'all' && alarm.mixerId !== parseInt(filters.mixer)) return false;
    if (filters.level !== 'all' && alarm.level !== filters.level) return false;
    if (filters.status !== 'all' && alarm.status !== filters.status) return false;
    // Filtre par période (si implémenté)
    if (filters.period) {
      const alarmDate = new Date(alarm.occurredAt);
      const now = new Date();
      const periodDays = parseInt(filters.period);
      const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
      if (alarmDate < periodStart) return false;
    }
    // Filtre par date (comme dans historique)
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

  const getLevelIcon = (level: AlarmLevel) => {
    switch (level) {
      case 'Critique':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'Warning':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getLevelColor = (level: AlarmLevel) => {
    switch (level) {
      case 'Critique':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Warning':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const activeAlarms = alarms.filter(a => a.status === 'Active');
  const criticalAlarms = alarms.filter(a => a.level === 'Critique' && a.status === 'Active');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Alarmes</h1>
        {activeAlarms.length > 0 && (
          <button onClick={handleAcknowledgeAll} className="btn-primary">
            <CheckCircle2 className="w-4 h-4 inline mr-2" />
            Acquitter toutes les alarmes
          </button>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-sm text-gray-600">Alarmes actives</div>
          <div className="text-2xl font-bold text-red-600">{activeAlarms.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Alarmes critiques</div>
          <div className="text-2xl font-bold text-red-600">{criticalAlarms.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600">Total alarmes</div>
          <div className="text-2xl font-bold">{alarms.length}</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Malaxeur
            </label>
            <select
              value={filters.mixer}
              onChange={(e) => setFilters({ ...filters, mixer: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="all">Tous</option>
              {[1, 2, 3, 4, 5, 6, 7].map(id => (
                <option key={id} value={id.toString()}>Malaxeur B{id}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Niveau
            </label>
            <select
              value={filters.level}
              onChange={(e) => setFilters({ ...filters, level: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="all">Tous</option>
              <option value="Critique">Critique</option>
              <option value="Warning">Warning</option>
              <option value="Info">Info</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="all">Tous</option>
              <option value="Active">Active</option>
              <option value="Acquittée">Acquittée</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Période
            </label>
            <select
              value={filters.period}
              onChange={(e) => setFilters({ ...filters, period: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">Toutes</option>
              <option value="1">Dernière heure</option>
              <option value="24">Dernières 24h</option>
              <option value="168">7 derniers jours</option>
              <option value="720">30 derniers jours</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jour spécifique
            </label>
            <input
              type="date"
              value={filters.dateFrom && filters.dateFrom === filters.dateTo ? filters.dateFrom : ''}
              onChange={(e) => {
                const date = e.target.value;
                setFilters({ ...filters, dateFrom: date, dateTo: date });
              }}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date début
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date fin
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : (
        <>
          {/* Liste des alarmes */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Liste des alarmes</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-2">Niveau</th>
                <th className="text-left p-2">Date/Heure</th>
                <th className="text-left p-2">Malaxeur</th>
                <th className="text-left p-2">Code</th>
                <th className="text-left p-2">Description</th>
                <th className="text-left p-2">Statut</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlarms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">
                    Aucune alarme trouvée
                  </td>
                </tr>
              ) : (
                filteredAlarms.map((alarm) => (
                  <tr
                    key={alarm.id}
                    className={cn(
                      'border-b hover:bg-gray-50',
                      alarm.status === 'Active' && alarm.level === 'Critique' && 'bg-red-50'
                    )}
                  >
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {getLevelIcon(alarm.level)}
                        <span className={cn('px-2 py-1 rounded text-xs font-medium border', getLevelColor(alarm.level))}>
                          {alarm.level}
                        </span>
                      </div>
                    </td>
                    <td className="p-2">
                      {new Date(alarm.occurredAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="p-2 font-medium">Malaxeur B{alarm.mixerId}</td>
                    <td className="p-2 font-mono text-sm">{alarm.alarmCode}</td>
                    <td className="p-2">{alarm.description}</td>
                    <td className="p-2">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        alarm.status === 'Active' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      )}>
                        {alarm.status}
                      </span>
                    </td>
                    <td className="p-2">
                      {alarm.status === 'Active' ? (
                        <button
                          onClick={() => handleAcknowledge(alarm.id)}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          <CheckCircle2 className="w-4 h-4 inline mr-1" />
                          Acquitter
                        </button>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Acquittée par {alarm.acknowledgedBy}
                          <br />
                          {alarm.acknowledgedAt && (
                            <span className="text-xs">
                              {new Date(alarm.acknowledgedAt).toLocaleString('fr-FR')}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>
        </>
      )}
    </div>
  );
}

