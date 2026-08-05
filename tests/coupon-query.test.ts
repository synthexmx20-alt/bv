import { describe, expect, it, vi } from 'vitest';
import { applyExactCouponCodeFilter } from '../supabase/functions/_shared/coupon-query';

describe('coupon database lookup', () => {
  it('uses exact equality so underscore-like codes are never SQL wildcards', () => {
    const query = {
      eq: vi.fn(() => query),
    };

    expect(applyExactCouponCodeFilter(query, '________')).toBe(query);
    expect(query.eq).toHaveBeenCalledWith('code', '________');
  });
});
