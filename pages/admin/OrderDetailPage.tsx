import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { supabaseCRM } from '../../lib/supabase-crm';

import { Icon } from '../../components/Icon';
const AdminOrderDetailPage = () => {
    const { id } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            fetchOrderDetails();
        }
    }, [id]);

    const fetchOrderDetails = async () => {
        let isCrm = false;

        // 1. Fetch Order from Main DB
        let { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select(`
                *,
                profiles (
                   full_name,
                   phone,
                   address
                )
            `)
            .eq('id', id)
            .single();

        if (orderError || !orderData) {
            // 2. Fallback to CRM DB
            const { data: crmData, error: crmError } = await supabaseCRM
                .from('orders')
                .select(`
                    *,
                    customers (
                       name,
                       phone_number
                    )
                `)
                .eq('id', id)
                .single();

            if (crmError || !crmData) {
                console.error('Error fetching order from both databases:', orderError, crmError);
                setError('Pedido no encontrado en ninguna base de datos.');
                setLoading(false);
                return;
            }

            isCrm = true;
            orderData = {
                ...crmData,
                is_crm: true,
                profiles: crmData.customers ? {
                    full_name: (Array.isArray(crmData.customers) ? crmData.customers[0]?.name : (crmData.customers as any)?.name) || 'Cliente WhatsApp',
                    phone: (Array.isArray(crmData.customers) ? crmData.customers[0]?.phone_number : (crmData.customers as any)?.phone_number)
                } : null
            };
        }

        // 3. Fetch Items
        const client = isCrm ? supabaseCRM : supabase;
        const { data: itemsData, error: itemsError } = await client
            .from('order_items')
            .select('*')
            .eq('order_id', id);

        if (itemsError && !isCrm) {
            console.error('Error fetching items:', itemsError);
            setError(itemsError.message);
        } else {
            setOrder(orderData);

            let finalItems = itemsData || [];

            // Si el pedido no tiene sub-ítems pero sí detalles en JSON (típico de WhatsApp / N8N)
            if (finalItems.length === 0 && orderData.product_details) {
                finalItems = [{
                    id: 'crm-item-1',
                    product_name: orderData.product_details.descripcion || 'Producto de WhatsApp',
                    size: '-',
                    price: orderData.total_amount || 0,
                    quantity: 1,
                    addons: []
                }];
            }

            setItems(finalItems);
        }
        setLoading(false);
    };

    if (loading) return <div>Cargando detalles...</div>;

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                <h3 className="font-bold">Error cargando detalles</h3>
                <p>Es probable que falten permisos de seguridad (RLS) en 'order_items'.</p>
                <p className="text-sm font-mono mt-2">{error}</p>
                <Link to="/admin/orders" className="text-red-800 underline mt-2 block">Volver a la lista</Link>
            </div>
        );
    }

    if (!order) return <div>Pedido no encontrado (ID inválido)</div>;

    const handleStatusChange = async (newStatus: string) => {
        setLoading(true);
        const client = order.is_crm ? supabaseCRM : supabase;
        const { error } = await client
            .from('orders')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            alert('Error al actualizar estado: ' + error.message);
        } else {
            setOrder({ ...order, status: newStatus });
        }
        setLoading(false);
    };

    const statusOptions = [
        { value: 'pending', label: 'Pendiente' },
        { value: 'confirmed', label: 'CONFIRMADO' },
        { value: 'shipped', label: 'En Ruta' },
        { value: 'completed', label: 'Completado' },
        { value: 'cancelled', label: 'Cancelado' },
    ];

    const shipping = order.shipping_details || {};
    const message = order.message_details || {};

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/admin/orders" className="text-slate-500 hover:text-slate-700 dark:text-slate-400">
                        &larr; Volver
                    </Link>
                    <h2 className="text-2xl font-serif dark:text-white">Pedido #{order.id.slice(0, 8)}</h2>
                </div>
                <div className="flex gap-2">
                    <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium border-none cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${['confirmed', 'paid'].includes(order.status) ? 'bg-green-100 text-green-700' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                    order.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                                        'bg-slate-100 text-slate-700'
                            }`}
                    >
                        {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-medium text-lg mb-4 dark:text-white">Información del Cliente</h3>
                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        <p><span className="font-medium">Nombre:</span> {order.profiles?.full_name}</p>
                        {/* <p><span className="font-medium">Email:</span> {order.profiles?.email}</p> Email not accessible in profiles */}
                        <p><span className="font-medium">Teléfono:</span> {order.profiles?.phone}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-medium text-lg mb-4 dark:text-white">Detalles de Envío</h3>
                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        <p><span className="font-medium">Para:</span> {shipping.fullName}</p>
                        <p><span className="font-medium">Teléfono:</span> {shipping.phone}</p>
                        <p><span className="font-medium">Dirección:</span> {shipping.street}, {shipping.colonia}</p>
                        <p><span className="font-medium">Referencia:</span> {shipping.reference}</p>
                        <p><span className="font-medium">Horario:</span> {shipping.date} ({shipping.timeSlot})</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-medium text-lg mb-4 dark:text-white">Mensaje de Regalo</h3>
                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        <p><span className="font-medium">De:</span> {message.from}</p>
                        <p><span className="font-medium">Para:</span> {message.to}</p>
                        <p className="mt-2 p-3 bg-slate-50 dark:bg-slate-700 rounded-md italic">"{message.note}"</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-medium text-lg mb-4 dark:text-white">Productos</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b dark:border-slate-700">
                                <th className="pb-3 font-medium dark:text-slate-300">Producto</th>
                                <th className="pb-3 font-medium dark:text-slate-300">Tamaño</th>
                                <th className="pb-3 font-medium dark:text-slate-300">Precio</th>
                                <th className="pb-3 font-medium dark:text-slate-300">Cantidad</th>
                                <th className="pb-3 font-medium dark:text-slate-300 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-b dark:border-slate-700 last:border-0">
                                    <td className="py-4 dark:text-slate-300">
                                        <div className="font-medium">{item.product_name}</div>
                                        {item.addons && item.addons.length > 0 && (
                                            <div className="mt-1 text-xs space-y-1">
                                                {item.addons.map((addon: any, idx: number) => (
                                                    <div key={idx} className="text-slate-500 flex flex-col">
                                                        <span className="flex items-center gap-1">
                                                            <Icon name={addon.type === 'banda' ? 'workspace_premium' : 'star'} size={10} />
                                                            {addon.name} (+${addon.price})
                                                        </span>
                                                        {addon.customText && (
                                                            <span className="ml-4 font-bold text-primary italic">
                                                                "{addon.customText}"
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-4 dark:text-slate-300">{item.size}</td>
                                    <td className="py-4 dark:text-slate-300">${item.price}</td>
                                    <td className="py-4 dark:text-slate-300">{item.quantity}</td>
                                    <td className="py-4 font-medium dark:text-slate-300 text-right">
                                        ${(item.price * item.quantity) + (item.addons?.reduce((sum: number, a: any) => sum + a.price, 0) || 0) * item.quantity}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={4} className="pt-4 text-right font-medium dark:text-slate-200">Subtotal</td>
                                <td className="pt-4 text-right font-medium dark:text-slate-200">
                                    ${items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString()}
                                </td>
                            </tr>
                            {order.discount_amount > 0 && (
                                <tr>
                                    <td colSpan={4} className="pt-2 text-right font-medium text-green-600 dark:text-green-400">
                                        Descuento ({order.coupon_code})
                                    </td>
                                    <td className="pt-2 text-right font-medium text-green-600 dark:text-green-400">
                                        -${order.discount_amount.toLocaleString()}
                                    </td>
                                </tr>
                            )}
                            <tr className="border-t border-slate-200 dark:border-slate-700">
                                <td colSpan={4} className="pt-4 text-right font-bold text-lg dark:text-white">Total</td>
                                <td className="pt-4 text-right font-bold text-lg dark:text-white">${order.total_amount.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminOrderDetailPage;
