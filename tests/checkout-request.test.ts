import { describe, expect, it } from 'vitest';
import { parseCheckoutRequest } from '../supabase/functions/_shared/checkout-request';

const validRequest = () => ({
  attemptId: '11111111-1111-4111-8111-111111111111',
  paymentMethod: 'card',
  couponCode: ' amor10 ',
  items: [{
    productId: '22222222-2222-4222-8222-222222222222',
    sizeName: 'Estándar',
    quantity: 2,
    addonIds: ['33333333-3333-4333-8333-333333333333'],
  }],
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
  returnOrigin: 'https://bluevelvetcuu.com',
});

describe('parseCheckoutRequest', () => {
  it('normalizes the coupon and preserves customer-entered fields', () => {
    const parsed = parseCheckoutRequest(validRequest());
    expect(parsed.couponCode).toBe('AMOR10');
    expect(parsed.shipping.fullName).toBe('Ana Pérez');
    expect(parsed.items[0]).toEqual({
      productId: '22222222-2222-4222-8222-222222222222',
      sizeName: 'Estándar',
      quantity: 2,
      addonIds: ['33333333-3333-4333-8333-333333333333'],
    });
  });

  it('rejects price fields from the browser', () => {
    const request = validRequest();
    const tampered = {
      ...request,
      total: 1,
      items: [{ ...request.items[0], price: 1 }],
    };
    expect(() => parseCheckoutRequest(tampered)).toThrow(/campo no permitido/i);
  });

  it.each([
    ['invalid attempt', (request: ReturnType<typeof validRequest>) => { request.attemptId = 'invalid'; }],
    ['invalid product', (request: ReturnType<typeof validRequest>) => { request.items[0].productId = 'invalid'; }],
    ['invalid add-on', (request: ReturnType<typeof validRequest>) => { request.items[0].addonIds = ['invalid']; }],
    ['invalid quantity', (request: ReturnType<typeof validRequest>) => { request.items[0].quantity = 0; }],
    ['invalid phone', (request: ReturnType<typeof validRequest>) => { request.shipping.phone = '123'; }],
    ['invalid date', (request: ReturnType<typeof validRequest>) => { request.shipping.date = '07/08/2026'; }],
    ['invalid ZIP', (request: ReturnType<typeof validRequest>) => { request.shipping.zipCode = '31A00'; }],
    ['invalid origin', (request: ReturnType<typeof validRequest>) => { request.returnOrigin = 'https://evil.example'; }],
  ])('rejects %s', (_label, mutate) => {
    const request = validRequest();
    mutate(request);
    expect(() => parseCheckoutRequest(request)).toThrow();
  });

  it('rejects more than twenty line items', () => {
    const request = validRequest();
    request.items = Array.from({ length: 21 }, () => ({ ...request.items[0] }));
    expect(() => parseCheckoutRequest(request)).toThrow(/20/);
  });
});
