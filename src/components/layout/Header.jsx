import React, { useRef } from 'react';
import { Search, Bell, UploadCloud, Moon, Sun, CheckCircle, Menu, ChevronLeft } from 'lucide-react';
import { useData } from '../../context/DataContext';
import './Header.css';

const Header = ({ toggleSidebar, toggleMobileMenu, isSidebarCollapsed }) => {
    const { importOrdersFromExcel, isDarkMode, toggleDarkMode, toastMessage } = useData();
    const fileInputRef = useRef(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
            alert("Please upload a valid Excel or CSV file.");
            return;
        }

        importOrdersFromExcel(file);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <header className="header" style={{ position: 'relative' }}>
            {toastMessage && (
                <div style={{
                    position: 'absolute', top: '100%', right: '20px', marginTop: '10px',
                    backgroundColor: '#10b981', color: 'white', padding: '12px 24px',
                    borderRadius: '8px', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', animation: 'dropdownPop 0.3s ease-out'
                }}>
                    <CheckCircle size={18} />
                    <span style={{ fontWeight: 500, fontSize: '14px' }}>{toastMessage}</span>
                </div>
            )}
            <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button className="icon-btn mobile-menu-btn" onClick={toggleMobileMenu}>
                    <Menu size={20} />
                </button>
                <button className="icon-btn desktop-menu-btn" onClick={toggleSidebar}>
                    {isSidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                </button>

                <div className="search-container">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Order ID..."
                        className="search-input"
                    />
                </div>
            </div>

            <div className="header-actions">
                <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
                <button className="btn btn-outline import-btn" onClick={handleImportClick}>
                    <UploadCloud size={16} /> Import Excel
                </button>
                <button className="icon-btn" onClick={toggleDarkMode} title="Mode Gelap/Terang">
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button className="icon-btn">
                    <Bell size={20} />
                    <span className="notification-dot"></span>
                </button>
            </div>
        </header>
    );
};

export default Header;
