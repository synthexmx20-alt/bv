import { describe, expect, it } from 'vitest';
import {
  PaymentVerificationError,
  verifyPaymentMatchesOrder,
} from '../supabase/functions/_shared/payment-domain';

const order = {
  id: '11111111-1111-4111-8111-111111111111',
  total_amount: '800.00',
};

const payment = {
  status: 'approved',
  currency_id: 'MXN',
  transaction_amount: 800,
  external_reference: order.id,
};

describe('verifyPaymentMatchesOrder', () => {
  it('accepts an exact approved MXN payment', () => {
    expect(() => verifyPaymentMatchesOrder(payment, order)).not.toThrow();
  });

  it.each([
    [{ ...payment, status: 'pending' }, 'PAYMENT_NOT_APPROVED'],
    [{ ...payment, currency_id: 'USD' }, 'PAYMENT_CURRENCY_MISMATCH'],
    [{ ...payment, transaction_amount: 799.99 }, 'PAYMENT_AMOUNT_MISMATCH'],
    [{ ...payment, transaction_amount: null }, 'PAYMENT_AMOUNT_INVALID'],
    [{ ...payment, external_reference: null }, 'PAYMENT_REFERENCE_INVALID'],
    [{ ...payment, external_reference: '22222222-2222-4222-8222-222222222222' }, 'PAYMENT_REFERENCE_MISMATCH'],
  ])('rejects payment mismatch %#', (candidate, code) => {
    try {
      verifyPaymentMatchesOrder(candidate, order);
      throw new Error('Expected payment verification to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(PaymentVerificationError);
      expect((error as PaymentVerificationError).code).toBe(code);
    }
  });
});
