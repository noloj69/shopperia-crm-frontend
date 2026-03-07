import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { MessageCircle, Save } from 'lucide-react';
import './Dashboard.css';

const FollowUpTemplates = () => {
    const { waTemplates, updateWaTemplate } = useData();

    // Local state for edits
    const [templates, setTemplates] = useState(waTemplates);
    const [savedCategory, setSavedCategory] = useState(null);

    const handleChange = (category, value) => {
        setTemplates(prev => ({ ...prev, [category]: value }));
    };

    const handleSave = (category) => {
        updateWaTemplate(category, templates[category]);
        setSavedCategory(category);
        setTimeout(() => setSavedCategory(null), 2000);
    };

    const categories = [
        { key: 'Stuck', label: 'Template Paket Stuck (>48 Jam)', desc: 'Digunakan ketika status monitoring menunjukkan paket stuck.' },
        { key: 'PaketBermasalah', label: 'Template Paket Bermasalah', desc: 'Digunakan ketika kurir tidak menemukan alamat atau penerima tidak bisa dihubungi.' },
        { key: 'Undelivery', label: 'Template Undelivery / RTS', desc: 'Digunakan ketika paket diretur atau pembeli menolak.' },
        { key: 'Default', label: 'Template Standar (Lainnya)', desc: 'Digunakan untuk status pengiriman normal.' }
    ];

    return (
        <div className="dashboard-content">
            <div className="dashboard-header mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark">Teks Follow Up</h1>
                    <p className="text-muted">Kustomisasi template pesan WhatsApp untuk berbagai status pengiriman.</p>
                </div>
            </div>

            <div className="grid gap-4" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.5rem', maxWidth: '800px' }}>
                <div className="card">
                    <div className="card-header bg-primary bg-opacity-10 text-primary p-4 rounded-t-lg border-b border-gray-100 flex items-center gap-2">
                        <MessageCircle size={20} />
                        <h2 className="font-semibold">Panduan Variabel</h2>
                    </div>
                    <div className="card-body p-4 text-sm text-gray-700 leading-relaxed bg-white rounded-b-lg shadow-sm">
                        <p>Gunakan variabel berikut di dalam teks Anda. Sistem akan otomatis menggantinya dengan data pelanggan saat tombol Follow Up ditekan:</p>
                        <ul className="mt-2" style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                            <li><code>{'{name}'}</code> - Nama Pembeli</li>
                            <li><code>{'{product}'}</code> - Nama Produk yang dipesan</li>
                            <li><code>{'{awb}'}</code> - Nomor Resi / AWB</li>
                            <li><code>{'{courier}'}</code> - Nama Ekspedisi</li>
                        </ul>
                    </div>
                </div>

                {categories.map((cat) => (
                    <div key={cat.key} className="card shadow-sm rounded-lg border border-gray-100 bg-white overflow-hidden">
                        <div className="card-header p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-lg text-dark">{cat.label}</h3>
                                <p className="text-xs text-muted mt-1">{cat.desc}</p>
                            </div>
                        </div>
                        <div className="card-body p-4">
                            <textarea
                                className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary mb-3"
                                rows="4"
                                value={templates[cat.key]}
                                onChange={(e) => handleChange(cat.key, e.target.value)}
                                style={{ width: '100%', resize: 'vertical' }}
                            ></textarea>

                            <div className="flex justify-end">
                                <button
                                    className="btn btn-primary flex items-center gap-2"
                                    onClick={() => handleSave(cat.key)}
                                >
                                    <Save size={16} />
                                    {savedCategory === cat.key ? 'Tersimpan!' : 'Simpan Template'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FollowUpTemplates;
