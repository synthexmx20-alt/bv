import { moneyToCents } from './checkout-domain.ts';

export type MercadoPagoPaymentSnapshot = {
  status: string | null;
  currency_id: string | null;
  transaction_amount: string | number | null;
  external_reference: string | null;
};

export type PayableOrderSnapshot = {
  id: string;
  total_amount: string | number;
};

export class PaymentVerificationError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = 'PaymentVerificationError';
  }
}

const fail = (message: string, code: string): never => {
  throw new PaymentVerificationError(message, code);
};

export function verifyPaymentMatchesOrder(
  payment: MercadoPagoPaymentSnapshot,
  order: PayableOrderSnapshot,
): void {
  if (payment.status !== 'approved') {
    return fail('Mercado Pago todavía no aprobó el pago.', 'PAYMENT_NOT_APPROVED');
  }

  if (payment.currency_id !== 'MXN') {
    return fail('La moneda del pago no coincide con MXN.', 'PAYMENT_CURRENCY_MISMATCH');
  }

  if (!payment.external_reference) {
    return fail('El pago no contiene una referencia de pedido.', 'PAYMENT_REFERENCE_INVALID');
  }

  if (payment.external_reference !== order.id) {
    return fail('La referencia del pago pertenece a otro pedido.', 'PAYMENT_REFERENCE_MISMATCH');
  }

  if (payment.transaction_amount === null) {
    return fail('Mercado Pago no devolvió un importe válido.', 'PAYMENT_AMOUNT_INVALID');
  }

  let paymentCents: number;
  let orderCents: number;
  try {
    paymentCents = moneyToCents(payment.transaction_amount);
  } catch {
    return fail('Mercado Pago devolvió un importe inválido.', 'PAYMENT_AMOUNT_INVALID');
  }

  try {
    orderCents = moneyToCents(order.total_amount);
  } catch {
    return fail('El pedido no contiene un total válido.', 'ORDER_AMOUNT_INVALID');
  }

  if (paymentCents !== orderCents) {
    return fail('El importe pagado no coincide con el pedido.', 'PAYMENT_AMOUNT_MISMATCH');
  }
}
