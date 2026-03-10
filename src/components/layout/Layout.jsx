import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useData } from '../../context/DataContext';

const Layout = ({ children, activeTab, setActiveTab }) => {
    const { isImporting, importProgress, isFetchingOrders } = useData();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Auto-close mobile menu on desktop resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setIsMobileMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close mobile menu when tab changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [activeTab]);

    return (
        <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
            {isImporting && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999,
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center',
                    backdropFilter: 'blur(4px)', color: 'white'
                }}>
                    <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Sedang Mengimpor Data...</h2>
                    <div style={{ width: '300px', height: '10px', backgroundColor: '#374151', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${importProgress}%`, height: '100%', backgroundColor: '#3B82F6', transition: 'width 0.3s ease' }}></div>
                    </div>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>{importProgress}% Selesai</p>
                </div>
            )}

            {isMobileMenuOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 }}
                ></div>
            )}

            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isCollapsed={isSidebarCollapsed}
                isMobileOpen={isMobileMenuOpen}
            />
            <div className="main-wrapper">
                <Header
                    toggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
                    toggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
                    isSidebarCollapsed={isSidebarCollapsed}
                />
                <main className="content-area" style={{ position: 'relative' }}>
                    {isFetchingOrders && (
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 50,
                            display: 'flex', flexDirection: 'column',
                            justifyContent: 'center', alignItems: 'center',
                            backdropFilter: 'blur(2px)'
                        }} className="dark:bg-gray-900/70">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" style={{ borderColor: '#e5e7eb', borderBottomColor: '#2563EB' }}></div>
                            <p className="text-gray-700 dark:text-gray-300 font-medium pb-20">Memuat data pesanan...</p>
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
