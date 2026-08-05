import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AdminUsersPage = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // 1. Get users
            const { data: usersData, error: usersError } = await supabase.rpc('get_users_with_email');

            if (usersError) throw usersError;

            // 2. Get confirmed orders stats
            // We fetch all orders that are confirmed/paid/delivered to count them
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('user_id, status')
                .in('status', ['confirmed', 'paid', 'delivered']);

            if (ordersError) throw ordersError;

            // 3. Aggregate counts
            const orderCounts: Record<string, number> = {};
            ordersData?.forEach(order => {
                if (order.user_id) {
                    orderCounts[order.user_id] = (orderCounts[order.user_id] || 0) + 1;
                }
            });

            // 4. Merge data
            const usersWithStats = (usersData || []).map((user: any) => ({
                ...user,
                confirmed_orders: orderCounts[user.id] || orderCounts[user.user_id] || 0
            }));

            setUsers(usersWithStats);

        } catch (err: any) {
            console.error('Error fetching data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Cargando usuarios...</div>;

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 mb-6">
                <h3 className="font-bold">Error cargando usuarios</h3>
                <p>Es probable que falten permisos o la función RPC 'get_users_with_email'.</p>
                <p className="text-sm font-mono mt-2">{error}</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-serif mb-6 dark:text-white">Usuarios Registrados</h2>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">ID Usuario</th>
                            <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Nombre</th>
                            <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Email</th>
                            <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Teléfono</th>
                            <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Pedidos Confirmados</th>
                            <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Rol</th>
                            <th className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">Fecha Registro</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {users.map((user) => (
                            <tr key={user.user_id || user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs text-slate-400">
                                    {(user.user_id || user.id)?.slice(0, 8)}...
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                    {user.full_name || 'Sin Nombre'}
                                </td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                    {user.phone || '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${user.confirmed_orders > 0
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                                        }`}>
                                        {user.confirmed_orders}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'admin'
                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                        }`}>
                                        {user.role || 'customer'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsersPage;
