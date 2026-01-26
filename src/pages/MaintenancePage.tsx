import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mixersAPI, usersAPI } from '../services/api';
import { Wifi, WifiOff, CheckCircle2, XCircle, Plus, Edit, Trash2, X, Lock, User, Save } from 'lucide-react';

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
  const [activeParamTab, setActiveParamTab] = useState<string>('B1-B2');
  const [parameterValues, setParameterValues] = useState<{ [key: string]: string }>({});

  // Rediriger si pas admin
  if (!isAdmin()) {
    return <Navigate to="/alarms" replace />;
  }

  // Structure des paramètres basée sur le CSV
  interface Parameter {
    name: string;
    address: string;
    value?: number | string;
    unit?: string;
  }

  interface ParameterCategory {
    id: string;
    label: string;
    parameters: Parameter[];
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const mixersData = await mixersAPI.getAll();
        setMixers(mixersData);
        
        // Charger les utilisateurs si l'API existe
        try {
          const usersData = await usersAPI.getAll();
          // Transformer les données si nécessaire
          const transformedUsers = Array.isArray(usersData) ? usersData.map((u: any) => ({
            id: u.id || u.user_id,
            username: u.username || u.user_name,
            email: u.email,
            role: (u.role || 'Operator') as 'Admin' | 'Operator' | 'Viewer',
            createdAt: u.createdAt || u.created_at,
            lastLogin: u.lastLogin || u.last_login,
          })) : [];
          setUsers(transformedUsers);
        } catch (error) {
          console.error('Error fetching users:', error);
          // Ne pas bloquer l'application si l'API users n'existe pas encore
          setUsers([]);
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
    // Validation des champs
    if (!userFormData.username || !userFormData.username.trim()) {
      alert('Veuillez saisir un nom d\'utilisateur');
      return;
    }

    if (!userFormData.email || !userFormData.email.trim()) {
      alert('Veuillez saisir un email');
      return;
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userFormData.email)) {
      alert('Veuillez saisir un email valide');
      return;
    }

    // Validation du mot de passe pour la création
    if (!editingUser) {
      if (!userFormData.password || userFormData.password.length < 6) {
        alert('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
    }

    try {
      if (editingUser) {
        await usersAPI.update(editingUser.id, {
          username: userFormData.username.trim(),
          email: userFormData.email.trim(),
          role: userFormData.role,
        });
        alert('Utilisateur modifié avec succès');
      } else {
        await usersAPI.create({
          username: userFormData.username.trim(),
          email: userFormData.email.trim(),
          password: userFormData.password,
          role: userFormData.role,
        });
        alert('Utilisateur créé avec succès');
      }
      
      // Recharger la liste des utilisateurs
      try {
        const usersData = await usersAPI.getAll();
        setUsers(usersData);
      } catch (fetchError) {
        console.error('Error fetching users after save:', fetchError);
      }
      
      closeUserDialog();
    } catch (error: any) {
      console.error('Error saving user:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Erreur lors de la sauvegarde de l\'utilisateur';
      alert(`Erreur: ${errorMessage}`);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
      try {
        await usersAPI.delete(id);
        alert('Utilisateur supprimé avec succès');
        
        // Recharger la liste des utilisateurs
        try {
          const usersData = await usersAPI.getAll();
          const transformedUsers = Array.isArray(usersData) ? usersData.map((u: any) => ({
            id: u.id || u.user_id,
            username: u.username || u.user_name,
            email: u.email,
            role: (u.role || 'Operator') as 'Admin' | 'Operator' | 'Viewer',
            createdAt: u.createdAt || u.created_at,
            lastLogin: u.lastLogin || u.last_login,
          })) : [];
          setUsers(transformedUsers);
        } catch (fetchError) {
          console.error('Error fetching users after delete:', fetchError);
        }
      } catch (error: any) {
        console.error('Error deleting user:', error);
        const errorMessage = error?.message || error?.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur';
        alert(`Erreur: ${errorMessage}`);
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
    } catch (error: any) {
      console.error('Error changing password:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Erreur lors de la modification du mot de passe';
      alert(`Erreur: ${errorMessage}`);
    }
  };

  const parameterCategories: ParameterCategory[] = [
    {
      id: 'B1-B2',
      label: 'Malaxeurs B1/B2',
      parameters: [
        { name: 'B12 Consigne Tempo DF FdC Vannes', address: '%MW1120' },
        { name: 'B12 Consigne Tempo DF Débit Huile', address: '%MW1121' },
        { name: 'B12 Consigne Tempo DF Remplissage', address: '%MW1122' },
        { name: 'B12 Consigne Tempo DF Extraction D10', address: '%MW1123' },
        { name: 'B12 Consigne Seuil Immobilité Compteur Huile', address: '%MW1124' },
        { name: 'B12 Consigne Tempo Immobilité Compteur Huile', address: '%MW1125' },
        { name: 'B12 Consigne Seuil Immobilité Bascule D10', address: '%MW1126' },
        { name: 'B12 Consigne Tempo Immobilité Bascule D10', address: '%MW1127' },
        { name: 'B12 Consigne Poids Maxi Fin Remplissage Trémie D10', address: '%MW1128' },
        { name: 'B12 Consigne Seuil DF Surcharge Bascule D10', address: '%MW1129' },
        { name: 'B12 Consigne Tempo DF Surcharge Bascule D10', address: '%MW1130' },
        { name: 'B12 Consigne POids Mini Forçage Remplissage Trémie D10', address: '%MW1131' },
        { name: 'B12 Consigne Dosage Fin Bascule D10', address: '%MW1132' },
        { name: 'HUI Retard Arrêt Pompe Alimentation', address: '%MW1133' },
        { name: 'B12 Consigne Poids Mini Validation Remplissage Masqué D10', address: '%MW1135' },
        { name: 'B12 Erreur de Jetée Maximale D10', address: '%MW1136' },
        { name: 'B12 Durée Moyenne Remplissage Trémie D10 (mn)', address: '%MW1137' },
        { name: 'B12 Seuil Défaut Mesure Bascule D10', address: '%MW1138' },
        { name: 'B12 Tempo Défaut Mesure Bascule D10', address: '%MW1139' },
        { name: 'B1 Seuil Défaut Intensité Basse Moteur Bras', address: '%MW1010' },
        { name: 'B1 Tempo Défaut Intensité Basse Moteur Bras', address: '%MW1011' },
        { name: 'B1 Seuil Défaut Intensité Basse Moteur Vis', address: '%MW1012' },
        { name: 'B1 Tempo Défaut Intensité Basse Moteur Vis', address: '%MW1013' },
        { name: 'B1 Tempo Défaut Attente Reprise Malaxage', address: '%MW1014' },
        { name: 'B2 Seuil Défaut Intensité Basse Moteur Bras', address: '%MW1030' },
        { name: 'B2 Tempo Défaut Intensité Basse Moteur Bras', address: '%MW1031' },
        { name: 'B2 Seuil Défaut Intensité Basse Moteur Vis', address: '%MW1032' },
        { name: 'B2 Tempo Défaut Intensité Basse Moteur Vis', address: '%MW1033' },
        { name: 'B2 Tempo Défaut Attente Reprise Malaxage', address: '%MW1034' },
      ],
    },
    {
      id: 'B1-B2-D200',
      label: 'B1/B2 - D200',
      parameters: [
        { name: 'B12 Consigne Tempo DF FdC Vannes D200', address: '%MW1140' },
        { name: 'B12 Consigne Tempo DF Remplissage D200', address: '%MW1141' },
        { name: 'B12 Consigne Tempo DF Extraction D200', address: '%MW1142' },
        { name: 'B12 Consigne Seuil Immobilité Bascule D200', address: '%MW1143' },
        { name: 'B12 Consigne Tempo Immobilité Bascule D200', address: '%MW1144' },
        { name: 'B12 Consigne Poids Maxi Fin Remplissage Trémie D200', address: '%MW1145' },
        { name: 'B12 Consigne Seuil DF Surcharge Bascule D200', address: '%MW1146' },
        { name: 'B12 Consigne Tempo DF Surcharge Bascule D200', address: '%MW1147' },
        { name: 'B12 Consigne Poids Mini Forçage Remplissage Bascule D200', address: '%MW1148' },
        { name: 'B12 Consigne Dosage Fin Bascule D200', address: '%MW1149' },
        { name: 'B12 Consigne Poids Mini Validation Remplissage Masqué Trémie D200 (1/10e Kg)', address: '%MW1151' },
        { name: 'B12 Consigne Seuil Validation Chauffe Bascule D200 (1/10e Kg)', address: '%MW1152' },
        { name: 'B12 Consigne Tempo Validation Chauffe Bascule D200 (1/10e s)', address: '%MW1153' },
        { name: 'B12 Consigne Seuil Température Marche Chauffe Bascule D200 (1/10e °C)', address: '%MW1154' },
        { name: 'B12 Consigne Seuil Température Arrêt Chauffe Bascule D200 (1/10e °C)', address: '%MW1155' },
        { name: 'B12 Consigne Seuil Sécurité Haute Température Bascule D200 (1/10e °C)', address: '%MW1156' },
        { name: 'B12 Consigne Seuil Alarme Basse Température Bascule D200 (1/10e °C)', address: '%MW1157' },
        { name: 'B12 Consigne Tempo Défauts Température Bascule D200 (1/10e s)', address: '%MW1158' },
        { name: 'B12 Consigne Retard Arrêt Pompe Extraction D200 (1/10e s)', address: '%MW1159' },
        { name: 'B12 Erreur de Jetée Maxi D200', address: '%MW1160' },
        { name: 'B12 Durée Moyenne Remplissage Trémie D200 (mn)', address: '%MW1161' },
        { name: 'B12 Seuil Défaut Mesure Bascule D200', address: '%MW1162' },
        { name: 'B12 Tempo Défaut Mesure Bascule D200', address: '%MW1163' },
      ],
    },
    {
      id: 'B3-B5',
      label: 'Malaxeurs B3/B5',
      parameters: [
        { name: 'B35 Consigne Tempo DF FdC Vannes', address: '%MW1320' },
        { name: 'B35 Consigne Tempo DF Débit Huile', address: '%MW1321' },
        { name: 'B35 Consigne Tempo DF Remplissage', address: '%MW1322' },
        { name: 'B35 Consigne Tempo DF Extraction D10', address: '%MW1323' },
        { name: 'B35 Consigne Seuil Immobilité Compteur Huile', address: '%MW1324' },
        { name: 'B35 Consigne Tempo Immobilité Compteur Huile', address: '%MW1325' },
        { name: 'B35 Consigne Seuil Immobilité Bascule D10', address: '%MW1326' },
        { name: 'B35 Consigne Tempo Immobilité Bascule D10', address: '%MW1327' },
        { name: 'B35 Consigne Poids Maxi Fin Remplissage Trémie D10', address: '%MW1328' },
        { name: 'B35 Consigne Seuil DF Surcharge Bascule D10', address: '%MW1329' },
        { name: 'B35 Consigne Tempo DF Surcharge Bascule D10', address: '%MW1330' },
        { name: 'B35 Consigne POids Mini Forçage Remplissage Trémie D10', address: '%MW1331' },
        { name: 'B35 Consigne Dosage Fin Bascule D10', address: '%MW1332' },
        { name: 'HUI Retard Arrêt Pompe Alimentation', address: '%MW1333' },
        { name: 'B35 Consigne Poids Mini Validation Remplissage Masqué D10', address: '%MW1335' },
        { name: 'B35 Erreur de Jetée Maximale D10', address: '%MW1336' },
        { name: 'B35 Durée Moyenne Remplissage Trémie D10 (mn)', address: '%MW1337' },
        { name: 'B35 Seuil Défaut Mesure Bascule D10', address: '%MW1338' },
        { name: 'B35 Tempo Défaut Mesure Bascule D10', address: '%MW1339' },
        { name: 'B3 Seuil Défaut Intensité Basse Moteur Bras', address: '%MW1010' },
        { name: 'B3 Tempo Défaut Intensité Basse Moteur Bras', address: '%MW1011' },
        { name: 'B3 Seuil Défaut Intensité Basse Moteur Vis', address: '%MW1012' },
        { name: 'B3 Tempo Défaut Intensité Basse Moteur Vis', address: '%MW1013' },
        { name: 'B3 Tempo Défaut Attente Reprise Malaxage', address: '%MW1014' },
        { name: 'B5 Seuil Défaut Intensité Basse Moteur Bras', address: '%MW1030' },
        { name: 'B5 Tempo Défaut Intensité Basse Moteur Bras', address: '%MW1031' },
        { name: 'B5 Seuil Défaut Intensité Basse Moteur Vis', address: '%MW1032' },
        { name: 'B5 Tempo Défaut Intensité Basse Moteur Vis', address: '%MW1033' },
        { name: 'B5 Tempo Défaut Attente Reprise Malaxage', address: '%MW1034' },
        { name: 'B35 Seuil Défaut Mesure Bascule D200', address: '%MW1362' },
        { name: 'B35 Tempo Défaut Mesure Bascule D200', address: '%MW1363' },
      ],
    },
    {
      id: 'B6-B7',
      label: 'Malaxeurs B6/B7',
      parameters: [
        { name: 'B67 Consigne Tempo DF FdC Vannes', address: '%MW1520' },
        { name: 'B67 Consigne Tempo DF Débit Huile', address: '%MW1521' },
        { name: 'B67 Consigne Tempo DF Remplissage', address: '%MW1522' },
        { name: 'B67 Consigne Tempo DF Extraction D10', address: '%MW1523' },
        { name: 'B67 Consigne Seuil Immobilité Compteur Huile', address: '%MW1524' },
        { name: 'B67 Consigne Tempo Immobilité Compteur Huile', address: '%MW1525' },
        { name: 'B67 Consigne Seuil Immobilité Bascule D10', address: '%MW1526' },
        { name: 'B67 Consigne Tempo Immobilité Bascule D10', address: '%MW1527' },
        { name: 'B67 Consigne Poids Maxi Fin Remplissage Trémie D10', address: '%MW1528' },
        { name: 'B67 Consigne Seuil DF Surcharge Bascule D10', address: '%MW1529' },
        { name: 'B67 Consigne Tempo DF Surcharge Bascule D10', address: '%MW1530' },
        { name: 'B67 Consigne POids Mini Forçage Remplissage Trémie D10', address: '%MW1531' },
        { name: 'B67 Consigne Dosage Fin Bascule D10', address: '%MW1532' },
        { name: 'HUI Retard Arrêt Pompe Alimentation', address: '%MW1533' },
        { name: 'B67 Consigne Poids Mini Validation Remplissage Masqué D10', address: '%MW1535' },
        { name: 'B67 Erreur de Jetée Maximale D10', address: '%MW1536' },
        { name: 'B67 Durée Moyenne Remplissage Trémie D10 (mn)', address: '%MW1537' },
        { name: 'B67 Seuil Défaut Mesure Bascule D10', address: '%MW1538' },
        { name: 'B67 Tempo Défaut Mesure Bascule D10', address: '%MW1539' },
        { name: 'B6 Seuil Défaut Intensité Basse Moteur Bras', address: '%MW1010' },
        { name: 'B6 Tempo Défaut Intensité Basse Moteur Bras', address: '%MW1011' },
        { name: 'B6 Seuil Défaut Intensité Basse Moteur Vis', address: '%MW1012' },
        { name: 'B6 Tempo Défaut Intensité Basse Moteur Vis', address: '%MW1013' },
        { name: 'B6 Tempo Défaut Attente Reprise Malaxage', address: '%MW1014' },
        { name: 'B7 Seuil Défaut Intensité Basse Moteur Bras', address: '%MW1030' },
        { name: 'B7 Tempo Défaut Intensité Basse Moteur Bras', address: '%MW1031' },
        { name: 'B7 Seuil Défaut Intensité Basse Moteur Vis', address: '%MW1032' },
        { name: 'B7 Tempo Défaut Intensité Basse Moteur Vis', address: '%MW1033' },
        { name: 'B7 Tempo Défaut Attente Reprise Malaxage', address: '%MW1034' },
      ],
    },
    {
      id: 'B6-B7-D200',
      label: 'B6/B7 - D200',
      parameters: [
        { name: 'B67 Consigne Tempo DF FdC Vannes D200', address: '%MW1540' },
        { name: 'B67 Consigne Tempo DF Remplissage D200', address: '%MW1541' },
        { name: 'B67 Consigne Tempo DF Extraction D200', address: '%MW1542' },
        { name: 'B67 Consigne Seuil Immobilité Bascule D200', address: '%MW1543' },
        { name: 'B67 Consigne Tempo Immobilité Bascule D200', address: '%MW1544' },
        { name: 'B67 Consigne Poids Maxi Fin Remplissage Trémie D200', address: '%MW1545' },
        { name: 'B67 Consigne Seuil DF Surcharge Bascule D200', address: '%MW1546' },
        { name: 'B67 Consigne Tempo DF Surcharge Bascule D200', address: '%MW1547' },
        { name: 'B67 Consigne Poids Mini Forçage Remplissage Bascule D200', address: '%MW1548' },
        { name: 'B67 Consigne Dosage Fin Bascule D200', address: '%MW1549' },
        { name: 'B67 Consigne Poids Mini Validation Remplissage Masqué Trémie D200 (1/10e Kg)', address: '%MW1551' },
        { name: 'B67 Consigne Seuil Validation Chauffe Bascule D200 (1/10e Kg)', address: '%MW1552' },
        { name: 'B67 Consigne Tempo Validation Chauffe Bascule D200 (1/10e s)', address: '%MW1553' },
        { name: 'B67 Consigne Seuil Température Marche Chauffe Bascule D200 (1/10e °C)', address: '%MW1554' },
        { name: 'B67 Consigne Seuil Température Arrêt Chauffe Bascule D200 (1/10e °C)', address: '%MW1555' },
        { name: 'B67 Consigne Seuil Sécurité Haute Température Bascule D200 (1/10e °C)', address: '%MW1556' },
        { name: 'B67 Consigne Seuil Alarme Basse Température Bascule D200 (1/10e °C)', address: '%MW1557' },
        { name: 'B67 Consigne Tempo Défauts Température Bascule D200 (1/10e s)', address: '%MW1558' },
        { name: 'B67 Consigne Retard Arrêt Pompe Extraction D200 (1/10e s)', address: '%MW1559' },
        { name: 'B67 Erreur de Jetée Maxi D200', address: '%MW1560' },
        { name: 'B67 Durée Moyenne Remplissage Trémie D200 (mn)', address: '%MW1561' },
        { name: 'B67 Seuil Défaut Mesure Bascule D200', address: '%MW1562' },
        { name: 'B67 Tempo Défaut Mesure Bascule D200', address: '%MW1563' },
      ],
    },
    {
      id: 'Stockage',
      label: 'Stockage',
      parameters: [
        { name: 'SUP Inhibition Défaut Position Vanne Stockage D10 Cuve 1', address: '%MW1620:X0' },
        { name: 'SUP Inhibition Défaut Position Vanne Stockage D10 Cuve 2', address: '%MW1620:X1' },
        { name: 'SUP Inhibition Défaut Aucune Vanne Ouverte Cuves Stockage D10', address: '%MW1620:X2' },
        { name: 'SUP Inhibition Défaut Toutes Vannes Ouvertes Cuves Stockage D10', address: '%MW1620:X3' },
        { name: 'SUP Inhibition Défaut Niveau Bas Stockage D10 Cuve 1', address: '%MW1620:X4' },
        { name: 'SUP Inhibition Défaut Niveau Bas Stockage D10 Cuve 2', address: '%MW1620:X5' },
        { name: 'SUP Inhibition Défaut Niveau Bas Stockage D200', address: '%MW1620:X6' },
        { name: 'SUP Inhibition Défaut Niveau Bas Stockage Huile Minérale', address: '%MW1620:X7' },
      ],
    },
    {
      id: 'Tremie-Poudre',
      label: 'Trémie Poudre',
      parameters: [
        { name: 'B12 Consigne Poids Maxi Fin Remplissage Trémie Poudre', address: '%MW1129' },
        { name: 'B12 Consigne Poids Mini Validation Remplissage Masqué Trémie Poudre', address: '%MW1125' },
        { name: 'B12 Consigne Poids Mini Forçage Remplissage Trémie Poudre', address: '%MW1128' },
        { name: 'B12 Durée Disponible pour Remplissage Trémie Poudre (mn)', address: '%MW1137' },
        { name: 'B12 Consigne Seuil Immobilité Bascule Poudre', address: '%MW1123' },
        { name: 'B12 Consigne Tempo Immobilité Bascule Poudre', address: '%MW1124' },
        { name: 'B12 Consigne Seuil DF Surcharge Bascule Poudre', address: '%MW1126' },
        { name: 'B12 Consigne Tempo DF Surcharge Bascule Poudre', address: '%MW1127' },
        { name: 'B12 Consigne Ecart Dosage Passage PV Bascule Poudre', address: '%MW1130' },
        { name: 'B12 Erreur de Jetée Maxi', address: '%MW1133' },
        { name: 'B12 Consigne Tempo Absence Demande Dosage Validation Remplissage', address: '%MW1134' },
        { name: 'B12 Consigne Tempo Transition Dosage GV->PV', address: '%MW1135' },
        { name: 'B12 Consigne Tempo DF FdC Vannes', address: '%MW1120' },
        { name: 'B12 Consigne Tempo DF Remplissage', address: '%MW1121' },
        { name: 'B12 Consigne Tempo DF Extraction Poudre', address: '%MW1122' },
        { name: 'B12 Consigne Tempo Blocage Poids', address: '%MW1136' },
        { name: 'B12 Seuil Défaut Mesure Bascule Poudre', address: '%MW1138' },
        { name: 'B12 Tempo Défaut Mesure Bascule Poudre', address: '%MW1139' },
        { name: 'B35 Consigne Poids Maxi Fin Remplissage Trémie Poudre', address: '%MW1329' },
        { name: 'B35 Consigne Poids Mini Validation Remplissage Masqué Trémie Poudre', address: '%MW1325' },
        { name: 'B35 Consigne Poids Mini Forçage Remplissage Trémie Poudre', address: '%MW1328' },
        { name: 'B35 Durée Disponible pour Remplissage Trémie Poudre (mn)', address: '%MW1337' },
        { name: 'B35 Consigne Seuil Immobilité Bascule Poudre', address: '%MW1323' },
        { name: 'B35 Consigne Tempo Immobilité Bascule Poudre', address: '%MW1324' },
        { name: 'B35 Consigne Seuil DF Surcharge Bascule Poudre', address: '%MW1326' },
        { name: 'B35 Consigne Tempo DF Surcharge Bascule Poudre', address: '%MW1327' },
        { name: 'B35 Consigne Ecart Dosage Passage PV Bascule Poudre', address: '%MW1330' },
        { name: 'B35 Erreur de Jetée Maxi', address: '%MW1333' },
        { name: 'B35 Consigne Tempo Absence Demande Dosage Validation Remplissage', address: '%MW1334' },
        { name: 'B35 Consigne Tempo Transition Dosage GV->PV', address: '%MW1335' },
        { name: 'B35 Consigne Tempo DF FdC Vannes', address: '%MW1320' },
        { name: 'B35 Consigne Tempo DF Remplissage', address: '%MW1321' },
        { name: 'B35 Consigne Tempo DF Extraction Poudre', address: '%MW1322' },
        { name: 'B35 Consigne Tempo Blocage Poids', address: '%MW1336' },
        { name: 'B35 Seuil Défaut Mesure Bascule Poudre', address: '%MW1338' },
        { name: 'B35 Tempo Défaut Mesure Bascule Poudre', address: '%MW1339' },
        { name: 'B67 Consigne Poids Maxi Fin Remplissage Trémie Poudre', address: '%MW1529' },
        { name: 'B67 Consigne Poids Mini Validation Remplissage Masqué Trémie Poudre', address: '%MW1525' },
        { name: 'B67 Consigne Poids Mini Forçage Remplissage Trémie Poudre', address: '%MW1528' },
        { name: 'B67 Durée Disponible pour Remplissage Trémie Poudre (mn)', address: '%MW1537' },
        { name: 'B67 Consigne Seuil Immobilité Bascule Poudre', address: '%MW1523' },
        { name: 'B67 Consigne Tempo Immobilité Bascule Poudre', address: '%MW1524' },
        { name: 'B67 Consigne Seuil DF Surcharge Bascule Poudre', address: '%MW1526' },
        { name: 'B67 Consigne Tempo DF Surcharge Bascule Poudre', address: '%MW1527' },
        { name: 'B67 Consigne Ecart Dosage Passage PV Bascule Poudre', address: '%MW1530' },
        { name: 'B67 Erreur de Jetée Maxi', address: '%MW1533' },
        { name: 'B67 Consigne Tempo Absence Demande Dosage Validation Remplissage', address: '%MW1534' },
        { name: 'B67 Consigne Tempo Transition Dosage GV->PV', address: '%MW1535' },
        { name: 'B67 Consigne Tempo DF FdC Vannes', address: '%MW1520' },
        { name: 'B67 Consigne Tempo DF Remplissage', address: '%MW1521' },
        { name: 'B67 Consigne Tempo DF Extraction Poudre', address: '%MW1522' },
        { name: 'B67 Consigne Tempo Blocage Poids', address: '%MW1536' },
        { name: 'B67 Seuil Défaut Mesure Bascule Poudre', address: '%MW1538' },
        { name: 'B67 Tempo Défaut Mesure Bascule Poudre', address: '%MW1539' },
      ],
    },
    {
      id: 'Transfert-Poudre',
      label: 'Transfert Poudre',
      parameters: [
        { name: 'TRF Consigne Tempo Surpression PSH Transfert', address: '%MW1605' },
        { name: 'TRF Consigne Tempo Niveau Haut Colmatage Cône de Dégazage', address: '%MW1606' },
        { name: 'TRF Consigne Tempo Temps de Marche Remplissage Minimal', address: '%MW1607' },
        { name: 'TRF Consigne Tempo Balayage', address: '%MW1608' },
        { name: 'TRF Consigne Tempo Nettoyage', address: '%MW1609' },
        { name: 'TRF Consigne Prolongation Marche Surpresseur', address: '%MW1614' },
        { name: 'TRF Consigne Prolongation Marche Fluidisation Silo', address: '%MW1615' },
        { name: 'TRF Consigne Tempo Cascade Ouverture Vanne Silo', address: '%MW1610' },
        { name: 'TRF Consigne Tempo Cascade Marche Ecluse Sortie Silo', address: '%MW1611' },
        { name: 'TRF Consigne Tempo Absence PAH Validation Ecluse Amont', address: '%MW1612' },
        { name: 'TRF Consigne Tempo Absence LSH Validation Ecluse Amont', address: '%MW1613' },
      ],
    },
  ];

  const handleParameterChange = (address: string, value: string) => {
    setParameterValues({ ...parameterValues, [address]: value });
  };

  const handleSaveParameters = async (categoryId: string) => {
    const category = parameterCategories.find(c => c.id === categoryId);
    if (!category) return;
    
    // Ici, vous pouvez ajouter l'appel API pour sauvegarder les paramètres
    const paramsToSave = category.parameters
      .filter(p => parameterValues[p.address])
      .map(p => ({
        address: p.address,
        value: parameterValues[p.address],
      }));
    
    console.log('Sauvegarde des paramètres:', paramsToSave);
    alert(`Paramètres de ${category.label} sauvegardés avec succès`);
    // TODO: Appel API pour sauvegarder
  };

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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Paramètres du cahier des charges</h2>
        </div>

        {/* Onglets pour les catégories de paramètres */}
        <div className="border-b mb-4">
          <nav className="flex space-x-4 overflow-x-auto">
            {parameterCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveParamTab(category.id)}
                className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeParamTab === category.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {category.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Contenu des onglets */}
        {parameterCategories.map((category) => (
          activeParamTab === category.id && (
            <div key={category.id} className="space-y-4">
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => handleSaveParameters(category.id)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Sauvegarder les paramètres
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                {category.parameters.map((param, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {param.name}
                    </label>
                    <div className="text-xs text-gray-500 mb-2 font-mono">{param.address}</div>
                    <input
                      type="text"
                      value={parameterValues[param.address] || ''}
                      onChange={(e) => handleParameterChange(param.address, e.target.value)}
                      placeholder="Valeur"
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
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
