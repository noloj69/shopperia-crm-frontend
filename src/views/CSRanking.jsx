import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Trophy, TrendingUp, PackageCheck, AlertTriangle, Calendar, Award, Star } from 'lucide-react';
import { isToday, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from 'date-fns';
import './CSRanking.css';

const CSRanking = () => {
    const { orders } = useData();
    const [dateFilter, setDateFilter] = useState('this_month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [activeTab, setActiveTab] = useState('delivered'); // 'delivered', 'rts', 'performance'

    // 1. FILTER ORDERS BY DATE
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            if (dateFilter === 'all') return true;
            const orderDateObj = new Date(order.date);
            const now = new Date();
            let matchesDate = true;

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
                    else { matchesDate = true; } // don't filter if halfway inputted
                    break;
                default: matchesDate = true;
            }
            return matchesDate;
        });
    }, [orders, dateFilter, customStartDate, customEndDate]);

    // 2. CALCULATE CS METRICS
    const csRankingData = useMemo(() => {
        const csMetricsMap = {};

        filteredOrders.forEach(order => {
            const csInfo = order.csToken || 'Unknown';
            if (!csMetricsMap[csInfo]) {
                csMetricsMap[csInfo] = { name: csInfo, total: 0, shipping: 0, delivered: 0, rts: 0 };
            }

            csMetricsMap[csInfo].total += 1;
            if (order.tracking.orderStatus === 'Delivered') csMetricsMap[csInfo].delivered += 1;
            else if (order.tracking.orderStatus === 'RTS') csMetricsMap[csInfo].rts += 1;
            else csMetricsMap[csInfo].shipping += 1;
        });

        // 3. ENRICH DATA (RTS Rate, Bonus, Performance Score)
        return Object.values(csMetricsMap).map(data => {
            const rtsRate = data.total > 0 ? ((data.rts / data.total) * 100) : 0;
            const bonus = data.delivered * 5000;

            // Performance Score Formula (Example): 
            // Weighted heavily on Delivered amount, penalized strongly by RTS amount (not just rate).
            // A simple metric: Delivered - (RTS * 2). Or (Delivered / (RTS+1)) * total.
            // Let's use: Delivered Ratio * (100 - RTS Rate). Higher is better.
            const deliveredRate = data.total > 0 ? (data.delivered / data.total) : 0;
            const performanceScore = data.total >= 10 ? (deliveredRate * (100 - rtsRate) * Math.log10(data.total)) : 0; // Require min 10 orders for good score, scale by volume log

            return {
                ...data,
                rtsRate: parseFloat(rtsRate.toFixed(1)),
                bonus: bonus,
                performanceScore: parseFloat(performanceScore.toFixed(2))
            };
        });
    }, [filteredOrders]);

    // 4. PREPARE 3 CATEGORIES
    // CATEGORY A: Delivered Terbanyak
    const sortedByDelivered = [...csRankingData].sort((a, b) => b.delivered - a.delivered);

    // CATEGORY B: RTS Terendah (Minimum 10 total leads to qualify)
    const sortedByRts = [...csRankingData]
        .filter(cs => cs.total >= 10) // Prevents someone with 1 lead and 0 RTS from winning
        .sort((a, b) => {
            if (a.rtsRate === b.rtsRate) return b.total - a.total; // Tie-breaker: higher volume wins
            return a.rtsRate - b.rtsRate;
        });

    // CATEGORY C: Performa Terbaik
    const sortedByPerformance = [...csRankingData]
        .filter(cs => cs.total >= 10)
        .sort((a, b) => b.performanceScore - a.performanceScore);

    // Active List Selection
    let activeList = sortedByDelivered;
    if (activeTab === 'rts') activeList = sortedByRts;
    if (activeTab === 'performance') activeList = sortedByPerformance;

    const topThree = activeList.slice(0, 3);
    const others = activeList.slice(3);

    // Helpers
    const getAvatarUrl = (name) => {
        // Simple hash function to deterministically assign one of the 15 custom avatars
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const avatarIndex = Math.abs(hash) % 15 + 1; // 1 to 15
        return `/avatars/avatar_${avatarIndex}.jpg`;
    };

    const getRtsRateClass = (rate) => {
        if (rate <= 5) return 'rts-good';
        if (rate <= 10) return 'rts-warning';
        return 'rts-bad';
    };

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number);
    };

    // Reorder top 3 for display: 2nd, 1st, 3rd
    const displayTopThree = [];
    if (topThree.length > 1) displayTopThree.push({ ...topThree[1], rank: 2 });
    if (topThree.length > 0) displayTopThree.push({ ...topThree[0], rank: 1 });
    if (topThree.length > 2) displayTopThree.push({ ...topThree[2], rank: 3 });

    return (
        <div className="leaderboard-container">
            <div className="leaderboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>Papan Peringkat CS</h1>
                    <p>Evaluasi Performa & Pencapaian Agen Customer Service</p>
                    <div className="text-sm font-semibold text-primary" style={{ marginTop: '0.5rem' }}>
                        Menampilkan {filteredOrders.length} pesanan yang dianalisis
                    </div>
                </div>

                {/* DATE FILTER UI */}
                <div className="leaderboard-filters" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'var(--color-surface)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <Calendar size={18} className="text-secondary" />
                    <select className="filter-select" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        <option value="all">Semua Waktu</option>
                        <option value="today">Hari Ini</option>
                        <option value="7days">7 Hari Terakhir</option>
                        <option value="14days">14 Hari Terakhir</option>
                        <option value="30days">30 Hari Terakhir</option>
                        <option value="this_month">Bulan Ini</option>
                        <option value="last_month">Bulan Lalu</option>
                        <option value="this_year">Tahun Ini</option>
                        <option value="last_year">Tahun Lalu</option>
                        <option value="custom">Rentang Tanggal</option>
                    </select>
                </div>
            </div>

            {dateFilter === 'custom' && (
                <div className="custom-date-inputs" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '1.5rem', justifyContent: 'flex-end' }}>
                    <input type="date" className="filter-select" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} />
                    <span className="text-muted" style={{ fontSize: '12px' }}>s/d</span>
                    <input type="date" className="filter-select" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
                </div>
            )}

            {/* CATEGORY TABS */}
            <div className="ranking-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', paddingBottom: '2px' }}>
                <button
                    className={`rank-tab-btn ${activeTab === 'delivered' ? 'active' : ''}`}
                    onClick={() => setActiveTab('delivered')}
                >
                    <PackageCheck size={18} /> Delivered Terbanyak
                </button>
                <button
                    className={`rank-tab-btn ${activeTab === 'rts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rts')}
                >
                    <AlertTriangle size={18} /> RTS Terendah
                </button>
                <button
                    className={`rank-tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('performance')}
                >
                    <Award size={18} /> Performa Terbaik
                </button>
            </div>

            {topThree.length > 0 ? (
                <>
                    <div className="podium-container">
                        {displayTopThree.map((cs) => (
                            <div key={cs.name} className={`podium-item rank-${cs.rank}`}>
                                <div className="podium-avatar-wrapper" style={{ overflow: 'visible' }}>
                                    {cs.rank === 1 && <Trophy size={32} className="crown-icon" />}
                                    <div className="podium-avatar" style={{ background: 'var(--color-surface)', border: `4px solid ${cs.rank === 1 ? '#eab308' : cs.rank === 2 ? '#9ca3af' : '#b45309'}` }}>
                                        <img src={getAvatarUrl(cs.name)} alt={cs.name} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%', transform: 'scale(1.1) translateY(4px)' }} />
                                    </div>
                                    <div className="rank-badge">{cs.rank}</div>
                                </div>
                                <div className="podium-name">{cs.name}</div>

                                {activeTab === 'delivered' && (
                                    <div className="podium-score text-success">
                                        <TrendingUp size={16} /> {cs.delivered} <span style={{ fontSize: '12px', opacity: 0.8 }}>Paket</span>
                                    </div>
                                )}
                                {activeTab === 'rts' && (
                                    <div className="podium-score text-danger">
                                        <AlertTriangle size={16} /> {cs.rtsRate}% <span style={{ fontSize: '12px', opacity: 0.8 }}>Rate</span>
                                    </div>
                                )}
                                {activeTab === 'performance' && (
                                    <div className="podium-score" style={{ color: '#8b5cf6' }}>
                                        <Star size={16} /> {cs.performanceScore} <span style={{ fontSize: '12px', opacity: 0.8 }}>Poin</span>
                                    </div>
                                )}

                                <div className={`rts-rate-badge ${getRtsRateClass(cs.rtsRate)}`} style={{ marginTop: '8px' }}>
                                    {activeTab === 'rts' ? `Total Leads: ${cs.total}` : `RTS: ${cs.rtsRate}%`}
                                </div>
                                <div className="bonus-badge" style={{ marginTop: '8px', fontSize: '12px', fontWeight: 600, color: '#059669', background: 'rgba(5, 150, 105, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                                    Bonus: {formatRupiah(cs.bonus)}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="leaderboard-list">
                        {others.map((cs, i) => (
                            <div key={cs.name} className="leaderboard-row">
                                <div className="list-rank">{i + 4}th</div>
                                <div className="list-avatar" style={{ background: 'transparent' }}>
                                    <img src={getAvatarUrl(cs.name)} alt={cs.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                                <div className="list-info">
                                    <div className="list-name">{cs.name}</div>
                                    <div className="list-metrics">
                                        <span title="Total Leads">Total: {cs.total}</span>
                                        <span title="Delivered" className="text-success">Deliv: {cs.delivered}</span>
                                        <span title="RTS" className="text-danger">RTS: {cs.rts}</span>
                                        <span title="Bonus CS" style={{ color: '#059669', fontWeight: 600 }}>{formatRupiah(cs.bonus)}</span>
                                    </div>
                                </div>
                                <div className="list-score">
                                    {activeTab === 'delivered' && (
                                        <div className="score-value text-success">
                                            <TrendingUp size={14} /> {cs.delivered}
                                        </div>
                                    )}
                                    {activeTab === 'rts' && (
                                        <div className="score-value text-danger">
                                            <AlertTriangle size={14} /> {cs.rtsRate}%
                                        </div>
                                    )}
                                    {activeTab === 'performance' && (
                                        <div className="score-value" style={{ color: '#8b5cf6' }}>
                                            <Star size={14} /> {cs.performanceScore}
                                        </div>
                                    )}
                                    <div className={`rts-rate-badge ${getRtsRateClass(cs.rtsRate)}`}>
                                        {activeTab === 'rts' ? `Vol: ${cs.total}` : `Rate: ${cs.rtsRate}%`}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginTop: '20px' }}>
                    <Trophy size={48} style={{ color: 'var(--color-border)', margin: '0 auto 16px', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Papan Peringkat Kosong</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                        Tidak ada data yang memenuhi kriteria filter tanggal atau batas minimum order saat ini.
                    </p>
                </div>
            )}
        </div>
    );
};

export default CSRanking;
