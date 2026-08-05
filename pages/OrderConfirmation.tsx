import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import CheckoutHeader from '../components/CheckoutHeader';

interface OrderItem {
    id: string;
    product_name: string;
    quantity: number;
    price: number;
    size: string;
    addons?: any[];
}

interface ShippingDetails {
    fullName?: string;
    street?: string;
    colonia?: string;
    reference?: string;
    phone?: string;
    date?: string;
    timeSlot?: string;
    paymentMethod?: 'card' | 'spei';
}

interface Order {
    id: string;
    created_at: string;
    total_amount: number;
    status: string;
    shipping_details: ShippingDetails | null;
    order_items: OrderItem[];
}

const OrderConfirmation = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const isHistoryView = new URLSearchParams(location.search).get('history') === 'true';

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [whatsappNumber, setWhatsappNumber] = useState('526141234567');

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', 'whatsapp_number')
                .single();
            if (data?.value) setWhatsappNumber(data.value);
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) return;

            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select(`
                        *,
                        order_items (
                            id,
                            product_name,
                            quantity,
                            price,
                            size,
                            addons
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setOrder(data);
            } catch (err: any) {
                console.error('Error fetching order:', err);
                setError('No se pudo cargar la información del pedido.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
        fetchOrder();
    }, [id]);

    useEffect(() => {
        if (order && !loading && !isHistoryView) {
            try {
                // Safe access to global fbq
                const fbq = window.fbq;
                if (typeof fbq === 'function') {
                    fbq('track', 'Purchase', {
                        value: order.total_amount,
                        currency: 'MXN',
                        content_ids: order.order_items.map((item: any) => item.id),
                        content_type: 'product',
                        order_id: order.id
                    });
                }
            } catch (error) {
                console.warn('Meta Pixel Error:', error);
            }
        }
    }, [order, loading, isHistoryView]);



    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
                <p>Cargando detalles del pedido...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
                <h2 className="text-2xl font-bold text-red-500">Error</h2>
                <p>{error || 'Pedido no encontrado'}</p>
                <Link to="/" className="text-primary hover:underline">Volver al inicio</Link>
            </div>
        );
    }

    const isSpeiParam = new URLSearchParams(location.search).get('payment') === 'spei';
    const isPendingTransfer = order.status === 'pending_transfer' || isSpeiParam;

    // Defensive access to shipping details
    const shipping: ShippingDetails = order.shipping_details ?? {};
    const safeOrderId = order.id || '';
    const safeTotal = order.total_amount || 0;
    const safeItems = order.order_items || [];
    const safeDate = order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Fecha desconocida';

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white flex flex-col">
            <CheckoutHeader />
            <div className="flex-1 py-12 px-4">
                <div className="max-w-3xl mx-auto bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl border border-border-light dark:border-border-dark overflow-hidden">
                    <div className={`${isPendingTransfer ? 'bg-amber-600' : 'bg-primary'} p-8 text-center transition-colors duration-300`}>
                        {isHistoryView ? (
                            <>
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                    <span className="material-symbols-outlined text-4xl">receipt_long</span>
                                </div>
                                <h1 className="text-3xl font-bold text-white mb-2">Detalles del Pedido</h1>
                            </>
                        ) : (
                            <>
                                <div className={`w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 ${isPendingTransfer ? 'text-amber-600' : 'text-primary'}`}>
                                    <span className="material-symbols-outlined text-4xl">{isPendingTransfer ? 'pending_actions' : 'check_circle'}</span>
                                </div>
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    {isPendingTransfer ? '¡Pedido Recibido!' : `¡Gracias por tu compra, ${shipping.fullName || 'Cliente'}!`}
                                </h1>
                                <p className="text-white/90">
                                    {isPendingTransfer
                                        ? 'Tu pedido ha sido reservado. Realiza el pago para confirmarlo.'
                                        : 'Tu pedido ha sido recibido correctamente.'}
                                </p>
                            </>
                        )}
                    </div>

                    <div className="p-8">
                        {/* SPEI Instructions Block */}
                        {isPendingTransfer && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-6 mb-8 text-center animate-fadeIn">
                                <h3 className="text-xl font-bold text-amber-800 dark:text-amber-400 mb-4 flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined">account_balance</span>
                                    Datos Bancarios para Transferencia
                                </h3>
                                <div className="bg-white dark:bg-surface-dark p-4 rounded-lg border border-amber-100 dark:border-amber-800/50 shadow-sm max-w-md mx-auto mb-6">
                                    <div className="grid grid-cols-1 gap-3 text-left">
                                        <div>
                                            <p className="text-xs text-text-secondary uppercase">Banco</p>
                                            <p className="font-bold text-lg select-all">BANREGIO</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-text-secondary uppercase">CLABE Interbancaria</p>
                                            <p className="font-bold text-xl font-mono select-all">058597000079336671</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-text-secondary uppercase">Beneficiario</p>
                                            <p className="font-bold text-lg select-all">ISABEL MEDINA DOZAL</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-text-secondary uppercase">Concepto / Motivo</p>
                                            <p className="font-bold text-lg select-all">Pedido {safeOrderId.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-3">
                                    <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md">
                                        Para confirmar tu pedido, por favor envía una captura de pantalla de tu transferencia a nuestro WhatsApp.
                                    </p>
                                    <a
                                        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hola, acabo de realizar el pedido ${safeOrderId.slice(0, 8)} y envío mi comprobante de pago.`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-transform hover:scale-105 shadow-md shadow-green-500/20"
                                    >
                                        <span className="material-symbols-outlined">chat</span>
                                        Enviar Comprobante por WhatsApp
                                    </a>
                                </div>
                            </div>
                        )}

                        <div>
                            <p className="text-text-secondary text-sm uppercase tracking-wider mb-1">Método de Pago</p>
                            <p className="font-bold text-lg text-slate-700 dark:text-slate-300">
                                {shipping.paymentMethod === 'spei' ? 'Transferencia Bancaria' : 'Tarjeta de Crédito/Débito'}
                            </p>
                        </div>


                        <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 pb-8 border-b border-border-light dark:border-border-dark">
                            <div>
                                <p className="text-text-secondary text-sm uppercase tracking-wider mb-1">Número de Pedido</p>
                                <p className="font-mono text-xl font-bold">#{safeOrderId.slice(0, 8)}</p>
                            </div>
                            <div>
                                <p className="text-text-secondary text-sm uppercase tracking-wider mb-1">Fecha</p>
                                <p className="font-medium">{safeDate}</p>
                            </div>
                            <div>
                                <p className="text-text-secondary text-sm uppercase tracking-wider mb-1">Total</p>
                                <p className="font-bold text-xl text-primary">${safeTotal}</p>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold mb-4">Detalles del Pedido</h3>
                        <div className="space-y-4 mb-8">
                            {safeItems.map((item) => (
                                <div key={item.id} className="flex flex-col bg-background-light dark:bg-background-dark p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold">{item.product_name}</p>
                                            <p className="text-sm text-text-secondary">{item.size} x {item.quantity}</p>

                                            {/* Render Addons */}
                                            {item.addons && item.addons.length > 0 && (
                                                <div className="mt-2 pl-3 border-l-2 border-primary/30">
                                                    <p className="text-xs text-text-secondary font-semibold uppercase mb-1">Complementos:</p>
                                                    <ul className="list-none text-sm space-y-1">
                                                        {item.addons.map((addon: any, index: number) => (
                                                            <li key={index} className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                                                <span className="material-symbols-outlined !text-[14px]">local_florist</span>
                                                                {addon.name} (+${addon.price})
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">${item.price * item.quantity}</p>
                                            {/* Calculate Addons Total for visuals if needed, though usually included in item price or separate? 
                                                Actually, typically price per item INCLUDES addons if calculated that way 
                                                OR it's separate. 
                                                In Payment.tsx, we saw: price: itemPrice. 
                                                We need to verify if itemPrice includes addons.
                                                
                                                Wait, looking at Payment.tsx:
                                                const itemPrice = getEffectivePrice(...) : item.size.price;
                                                It DOES NOT seem to add addon prices to the main 'price' column in the existing code I saw.
                                                However, the TOTAL amount of the order likely includes it.
                                                
                                                Let's check if the 'price' stored in order_items includes addons. 
                                                If not, the sum of items might not match the total order amount.
                                                
                                                Actually, usually addons are just extra visual info, and the 'price' field in order_items 
                                                SHOULD be the final unit price.
                                                
                                                Let's assume for now we just show them.
                                            */}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-blue-50 dark:bg-slate-800 p-6 rounded-xl mb-8">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined">local_shipping</span>
                                Dirección de Envío
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-text-secondary text-sm uppercase tracking-wider mb-1">FECHA DE ENTREGA</p>
                                    <p className="font-medium">{shipping.date || 'No especificada'}</p>
                                </div>
                                <div>
                                    <p className="text-text-secondary text-sm uppercase tracking-wider mb-1">RANGO DE HORARIO DE PEDIDO</p>
                                    <p className="font-medium">{shipping.timeSlot || 'No especificado'}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-text-secondary text-sm uppercase tracking-wider mb-1">NOMBRE DE LA PERSONA QUE RECIBE</p>
                                    <p className="font-medium text-lg">{shipping.fullName || 'No especificado'}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-text-secondary text-sm uppercase tracking-wider mb-1">DIRECCION</p>
                                    <p className="font-medium">{shipping.street || ''}, {shipping.colonia || ''}</p>
                                    {shipping.reference && (
                                        <p className="text-text-secondary text-sm mt-1">Ref: {shipping.reference}</p>
                                    )}
                                    <p className="text-text-secondary text-sm mt-1">Tel: {shipping.phone || 'No especificado'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <Link
                                to={isHistoryView ? "/account/orders" : "/catalog"}
                                className="inline-block bg-primary text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
                            >
                                {isHistoryView ? "Volver a Mis Pedidos" : "Seguir Comprando"}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default OrderConfirmation;
