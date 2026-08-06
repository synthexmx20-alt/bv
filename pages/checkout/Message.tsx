import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CheckoutHeader from '../../components/CheckoutHeader';
import { CheckoutContext } from '../../context/CheckoutContext';

import { Icon } from '../../components/Icon';
const CheckoutMessage = () => {
    const navigate = useNavigate();
    const { checkoutData, updateCheckoutData } = useContext(CheckoutContext);
    const [submitted, setSubmitted] = useState(false);

    const handleNext = () => {
        setSubmitted(true);
        const { from, to, note, isAnonymous, withoutNote } = checkoutData.message;

        // Validate: 
        // 1. 'from' required if NOT anonymous.
        // 2. 'to' always required.
        // 3. 'note' required if NOT withoutNote.
        if ((!isAnonymous && !from) || !to || (!withoutNote && !note)) {
            return;
        }

        navigate('/checkout/payment');
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display antialiased min-h-screen">
            <CheckoutHeader />
            <main className="layout-container flex h-full grow flex-col px-4 md:px-10 py-6 lg:px-20 xl:px-40">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 max-w-[1400px] mx-auto w-full">
                    <div className="flex flex-col flex-1 gap-8">
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-6 justify-between items-end">
                                <h1 className="text-white tracking-tight text-2xl md:text-3xl font-bold leading-tight">Personalización</h1>
                                <p className="text-text-secondary text-sm font-medium leading-normal">Paso 2 de 3</p>
                            </div>
                            <div className="rounded-full bg-surface-dark h-2 w-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: '66%' }}></div>
                            </div>
                        </div>
                        <section className="flex flex-col gap-6 p-6 rounded-xl border border-border-dark bg-surface-dark">
                            <div className="flex items-center gap-3 border-b border-border-dark pb-4">
                                <Icon name="edit_note" size={24} className="text-primary" />
                                <h2 className="text-white text-lg font-bold">Tarjeta y Dedicatoria</h2>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4">
                                <label className="flex flex-col flex-1 gap-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white text-sm font-medium">De (Remitente)</span>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="peer relative appearance-none w-4 h-4 border border-border-dark rounded bg-background-dark checked:bg-primary checked:border-primary transition-all"
                                                    checked={checkoutData.message.isAnonymous || false}
                                                    onChange={(e) => updateCheckoutData('message', { ...checkoutData.message, isAnonymous: e.target.checked })}
                                                />
                                                <Icon name="check" size={14} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                            </div>
                                            <span className="text-gray-400 text-xs font-medium select-none">Regalo Anónimo</span>
                                        </label>
                                    </div>
                                    <input
                                        className={`w-full rounded-lg bg-background-dark text-white px-4 py-3 focus:outline-none transition-opacity ${checkoutData.message.isAnonymous ? 'opacity-50 cursor-not-allowed border border-border-dark' : (submitted && !checkoutData.message.from ? 'border border-red-500 ring-1 ring-red-500' : 'border border-border-dark focus:border-primary')}`}
                                        placeholder={checkoutData.message.isAnonymous ? "Anónimo" : "Tu nombre"}
                                        type="text"
                                        disabled={checkoutData.message.isAnonymous}
                                        value={checkoutData.message.isAnonymous ? '' : checkoutData.message.from}
                                        onChange={(e) => updateCheckoutData('message', { ...checkoutData.message, from: e.target.value })}
                                    />
                                </label>
                                <label className="flex flex-col flex-1 gap-2">
                                    <span className="text-white text-sm font-medium">Para (Destinatario)</span>
                                    <input
                                        className={`w-full rounded-lg bg-background-dark text-white px-4 py-3 focus:outline-none ${submitted && !checkoutData.message.to ? 'border border-red-500 ring-1 ring-red-500' : 'border border-border-dark focus:border-primary'}`}
                                        placeholder="Nombre"
                                        type="text"
                                        value={checkoutData.message.to}
                                        onChange={(e) => updateCheckoutData('message', { ...checkoutData.message, to: e.target.value })}
                                    />
                                </label>
                            </div>
                            <label className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-white text-sm font-medium">Mensaje</span>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="peer relative appearance-none w-4 h-4 border border-border-dark rounded bg-background-dark checked:bg-primary checked:border-primary transition-all"
                                                checked={checkoutData.message.withoutNote || false}
                                                onChange={(e) => updateCheckoutData('message', { ...checkoutData.message, withoutNote: e.target.checked })}
                                            />
                                            <Icon name="check" size={14} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                        </div>
                                        <span className="text-gray-400 text-xs font-medium select-none">Sin Mensaje</span>
                                    </label>
                                </div>
                                <textarea
                                    className={`w-full rounded-lg bg-background-dark text-white px-4 py-3 resize-none focus:outline-none transition-opacity ${checkoutData.message.withoutNote ? 'opacity-50 cursor-not-allowed border border-border-dark' : (submitted && !checkoutData.message.note ? 'border border-red-500 ring-1 ring-red-500' : 'border border-border-dark focus:border-primary')}`}
                                    placeholder={checkoutData.message.withoutNote ? "Sin mensaje" : "Escribe aquí..."}
                                    rows={5}
                                    disabled={checkoutData.message.withoutNote}
                                    value={checkoutData.message.withoutNote ? '' : checkoutData.message.note}
                                    onChange={(e) => updateCheckoutData('message', { ...checkoutData.message, note: e.target.value })}
                                ></textarea>
                            </label>
                        </section>
                        <div className="flex lg:hidden gap-4 mt-4">
                            <Link to="/checkout/shipping" className="flex-1 py-3 px-6 rounded-lg border border-border-dark text-white text-center font-bold">Atrás</Link>
                            <button onClick={handleNext} className="flex-[2] py-3 px-6 rounded-lg bg-primary text-white font-bold">Continuar</button>
                        </div>
                        <div className="hidden lg:flex justify-end mt-4">
                            <button onClick={handleNext} className="py-3 px-8 rounded-lg bg-primary text-white font-bold hover:bg-blue-600 transition-all">
                                Continuar al Pago
                            </button>
                        </div>
                    </div>
                    <div className="hidden lg:block w-[380px] shrink-0">
                        <div className="sticky top-24 flex flex-col gap-6 p-6 rounded-xl border border-border-dark bg-surface-dark">
                            <h3 className="text-white text-lg font-bold border-b border-border-dark pb-4">Resumen</h3>
                            <div className="flex flex-col gap-4 py-4 max-h-[300px] overflow-y-auto">
                                {(checkoutData.items || []).map((item, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="size-16 rounded-lg overflow-hidden shrink-0 border border-border-dark">
                                            <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <p className="text-white text-sm font-bold leading-tight">{item.product.name}</p>
                                            <p className="text-gray-400 text-xs">{item.size.name} x {item.quantity}</p>
                                            <p className="text-primary font-bold text-sm">${(item.size.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col gap-2 border-t border-border-dark pt-4">
                                <div className="flex justify-between text-lg text-white font-bold mt-2 pt-2 border-t border-border-dark border-dashed">
                                    <span>Total</span>
                                    <span>${(checkoutData.items || []).reduce((sum, item) => sum + (item.size.price * item.quantity), 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CheckoutMessage;