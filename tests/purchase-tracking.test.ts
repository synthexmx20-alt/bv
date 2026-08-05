import { describe, expect, it } from 'vitest';
import {
  buildMetaPurchasePayload,
  isPurchaseEligible,
  purchaseStorageKey,
} from '../lib/purchaseTracking';

describe('purchase tracking', () => {
  it('fires only for a newly confirmed order that has not been tracked', () => {
    expect(isPurchaseEligible('confirmed', false, false)).toBe(true);
    expect(isPurchaseEligible('pending_payment', false, false)).toBe(false);
    expect(isPurchaseEligible('pending_transfer', false, false)).toBe(false);
    expect(isPurchaseEligible('confirmed', true, false)).toBe(false);
    expect(isPurchaseEligible('confirmed', false, true)).toBe(false);
  });

  it('deduplicates by order id and uses product ids in the Meta payload', () => {
    expect(purchaseStorageKey('order-123')).toBe('blue-velvet:purchase:order-123');
    expect(buildMetaPurchasePayload({
      id: 'order-123',
      total_amount: 1600,
      order_items: [
        { product_id: 'product-a', product_name: 'Rosas', quantity: 1 },
        { product_id: 'product-b', product_name: 'Tulipanes', quantity: 2 },
      ],
    })).toEqual({
      value: 1600,
      currency: 'MXN',
      content_ids: ['product-a', 'product-b'],
      contents: [
        { id: 'product-a', quantity: 1 },
        { id: 'product-b', quantity: 2 },
      ],
      content_name: 'Rosas, Tulipanes',
      content_type: 'product',
      order_id: 'order-123',
    });
  });
});
