import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CheckoutHeader from '../../components/CheckoutHeader';
import { CheckoutContext } from '../../context/CheckoutContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const CheckoutPayment = () => {
    const { checkoutData, updateCheckoutData, getEffectivePrice, clearCart } = useContext(CheckoutContext);
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [couponCode, setCouponCode] = useState('');
    const [couponError, setCouponError] = useState('');
    const [couponSuccess, setCouponSuccess] = useState('');

    const items = checkoutData.items || [];
    const subtotal = items.reduce((sum, item) => {
        const itemPrice = getEffectivePrice ? getEffectivePrice(item.size, checkoutData.shipping.date) : item.size.price;
        const addonsPrice = item.selectedAddons?.reduce((s: number, a: any) => s + a.price, 0) || 0;
        return sum + ((itemPrice + addonsPrice) * item.quantity);
    }, 0);
    const discountAmount = checkoutData.discount ? checkoutData.discount.amount : 0;
    const shippingCost = checkoutData.shippingCost || 0;
    const totalAmount = Math.max(0, subtotal + shippingCost - discountAmount);

    const handleApplyCoupon = async () => {
        setCouponError('');
        setCouponSuccess('');

        if (!couponCode.trim()) return;

        try {
            const { data: coupon, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', couponCode.toUpperCase())
                .eq('active', true)
                .single();

            if (error || !coupon) {
                setCouponError('Cupón no válido o expirado.');
                return;
            }

            // Validations
            if (coupon.expiration_date && new Date(coupon.expiration_date) < new Date()) {
                setCouponError('Este cupón ha expirado.');
                return;
            }

            if (coupon.usage_limit && coupon.usage_limit <= coupon.usage_count) {
                setCouponError('Este cupón ha alcanzado su límite de usos.');
                return;
            }

            // Calculate Discount
            let calculatedDiscount = 0;
            if (coupon.discount_type === 'percentage') {
                calculatedDiscount = (subtotal * coupon.value) / 100;
            } else {
                calculatedDiscount = coupon.value;
            }

            // Update Context
            updateCheckoutData('discount', {
                code: coupon.code,
                amount: calculatedDiscount,
                type: coupon.discount_type
            });
            setCouponSuccess(`¡Descuento de $${calculatedDiscount} aplicado!`);
            setCouponCode('');

        } catch (err) {
            console.error(err);
            setCouponError('Error al validar cupón.');
        }
    };

    const handleFinishOrder = async () => {
        if (!user) {
            alert('Por favor inicia sesión para completar tu pedido');
            navigate('/login');
            return;
        }

        setLoading(true);

        try {
            const isSpei = checkoutData.paymentMethod === 'spei';
            // Use 'pending_transfer' for SPEI to identify it easily
            const initialStatus = isSpei ? 'pending_transfer' : 'pending_payment';

            // 1. Create Order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    total_amount: totalAmount,
                    status: initialStatus,
                    coupon_code: checkoutData.discount?.code, // Save Coupon
                    discount_amount: checkoutData.discount?.amount, // Save Discount
                    shipping_details: {
                        ...checkoutData.shipping,
                        cost: checkoutData.shippingCost || 0,
                        paymentMethod: checkoutData.paymentMethod // Persist method in metadata
                    },
                    message_details: checkoutData.message
                })
                .select()
                .single();

            if (orderError) throw orderError;


            // 2. Create Order Items
            const orderItems = items.map(item => {
                const itemPrice = getEffectivePrice ? getEffectivePrice(item.size, checkoutData.shipping.date) : item.size.price;
                return {
                    order_id: orderData.id,
                    product_id: item.product.id,
                    product_name: item.product.name,
                    quantity: item.quantity,
                    price: itemPrice,
                    size: item.size.name,
                    addons: item.selectedAddons || []
                };
            });

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // Increment Coupon Usage if used
            if (checkoutData.discount?.code) {
                await supabase.rpc('increment_coupon_usage', { code_input: checkoutData.discount.code });
                // Fallback if RPC doesnt exist (we will make user create it or just simple update)
                // simple update for now, prone to race conditions but fine for MVP
                const { data: currentCoupon } = await supabase.from('coupons').select('usage_count').eq('code', checkoutData.discount.code).single();
                if (currentCoupon) {
                    await supabase.from('coupons').update({ usage_count: currentCoupon.usage_count + 1 }).eq('code', checkoutData.discount.code);
                }
            }

            // --- TRIGGER EMAIL NOTIFICATION (AWAITING to ensure delivery before redirect) ---
            try {
                const { data: emailData, error: emailError } = await supabase.functions.invoke('order-confirmation', {
                    body: { orderId: orderData.id }
                });

                if (emailError) {
                    console.error("❌ Error invocando función de correo:", emailError);
                    alert(`Aviso: El pedido se creó, pero no se pudo enviar el correo de confirmación. (Error de Red: ${JSON.stringify(emailError)})`);
                } else if (emailData?.error) {
                    console.error("❌ Función devolvió error interno:", emailData.error);
                    alert(`Aviso: El pedido se creó, pero hubo un error enviando el correo: ${emailData.error}`);
                } else {
                    console.log("✅ Correo enviado correctamente.");
                    // Success is silent as requested
                }
            } catch (err: any) {
                console.error("❌ Excepción crítica correo:", err);
                alert(`Aviso: El pedido se creó, pero falló el sistema de correos. (${err.message})`);
            }
            // --------------------------------------------------------------------

            // Clear checkout items locally now that order is saved
            // Clear checkout items and discount using the dedicated function to ensure DB sync
            if (clearCart) {
                await clearCart();
            } else {
                updateCheckoutData('items', []);
                updateCheckoutData('discount', undefined);
            }

            if (isSpei) {
                // Direct redirect to confirmation for manual transfer flow
                navigate(`/order-confirmation/${orderData.id}?payment=spei`);
                return;
            }

            // 3. Create Mercado Pago Preference (For Card)
            // Prepare items with effective price
            const itemsWithEffectivePrice = checkoutData.items.map(item => ({
                ...item,
                size: {
                    ...item.size,
                    price: getEffectivePrice ? getEffectivePrice(item.size, checkoutData.shipping.date) : item.size.price
                }
            }));

            const { data: preferenceData, error: functionError } = await supabase.functions.invoke('create-preference', {
                body: {
                    orderId: orderData.id,
                    items: itemsWithEffectivePrice,
                    discount: checkoutData.discount?.amount, // Pass discount to preference
                    user: {
                        email: user.email,
                        name: checkoutData.shipping.fullName
                    },
                    origin: window.location.origin
                }
            });

            if (functionError) {
                console.error("Function Error Details:", functionError);
                throw new Error(`Error en el servidor de pagos: ${functionError.message}`);
            }

            if (preferenceData.error) {
                console.error("Preference Data Error:", preferenceData.error);
                throw new Error(`Error de Mercado Pago: ${preferenceData.error}`);
            }

            // 4. Redirect to Mercado Pago
            if (preferenceData.initPoint) {
                // Open Mercado Pago in new tab
                window.open(preferenceData.initPoint, '_blank');
                // Navigate current tab to waiting page
                navigate(`/checkout/waiting/${orderData.id}`);
            } else {
                throw new Error('No se recibió el link de pago');
            }

        } catch (error: any) {
            console.error('Error processing order full details:', error);
            alert(error.message || 'Hubo un error al procesar tu pedido');
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
                <h2 className="text-2xl font-bold">Tu carrito está vacío</h2>
                <Link to="/catalog" className="text-primary hover:underline">Volver al catálogo</Link>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white antialiased min-h-screen">
            <CheckoutHeader />
            <main className="layout-container flex grow flex-col w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-10 py-8">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
                    <div className="flex-1 flex flex-col gap-6">
                        <nav className="flex flex-wrap gap-2 items-center text-sm md:text-base">
                            <Link className="text-text-secondary font-medium hover:text-white transition-colors" to="/checkout/shipping">Envío</Link>
                            <span className="text-text-secondary material-symbols-outlined !text-sm">chevron_right</span>
                            <Link className="text-text-secondary font-medium hover:text-white transition-colors" to="/checkout/message">Detalles</Link>
                            <span className="text-text-secondary material-symbols-outlined !text-sm">chevron_right</span>
                            <span className="text-primary font-bold">Pago</span>
                        </nav>
                        <div className="flex flex-col gap-2">
                            <h1 className="text-white tracking-tight text-3xl md:text-4xl font-bold">Método de Pago</h1>
                        </div>
                        <div className="flex flex-col gap-4 mt-2">
                            {/* Payment Methods UI */}
                            <div className="relative group">
                                <label className="cursor-pointer relative z-10 block w-full">
                                    <input
                                        className="peer sr-only"
                                        name="payment_method"
                                        type="radio"
                                        value="card"
                                        checked={checkoutData.paymentMethod === 'card'}
                                        onChange={() => updateCheckoutData('paymentMethod', 'card')}
                                    />
                                    <div className={`flex flex-col gap-4 rounded-xl border bg-surface-dark p-5 transition-all ${checkoutData.paymentMethod === 'card' ? 'border-primary shadow-lg shadow-primary/10' : 'border-border-dark'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors ${checkoutData.paymentMethod === 'card' ? 'bg-primary' : 'bg-border-dark'}`}>
                                                <span className="material-symbols-outlined">credit_card</span>
                                            </div>
                                            <div className="flex grow flex-col"><p className="text-white text-base font-bold">Tarjeta de Crédito / Débito</p></div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${checkoutData.paymentMethod === 'card' ? 'border-primary' : 'border-text-secondary'}`}>
                                                <div className={`w-2.5 h-2.5 rounded-full bg-primary transition-opacity ${checkoutData.paymentMethod === 'card' ? 'opacity-100' : 'opacity-0'}`}></div>
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            </div>
                            <div className="relative group">
                                <label className="cursor-pointer relative z-10 block w-full">
                                    <input
                                        className="peer sr-only"
                                        name="payment_method"
                                        type="radio"
                                        value="spei"
                                        checked={checkoutData.paymentMethod === 'spei'}
                                        onChange={() => updateCheckoutData('paymentMethod', 'spei')}
                                    />
                                    <div className={`flex items-center gap-4 rounded-xl border bg-surface-dark p-5 transition-all ${checkoutData.paymentMethod === 'spei' ? 'border-primary shadow-lg shadow-primary/10' : 'border-border-dark'}`}>
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors ${checkoutData.paymentMethod === 'spei' ? 'bg-primary' : 'bg-border-dark'}`}>
                                            <span className="material-symbols-outlined">account_balance</span>
                                        </div>
                                        <div className="flex grow flex-col"><p className="text-white text-base font-bold">SPEI</p></div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${checkoutData.paymentMethod === 'spei' ? 'border-primary' : 'border-text-secondary'}`}>
                                            <div className={`w-2.5 h-2.5 rounded-full bg-primary transition-opacity ${checkoutData.paymentMethod === 'spei' ? 'opacity-100' : 'opacity-0'}`}></div>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="w-full lg:w-[420px] shrink-0">
                        <div className="sticky top-24 flex flex-col gap-6 rounded-xl border border-border-dark bg-surface-dark p-6 shadow-2xl">
                            <div className="flex items-center justify-between"><h3 className="text-white text-lg font-bold">Resumen</h3></div>

                            <div className="flex flex-col gap-4">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-border-dark relative">
                                            <img alt={item.product.name} className="h-full w-full object-cover" src={item.product.image} />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <p className="text-white font-bold leading-tight">{item.product.name}</p>
                                            <p className="text-text-secondary text-sm">{item.quantity} x {item.size.name}</p>
                                            <p className="text-primary font-bold">
                                                ${(((getEffectivePrice ? getEffectivePrice(item.size, checkoutData.shipping.date) : item.size.price) + (item.selectedAddons?.reduce((s: number, a: any) => s + a.price, 0) || 0)) * item.quantity).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Coupon Section */}
                            <div className="py-4 border-t border-border-dark">
                                <p className="text-sm font-medium text-text-secondary mb-2">Cupón de Descuento</p>
                                <div className="flex gap-2">
                                    <div className="relative grow">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            placeholder="Ingresa tu código"
                                            className="w-full rounded-lg bg-slate-800 border border-border-dark p-2.5 text-white text-sm uppercase focus:border-primary focus:outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleApplyCoupon}
                                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Aplicar
                                    </button>
                                </div>
                                {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                                {couponSuccess && <p className="text-green-500 text-xs mt-1">{couponSuccess}</p>}

                                {checkoutData.discount && (
                                    <div className="mt-2 text-sm bg-green-900/20 text-green-400 p-2 rounded border border-green-900/50 flex justify-between items-center">
                                        <span>Cupón: <b>{checkoutData.discount.code}</b></span>
                                        <button onClick={() => {
                                            updateCheckoutData('discount', undefined);
                                            setCouponSuccess('');
                                            setCouponCode('');
                                        }} className="text-xs hover:underline">Quitar</button>
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-border-dark w-full"></div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-text-secondary">
                                    <span>Subtotal</span>
                                    <span>${subtotal}</span>
                                </div>
                                {checkoutData.shippingCost > 0 && (
                                    <div className="flex justify-between text-sm text-text-secondary">
                                        <span>Envío</span>
                                        <span>+${checkoutData.shippingCost}</span>
                                    </div>
                                )}
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-sm text-green-400">
                                        <span>Descuento</span>
                                        <span>-${discountAmount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-end pt-2">
                                    <span className="text-text-secondary text-sm font-medium mb-1">Total Final</span>
                                    <div className="flex flex-col items-end"><span className="text-white text-3xl font-bold tracking-tight text-primary">${totalAmount}</span></div>
                                </div>
                            </div>

                            <button
                                onClick={handleFinishOrder}
                                disabled={loading}
                                className="group w-full rounded-lg bg-primary py-4 text-white font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <span>{loading ? 'Procesando...' : 'Finalizar Compra'}</span>
                                {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CheckoutPayment;