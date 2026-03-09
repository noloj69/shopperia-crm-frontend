import React, { createContext, useContext, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    // State
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem('shopperia_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [orders, setOrders] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    const [importSessions, setImportSessions] = useState([]);
    const [toastMessage, setToastMessage] = useState(null);
    const [waTemplates, setWaTemplates] = useState({
        Stuck: 'Halo Kak {name}, pesanan {product} dengan No Resi {awb} sedang terkendala dijalan nih. Mohon ditunggu ya kak...',
        PaketBermasalah: 'Halo Kak {name}, kurir tidak dapat menemukan alamat kakak untuk pesanan {product}. Mohon bantuannya patokan lokasi ya...',
        Undelivery: 'Halo Kak {name}, pesanan {product} dikembalikan nih. Boleh konfirmasi ulang kesediaannya menerima paket?',
        Default: 'Halo Kak {name}, pesanan {product} dengan No Resi {awb} sedang dalam perjalanan. Terima kasih!'
    });

    // Dark Mode Effect
    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Users
                const userRes = await fetch(`${API_BASE_URL}/api/users`);
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUsers(userData);
                }

                // Fetch Orders
                const orderRes = await fetch(`${API_BASE_URL}/api/orders`);
                if (orderRes.ok) {
                    const orderData = await orderRes.json();
                    // Deserialize dates correctly
                    const parsedOrders = orderData.map(o => ({
                        ...o,
                        date: new Date(o.date)
                    }));
                    setOrders(parsedOrders);
                }
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
                showToast("Gagal terhubung ke server database.");
            }
        };

        fetchData();
    }, []);

    // Filter accessible orders based on auth
    const accessibleOrders = React.useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.role === 'cs' && currentUser.name) {
            return orders.filter(o => o.csToken === currentUser.name);
        }
        return orders;
    }, [orders, currentUser]);

    // Actions
    const login = async (identifier, password) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setCurrentUser(data.user);
                localStorage.setItem('shopperia_user', JSON.stringify(data.user));
                return true;
            }
            return false;
        } catch (error) {
            console.error("Login error:", error);
            return false;
        }
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('shopperia_user');
    };

    const toggleDarkMode = () => setIsDarkMode(prev => !prev);

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3500);
    };

    const updateWaTemplate = (category, newTemplate) => {
        setWaTemplates(prev => ({ ...prev, [category]: newTemplate }));
    };

    // --- API Interactions ---

    const updateOrderStatus = async (orderId, newStatusCategory, newStatusText, newOrderStatus = null) => {
        try {
            // Find db_id
            const order = orders.find(o => o.id === orderId);
            if (!order) return;

            const payload = {
                statusCategory: newStatusCategory
            };
            if (newOrderStatus) payload.orderStatus = newOrderStatus;

            const res = await fetch(`${API_BASE_URL}/api/orders/${order.db_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Update local state to reflect changes immediately
                setOrders(prevOrders => prevOrders.map(o => {
                    if (o.id === orderId) {
                        return {
                            ...o,
                            tracking: {
                                ...o.tracking,
                                ...(newOrderStatus ? { orderStatus: newOrderStatus } : {}),
                                statusCategory: newStatusCategory,
                                statusText: newStatusText,
                                lastUpdate: new Date().toISOString()
                            }
                        }
                    }
                    return o;
                }));
            } else {
                showToast("Gagal mengupdate status pesanan.");
            }
        } catch (error) {
            console.error("Error updating order:", error);
            showToast("Terjadi kesalahan jaringan.");
        }
    };

    const updateOrderCourierPhone = async (orderId, newPhone) => {
        try {
            const order = orders.find(o => o.id === orderId);
            if (!order) return;

            const res = await fetch(`${API_BASE_URL}/api/orders/${order.db_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kurirPhone: newPhone })
            });

            if (res.ok) {
                setOrders(prevOrders => prevOrders.map(o => {
                    if (o.id === orderId) {
                        return {
                            ...o,
                            courierInfo: {
                                ...o.courierInfo,
                                kurirPhone: newPhone
                            }
                        }
                    }
                    return o;
                }));
            }
        } catch (error) {
            console.error("Error updating phone:", error);
        }
    };

    const simulateWebhook = async () => {
        // Just arbitrarily pick the first 'Aman' order and mark it as 'Kritis' to demo webhook
        const target = orders.find(o => o.tracking.statusCategory === 'Aman' && o.tracking.orderStatus === 'Shipping');
        if (target) {
            await updateOrderStatus(target.id, 'Kritis', 'Rumah kosong', 'Shipping');
            showToast(`Webhook Simulated: Pesanan ${target.id} kini terkendala!`);
        } else {
            showToast("Tidak ada pesanan aman tersisa untuk disimulasikan webhook.");
        }
    };

    const importOrdersFromExcel = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target.result;
            // dynamic import of xlsx
            import('xlsx').then(async (XLSX) => {
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (json.length < 2) return;

                const headers = json[0];
                const getCol = (name) => {
                    const idx = headers.findIndex(h => h && h.toString().toLowerCase().trim() === name.toLowerCase());
                    return idx === -1 ? null : idx;
                };

                const cols = {
                    order_number: getCol('order_number'),
                    order_status: getCol('order_status'),
                    payment_method: getCol('payment_method'),
                    shipping_courier: getCol('shipping_courier'),
                    shipping_awb: getCol('shipping_awb'),
                    shipping_receiver: getCol('shipping_receiver'),
                    phone: getCol('shipping_receiver_phone'),
                    total_cost: getCol('total_cost'),
                    warehouse: getCol('warehouse'),
                    cs: getCol('diinput_oleh'),
                    kecamatan: getCol('kecamatan'),
                    kota: getCol('kota'),
                    provinsi: getCol('provinsi'),
                    items: getCol('items')
                };

                const newOrdersPayload = [];
                for (let i = 1; i < json.length; i++) {
                    const row = json[i];
                    if (!row || row.length === 0) continue;

                    let rawOrderStatus = cols.order_status !== null ? row[cols.order_status] : '';
                    if (rawOrderStatus && rawOrderStatus.toString().toUpperCase() === 'CANCELLED') {
                        continue;
                    }

                    let orderStatusStr = 'Shipping';
                    let detailStatus = 'Dalam proses pengiriman';
                    if (rawOrderStatus) {
                        const s = rawOrderStatus.toString().toUpperCase();
                        if (s === 'DELIVERED') orderStatusStr = 'Delivered';
                        else if (s === 'RETURNED' || s === 'RTS') orderStatusStr = 'RTS';
                    }

                    let rawPayment = cols.payment_method !== null ? row[cols.payment_method] : 'COD';
                    let payment = 'COD';
                    if (rawPayment && rawPayment.toString().toUpperCase() === 'NON_COD') payment = 'Transfer';

                    const addressParts = [];
                    if (cols.kecamatan !== null && row[cols.kecamatan]) addressParts.push(`Kec. ${row[cols.kecamatan]}`);
                    if (cols.kota !== null && row[cols.kota]) addressParts.push(row[cols.kota]);
                    if (cols.provinsi !== null && row[cols.provinsi]) addressParts.push(row[cols.provinsi]);

                    let monCategory = 'Aman';
                    if (orderStatusStr === 'RTS') monCategory = 'Kritis';

                    newOrdersPayload.push({
                        customer: {
                            name: cols.shipping_receiver !== null ? row[cols.shipping_receiver] || 'Unknown' : 'Unknown',
                            phone: cols.phone !== null ? row[cols.phone] || '-' : '-'
                        },
                        address: addressParts.length > 0 ? addressParts.join(', ') : 'Unknown Address',
                        paymentMethod: payment,
                        courierInfo: {
                            name: cols.shipping_courier !== null ? row[cols.shipping_courier] || 'Unknown' : 'Unknown',
                            awb: cols.shipping_awb !== null ? row[cols.shipping_awb] || '-' : '-'
                        },
                        csToken: cols.cs !== null ? row[cols.cs] || 'Admin' : 'Admin',
                        tracking: {
                            statusCategory: monCategory,
                            orderStatus: orderStatusStr
                        }
                    });
                }

                if (newOrdersPayload.length > 0) {
                    try {
                        const res = await fetch(`${API_BASE_URL}/api/orders`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newOrdersPayload) // Passing array
                        });

                        const data = await res.json();
                        if (res.ok && data.success) {
                            const createdOrders = data.orders.map(o => ({
                                ...o,
                                date: new Date(o.date)
                            }));

                            const sessionId = `IMP-${Date.now()}`;
                            const sessionRecord = {
                                id: sessionId,
                                date: new Date().toISOString(),
                                filename: file.name,
                                count: createdOrders.length,
                                orderIds: createdOrders.map(o => o.id)
                            };

                            setImportSessions(prev => [sessionRecord, ...prev]);
                            setOrders(prev => [...createdOrders, ...prev]);
                            showToast(`Data Excel Berhasil Diimpor! (${createdOrders.length} pesanan)`);
                        } else {
                            showToast('Gagal memproses file Excel di server.');
                        }
                    } catch (error) {
                        console.error("Import error:", error);
                        showToast("Terjadi kesalahan jaringan saat import.");
                    }
                } else {
                    showToast('Gagal memproses. Data Excel kosong atau cancel semua.');
                }
            });
        };
        reader.readAsBinaryString(file);
    };

    const undoImport = (sessionId) => {
        // Technically this should hit a DELETE endpoint, but for simplicity of CRM we just soft hide it or mock it.
        const session = importSessions.find(s => s.id === sessionId);
        if (!session) return;
        if (session.canceled) {
            showToast('Sesi import ini sudah dibatalkan sebelumnya.');
            return;
        }

        setOrders(prev => prev.filter(o => !session.orderIds.includes(o.id)));
        setImportSessions(prev =>
            prev.map(s => s.id === sessionId ? { ...s, canceled: true } : s)
        );
        showToast(`Import dibatalkan. ${session.count} data dihapus secara lokal.`);
    };

    // User Management (API connected)
    const addUser = async (newUser) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(prev => [...prev, data.user]);
            } else {
                showToast("Gagal menambahkan user.");
            }
        } catch (error) {
            console.error("Error adding user:", error);
            showToast("Terjadi kesalahan jaringan.");
        }
    };

    const deleteUser = async (userId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, { method: 'DELETE' });
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== userId));
            } else {
                showToast("Gagal menghapus user.");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    const editUser = async (updatedUser) => {
        // Optimistic UI update
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
        try {
            await fetch(`${API_BASE_URL}/api/users/${updatedUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedUser)
            });
        } catch (error) {
            console.error("Error updating user backend:", error);
            showToast("Gagal menyimpan perubahan ke server.");
        }
    };

    const mockFetchTracking = (awb, courier, currentStatus) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const baseHistory = [
                    { date: new Date(Date.now() - 48 * 3600000).toISOString(), status: 'Manifested', desc: 'Paket diserahkan ke kurir' },
                    { date: new Date(Date.now() - 24 * 3600000).toISOString(), status: 'In Transit', desc: 'Tiba di fasilitas logistik' },
                ];
                if (currentStatus === 'Delivered') {
                    baseHistory.push({ date: new Date(Date.now() - 2 * 3600000).toISOString(), status: 'Out for Delivery', desc: 'Dibawa menuju alamat' });
                    baseHistory.push({ date: new Date().toISOString(), status: 'Delivered', desc: 'Selesai dikirim' });
                } else if (currentStatus === 'RTS') {
                    baseHistory.push({ date: new Date(Date.now() - 12 * 3600000).toISOString(), status: 'Delivery Failed', desc: 'Gagal kirim' });
                    baseHistory.push({ date: new Date().toISOString(), status: 'RTS', desc: 'Retur ke pengirim' });
                } else {
                    baseHistory.push({ date: new Date().toISOString(), status: 'Shipping', desc: 'Perjalanan ke kota tujuan' });
                }
                resolve(baseHistory.reverse());
            }, 800);
        });
    };

    return (
        <DataContext.Provider value={{
            currentUser, login, logout, users, addUser, deleteUser, editUser,
            orders: accessibleOrders, globalOrders: orders, setOrders,
            simulateWebhook, updateOrderStatus, updateOrderCourierPhone, importOrdersFromExcel,
            importSessions, undoImport,
            waTemplates, updateWaTemplate,
            isDarkMode, toggleDarkMode, toastMessage, showToast, mockFetchTracking
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
