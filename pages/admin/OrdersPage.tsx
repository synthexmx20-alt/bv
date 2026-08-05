import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { supabaseCRM } from '../../lib/supabase-crm';
import { Link } from 'react-router-dom';
import VisitorStats from '../../components/admin/VisitorStats';

const AdminOrdersPage = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        // Fetch Main DB Orders
        const { data: mainData, error: mainError } = await supabase
            .from('orders')
            .select(`
                *,
                profiles (
                   full_name,
                   phone
                )
            `);

        if (mainError) {
            console.error('Error fetching main orders:', mainError);
            setError(mainError.message);
        }

        // Fetch CRM DB Orders (WhatsApp)
        const { data: crmData, error: crmError } = await supabaseCRM
            .from('orders')
            .select(`
                *,
                customers (
                   name,
                   phone_number
                )
            `);

        if (crmError) {
            console.error('Error fetching CRM orders:', crmError);
        }

        let combinedOrders: any[] = [];

        if (mainData) {
            combinedOrders = [...mainData];
        }

        if (crmData) {
            const mappedCrmData = crmData.map(order => ({
                ...order,
                is_crm: true, // Identify CRM orders
                profiles: order.customers ? {
                    full_name: order.customers.name || 'Cliente WhatsApp',
                    phone: order.customers.phone_number
                } : null
            }));
            combinedOrders = [...combinedOrders, ...mappedCrmData];
        }

        // Sort by created_at descending
        combinedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setOrders(combinedOrders);
        setLoading(false);
    };

    const handleDelete = async (orderId: string, isCrm?: boolean) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const client = isCrm ? supabaseCRM : supabase;
            const { error } = await client
                .from('orders')
                .delete()
                .eq('id', orderId);

            if (error) throw error;

            setOrders(prev => prev.filter(order => order.id !== orderId));
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Error al eliminar el pedido: ' + (error as any).message);
        }
    };

    if (loading) return <div>Cargando pedidos...</div>;

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                <h3 className="font-bold">Error cargando pedidos</h3>
                <p>Es probable que falten permisos de seguridad (RLS).</p>
                <p className="text-sm font-mono mt-2">{error}</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <VisitorStats />
            </div>

            <h2 className="text-2xl font-serif mb-6 dark:text-white">Pedidos Recientes</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b dark:border-slate-700">
                            <th className="pb-3 font-medium dark:text-slate-300">ID Pedido</th>
                            <th className="pb-3 font-medium dark:text-slate-300">Cliente</th>
                            <th className="pb-3 font-medium dark:text-slate-300">Fecha Pedido</th>
                            <th className="pb-3 font-medium dark:text-slate-300">Fecha Entrega</th>
                            <th className="pb-3 font-medium dark:text-slate-300">Total</th>
                            <th className="pb-3 font-medium dark:text-slate-300">Estado</th>
                            <th className="pb-3 font-medium dark:text-slate-300">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id} className="border-b dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="py-4 font-mono text-xs dark:text-slate-400">{order.id.slice(0, 8)}</td>
                                <td className="py-4 dark:text-slate-300">
                                    {order.profiles?.full_name || order.shipping_details?.fullName || 'Cliente de WhatsApp'}
                                    <div className="text-xs text-slate-500">{order.profiles?.phone || order.shipping_details?.phone || 'Sin número'}</div>
                                </td>
                                <td className="py-4 dark:text-slate-300">
                                    {new Date(order.created_at).toLocaleDateString()}
                                    <div className="text-xs text-slate-500">
                                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td className="py-4 dark:text-slate-300">
                                    {order.shipping_details?.date ? (
                                        <>
                                            <span className="font-bold text-primary">{new Date(order.shipping_details.date + 'T12:00:00').toLocaleDateString()}</span>
                                            <div className="text-xs text-slate-400">{order.shipping_details.timeSlot}</div>
                                        </>
                                    ) : (
                                        <span className="text-slate-500 text-xs text-center block">-</span>
                                    )}
                                </td>
                                <td className="py-4 font-medium dark:text-slate-200">${order.total_amount}</td>
                                <td className="py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${['confirmed', 'paid'].includes(order.status) ? 'bg-green-100 text-green-700' :
                                        ['pending_payment', 'pending'].includes(order.status) ? 'bg-yellow-100 text-yellow-700' :
                                            order.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                                                'bg-slate-100 text-slate-700'
                                        }`}>
                                        {['confirmed', 'paid'].includes(order.status) ? 'CONFIRMADO' :
                                            ['pending_payment', 'pending'].includes(order.status) ? 'Pendiente' :
                                                order.status === 'delivered' ? 'Entregado' :
                                                    order.status}
                                    </span>
                                </td>
                                <td className="py-4">
                                    <div className="flex items-center gap-2">
                                        <Link to={`/admin/orders/${order.id}`} className="text-primary-600 hover:text-primary-700 font-medium" title="Ver Detalles">
                                            <span className="material-symbols-outlined">visibility</span>
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(order.id, order.is_crm)}
                                            className="text-red-500 hover:text-red-700 transition-colors"
                                            title="Eliminar Pedido"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminOrdersPage;
