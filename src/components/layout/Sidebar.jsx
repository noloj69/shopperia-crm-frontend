import React from 'react';
import { LayoutDashboard, AlertCircle, Package, MessageCircle, Trophy, History, LogOut, Users } from 'lucide-react';
import { useData } from '../../context/DataContext';
import './Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { logout, currentUser } = useData();

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'terkendala', label: 'Paket Terkendala', icon: AlertCircle },
    { id: 'orders', label: 'All Orders', icon: Package },
    { id: 'templates', label: 'Teks Follow Up', icon: MessageCircle },
    { id: 'import_history', label: 'Riwayat Import', icon: History },
    { id: 'ranking', label: 'Peringkat CS', icon: Trophy },
    { id: 'usermanagement', label: 'Manajemen Pengguna', icon: Users, reqSuperadmin: true },
  ];

  const menuItems = allMenuItems.filter(item => {
    if (currentUser?.role === 'superadmin') return true;
    if (item.reqSuperadmin && currentUser?.role !== 'superadmin') return false;
    return currentUser?.permissions?.includes(item.id);
  });

  // Extract initials directly using fallback if currentUser is somehow missing
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">CS</div>
        <span className="brand-text">Shopperia CRM</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={20} className="nav-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="user-avatar">{getInitials(currentUser?.name)}</div>
            <div className="user-details" style={{ maxWidth: '100px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              <span className="user-name">{currentUser?.name || 'User'}</span>
              <span className="user-role" style={{ textTransform: 'capitalize' }}>
                {currentUser?.role === 'superadmin' ? 'Admin Utama' : 'CS Staff'}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}
            title="Keluar / Logout"
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
