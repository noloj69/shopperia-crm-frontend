import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { History, FileSpreadsheet, Trash2, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { format } from 'date-fns';
import './ImportHistory.css';

const ImportHistory = () => {
    const { importSessions, undoImport } = useData();
    const [sessionToCancel, setSessionToCancel] = useState(null);

    const handleConfirmCancel = () => {
        if (sessionToCancel) {
            undoImport(sessionToCancel.id);
            setSessionToCancel(null);
        }
    };

    return (
        <div className="import-history-view">
            <div className="page-header-row">
                <div>
                    <h1 className="page-title">Riwayat Import</h1>
                    <p className="page-subtitle">Pusat kontrol data Excel yang diunggah ke sistem</p>
                </div>
                <div className="header-icon-wrapper blue">
                    <History size={24} />
                </div>
            </div>

            <div className="card full-width-card mt-6">
                <div className="card-header border-b">
                    <h2 className="card-title text-base font-semibold">Riwayat Unggahan Terbaru</h2>
                </div>

                {importSessions.length === 0 ? (
                    <div className="empty-state">
                        <FileSpreadsheet size={48} className="empty-icon" />
                        <p className="empty-title">Belum ada riwayat import.</p>
                        <p className="empty-desc">Silakan unggah file Excel dari halaman Semua Pesanan.</p>
                    </div>
                ) : (
                    <div className="history-list">
                        {importSessions.map(session => (
                            <div key={session.id} className={`history-item ${session.canceled ? 'canceled' : ''}`}>
                                <div className="history-item-content">
                                    <div className="history-icon-box">
                                        <FileSpreadsheet size={24} />
                                    </div>
                                    <div className="history-details">
                                        <h3 className="history-item-title">
                                            {session.filename}
                                            <span className="badge-count">
                                                +{session.count} Pesanan
                                            </span>
                                            {session.canceled && (
                                                <span className="badge-canceled">Dibatalkan</span>
                                            )}
                                        </h3>
                                        <time className="history-item-date">
                                            {format(new Date(session.date), 'dd MMM yyyy, HH:mm')}
                                        </time>
                                    </div>
                                </div>
                                <div className="history-actions">
                                    {!session.canceled && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSessionToCancel(session);
                                            }}
                                            className="cancel-import-btn"
                                            type="button"
                                        >
                                            <Trash2 size={16} />
                                            <span>Batal Import</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="info-banner mt-6">
                <AlertCircle size={20} className="info-icon" />
                <p><strong>Catatan Penting:</strong> Membatalkan import akan menghapus semua pesanan yang masuk pada sesi tersebut secara permanen dari daftar Anda. Pastikan untuk meninjau kembali sebelum melakukan pembatalan.</p>
            </div>

            {/* Custom Confirmation Modal */}
            {sessionToCancel && (
                <div className="modal-overlay" onClick={() => setSessionToCancel(null)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-body">
                            <div className="modal-header-flex">
                                <div className="modal-icon-wrapper">
                                    <AlertTriangle size={24} />
                                </div>
                                <div className="modal-text-content">
                                    <h3 className="modal-title">Batalkan Import Data</h3>
                                    <p className="modal-desc">
                                        Anda yakin ingin membatalkan unggahan <span className="font-semibold">"{sessionToCancel.filename}"</span>?
                                        Tindakan ini akan menghapus permanen <strong>{sessionToCancel.count} pesanan</strong> dari sistem.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={() => setSessionToCancel(null)}
                                className="btn-cancel"
                            >
                                Kembali
                            </button>
                            <button
                                onClick={handleConfirmCancel}
                                className="btn-danger"
                            >
                                <Trash2 size={16} />
                                Ya, Batalkan Import
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportHistory;
