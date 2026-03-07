import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { ShieldAlert, CheckCircle, Package, TrendingDown, Truck, PackageCheck } from 'lucide-react';
import { isToday, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from 'date-fns';
import './Dashboard.css';

const Dashboard = () => {
    const { orders } = useData();
    const [dateFilter, setDateFilter] = useState('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // Global Date Filter Logic
    const filteredOrders = orders.filter(order => {
        if (dateFilter === 'all') return true;

        const orderDateObj = new Date(order.date);
        const now = new Date();

        switch (dateFilter) {
            case 'today': return isToday(orderDateObj);
            case '7days': return orderDateObj >= subDays(now, 7);
            case '14days': return orderDateObj >= subDays(now, 14);
            case '30days': return orderDateObj >= subDays(now, 30);
            case 'this_month': return orderDateObj >= startOfMonth(now) && orderDateObj <= endOfMonth(now);
            case 'last_month':
                const lastMonth = subMonths(now, 1);
                return orderDateObj >= startOfMonth(lastMonth) && orderDateObj <= endOfMonth(lastMonth);
            case 'this_year': return orderDateObj >= startOfYear(now) && orderDateObj <= endOfYear(now);
            case 'last_year':
                const lastYear = subYears(now, 1);
                return orderDateObj >= startOfYear(lastYear) && orderDateObj <= endOfYear(lastYear);
            case 'custom':
                if (customStartDate && customEndDate) {
                    const start = new Date(customStartDate);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(customEndDate);
                    end.setHours(23, 59, 59, 999);
                    return orderDateObj >= start && orderDateObj <= end;
                }
                return true;
            default: return true;
        }
    });

    // Calculate metrics based on FILTERED orders
    const totalOrders = filteredOrders.length;

    // Total Delivered Metric (Any order that has reached Delivered state)
    const totalDelivered = filteredOrders.filter(o => o.tracking.orderStatus === 'Delivered').length;

    // Total Shipping Metric (Any order currently in transit)
    const totalShipping = filteredOrders.filter(o => o.tracking.orderStatus === 'Shipping').length;

    // Delivery Success Rate
    const deliverySuccessRate = totalOrders > 0 ? Math.round((totalDelivered / totalOrders) * 100) : 0;

    // Real-time RTS computation based on order status instead of simplistic flag
    const rtsOrdersCount = filteredOrders.filter(o => o.tracking.orderStatus === 'RTS').length;
    const rtsRate = totalOrders > 0 ? Math.round((rtsOrdersCount / totalOrders) * 100) : 0;

    // Courier Performance Data
    const courierStats = filteredOrders.reduce((acc, order) => {
        if (!acc[order.courierInfo.name]) {
            acc[order.courierInfo.name] = { name: order.courierInfo.name, success: 0, rts: 0 };
        }

        if (order.tracking.orderStatus === 'Delivered') {
            acc[order.courierInfo.name].success += 1;
        } else if (order.tracking.orderStatus === 'RTS' || order.customer.rtsFlag) {
            acc[order.courierInfo.name].rts += 1;
        }
        return acc;
    }, {});

    const chartData = Object.values(courierStats);

    // Region Issues Data (Mocked based on Address parsing)
    const regionStats = filteredOrders.reduce((acc, order) => {
        const isProblematic = order.tracking.orderStatus === 'RTS' ||
            (order.tracking.orderStatus === 'Shipping' && ['Stuck', 'Undelivery', 'Paket bermasalah'].includes(order.tracking.statusCategory));

        if (isProblematic) {
            // Safe extraction for Region name
            const parts = (order.address || '').split(', ');
            const city = parts.length > 1 ? parts[1] : 'Unknown';
            acc[city] = (acc[city] || 0) + 1;
        }
        return acc;
    }, {});

    const topIssues = Object.entries(regionStats)
        .sort((a, b) => b[1] - a[1])
        .map(([city, count]) => ({ city, count }));

    return (
        <div className="dashboard-view">
            <div className="dashboard-header flex justify-between items-end flex-wrap gap-4">
                <div>
                    <h1 className="page-title">Overview Diagnostics</h1>
                    <p className="page-subtitle">Real-time performance metrics</p>
                </div>

                <div className="global-date-filter flex gap-2 items-center flex-wrap">
                    <select className="filter-select h-10 border border-gray-300 rounded-lg px-3 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
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
                        <div className="custom-date-inputs flex gap-2 items-center">
                            <input
                                type="date"
                                className="filter-select h-10 border border-gray-300 rounded-lg px-3 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                title="Dari Tanggal"
                            />
                            <span className="text-gray-500 text-sm font-medium">s/d</span>
                            <input
                                type="date"
                                className="filter-select h-10 border border-gray-300 rounded-lg px-3 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                title="Sampai Tanggal"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon-wrapper blue">
                        <Package size={24} />
                    </div>
                    <div className="metric-info">
                        <h3 className="metric-label">Total Orders</h3>
                        <div className="metric-value">{totalOrders}</div>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
                        <Truck size={24} />
                    </div>
                    <div className="metric-info">
                        <h3 className="metric-label">Total Shipping</h3>
                        <div className="metric-value">{totalShipping}</div>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon-wrapper green" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <PackageCheck size={24} />
                    </div>
                    <div className="metric-info">
                        <h3 className="metric-label">Total Delivered</h3>
                        <div className="metric-value">{totalDelivered}</div>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon-wrapper green">
                        <CheckCircle size={24} />
                    </div>
                    <div className="metric-info">
                        <h3 className="metric-label">Delivery Success</h3>
                        <div className="metric-value">{deliverySuccessRate}%</div>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon-wrapper red">
                        <ShieldAlert size={24} />
                    </div>
                    <div className="metric-info">
                        <h3 className="metric-label">Total RTS (Real-time)</h3>
                        <div className="metric-value" style={{ color: 'var(--color-danger)' }}>{rtsOrdersCount}</div>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon-wrapper red">
                        <TrendingDown size={24} />
                    </div>
                    <div className="metric-info">
                        <h3 className="metric-label">RTS Rate</h3>
                        <div className="metric-value">{rtsRate}%</div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="card chart-card">
                    <h3 className="card-title">Courier Performance</h3>
                    <p className="card-subtitle">Success vs RTS by provider</p>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="success" name="Success" fill="var(--color-success)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                <Bar dataKey="rts" name="Return (RTS)" fill="var(--color-danger)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card heat-list-card">
                    <div className="card-header-flex">
                        <div>
                            <h3 className="card-title">Problematic Regions</h3>
                            <p className="card-subtitle">Highest volume of delivery issues</p>
                        </div>
                        <ShieldAlert size={20} className="text-warning" style={{ color: 'var(--color-warning)' }} />
                    </div>

                    <div className="region-list">
                        {topIssues.length > 0 ? topIssues.map((item, index) => (
                            <div key={index} className="region-item">
                                <div className="region-name">
                                    <span className="region-rank">#{index + 1}</span>
                                    {item.city}
                                </div>
                                <div className="region-count">
                                    <span className="badge badge-danger">{item.count} issues</span>
                                </div>
                            </div>
                        )) : (
                            <div className="empty-state">No regional issues detected today. Everything is smooth! 🎉</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
