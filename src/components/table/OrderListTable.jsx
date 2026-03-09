import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { format, isToday, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from 'date-fns';
import { ChevronDown, MessageCircle, AlertCircle, Copy, CheckCircle, PackageCheck, PackageX, Truck, ShieldCheck, Clock, Ban, Search } from 'lucide-react';
import './OrderListTable.css';

import { useData } from '../../context/DataContext';

const TrackingModal = ({ isOpen, onClose, awb, courier, trackingData, isLoading, order }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" style={{ backdropFilter: 'blur(4px)' }} onClick={onClose}>
            <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col relative dark:bg-gray-800" style={{ maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10 bg-white dark:bg-gray-700 rounded-full p-1 shadow-sm border border-gray-100 dark:border-gray-600">
                    <PackageX size={24} />
                </button>

                <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
                    {/* Header */}
                    <div className="text-center mb-6 pt-2">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Informasi barang</h2>
                    </div>

                    {/* Info Card */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-5 mb-8 shadow-sm border border-gray-100 dark:border-gray-600">
                        <div className="flex mb-4 border-b border-gray-100 dark:border-gray-600 pb-4">
                            <span className="w-1/3 text-gray-800 font-bold text-sm dark:text-gray-200">Nama Penerima</span>
                            <span className="w-4 text-gray-800 dark:text-gray-200">:</span>
                            <span className="w-2/3 text-gray-500 dark:text-gray-400 font-medium">{order?.customer?.name || '-'}</span>
                        </div>
                        <div className="flex mb-4 border-b border-gray-100 dark:border-gray-600 pb-4">
                            <span className="w-1/3 text-gray-800 font-bold text-sm dark:text-gray-200">Kurir & Resi</span>
                            <span className="w-4 text-gray-800 dark:text-gray-200">:</span>
                            <span className="w-2/3 text-gray-500 dark:text-gray-400 font-medium">{courier} - {awb}</span>
                        </div>
                        <div className="flex">
                            <span className="w-1/3 text-gray-800 font-bold text-sm dark:text-gray-200">Keterangan</span>
                            <span className="w-4 text-gray-800 dark:text-gray-200">:</span>
                            <span className="w-2/3 text-gray-500 dark:text-gray-400 font-medium">{order?.product || '-'}</span>
                        </div>
                    </div>

                    {/* Tracking Badge */}
                    <div className="mb-6">
                        <span className="bg-primary text-white font-bold px-4 py-2 rounded-md shadow-sm inline-block tracking-wide">Tracking</span>
                    </div>

                    {/* Timeline */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                            <Clock size={32} className="animate-spin mb-3 text-primary" />
                            <p>Menghubungi Ekspedisi...</p>
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-gray-300 dark:border-gray-600 ml-4 pb-4">
                            {trackingData.map((item, index) => (
                                <div key={index} className="mb-4 ml-8 relative">
                                    <span className="absolute flex items-center justify-center w-8 h-8 rounded-full -left-[41px] ring-4 ring-gray-50 dark:ring-gray-800 bg-yellow-400 text-gray-900 shadow-sm z-10">
                                        <Truck size={16} />
                                    </span>
                                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-600 hover:shadow-md transition-shadow">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4">
                                            <h3 className="font-bold text-gray-700 dark:text-white text-[15px] leading-snug flex-1">{item.desc}</h3>
                                            <time className="flex items-center gap-1.5 text-xs font-medium text-gray-400 whitespace-nowrap pt-1 sm:pt-0">
                                                <Clock size={12} />
                                                {format(new Date(item.date), 'dd MMMM yyyy HH:mm')}
                                            </time>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

const OrderTableRow = ({ order }) => {
    const { updateOrderStatus, updateOrderCourierPhone, waTemplates, mockFetchTracking } = useData();
    const [copied, setCopied] = useState(false);
    const [courierPhone, setCourierPhone] = useState(order.courierInfo.kurirPhone || '');
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [isFollowedUp, setIsFollowedUp] = useState(() => {
        return localStorage.getItem(`followed_up_${order.id}`) === 'true';
    });
    const [isTrackingOpen, setIsTrackingOpen] = useState(false);
    const [trackingData, setTrackingData] = useState([]);
    const [isTrackingLoading, setIsTrackingLoading] = useState(false);

    const handleTrackResi = async () => {
        setIsTrackingOpen(true);
        setIsTrackingLoading(true);
        const data = await mockFetchTracking(order.courierInfo.awb, order.courierInfo.name, order.tracking.orderStatus);
        setTrackingData(data);
        setIsTrackingLoading(false);
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(order.awb || order.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSavePhone = () => {
        updateOrderCourierPhone(order.id, courierPhone);
        setIsEditingPhone(false);
    };

    // Construct WA Text dynamically based on status
    const getWaText = () => {
        let template = waTemplates.Default;
        if (order.tracking.statusCategory === 'Paket bermasalah') template = waTemplates.PaketBermasalah;
        if (order.tracking.statusCategory === 'Stuck') template = waTemplates.Stuck;
        if (order.tracking.orderStatus === 'RTS') template = waTemplates.Undelivery;

        let text = template
            .replace(/{name}/g, order.customer.name)
            .replace(/{product}/g, order.product)
            .replace(/{awb}/g, order.courierInfo.awb)
            .replace(/{courier}/g, order.courierInfo.name);

        return encodeURIComponent(text);
    };
    return (
        <div className="table-row">
            <div className="td td-checkbox">
                <input type="checkbox" className="row-checkbox" />
            </div>

            <div className="td td-id">
                <div className="id-text">
                    <span className="text-primary font-medium">{order.id}</span>
                </div>
                <div className="date-text">{format(new Date(order.date), "EEE dd MMM yyyy - HH:mm")}</div>
                <div className="warehouse-text badge-process" style={{ marginTop: '4px', display: 'inline-block' }}>{order.warehouse || 'EZ Bekasi'}</div>
            </div>

            <div className="td td-customer">
                <div className="customer-name">
                    {order.customer.name}
                    {order.customer.rtsFlag && <span className="rts-dot" title="RTS History">R</span>}
                </div>
                <div className="customer-phone">{order.customer.phone}</div>
                <div className="customer-ip text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>{order.address}</div>
            </div>

            <div className="td td-product">
                <div className="product-name">{order.product}</div>
            </div>

            <div className="td td-cs">
                <div className="cs-token">{order.csToken}</div>
            </div>

            <div className="td td-courier">
                <div className="courier-name pb-1 border-b border-gray-100 mb-1">
                    {order.courierInfo.name} -
                    <button
                        className="ml-1 text-primary hover:text-blue-800 font-medium underline-offset-2 hover:underline transition-all"
                        onClick={handleTrackResi}
                        title="Klik untuk Lacak Resi"
                    >
                        {order.courierInfo.awb}
                    </button>
                    <button className="copy-btn ml-2" onClick={handleCopy} title="Copy Resi">
                        {copied ? <CheckCircle size={12} className="text-success" /> : <Copy size={12} />}
                    </button>
                </div>
                <div className="fee-line"><span className="fee-label">Total / Nilai COD:</span> <span className="text-primary font-medium">{formatCurrency(order.courierInfo.nilaiCOD)}</span></div>
                <div className="courier-phone" style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isEditingPhone ? (
                        <>
                            <input
                                type="text"
                                placeholder="No. Kurir..."
                                value={courierPhone}
                                onChange={(e) => setCourierPhone(e.target.value)}
                                style={{ fontSize: '0.75rem', padding: '2px 4px', border: '1px solid #ccc', borderRadius: '4px', width: '90px' }}
                            />
                            <button onClick={handleSavePhone} className="text-primary hover:text-blue-700" title="Simpan" style={{ fontSize: '0.7rem', cursor: 'pointer', background: 'none', border: 'none', fontWeight: '500' }}>Save</button>
                        </>
                    ) : (
                        <>
                            {order.courierInfo.kurirPhone ? (
                                <a
                                    href={`https://wa.me/${order.courierInfo.kurirPhone}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ fontSize: '0.75rem', color: '#2563EB', textDecoration: 'none', fontWeight: '500' }}
                                    title="Hubungi Kurir via WA"
                                >
                                    {order.courierInfo.kurirPhone}
                                </a>
                            ) : (
                                <span style={{ fontSize: '0.75rem', color: '#999' }}>Input No. Kurir</span>
                            )}
                            <button onClick={() => setIsEditingPhone(true)} className="text-muted hover:text-primary" title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="td td-payment">
                <div className="payment-method">{order.paymentMethod}</div>
            </div>

            <div className="td td-note">
                <div className="note-text">{order.note}</div>
            </div>

            <div className="td td-status">
                <div className={`status-badge badge-${order.tracking.orderStatus === 'RTS' ? 'pending' : 'process'}`}>{order.tracking.orderStatus}</div>
                <div className={`status-badge badge-${order.tracking.statusCategory === 'Aman' ? 'success' : 'danger'}`}>{order.tracking.statusCategory}</div>
                <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '4px' }}>{order.tracking.statusText}</div>
            </div>

            <div className="td td-followup">
                <a
                    href={`https://wa.me/${order.customer.phone}?text=${getWaText()}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`btn-followup ${isFollowedUp ? 'followed' : ''}`}
                    onClick={() => {
                        setIsFollowedUp(true);
                        localStorage.setItem(`followed_up_${order.id}`, 'true');
                    }}
                    title="Kirim pesan WhatsApp sbg Follow Up"
                >
                    FOLLOW UP
                </a>
            </div>

            <div className="td td-action" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <select
                    className="filter-select"
                    value={order.tracking.orderStatus}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Delivered') updateOrderStatus(order.id, 'Aman', 'Pesanan telah sampai', 'Delivered');
                        else if (val === 'RTS') updateOrderStatus(order.id, 'Kritis', 'Pesanan diretur', 'RTS');
                        else if (val === 'Shipping') updateOrderStatus(order.id, order.tracking.statusCategory, 'Dalam proses pengiriman', 'Shipping');
                    }}
                    style={{ fontSize: '0.75rem', padding: '4px', height: 'auto', width: '110px' }}
                >
                    <option disabled value="">Ubah Status</option>
                    <option value="Shipping">Shipping</option>
                    <option value="Delivered">Delivered</option>
                    <option value="RTS">RTS</option>
                </select>

                <select
                    className="filter-select"
                    value={order.tracking.statusCategory}
                    onChange={(e) => {
                        const val = e.target.value;
                        let text = order.tracking.statusText;
                        if (val === 'Stuck') text = 'Stuck > 48 hours';
                        if (val === 'Paket bermasalah') text = 'Alamat tidak ditemukan';
                        if (val === 'Undelivery') text = 'Gagal kirim ulang';
                        updateOrderStatus(order.id, val, text, order.tracking.orderStatus);
                    }}
                    style={{ fontSize: '0.75rem', padding: '4px', height: 'auto', width: '110px' }}
                >
                    <option disabled value="">Ubah Monitoring</option>
                    <option value="Aman">Aman</option>
                    <option value="Stuck">Stuck</option>
                    <option value="Paket bermasalah">Bermasalah</option>
                    <option value="Undelivery">Undelivery</option>
                    <option value="Kritis">Kritis</option>
                </select>
            </div>

            <TrackingModal
                isOpen={isTrackingOpen}
                onClose={() => setIsTrackingOpen(false)}
                awb={order.courierInfo.awb}
                courier={order.courierInfo.name}
                trackingData={trackingData}
                isLoading={isTrackingLoading}
                order={order}
            />
        </div>
    );
};

const OrderListTable = ({ orders, title, subtitle }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [monFilter, setMonFilter] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [csFilter, setCsFilter] = useState('');

    const itemsPerPage = 25;

    // Extract unique CS Names
    const uniqueCS = Array.from(new Set(orders.map(o => o.csToken))).sort();

    // Filter Logic
    const filteredOrders = orders.filter(order => {
        // Search
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q ||
            (order.id && order.id.toLowerCase().includes(q)) ||
            (order.courierInfo.awb && order.courierInfo.awb.toLowerCase().includes(q)) ||
            (order.customer.phone && order.customer.phone.toLowerCase().includes(q)) ||
            (order.customer.name && order.customer.name.toLowerCase().includes(q));

        // Filters
        const matchesStatus = !statusFilter || order.tracking.orderStatus === statusFilter;
        const matchesMon = !monFilter || order.tracking.statusCategory === monFilter;
        const matchesPay = !paymentFilter || order.paymentMethod === paymentFilter;
        const matchesCS = !csFilter || order.csToken === csFilter;

        let matchesDate = true;
        if (dateFilter && dateFilter !== 'all') {
            const orderDateObj = new Date(order.date);
            const now = new Date();

            switch (dateFilter) {
                case 'today': matchesDate = isToday(orderDateObj); break;
                case '7days': matchesDate = orderDateObj >= subDays(now, 7); break;
                case '14days': matchesDate = orderDateObj >= subDays(now, 14); break;
                case '30days': matchesDate = orderDateObj >= subDays(now, 30); break;
                case 'this_month': matchesDate = orderDateObj >= startOfMonth(now) && orderDateObj <= endOfMonth(now); break;
                case 'last_month':
                    const lastMonth = subMonths(now, 1);
                    matchesDate = orderDateObj >= startOfMonth(lastMonth) && orderDateObj <= endOfMonth(lastMonth);
                    break;
                case 'this_year': matchesDate = orderDateObj >= startOfYear(now) && orderDateObj <= endOfYear(now); break;
                case 'last_year':
                    const lastYear = subYears(now, 1);
                    matchesDate = orderDateObj >= startOfYear(lastYear) && orderDateObj <= endOfYear(lastYear);
                    break;
                case 'custom':
                    if (customStartDate && customEndDate) {
                        const start = new Date(customStartDate);
                        start.setHours(0, 0, 0, 0);
                        const end = new Date(customEndDate);
                        end.setHours(23, 59, 59, 999);
                        matchesDate = orderDateObj >= start && orderDateObj <= end;
                    }
                    break;
                default: matchesDate = true;
            }
        }

        return matchesSearch && matchesStatus && matchesMon && matchesPay && matchesCS && matchesDate;
    });

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

    const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
    const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

    return (
        <div className="table-container">
            {title && (
                <div className="table-header-block">
                    <h2 className="table-title">{title}</h2>
                    {subtitle && <p className="table-subtitle">{subtitle}</p>}
                    <div className="text-sm font-semibold text-primary" style={{ marginTop: '0.25rem' }}>
                        Menampilkan {filteredOrders.length} pesanan
                    </div>
                </div>
            )}

            {/* Table Filters */}
            <div className="table-filters" style={{ flexWrap: 'wrap' }}>
                <select className="filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                    <option value="">Semua Status</option>
                    <option value="Shipping">Shipping</option>
                    <option value="Delivered">Delivered</option>
                    <option value="RTS">RTS</option>
                </select>
                <select className="filter-select" value={monFilter} onChange={(e) => { setMonFilter(e.target.value); setCurrentPage(1); }}>
                    <option value="">Semua Monitoring</option>
                    <option value="Aman">Aman</option>
                    <option value="Stuck">Stuck</option>
                    <option value="Paket bermasalah">Paket bermasalah</option>
                    <option value="Undelivery">Undelivery</option>
                </select>
                <select className="filter-select" value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}>
                    <option value="">Semua Pembayaran</option>
                    <option value="COD">COD</option>
                    <option value="Transfer">Transfer</option>
                </select>

                <select className="filter-select" value={csFilter} onChange={(e) => { setCsFilter(e.target.value); setCurrentPage(1); }}>
                    <option value="">Semua CS</option>
                    {uniqueCS.map(cs => <option key={cs} value={cs}>{cs}</option>)}
                </select>

                <select className="filter-select" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}>
                    <option value="all">Semua Waktu</option>
                    <option value="today">Hari Ini</option>
                    <option value="7days">7 Hari Terakhir</option>
                    <option value="14days">14 Hari Terakhir</option>
                    <option value="30days">30 Hari Terakhir</option>
                    <option value="this_month">Bulan Ini</option>
                    <option value="last_month">Bulan Lalu</option>
                    <option value="this_year">Tahun Ini</option>
                    <option value="last_year">Tahun Lalu</option>
                    <option value="custom">Kustom (Rentang Tanggal)</option>
                </select>

                {dateFilter === 'custom' && (
                    <div className="custom-date-inputs" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                            type="date"
                            className="filter-select"
                            value={customStartDate}
                            onChange={(e) => { setCustomStartDate(e.target.value); setCurrentPage(1); }}
                            title="Dari Tanggal"
                        />
                        <span className="text-muted" style={{ fontSize: '12px' }}>s/d</span>
                        <input
                            type="date"
                            className="filter-select"
                            value={customEndDate}
                            onChange={(e) => { setCustomEndDate(e.target.value); setCurrentPage(1); }}
                            title="Sampai Tanggal"
                        />
                    </div>
                )}

                <div className="search-box-wrapper" style={{ flexGrow: 1, minWidth: '250px' }}>
                    <span className="search-prefix">Pencarian</span>
                    <input
                        type="text"
                        placeholder="Resi, No. HP, Nama Pembeli..."
                        className="filter-search"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    />
                    <button className="search-btn"><Search size={14} color="white" /></button>
                </div>
            </div>

            <div className="data-table">
                <div className="table-header">
                    <div className="th th-checkbox"><input type="checkbox" /></div>
                    <div className="th th-id">ID Pesanan</div>
                    <div className="th th-customer">Penerima</div>
                    <div className="th th-product">Produk</div>
                    <div className="th th-cs">CS</div>
                    <div className="th th-courier">Kurir</div>
                    <div className="th th-payment">Pembayaran</div>
                    <div className="th th-note">Catatan</div>
                    <div className="th th-status">Status</div>
                    <div className="th th-followup">Follow Up</div>
                    <div className="th th-action"></div>
                </div>

                <div className="table-body">
                    {currentOrders.length > 0 ? (
                        currentOrders.map(order => <OrderTableRow key={order.id} order={order} />)
                    ) : (
                        <div className="empty-table-state">
                            <AlertCircle size={32} className="text-muted" />
                            <p>No orders found corresponding to the current filters.</p>
                        </div>
                    )}
                </div>
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <span className="page-info">Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders</span>
                    <div className="page-controls">
                        <button className="btn-page" onClick={handlePrev} disabled={currentPage === 1}>Prev</button>
                        <span className="current-page">Page {currentPage} of {totalPages}</span>
                        <button className="btn-page" onClick={handleNext} disabled={currentPage === totalPages}>Next</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderListTable;
