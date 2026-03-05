import { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole, MixerGroup } from '../types';

interface AuthContextType {
  user: { id: string; username: string; role: UserRole; mixerGroup?: MixerGroup | null } | null;
  login: (user: { id: string; username: string; role: UserRole; mixerGroup?: MixerGroup | null }) => void;
  logout: () => void;
  isAdmin: () => boolean;
  hasAccess: (requiredRole: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; username: string; role: UserRole; mixerGroup?: MixerGroup | null } | null>(() => {
    // Charger depuis localStorage au démarrage
    const saved = localStorage.getItem('auth');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (authUser: { id: string; username: string; role: UserRole; mixerGroup?: MixerGroup | null }) => {
    const userData = authUser;
    setUser(userData);
    localStorage.setItem('auth', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth');
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

