import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const ConfirmationCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState('Esperando confirmación segura del pago...');
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const collectionStatus = searchParams.get('collection_status');
        const orderId = searchParams.get('order_id') ?? searchParams.get('external_reference');

        if (!orderId) {
            setFailed(true);
            setMessage('No se encontró la referencia del pedido. Revisa tus pedidos o contáctanos.');
            return;
        }

        // Mercado Pago's query string is useful for UX only. Payment authority belongs
        // exclusively to the verified server webhook, so this page never updates orders.
        if (collectionStatus && !['approved', 'pending', 'in_process'].includes(collectionStatus)) {
            setFailed(true);
            setMessage('El pago no fue aprobado. Puedes intentarlo nuevamente desde tus pedidos.');
            return;
        }

        navigate(`/checkout/waiting/${orderId}`, { replace: true });
    }, [searchParams, navigate]);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center text-text-primary">
            <div className="flex max-w-md flex-col items-center gap-4">
                {failed ? (
                    <span className="material-symbols-outlined text-6xl text-red-500">error</span>
                ) : (
                    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
                )}
                <h1 className="text-2xl font-bold">{failed ? 'No pudimos completar el pago' : 'Validando tu pago'}</h1>
                <p role="status" className="text-text-secondary">{message}</p>
                {failed && (
                    <Link to="/account/orders" className="rounded-lg bg-primary px-6 py-3 font-bold text-white">
                        Ver mis pedidos
                    </Link>
                )}
            </div>
        </main>
    );
};

export default ConfirmationCallback;
