import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ReportsProvider } from './context/ReportsContext';
import { NotificationProvider } from './context/NotificationContext';
import { BotConversationsProvider } from './context/BotConversationsContext';
import Landing from './website/Landing-Page';
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
      <NotificationProvider>
        <ReportsProvider>
          <BotConversationsProvider>
            <Routes>
              {/* Public routes — no login required */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />

              {/* Protected admin routes — wrapped in Layout */}
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
          </BotConversationsProvider>
        </ReportsProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;
