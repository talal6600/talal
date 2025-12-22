import React, { useState } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Fuel } from './pages/Fuel';
import { Reports } from './pages/Reports';
import { SettingsPage } from './pages/Settings';
import { Login } from './pages/Login';

const AppContent: React.FC = () => {
  const { currentUser } = useData();
  const [activeTab, setActiveTab] = useState('home');

  if (!currentUser) {
      return <Login />;
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'home': return <Dashboard />;
      case 'inventory': return <Inventory />;
      case 'fuel': return <Fuel />;
      case 'reports': return <Reports />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
