import { describe, expect, it } from 'vitest';
import {
  buildCheckoutQuote,
  centsToMoney,
  moneyToCents,
  type BuildCheckoutQuoteInput,
} from '../supabase/functions/_shared/checkout-domain';

const baseInput = (): BuildCheckoutQuoteInput => ({
  requestedItems: [
    {
      productId: '11111111-1111-4111-8111-111111111111',
      sizeName: 'Estándar',
      quantity: 1,
      addonIds: [],
    },
  ],
  products: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Ramo Blue Velvet',
      price: '500.00',
      sizes: null,
    },
  ],
  addons: [],
  shippingZone: {
    id: '22222222-2222-4222-8222-222222222222',
    status: 'standard',
    surcharge: 0,
  },
  coupon: null,
  now: new Date('2026-08-05T12:00:00.000Z'),
});

describe('moneyToCents', () => {
  it.each([
    ['800.10', 80_010],
    [800.1, 80_010],
    ['0.01', 1],
    [0, 0],
  ])('converts %s MXN without floating-point drift', (value, expected) => {
    expect(moneyToCents(value)).toBe(expected);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1, '12.345', '', 'abc'])('rejects invalid money %s', value => {
    expect(() => moneyToCents(value)).toThrow();
  });

  it('converts integer centavos back to MXN', () => {
    expect(centsToMoney(167_000)).toBe(1670);
  });
});

describe('buildCheckoutQuote', () => {
  it('uses authoritative variant, add-on, shipping, and coupon rows', () => {
    const input = baseInput();
    input.requestedItems = [{
      productId: input.products[0].id,
      sizeName: 'Grande',
      quantity: 2,
      addonIds: ['33333333-3333-4333-8333-333333333333'],
    }];
    input.products[0].sizes = [{ name: 'Grande', price: 800 }];
    input.addons = [{
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Chocolates',
      price: 100,
      active: true,
      type: 'extra',
    }];
    input.shippingZone = {
      id: input.shippingZone.id,
      status: 'surcharge',
      surcharge: 50,
    };
    input.coupon = {
      code: 'AMOR10',
      discount_type: 'percentage',
      value: 10,
      expiration_date: null,
      usage_limit: null,
      usage_count: 0,
      active: true,
    };

    expect(buildCheckoutQuote(input)).toEqual({
      items: [{
        productId: input.products[0].id,
        productName: 'Ramo Blue Velvet',
        sizeName: 'Grande',
        quantity: 2,
        unitPriceCents: 80_000,
        addons: [{
          id: input.addons[0].id,
          name: 'Chocolates',
          type: 'extra',
          priceCents: 10_000,
        }],
        lineTotalCents: 180_000,
      }],
      subtotalCents: 180_000,
      shippingCents: 5_000,
      discountCents: 18_000,
      totalCents: 167_000,
      couponCode: 'AMOR10',
    });
  });

  it('uses the base product price when the product has no variants', () => {
    const quote = buildCheckoutQuote(baseInput());
    expect(quote.subtotalCents).toBe(50_000);
    expect(quote.totalCents).toBe(50_000);
  });

  it.each([0, -1, 1.5, 21])('rejects invalid quantity %s', quantity => {
    const input = baseInput();
    input.requestedItems[0].quantity = quantity;
    expect(() => buildCheckoutQuote(input)).toThrow(/cantidad/i);
  });

  it('rejects an empty cart', () => {
    const input = baseInput();
    input.requestedItems = [];
    expect(() => buildCheckoutQuote(input)).toThrow(/carrito/i);
  });

  it('rejects a missing product', () => {
    const input = baseInput();
    input.products = [];
    expect(() => buildCheckoutQuote(input)).toThrow(/producto/i);
  });

  it('rejects a missing variant when variants exist', () => {
    const input = baseInput();
    input.products[0].sizes = [{ name: 'Grande', price: 800 }];
    expect(() => buildCheckoutQuote(input)).toThrow(/variante/i);
  });

  it.each([
    { active: false, expected: /disponible/i },
    { active: true, expected: /extra/i, omit: true },
  ])('rejects inactive or missing add-ons', ({ active, expected, omit }) => {
    const input = baseInput();
    input.requestedItems[0].addonIds = ['33333333-3333-4333-8333-333333333333'];
    input.addons = omit ? [] : [{
      id: input.requestedItems[0].addonIds[0],
      name: 'Chocolates',
      price: 100,
      active,
      type: 'extra',
    }];
    expect(() => buildCheckoutQuote(input)).toThrow(expected);
  });

  it('rejects duplicate add-on IDs on one line', () => {
    const input = baseInput();
    const addonId = '33333333-3333-4333-8333-333333333333';
    input.requestedItems[0].addonIds = [addonId, addonId];
    input.addons = [{ id: addonId, name: 'Chocolates', price: 100, active: true, type: 'extra' }];
    expect(() => buildCheckoutQuote(input)).toThrow(/duplicado/i);
  });

  it('rejects a blocked shipping zone', () => {
    const input = baseInput();
    input.shippingZone.status = 'blocked';
    expect(() => buildCheckoutQuote(input)).toThrow(/entrega/i);
  });

  it.each([
    {
      coupon: { active: false, expiration_date: null, usage_limit: null, usage_count: 0 },
      expected: /activo/i,
    },
    {
      coupon: { active: true, expiration_date: '2026-08-04T00:00:00.000Z', usage_limit: null, usage_count: 0 },
      expected: /expirado/i,
    },
    {
      coupon: { active: true, expiration_date: null, usage_limit: 3, usage_count: 3 },
      expected: /usos/i,
    },
  ])('rejects an invalid coupon', ({ coupon, expected }) => {
    const input = baseInput();
    input.coupon = {
      code: 'AMOR10',
      discount_type: 'percentage',
      value: 10,
      ...coupon,
    };
    expect(() => buildCheckoutQuote(input)).toThrow(expected);
  });

  it('caps a fixed discount at the subtotal without discounting shipping', () => {
    const input = baseInput();
    input.shippingZone = { ...input.shippingZone, status: 'surcharge', surcharge: 50 };
    input.coupon = {
      code: 'REGALO',
      discount_type: 'fixed',
      value: 1_000,
      expiration_date: null,
      usage_limit: null,
      usage_count: 0,
      active: true,
    };

    expect(buildCheckoutQuote(input)).toMatchObject({
      subtotalCents: 50_000,
      discountCents: 50_000,
      shippingCents: 5_000,
      totalCents: 5_000,
    });
  });

  it('rejects percentage coupons above 100 percent', () => {
    const input = baseInput();
    input.coupon = {
      code: 'INVALIDO',
      discount_type: 'percentage',
      value: 101,
      expiration_date: null,
      usage_limit: null,
      usage_count: 0,
      active: true,
    };
    expect(() => buildCheckoutQuote(input)).toThrow(/porcentaje/i);
  });
});
