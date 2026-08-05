import { describe, expect, it } from 'vitest';
import { toCheckoutRequest } from '../lib/checkoutApi';
import type { CheckoutState } from '../types';

const checkoutState = (): CheckoutState => ({
  shipping: {
    fullName: 'Ana Pérez',
    phone: '6141234567',
    street: 'Av. Universidad 100',
    colonia: 'Centro',
    reference: 'Puerta azul',
    date: '2026-08-07',
    timeSlot: '10:00 - 13:00',
    zipCode: '31000',
    city: 'Chihuahua',
    state: 'Chihuahua',
  },
  message: {
    from: 'Carlos',
    to: 'Ana',
    note: 'Feliz cumpleaños',
    isAnonymous: false,
    withoutNote: false,
  },
  shippingCost: 250,
  paymentMethod: 'card',
  discount: { code: 'amor10', amount: 9999, type: 'fixed' },
  items: [{
    product: {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Rosas Blue Velvet',
      price: 800,
      image: '/rosas.webp',
      description: 'Arreglo de rosas',
      category: 'Rosas',
    },
    size: { name: '50 rosas', price: 800 },
    quantity: 2,
    selectedAddons: [{
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Chocolates',
      price: 300,
      type: 'extra',
      active: true,
    }],
  }],
});

describe('toCheckoutRequest', () => {
  it('maps only catalog identifiers and customer-entered checkout data', () => {
    const request = toCheckoutRequest(
      checkoutState(),
      'https://bluevelvetcuu.com',
      '11111111-1111-4111-8111-111111111111',
    );

    expect(request).toEqual({
      attemptId: '11111111-1111-4111-8111-111111111111',
      paymentMethod: 'card',
      couponCode: 'AMOR10',
      items: [{
        productId: '22222222-2222-4222-8222-222222222222',
        sizeName: '50 rosas',
        quantity: 2,
        addonIds: ['33333333-3333-4333-8333-333333333333'],
      }],
      shipping: checkoutState().shipping,
      message: checkoutState().message,
      returnOrigin: 'https://bluevelvetcuu.com',
    });
  });

  it('never sends browser-provided prices, discounts, shipping costs, names or totals', () => {
    const serialized = JSON.stringify(toCheckoutRequest(
      checkoutState(),
      'https://bluevelvetcuu.com',
      '11111111-1111-4111-8111-111111111111',
    ));

    expect(serialized).not.toContain('9999');
    expect(serialized).not.toContain('Rosas Blue Velvet');
    expect(serialized).not.toContain('Chocolates');
    expect(serialized).not.toContain('shippingCost');
    expect(serialized).not.toContain('total');
    expect(serialized).not.toContain('price');
  });

  it('rejects an empty cart or missing checkout attempt', () => {
    const empty = checkoutState();
    empty.items = [];
    expect(() => toCheckoutRequest(empty, 'https://bluevelvetcuu.com', '11111111-1111-4111-8111-111111111111'))
      .toThrow(/carrito/i);
    expect(() => toCheckoutRequest(checkoutState(), 'https://bluevelvetcuu.com', ''))
      .toThrow(/intento/i);
  });
});
