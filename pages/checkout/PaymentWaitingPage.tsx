import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const PaymentWaitingPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (!orderId) return;

        // 1. Initial check
        const checkStatus = async () => {
            const { data } = await supabase
                .from('orders')
                .select('status')
                .eq('id', orderId)
                .single();

            if (data?.status === 'paid' || data?.status === 'confirmed') {
                navigate(`/order-confirmation/${orderId}`);
            }
        };

        checkStatus();

        // 2. Subscribe to Realtime changes
        const channel = supabase
            .channel(`order-${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`,
                },
                (payload) => {
                    console.log('Order update received:', payload);
                    if (['paid', 'confirmed'].includes(payload.new.status)) {
                        navigate(`/order-confirmation/${orderId}`);
                    }
                }
            )
            .subscribe();

        // 3. Fallback: Poll every 3 seconds
        const interval = setInterval(checkStatus, 3000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [orderId, navigate]);

    const handleManualCheck = async () => {
        const { data } = await supabase
            .from('orders')
            .select('status')
            .eq('id', orderId)
            .single();

        if (data?.status === 'paid' || data?.status === 'confirmed') {
            navigate(`/order-confirmation/${orderId}`);
        } else {
            alert('Aún no detectamos el pago. Si ya pagaste, espera unos segundos más.');
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
                <div className="relative mb-6">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                    <span className="material-symbols-outlined absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary">
                        lock
                    </span>
                </div>

                <h2 className="text-2xl font-bold dark:text-white mb-2">Completando pago seguro...</h2>
                <p className="text-text-secondary mb-8">
                    Se ha abierto una nueva ventana de Mercado Pago.
                    <br />
                    Por favor completa el pago allí.
                </p>

                <div className="bg-surface-dark p-4 rounded-lg flex items-center gap-3 text-left w-full border border-border-dark mb-6">
                    <span className="material-symbols-outlined text-primary">info</span>
                    <p className="text-sm text-text-secondary">
                        Esta pantalla se actualizará automáticamente cuando recibamos la confirmación del pago.
                    </p>
                </div>

                <button
                    onClick={handleManualCheck}
                    className="text-primary hover:underline text-sm font-medium"
                >
                    ¿Ya pagaste y no se actualiza? Haz clic aquí
                </button>
            </main>
            <Footer />
        </div>
    );
};

export default PaymentWaitingPage;
