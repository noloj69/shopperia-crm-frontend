import React from 'react';
import { useData } from '../context/DataContext';
import OrderListTable from '../components/table/OrderListTable';

const Orders = () => {
    const { orders } = useData();

    return (
        <div className="orders-page-container">
            <OrderListTable
                orders={orders}
                title="Semua Pesanan"
                subtitle="Daftar seluruh pesanan pelanggan"
            />
        </div>
    );
};

export default Orders;
