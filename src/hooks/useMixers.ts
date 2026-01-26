import { useState, useEffect } from 'react';
import { mixersAPI } from '../services/api';
import { Mixer } from '../types';

export function useMixers() {
  const [mixers, setMixers] = useState<Mixer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMixers = async () => {
    try {
      setLoading(true);
      const data = await mixersAPI.getAll();
      // Logs désactivés pour éviter le spam - activer seulement en développement si nécessaire
      // if (import.meta.env.DEV) {
      //   console.log('Mixers data received:', data.length, 'mixers');
      // }
      setMixers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des malaxeurs');
      console.error('Error fetching mixers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMixers();
    
    // Rafraîchissement automatique désactivé - les données ne se rafraîchissent que manuellement
    // const interval = setInterval(fetchMixers, 5000);
    // return () => clearInterval(interval);
  }, []);

  const updateMixer = async (id: number, updates: Partial<Mixer>) => {
    try {
      await mixersAPI.update(id, updates);
      await fetchMixers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      throw err;
    }
  };

  return { mixers, loading, error, updateMixer, refresh: fetchMixers };
}

export function useMixer(id: number) {
  const [mixer, setMixer] = useState<Mixer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMixer = async () => {
    try {
      setLoading(true);
      const data = await mixersAPI.getById(id);
      setMixer(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du malaxeur');
      console.error('Error fetching mixer:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMixer();
    
    // Rafraîchissement automatique désactivé - les données ne se rafraîchissent que manuellement
    // const interval = setInterval(fetchMixer, 2000);
    // return () => clearInterval(interval);
  }, [id]);

  const updateMixer = async (updates: Partial<Mixer>) => {
    try {
      await mixersAPI.update(id, updates);
      await fetchMixer();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      throw err;
    }
  };

  return { mixer, loading, error, updateMixer, refresh: fetchMixer };
}

