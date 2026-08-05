import React, { useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckoutContext } from '../context/CheckoutContext';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
    const { checkoutData, updateCheckoutData, updateCartItemQuantity, clearCart } = useContext(CheckoutContext);
    const navigate = useNavigate();
    const drawerRef = useRef<HTMLDivElement>(null);

    const items = checkoutData.items || [];
    const totalAmount = items.reduce((sum, item) => sum + ((item.size.price + (item.selectedAddons?.reduce((s: number, a: any) => s + a.price, 0) || 0)) * item.quantity), 0);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Handle checkout navigation
    const handleCheckout = () => {
        onClose();
        navigate('/checkout/shipping');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity opacity-100"
                onClick={onClose}
            ></div>

            {/* Drawer Panel */}
            <div
                ref={drawerRef}
                className="relative w-full max-w-md bg-white dark:bg-[#101322] h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out animate-slideInRight"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-[#282b39]">
                    <h2 className="text-xl font-bold text-[#111418] dark:text-white">Tu Carrito ({items.length})</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-[#282b39] rounded-full transition-colors text-gray-500 dark:text-gray-400"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center gap-4 text-gray-500 dark:text-gray-400">
                            <span className="material-symbols-outlined text-6xl opacity-20">shopping_cart_off</span>
                            <p className="text-lg font-medium">Tu carrito está vacío</p>
                            <button
                                onClick={onClose}
                                className="text-primary font-bold hover:underline"
                            >
                                Explorar Catálogo
                            </button>
                        </div>
                    ) : (
                        items.map((item, idx) => (
                            <div key={idx} className="flex gap-4 animate-fadeIn">
                                <div className="size-20 bg-gray-100 dark:bg-[#282b39] rounded-lg overflow-hidden shrink-0">
                                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-0.5">
                                    <div>
                                        <h3 className="font-bold text-[#111418] dark:text-white leading-tight">{item.product.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.size.name} x {item.quantity}</p>

                                        {/* Add-ons display */}
                                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {item.selectedAddons.map((addon: any, i: number) => (
                                                    <span key={i} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
                                                        + {addon.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
                                            <button
                                                onClick={() => updateCheckoutData && updateCartItemQuantity && updateCartItemQuantity(idx, item.quantity - 1)}
                                                className="size-6 flex items-center justify-center rounded bg-white dark:bg-slate-700 shadow-sm hover:text-primary transition-colors text-gray-600 dark:text-gray-300"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">remove</span>
                                            </button>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white w-4 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateCheckoutData && updateCartItemQuantity && updateCartItemQuantity(idx, item.quantity + 1)}
                                                className="size-6 flex items-center justify-center rounded bg-white dark:bg-slate-700 shadow-sm hover:text-primary transition-colors text-gray-600 dark:text-gray-300"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">add</span>
                                            </button>
                                        </div>
                                        <span className="font-bold text-primary">${((item.size.price + (item.selectedAddons?.reduce((sum: number, a: any) => sum + a.price, 0) || 0)) * item.quantity).toLocaleString()}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => updateCheckoutData && updateCartItemQuantity && updateCartItemQuantity(idx, 0)}
                                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded transition-colors self-start"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </div>
                        ))
                    )}
                </div >

                {/* Footer */}
                {
                    items.length > 0 && (
                        <div className="p-6 border-t border-gray-100 dark:border-[#282b39] bg-gray-50 dark:bg-[#1a1d2d]">
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={clearCart}
                                    className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1 hover:underline"
                                >
                                    <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                                    Vaciar Carrito
                                </button>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600 dark:text-gray-300 font-medium">Subtotal</span>
                                    <span className="text-xl font-bold text-[#111418] dark:text-white">${totalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleCheckout}
                                    className="w-full py-4 bg-primary hover:bg-primary-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                >
                                    <span>Proceder al Pago</span>
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-[#282b39] rounded-xl transition-colors"
                                >
                                    Seguir Comprando
                                </button>
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
};

export default CartDrawer;
