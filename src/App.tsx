import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import IncidentReports from './pages/IncidentReports';
import MessengerBotLogs from './pages/MessengerBotLogs';
import ScraperFeed from './pages/ScraperFeed';
import GeospatialMap from './pages/GeospatialMap';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        {/* All pages that share the sidebar + header */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/incident-reports" element={<IncidentReports />} />
          <Route path="/messenger-bot-logs" element={<MessengerBotLogs />} />
          <Route path="/scraper-feed" element={<ScraperFeed />} />
          <Route path="/geospatial-map" element={<GeospatialMap />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;