import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RecipesPage from './pages/RecipesPage';
import MixerDetail from './pages/MixerDetail';
import ProductionPage from './pages/ProductionPage';
import ManualModePage from './pages/ManualModePage';
import InventoryPage from './pages/InventoryPage';
import AlarmsPage from './pages/AlarmsPage';
import HistoryPage from './pages/HistoryPage';
import MaintenancePage from './pages/MaintenancePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/production/:pair" element={<ProductionPage />} />
            <Route path="/mixer/:id" element={<MixerDetail />} />
            <Route path="/manual" element={<ManualModePage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/alarms" element={<AlarmsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;

