import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mixersAPI, usersAPI } from '../services/api';
import { Wifi, WifiOff, CheckCircle2, XCircle, Plus, Edit, Trash2, X, Lock, User } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'Admin' | 'Operator' | 'Viewer';
  createdAt?: string;
  lastLogin?: string;
}

export default function MaintenancePage() {
  const { isAdmin } = useAuth();
  const [mixers, setMixers] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<{
    username: string;
    email: string;
    password: string;
    role: 'Admin' | 'Operator' | 'Viewer';
  }>({
    username: '',
    email: '',
    password: '',
    role: 'Operator',
  });
  const [passwordChangeUserId, setPasswordChangeUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Rediriger si pas admin
  if (!isAdmin()) {
    return <Navigate to="/alarms" replace />;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const mixersData = await mixersAPI.getAll();
        setMixers(mixersData);
        
        // Charger les utilisateurs si l'API existe
        try {
          const usersData = await usersAPI.getAll();
          setUsers(usersData);
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Simuler l'état des communications automates
  const automationStatus = [
    { name: 'Automate MB12 (B1/B2)', status: 'connected', lastUpdate: new Date().toLocaleTimeString() },
    { name: 'Automate MB35 (B3/B5)', status: 'connected', lastUpdate: new Date().toLocaleTimeString() },
    { name: 'Automate MB67 (B6/B7)', status: 'connected', lastUpdate: new Date().toLocaleTimeString() },
    { name: 'Automate Liquide', status: 'connected', lastUpdate: new Date().toLocaleTimeString() },
    { name: 'Automate Poudre', status: 'disconnected', lastUpdate: '--' },
  ];

  const openUserDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserFormData({
        username: user.username,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setUserFormData({
        username: '',
        email: '',
        password: '',
        role: 'Operator',
      });
    }
    setIsUserDialogOpen(true);
  };

  const closeUserDialog = () => {
    setIsUserDialogOpen(false);
    setEditingUser(null);
    setUserFormData({
      username: '',
      email: '',
      password: '',
      role: 'Operator',
    });
  };

  const handleSaveUser = async () => {
    if (!userFormData.username || !userFormData.email || (!editingUser && !userFormData.password)) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      if (editingUser) {
        await usersAPI.update(editingUser.id, {
          username: userFormData.username,
          email: userFormData.email,
          role: userFormData.role,
        });
      } else {
        await usersAPI.create({
          username: userFormData.username,
          email: userFormData.email,
          password: userFormData.password,
          role: userFormData.role,
        });
      }
      const usersData = await usersAPI.getAll();
      setUsers(usersData);
      closeUserDialog();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Erreur lors de la sauvegarde de l\'utilisateur');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
    try {
      await usersAPI.delete(id);
      const usersData = await usersAPI.getAll();
      setUsers(usersData);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const handleChangePassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      await usersAPI.changePassword(userId, newPassword);
      alert('Mot de passe modifié avec succès');
      setPasswordChangeUserId(null);
      setNewPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Erreur lors de la modification du mot de passe');
    }
  };

  // Paramètres du cahier des charges
  const parameters = [
    { name: 'Nombre de malaxeurs', value: mixers.length, unit: '' },
    { name: 'Température maximale', value: '120', unit: '°C' },
    { name: 'Température minimale', value: '20', unit: '°C' },
    { name: 'Pression maximale', value: '2.5', unit: 'bar' },
    { name: 'Vitesse maximale', value: '60', unit: 'tr/min' },
    { name: 'Intensité maximale', value: '20', unit: 'A' },
    { name: 'Capacité maximale de dosage', value: '500', unit: 'Kg' },
    { name: 'Durée minimale d\'étape', value: '10', unit: 's' },
    { name: 'Durée maximale d\'étape', value: '3600', unit: 's' },
    { name: 'Seuil vide maximal', value: '100', unit: '%' },
    { name: 'Intervalle de rafraîchissement', value: '5', unit: 's' },
    { name: 'Timeout de connexion', value: '30', unit: 's' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Maintenance</h1>
      </div>

      {/* État des communications automates */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">État des communications automates</h2>
        <div className="space-y-3">
          {automationStatus.map((automate, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {automate.status === 'connected' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <div className="font-medium">{automate.name}</div>
                  <div className="text-sm text-gray-500">
                    Dernière mise à jour: {automate.lastUpdate}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {automate.status === 'connected' ? (
                  <>
                    <Wifi className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Connecté</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-600">Déconnecté</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gestion des utilisateurs */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Gestion des utilisateurs</h2>
          <button
            onClick={() => openUserDialog()}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvel utilisateur
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left">Nom d'utilisateur</th>
                <th className="border p-3 text-left">Email</th>
                <th className="border p-3 text-left">Rôle</th>
                <th className="border p-3 text-left">Dernière connexion</th>
                <th className="border p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-4 text-gray-500">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="border p-3 font-medium">{user.username}</td>
                    <td className="border p-3">{user.email}</td>
                    <td className="border p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'Operator' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="border p-3 text-sm text-gray-600">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : 'Jamais'}
                    </td>
                    <td className="border p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openUserDialog(user)}
                          className="text-primary-600 hover:text-primary-700"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPasswordChangeUserId(user.id)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Changer le mot de passe"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paramètres du cahier des charges */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Paramètres du cahier des charges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parameters.map((param, index) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50">
              <div className="text-sm text-gray-600 mb-1">{param.name}</div>
              <div className="text-2xl font-bold text-gray-900">
                {param.value} {param.unit}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Informations système */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Malaxeurs en production</div>
          <div className="text-2xl font-bold">
            {mixers.filter(m => m.status === 'Production').length} / {mixers.length}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Nombre d'utilisateurs</div>
          <div className="text-2xl font-bold">{users.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Taux de connexion</div>
          <div className="text-2xl font-bold">
            {Math.round((automationStatus.filter(a => a.status === 'connected').length / automationStatus.length) * 100)}%
          </div>
        </div>
      </div>

      {/* Dialogue de création/modification utilisateur */}
      {isUserDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <button onClick={closeUserDialog} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom d'utilisateur *
                </label>
                <input
                  type="text"
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Nom d'utilisateur"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="email@example.com"
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Minimum 6 caractères"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle *
                </label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as any })}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="Admin">Admin</option>
                  <option value="Operator">Operator</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button onClick={closeUserDialog} className="btn-secondary">
                  Annuler
                </button>
                <button onClick={handleSaveUser} className="btn-primary">
                  {editingUser ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialogue changement de mot de passe */}
      {passwordChangeUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Changer le mot de passe</h2>
              <button
                onClick={() => {
                  setPasswordChangeUserId(null);
                  setNewPassword('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau mot de passe *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Minimum 6 caractères"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  onClick={() => {
                    setPasswordChangeUserId(null);
                    setNewPassword('');
                  }}
                  className="btn-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleChangePassword(passwordChangeUserId)}
                  className="btn-primary"
                >
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
