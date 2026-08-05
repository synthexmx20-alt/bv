import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Order {
    id: string;
    created_at: string;
    total_amount: number;
    status: string;
    shipping_details: any;
}

const OrderHistory = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setOrders(data || []);
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
                <p>Cargando tus pedidos...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Mis Pedidos</h1>

                {orders.length === 0 ? (
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-8 text-center border border-border-light dark:border-border-dark">
                        <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">shopping_bag</span>
                        <h2 className="text-xl font-bold mb-2">No tienes pedidos aún</h2>
                        <p className="text-text-secondary mb-6">Parece que no has realizado ninguna compra.</p>
                        <Link to="/catalog" className="text-primary font-bold hover:underline">Ir al catálogo</Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm hover:border-primary transition-colors">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg">pedido #{order.id.slice(0, 8)}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${['confirmed', 'paid'].includes(order.status) ? 'bg-green-100 text-green-700' :
                                                    ['pending_payment', 'pending'].includes(order.status) ? 'bg-yellow-100 text-yellow-700' :
                                                        order.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-700'
                                                }`}>
                                                {['confirmed', 'paid'].includes(order.status) ? 'CONFIRMADO' :
                                                    ['pending_payment', 'pending'].includes(order.status) ? 'Pendiente de Pago' :
                                                        order.status === 'delivered' ? 'Entregado' :
                                                            order.status}
                                            </span>
                                        </div>
                                        <p className="text-text-secondary text-sm">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6 md:w-auto w-full">
                                        <p className="font-bold text-xl">${order.total_amount}</p>
                                        <Link
                                            to={`/order-confirmation/${order.id}?history=true`}
                                            className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors"
                                        >
                                            Ver Detalles
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistory;
