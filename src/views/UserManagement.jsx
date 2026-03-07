import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { UserPlus, UserCog, Trash2, CheckSquare, XSquare, Search } from 'lucide-react';
import './UserManagement.css';

const UserManagement = () => {
    const { users, addUser, deleteUser, editUser, showToast, currentUser, globalOrders } = useData();
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const existingCSNames = [...new Set(globalOrders?.map(o => o.csToken))].filter(Boolean).sort();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'staff',
        csName: '',
        permissions: []
    });

    const availablePermissions = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'terkendala', label: 'Paket Terkendala' },
        { id: 'orders', label: 'All Orders' },
        { id: 'templates', label: 'Teks Follow Up' },
        { id: 'import_history', label: 'Riwayat Import' },
        { id: 'ranking', label: 'Peringkat CS' }
    ];

    const handlePermissionToggle = (permId) => {
        setFormData(prev => {
            const perms = prev.permissions;
            if (perms.includes(permId)) {
                return { ...prev, permissions: perms.filter(p => p !== permId) };
            } else {
                return { ...prev, permissions: [...perms, permId] };
            }
        });
    };

    const handleAddSubmit = (e) => {
        e.preventDefault();
        if (formData.permissions.length === 0 && formData.role !== 'superadmin') {
            showToast('Error: User harus memiliki minimal 1 akses menu!');
            return;
        }
        if (formData.role === 'cs' && !formData.csName) {
            showToast('Error: Harap pilih Nama CS untuk integrasi order!');
            return;
        }

        if (isEditing) {
            editUser({ ...formData, id: isEditing });
            showToast(`User ${formData.name} berhasil diperbarui!`);
        } else {
            addUser(formData);
            showToast(`User ${formData.name} berhasil ditambahkan!`);
        }

        setIsAdding(false);
        setIsEditing(null);
        setFormData({ name: '', email: '', phone: '', password: '', role: 'staff', csName: '', permissions: [] });
    };

    const handleEditClick = (user) => {
        setFormData({
            name: user.name,
            email: user.email,
            phone: user.phone,
            password: user.password,
            role: user.role,
            csName: user.csName || '',
            permissions: user.permissions || []
        });
        setIsEditing(user.id);
        setIsAdding(true);
    };

    const handleDeleteClick = (id, name) => {
        if (id === currentUser.id) {
            showToast("Error: Anda tidak bisa menghapus akun Anda sendiri!");
            return;
        }
        setConfirmDelete({ id, name });
    };

    const confirmDeleteAction = () => {
        if (confirmDelete) {
            deleteUser(confirmDelete.id);
            showToast(`User ${confirmDelete.name} berhasil dihapus.`);
            setConfirmDelete(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="view-container">
            <div className="view-header">
                <div className="header-title">
                    <h1>Manajemen Pengguna</h1>
                    <p>Atur staf, kredensial login, dan hak akses dashboard.</p>
                </div>
                <button className="btn btn-primary" onClick={() => {
                    setFormData({ name: '', email: '', phone: '', password: '', role: 'staff', csName: '', permissions: [] });
                    setIsEditing(null);
                    setIsAdding(true);
                }}>
                    <UserPlus size={18} />
                    <span>Tambah Pengguna Biasa</span>
                </button>
            </div>

            <div className="um-controls">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        className="input-base"
                        type="text"
                        placeholder="Cari nama atau email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-card">
                <div className="table-responsive">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>Nama Pengguna</th>
                                <th>Kontak Info</th>
                                <th>Peran</th>
                                <th>Akses Menu</th>
                                <th className="text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="u-avatar">{u.name.substring(0, 2).toUpperCase()}</div>
                                            <div className="u-details">
                                                <span className="u-name">{u.name}</span>
                                                <span className="u-id">ID: {u.id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="u-contact">
                                            <span>{u.email}</span>
                                            <span>{u.phone}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`role-badge ${u.role === 'superadmin' ? 'superadmin' : 'staff'}`}>
                                            {u.role === 'superadmin' ? 'Admin Utama' : u.role === 'cs' ? 'CS Staff' : 'Staff Umum'}
                                        </span>
                                        {u.role === 'cs' && u.csName && (
                                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                                Integrasi: {u.csName}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div className="u-permissions">
                                            {u.role === 'superadmin' ? (
                                                <span className="perm-tag all-access">Full Access (All Menus)</span>
                                            ) : (
                                                u.permissions.map(p => {
                                                    const label = availablePermissions.find(ap => ap.id === p)?.label || p;
                                                    return <span key={p} className="perm-tag">{label}</span>
                                                })
                                            )}
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button className="btn-icon" style={{ color: 'var(--color-primary)' }} onClick={() => handleEditClick(u)} title="Edit User">
                                                <UserCog size={18} />
                                            </button>
                                            {u.id !== currentUser.id && (
                                                <button className="btn-icon delete" onClick={() => handleDeleteClick(u.id, u.name)} title="Hapus User">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center py-6">Tidak ada user yang ditemukan.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isAdding && (
                <div className="modal-overlay">
                    <div className="modal-content um-modal">
                        <div className="modal-header">
                            <h3>{isEditing ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
                            <p>Berikan detail login dan tentukan akses menu khusus staf ini.</p>
                        </div>
                        <form onSubmit={handleAddSubmit}>
                            <div className="um-form-grid">
                                <div className="um-input-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Peran/Role User</label>
                                    <select className="input-base" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} disabled={isEditing === currentUser.id}>
                                        <option value="staff">Staff Umum (Dapat melihat semua data dashboard)</option>
                                        <option value="cs">CS Spesifik (Hanya melihat data paket miliknya)</option>
                                        <option value="superadmin">Admin Utama (Akses penuh dan bebas kontrol akun)</option>
                                    </select>
                                    {isEditing === currentUser.id && <small style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>Peran akun Anda sendiri tidak dapat diturunkan.</small>}
                                </div>

                                {formData.role === 'cs' && (
                                    <div className="um-input-group" style={{ gridColumn: '1 / -1' }}>
                                        <label>Integrasi Nama CS (Pilih dari data sistem)</label>
                                        <select className="input-base" required value={formData.csName} onChange={e => setFormData({ ...formData, csName: e.target.value })}>
                                            <option value="">-- Pilih Nama CS di Sistem --</option>
                                            {existingCSNames.map(name => (
                                                <option key={name} value={name}>{name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="um-input-group">
                                    <label>Nama Lengkap</label>
                                    <input className="input-base" type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Contoh: CS Budi" />
                                </div>
                                <div className="um-input-group">
                                    <label>Email (Untuk Login)</label>
                                    <input className="input-base" type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="budi@contoh.com" />
                                </div>
                                <div className="um-input-group">
                                    <label>No. WhatsApp (Untuk Login alternatif)</label>
                                    <input className="input-base" type="text" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="081234..." />
                                </div>
                                <div className="um-input-group">
                                    <label>Password Akun</label>
                                    <input className="input-base" type="text" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Buat password login..." />
                                </div>
                            </div>

                            {formData.role !== 'superadmin' && (
                                <div className="um-permissions-section">
                                    <h4>Otorisasi Akses Menu</h4>
                                    <p className="subtext">Pilih menu apa saja yang boleh dibuka oleh user ini:</p>
                                    <div className="perm-grid">
                                        {availablePermissions.map(perm => (
                                            <label key={perm.id} className={`perm-checkbox ${formData.permissions.includes(perm.id) ? 'selected' : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.permissions.includes(perm.id)}
                                                    onChange={() => handlePermissionToggle(perm.id)}
                                                />
                                                <span className="perm-label">{perm.label}</span>
                                                {formData.permissions.includes(perm.id) ?
                                                    <CheckSquare className="check-icon active" size={18} /> :
                                                    <XSquare className="check-icon" size={18} />
                                                }
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setIsAdding(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">Simpan Pengguna</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {confirmDelete && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px', padding: '24px' }}>
                        <div className="modal-header">
                            <h3>Hapus User?</h3>
                            <p style={{ marginTop: '8px' }}>Yakin ingin menghapus <strong>{confirmDelete.name}</strong>? Akses login user ini akan dicabut permanen dan tindakan ini tidak dapat dibatalkan.</p>
                        </div>
                        <div className="modal-actions" style={{ marginTop: '24px' }}>
                            <button type="button" className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Batal</button>
                            <button type="button" className="btn" style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none' }} onClick={confirmDeleteAction}>Hapus Permanen</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
