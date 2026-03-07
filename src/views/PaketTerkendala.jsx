import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import OrderListTable from '../components/table/OrderListTable';
import './PaketTerkendala.css';

const TABS = [
    { id: 'Kritis', label: 'Kritis (RTS)', colorClass: 'tab-danger', desc: 'Paket diretur' },
    { id: 'Peringatan', label: 'Peringatan (Bermasalah)', colorClass: 'tab-warning', desc: 'Stuck, Undelivery, atau Bermasalah' },
    { id: 'Aman', label: 'Aman (Delivered)', colorClass: 'tab-success', desc: 'Pesanan telah sampai' }
];

const PaketTerkendala = () => {
    const { orders, simulateWebhook } = useData();
    const [activeFilter, setActiveFilter] = useState('Kritis');

    const getFilteredByTab = (tabId) => {
        if (tabId === 'Kritis') return orders.filter(o => o.tracking.orderStatus === 'RTS');
        if (tabId === 'Peringatan') return orders.filter(o => ['Stuck', 'Undelivery', 'Paket bermasalah'].includes(o.tracking.statusCategory) && o.tracking.orderStatus !== 'RTS');
        if (tabId === 'Aman') return orders.filter(o => o.tracking.orderStatus === 'Delivered');
        return orders;
    };

    const filteredOrders = getFilteredByTab(activeFilter);

    // Calculate counts for tabs
    const getCount = (tabId) => getFilteredByTab(tabId).length;

    return (
        <div className="terkendala-view">
            <div className="page-header-row">
                <div>
                    <h1 className="page-title">Paket Terkendala</h1>
                    <p className="page-subtitle">Manage and follow up on problematic deliveries</p>
                </div>
                <button className="btn btn-primary" onClick={simulateWebhook}>
                    <RefreshCw size={16} /> Simulate Webhook Update
                </button>
            </div>

            <div className="tabs-container">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`modern-tab ${activeFilter === tab.id ? 'active ' + tab.colorClass : ''}`}
                        onClick={() => setActiveFilter(tab.id)}
                    >
                        <div className="tab-header">
                            <span className="tab-label">{tab.label}</span>
                            <span className={`tab-count ${tab.colorClass}-badge`}>{getCount(tab.id)}</span>
                        </div>
                        <span className="tab-desc">{tab.desc}</span>
                    </button>
                ))}
            </div>

            <div className="kanban-board">
                <OrderListTable orders={filteredOrders} />
            </div>
        </div>
    );
};

export default PaketTerkendala;
