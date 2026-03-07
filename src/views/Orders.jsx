import React from 'react';
import { useData } from '../context/DataContext';
import OrderListTable from '../components/table/OrderListTable';

const Orders = () => {
    const { orders } = useData();

    return (
        <div style={{ padding: '1.5rem', height: '100%', overflow: 'auto' }}>
            <OrderListTable
                orders={orders}
                title="Semua Pesanan"
                subtitle="Daftar seluruh pesanan pelanggan"
            />
        </div>
    );
};

export default Orders;
