import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { supabaseCRM } from '../../lib/supabase-crm';
import { Link } from 'react-router-dom';

const AdminDashboardPage = () => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalUsers: 0
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Orders (for Revenue and Count)
                const { data: mainOrders, error: ordersError } = await supabase
                    .from('orders')
                    .select('total_amount, status, created_at, id, shipping_details');

                if (ordersError) throw ordersError;

                const { data: crmOrders, error: crmOrdersError } = await supabaseCRM
                    .from('orders')
                    .select('total_amount, status, created_at, id, shipping_details, customers(name)');

                if (crmOrdersError) console.error("Error fetching CRM orders", crmOrdersError);

                let allOrders = [...(mainOrders || [])];
                if (crmOrders) {
                    const mapped = crmOrders.map(o => ({
                        ...o,
                        shipping_details: o.shipping_details || { fullName: (Array.isArray(o.customers) ? o.customers[0]?.name : (o.customers as any)?.name) || 'Cliente WhatsApp' }
                    }));
                    allOrders = [...allOrders, ...mapped];
                }

                // Calculate Revenue (excluding cancelled)
                const validOrders = allOrders.filter(o => o.status !== 'cancelled');
                const revenue = validOrders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);

                // 2. Fetch Products Count
                const { count: productsCount, error: productsError } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true });

                if (productsError) throw productsError;

                // 3. Fetch Users Count (Profiles)
                const { count: usersCount, error: usersError } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true });

                // Non-fatal error for profiles (sometimes RLS blocks counting all)
                if (usersError) console.warn("Could not count profiles", usersError);

                setStats({
                    totalRevenue: revenue,
                    totalOrders: allOrders.length,
                    totalProducts: productsCount || 0,
                    totalUsers: usersCount || 0
                });

                // 4. Set Recent Orders (Top 5)
                // Sort by date desc
                const sortedOrders = [...allOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setRecentOrders(sortedOrders.slice(0, 5));

            } catch (error) {
                console.error("Error loading dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'paid': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const translateStatus = (status: string) => {
        const map: Record<string, string> = {
            'pending': 'Pendiente',
            'pending_payment': 'Pendiente',
            'pending_transfer': 'Transferencia Pend.',
            'paid': 'Pagado',
            'processing': 'Procesando',
            'shipped': 'Enviado',
            'completed': 'Entregado',
            'cancelled': 'Cancelado'
        };
        return map[status] || status;
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Cargando tablero...</div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Panel Principal</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ingresos Totales</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{formatCurrency(stats.totalRevenue)}</h3>
                        </div>
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pedidos Totales</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats.totalOrders}</h3>
                        </div>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <span className="material-symbols-outlined">shopping_bag</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Productos Activos</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats.totalProducts}</h3>
                        </div>
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                            <span className="material-symbols-outlined">inventory_2</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Usuarios</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats.totalUsers}</h3>
                        </div>
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                            <span className="material-symbols-outlined">group</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Pedidos Recientes</h2>
                    <Link to="/admin/orders" className="text-sm text-primary hover:text-blue-700 font-medium hover:underline">
                        Ver todos
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-700/50 text-slate-500 dark:text-slate-400 text-sm">
                                <th className="p-4 font-medium">ID Pedido</th>
                                <th className="p-4 font-medium">Cliente</th>
                                <th className="p-4 font-medium">Fecha</th>
                                <th className="p-4 font-medium">Estado</th>
                                <th className="p-4 font-medium text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {recentOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                                        <Link to={`/admin/orders/${order.id}`} className="hover:text-primary hover:underline">
                                            {order.id.slice(0, 8)}...
                                        </Link>
                                    </td>
                                    <td className="p-4 text-slate-900 dark:text-white font-medium">
                                        {order.shipping_details?.fullName || 'Anonimo'}
                                    </td>
                                    <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                            {translateStatus(order.status)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-medium text-slate-900 dark:text-white">
                                        {formatCurrency(order.total_amount)}
                                    </td>
                                </tr>
                            ))}
                            {recentOrders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        No hay pedidos recientes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
