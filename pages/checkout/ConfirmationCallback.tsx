import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const ConfirmationCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'failure'>('loading');
    const [message, setMessage] = useState('Verificando pago...');

    useEffect(() => {
        const checkPayment = async () => {
            const collectionStatus = searchParams.get('collection_status');
            const orderId = searchParams.get('external_reference');
            const paymentId = searchParams.get('payment_id');

            if (!orderId) {
                setStatus('failure');
                setMessage('No se encontró la referencia del pedido.');
                return;
            }

            if (collectionStatus === 'approved') {
                try {
                    // Update order status using RPC to bypass RLS/Policy issues
                    const { error } = await supabase
                        .rpc('confirm_order_payment', {
                            order_id_input: orderId,
                            payment_id_input: paymentId
                        });

                    if (error) throw error;

                    // Clear cart (optional here if not cleared before, but we likely cleared it before redirect or dependent on implementation)
                    // Since we are not in CheckoutContext context easily here without wrapping, we assume redirection handles flow.
                    // But actually, cart clearing usually happens *before* or *after*. 
                    // Ideally we clear it now? But local storage might be cleared.
                    // Let's just redirect to confirmation.

                    // navigate(`/order-confirmation/${orderId}`);
                    setStatus('success');
                } catch (error) {
                    console.error("Error updating order:", error);
                    setStatus('failure');
                    setMessage('El pago fue aprobado pero hubo un error actualizando el pedido. Por favor contáctanos.');
                }
            } else if (collectionStatus === 'pending') {
                setStatus('failure');
                setMessage('El pago está pendiente de aprobación.');
            } else {
                setStatus('failure');
                setMessage('El pago no fue aprobado. Intenta nuevamente.');
            }
        };

        checkPayment();
    }, [searchParams, navigate]);

    return (
        <div className="flex flex-col min-h-screen bg-background text-text-primary">
            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                {status === 'loading' && (
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                )}

                {status === 'failure' && (
                    <div className="flex flex-col items-center gap-4 max-w-md">
                        <span className="material-symbols-outlined text-6xl text-red-500">error</span>
                        <h2 className="text-2xl font-bold">Algo salió mal</h2>
                        <p className="text-text-secondary">{message}</p>
                        <button
                            onClick={() => window.close()}
                            className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors"
                        >
                            Cerrar ventana
                        </button>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-4 max-w-md animate-fade-in-up">
                        <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center mb-2">
                            <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
                        </div>
                        <h2 className="text-3xl font-bold">¡Pago Recibido!</h2>
                        <p className="text-lg text-text-secondary">
                            Todo salió bien. Ya puedes cerrar esta ventana y volver a la tienda.
                        </p>
                        <button
                            onClick={() => window.close()}
                            className="mt-4 px-6 py-2 border border-border-dark rounded-lg hover:bg-surface-dark transition-colors"
                        >
                            Cerrar ventana
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ConfirmationCallback;
