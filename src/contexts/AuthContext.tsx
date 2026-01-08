import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserRole } from '../types';

interface AuthContextType {
  user: { username: string; role: UserRole } | null;
  login: (username: string, role: UserRole) => void;
  logout: () => void;
  isAdmin: () => boolean;
  hasAccess: (requiredRole: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ username: string; role: UserRole } | null>(() => {
    // Charger depuis localStorage au démarrage
    const saved = localStorage.getItem('auth');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    // Si pas d'utilisateur, demander connexion
    if (!user) {
      const username = prompt('Entrez votre nom d\'utilisateur:') || 'User';
      const role = prompt('Entrez votre rôle (Admin, B1/2, B3/5, B6/7, Operator, Viewer):') as UserRole || 'Viewer';
      const userData = { username, role };
      setUser(userData);
      localStorage.setItem('auth', JSON.stringify(userData));
    }
  }, [user]);

  const login = (username: string, role: UserRole) => {
    const userData = { username, role };
    setUser(userData);
    localStorage.setItem('auth', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth');
    // Redemander connexion
    const username = prompt('Entrez votre nom d\'utilisateur:') || 'User';
    const role = prompt('Entrez votre rôle (Admin, B1/2, B3/5, B6/7, Operator, Viewer):') as UserRole || 'Viewer';
    login(username, role);
  };

  const isAdmin = () => user?.role === 'Admin';

  const hasAccess = (requiredRole: UserRole | UserRole[]) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

