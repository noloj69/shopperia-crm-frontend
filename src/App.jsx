import React, { useState } from 'react';
import Layout from './components/layout/Layout';
import { useData } from './context/DataContext';

import Login from './views/Login';

import Dashboard from './views/Dashboard';
import PaketTerkendala from './views/PaketTerkendala';
import Orders from './views/Orders';
import FollowUpTemplates from './views/FollowUpTemplates';
import CSRanking from './views/CSRanking';
import ImportHistory from './views/ImportHistory';
import UserManagement from './views/UserManagement';

const App = () => {
  const { currentUser } = useData();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Effect: if the user tries to access a tab they don't have permission for,
  // push them to their first available permitted tab.
  React.useEffect(() => {
    if (currentUser && !currentUser.permissions.includes(activeTab) && activeTab !== 'usermanagement') {
      if (currentUser.permissions.length > 0) {
        // Exclude 'usermanagement' from auto-routing if they aren't superadmin
        const permittedTabs = currentUser.permissions.filter(p => p !== 'usermanagement');
        if (permittedTabs.length > 0) {
          setActiveTab(permittedTabs[0]);
        }
      }
    }
  }, [currentUser, activeTab]);

  if (!currentUser) {
    return <Login />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'terkendala' && <PaketTerkendala />}
      {activeTab === 'orders' && <Orders />}
      {activeTab === 'templates' && currentUser?.permissions?.includes('templates') && <FollowUpTemplates />}
      {activeTab === 'import_history' && currentUser?.permissions?.includes('import_history') && <ImportHistory />}
      {activeTab === 'ranking' && currentUser?.permissions?.includes('ranking') && <CSRanking />}
      {activeTab === 'usermanagement' && currentUser?.role === 'superadmin' && <UserManagement />}
    </Layout>
  );
};

export default App;
