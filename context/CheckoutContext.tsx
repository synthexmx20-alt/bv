import { createContext } from 'react';
import { CheckoutState } from '../types';

export const CheckoutContext = createContext<{
    checkoutData: CheckoutState;
    updateCheckoutData: (section: keyof CheckoutState, data: any) => void;
    addToCart?: (product: any, size: any, quantity: number, selectedAddons?: any[]) => void;
    updateCartItemQuantity?: (index: number, quantity: number) => void;
    clearCart?: () => void;
    getEffectivePrice?: (size: any, date: string) => number;
}>({
    checkoutData: {
        shipping: { fullName: '', phone: '', street: '', colonia: '', reference: '', date: '', timeSlot: '', zipCode: '' },
        message: { from: '', to: '', note: '', isAnonymous: false, withoutNote: false },
        shippingCost: 0,
        paymentMethod: 'card',
        items: []
    },
    updateCheckoutData: () => { },
    addToCart: () => { },
    updateCartItemQuantity: () => { },
    clearCart: () => { },
    getEffectivePrice: (size: any, date: string) => size.price
});
