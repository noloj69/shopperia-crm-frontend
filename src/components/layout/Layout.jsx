import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, activeTab, setActiveTab }) => {
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
                <main className="content-area">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
