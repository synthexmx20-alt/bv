import type { CheckoutState } from '../types';

export type SecureCheckoutRequest = {
  attemptId: string;
  paymentMethod: 'card' | 'spei';
  couponCode?: string;
  items: Array<{
    productId: string;
    sizeName: string;
    quantity: number;
    addonIds: string[];
  }>;
  shipping: CheckoutState['shipping'];
  message: CheckoutState['message'];
  returnOrigin: string;
};

export type SecureCheckoutResponse = {
  orderId: string;
  status: 'pending_payment' | 'pending_transfer';
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  initPoint: string | null;
};

export class CheckoutApiError extends Error {
  constructor(
    message: string,
    readonly code = 'CHECKOUT_FAILED',
    readonly status?: number,
  ) {
    super(message);
    this.name = 'CheckoutApiError';
  }
}

export const toCheckoutRequest = (
  checkout: CheckoutState,
  returnOrigin: string,
  attemptId: string,
): SecureCheckoutRequest => {
  if (!attemptId.trim()) {
    throw new CheckoutApiError('No se pudo identificar el intento de compra.', 'ATTEMPT_REQUIRED');
  }
  if (!checkout.items?.length) {
    throw new CheckoutApiError('Tu carrito está vacío.', 'CART_EMPTY');
  }

  const couponCode = checkout.discount?.code.trim().toUpperCase();
  return {
    attemptId,
    paymentMethod: checkout.paymentMethod,
    ...(couponCode ? { couponCode } : {}),
    items: checkout.items.map(item => ({
      productId: item.product.id,
      sizeName: item.size.name,
      quantity: item.quantity,
      addonIds: (item.selectedAddons ?? []).map(addon => addon.id),
    })),
    shipping: { ...checkout.shipping },
    message: { ...checkout.message },
    returnOrigin,
  };
};

const isCheckoutResponse = (value: unknown): value is SecureCheckoutResponse => {
  if (typeof value !== 'object' || value === null) return false;
  const response = value as Record<string, unknown>;
  return typeof response.orderId === 'string'
    && (response.status === 'pending_payment' || response.status === 'pending_transfer')
    && typeof response.subtotal === 'number'
    && typeof response.shipping === 'number'
    && typeof response.discount === 'number'
    && typeof response.total === 'number'
    && (typeof response.initPoint === 'string' || response.initPoint === null);
};

const readFunctionError = async (error: unknown): Promise<CheckoutApiError> => {
  const fallbackMessage = error instanceof Error ? error.message : 'No pudimos procesar tu pedido.';
  const context = typeof error === 'object' && error !== null && 'context' in error
    ? (error as { context?: Response }).context
    : undefined;
  if (!context) return new CheckoutApiError(fallbackMessage);

  const body = await context.clone().json().catch(() => null) as { error?: unknown; code?: unknown } | null;
  return new CheckoutApiError(
    typeof body?.error === 'string' ? body.error : fallbackMessage,
    typeof body?.code === 'string' ? body.code : 'CHECKOUT_FAILED',
    context.status,
  );
};

export const createSecureCheckout = async (
  request: SecureCheckoutRequest,
): Promise<SecureCheckoutResponse> => {
  const { supabase } = await import('./supabase');
  const { data, error } = await supabase.functions.invoke('checkout-order', { body: request });
  if (error) throw await readFunctionError(error);
  if (!isCheckoutResponse(data)) {
    throw new CheckoutApiError('El servidor devolvió una respuesta de compra incompleta.', 'INVALID_RESPONSE');
  }
  return data;
};
