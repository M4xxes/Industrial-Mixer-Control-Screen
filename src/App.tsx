import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RecipesPage from './pages/RecipesPage';
import MixerDetail from './pages/MixerDetail';
import ManualModePage from './pages/ManualModePage';
import InventoryPage from './pages/InventoryPage';
import AlarmsPage from './pages/AlarmsPage';
import HistoryPage from './pages/HistoryPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/mixer/:id" element={<MixerDetail />} />
          <Route path="/manual" element={<ManualModePage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/alarms" element={<AlarmsPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

