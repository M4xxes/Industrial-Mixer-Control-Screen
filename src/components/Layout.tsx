
import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  BookOpen, 
  Settings, 
  AlertTriangle, 
  History, 
  Package,
  Hand,
  Factory,
  LogOut,
  User,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout, hasAccess } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productionMenuOpen, setProductionMenuOpen] = useState(false);

  const navItems: Array<{ path: string; label: string; icon: any; roles: UserRole[] }> = [
    { path: '/', label: 'Vue d\'ensemble', icon: LayoutDashboard, roles: ['Admin'] },
    { path: '/recipes', label: 'Recettes', icon: BookOpen, roles: ['Admin'] },
    { path: '/manual', label: 'Mode Manuel', icon: Hand, roles: ['Admin'] },
    // { path: '/inventory', label: 'Stocks', icon: Package, roles: ['Admin', 'B1/2', 'B3/5', 'B6/7', 'Operator', 'Viewer'] }, // Masqué temporairement
    { path: '/alarms', label: 'Alarmes', icon: AlertTriangle, roles: ['Admin', 'B1/2', 'B3/5', 'B6/7', 'Operator', 'Viewer'] },
    { path: '/history', label: 'Historique', icon: History, roles: ['Admin', 'B1/2', 'B3/5', 'B6/7', 'Operator', 'Viewer'] },
    { path: '/maintenance', label: 'Maintenance', icon: Settings, roles: ['Admin'] },
  ];

  const productionItems: Array<{ path: string; label: string; roles: UserRole[] }> = [
    { path: '/production/B1-2', label: 'Production BUTYL1/2', roles: ['Admin', 'B1/2'] },
    { path: '/production/B3-5', label: 'Production BUTYL3/5', roles: ['Admin', 'B3/5'] },
    { path: '/production/B6-7', label: 'Production BUTYL6/7', roles: ['Admin', 'B6/7'] },
  ];

  const visibleNavItems = navItems.filter(item => hasAccess(item.roles));
  const visibleProductionItems = productionItems.filter(item => hasAccess(item.roles));
  const hasProductionAccess = visibleProductionItems.length > 0;
  const isProductionActive = location.pathname.startsWith('/production/');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <h1 className="text-lg sm:text-xl font-bold text-primary-600 whitespace-nowrap">
                Supervision Multi-Malaxeurs
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:flex-1 lg:justify-center lg:space-x-1 xl:space-x-2">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-2 xl:px-3 py-2 border-b-2 text-xs xl:text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-1 xl:mr-2" />
                    <span className="hidden xl:inline">{item.label}</span>
                    <span className="xl:hidden">{item.label.split(' ')[0]}</span>
                  </Link>
                );
              })}
              
              {/* Production Dropdown */}
              {hasProductionAccess && (
                <div className="relative">
                  <button
                    onMouseEnter={() => setProductionMenuOpen(true)}
                    onMouseLeave={() => setProductionMenuOpen(false)}
                    className={`inline-flex items-center px-2 xl:px-3 py-2 border-b-2 text-xs xl:text-sm font-medium whitespace-nowrap transition-colors ${
                      isProductionActive
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Factory className="w-4 h-4 mr-1 xl:mr-2" />
                    <span className="hidden xl:inline">Production</span>
                    <span className="xl:hidden">Prod</span>
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </button>
                  {productionMenuOpen && (
                    <div
                      onMouseEnter={() => setProductionMenuOpen(true)}
                      onMouseLeave={() => setProductionMenuOpen(false)}
                      className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200 z-50"
                    >
                      {visibleProductionItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`block px-4 py-2 text-sm ${
                              isActive
                                ? 'bg-primary-50 text-primary-700 font-medium'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User info and logout */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="hidden md:inline whitespace-nowrap">{user?.username}</span>
                <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs whitespace-nowrap">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center px-2 sm:px-3 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors whitespace-nowrap"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
              {hasProductionAccess && (
                <div className="border-t pt-2 mt-2">
                  <div className="px-3 py-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Production
                  </div>
                  {visibleProductionItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center px-6 py-2 rounded-md text-base font-medium ${
                          isActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Factory className="w-5 h-5 mr-3" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

