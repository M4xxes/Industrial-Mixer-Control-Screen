import { FormEvent, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, usersAPI } from '../services/api';
import type { UserRole, MixerGroup } from '../types';

export default function LoginOverlay() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mixerGroup, setMixerGroup] = useState<MixerGroup | ''>('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Merci de saisir un nom d\'utilisateur et un mot de passe.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result: any = await authAPI.login(username.trim(), password);
      // Les clés sont déjà transformées en camelCase par fetchAPI
      const userRole = (result.role || 'Operator') as UserRole;
      const mixerGroup = (result.mixerGroup || null) as MixerGroup | null;

      login({
        id: result.id,
        username: result.username,
        role: userRole,
        mixerGroup,
      });
      setPassword('');
    } catch (err: any) {
      console.error('Erreur de connexion', err);
      const message =
        err?.message?.includes('401') || err?.message?.toLowerCase().includes('identifiants')
          ? 'Identifiants invalides. Vérifiez le nom d\'utilisateur et le mot de passe.'
          : 'Erreur lors de la connexion. Réessayez plus tard.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || !confirmPassword) {
      setError('Merci de remplir tous les champs.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!mixerGroup) {
      setError('Veuillez sélectionner le groupe de malaxeurs autorisé.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Crée un compte opérateur avec email technique
      await usersAPI.create({
        username: username.trim(),
        password,
        role: 'Operator',
        email: `${username.trim()}@local`,
        mixerGroup,
      });

      // Connexion automatique après création
      const result: any = await authAPI.login(username.trim(), password);
      const userRole = (result.role || 'Operator') as UserRole;
      const userMixerGroup = (result.mixerGroup || null) as MixerGroup | null;

      login({
        id: result.id,
        username: result.username,
        role: userRole,
        mixerGroup: userMixerGroup,
      });

      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Erreur de création de compte', err);
      const backendMessage = err?.message || '';
      if (backendMessage.toLowerCase().includes('existe déjà')) {
        setError('Ce nom d\'utilisateur existe déjà. Choisissez-en un autre.');
      } else {
        setError('Erreur lors de la création du compte. Réessayez plus tard.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold text-gray-900">
            {mode === 'login' ? 'Connexion supervision' : 'Créer un compte opérateur'}
          </h1>
          <p className="text-sm text-gray-600">
            {mode === 'login'
              ? 'Veuillez saisir votre nom d\'utilisateur et votre mot de passe.'
              : 'Créer un compte opérateur en choisissant le groupe de malaxeurs autorisé.'}
          </p>
        </div>

        <div className="flex justify-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`px-3 py-1 rounded-full border ${
              mode === 'login'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`px-3 py-1 rounded-full border ${
              mode === 'signup'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            Créer un compte
          </button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          className="space-y-4"
          onSubmit={mode === 'login' ? handleLogin : handleSignup}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">
              Nom d&apos;utilisateur
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Groupe de malaxeurs autorisé
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                  value={mixerGroup}
                  onChange={(e) => setMixerGroup(e.target.value as MixerGroup | '')}
                >
                  <option value="">Sélectionner un groupe</option>
                  <option value="B1-2">B1/B2</option>
                  <option value="B3-5">B3/B5</option>
                  <option value="B6-7">B6/B7</option>
                </select>
              </div>
            </>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center items-center px-4 py-2 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? mode === 'login'
                ? 'Connexion…'
                : 'Création du compte…'
              : mode === 'login'
              ? 'Se connecter'
              : 'Créer le compte'}
          </button>
        </form>
      </div>
    </div>
  );
}

