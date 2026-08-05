import { createClient } from 'npm:@supabase/supabase-js@2.89.0';
import {
  PaymentVerificationError,
  verifyPaymentMatchesOrder,
  type MercadoPagoPaymentSnapshot,
} from '../_shared/payment-domain.ts';

type WebhookBody = {
  type?: string;
  topic?: string;
  action?: string;
  id?: string | number;
  data?: { id?: string | number };
};

type MercadoPagoPayment = MercadoPagoPaymentSnapshot & {
  id?: string | number;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const json = (status: number, body: unknown): Response => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
});

const invokeOrderEmail = async (
  supabaseUrl: string,
  serviceRoleKey: string,
  orderId: string,
): Promise<void> => {
  const response = await fetch(`${supabaseUrl}/functions/v1/order-confirmation`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    throw new Error(`order-confirmation returned ${response.status}`);
  }
};

Deno.serve(async request => {
  if (request.method !== 'POST') {
    return json(405, { received: false, code: 'METHOD_NOT_ALLOWED' });
  }

  const mercadoPagoAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!mercadoPagoAccessToken || !supabaseUrl || !serviceRoleKey) {
    console.error('mercadopago-webhook missing server configuration');
    return json(503, { received: false, code: 'SERVICE_NOT_CONFIGURED' });
  }

  let body: WebhookBody;
  try {
    body = await request.json() as WebhookBody;
  } catch {
    return json(400, { received: false, code: 'INVALID_JSON' });
  }

  const url = new URL(request.url);
  const eventType = body.type ?? body.topic ?? url.searchParams.get('type') ?? url.searchParams.get('topic');
  const rawPaymentId = body.data?.id ?? body.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id');
  const paymentId = rawPaymentId === undefined || rawPaymentId === null ? '' : String(rawPaymentId);

  if (eventType && eventType !== 'payment' && !body.action?.startsWith('payment.')) {
    return json(200, { received: true, ignored: true });
  }
  if (!/^\d{1,32}$/.test(paymentId)) {
    return json(400, { received: false, code: 'PAYMENT_ID_INVALID' });
  }

  let payment: MercadoPagoPayment;
  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: { Authorization: `Bearer ${mercadoPagoAccessToken}` },
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (!response.ok) {
      console.error('mercadopago-webhook payment lookup failed', {
        paymentId,
        status: response.status,
      });
      return json(response.status >= 500 ? 503 : 502, {
        received: false,
        code: 'PAYMENT_LOOKUP_FAILED',
      });
    }
    payment = await response.json() as MercadoPagoPayment;
  } catch (error) {
    console.error('mercadopago-webhook payment lookup exception', {
      paymentId,
      name: error instanceof Error ? error.name : 'unknown',
    });
    return json(503, { received: false, code: 'PAYMENT_LOOKUP_UNAVAILABLE' });
  }

  if (payment.status !== 'approved') {
    return json(200, {
      received: true,
      ignored: true,
      paymentStatus: payment.status ?? 'unknown',
    });
  }

  const orderId = payment.external_reference;
  if (!orderId || !UUID_PATTERN.test(orderId)) {
    console.warn('mercadopago-webhook invalid external reference', { paymentId });
    return json(200, { received: true, ignored: true, code: 'ORDER_REFERENCE_INVALID' });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('id,total_amount,status,payment_id')
    .eq('id', orderId)
    .maybeSingle();
  if (orderError) {
    console.error('mercadopago-webhook order lookup failed', {
      paymentId,
      orderId,
      code: orderError.code,
    });
    return json(503, { received: false, code: 'ORDER_LOOKUP_FAILED' });
  }
  if (!order) {
    console.warn('mercadopago-webhook order not found', { paymentId, orderId });
    return json(200, { received: true, ignored: true, code: 'ORDER_NOT_FOUND' });
  }

  try {
    verifyPaymentMatchesOrder(payment, order);
  } catch (error) {
    if (error instanceof PaymentVerificationError) {
      console.warn('mercadopago-webhook payment rejected', {
        paymentId,
        orderId,
        code: error.code,
      });
      return json(200, { received: true, ignored: true, code: error.code });
    }
    throw error;
  }

  const { data: confirmation, error: confirmationError } = await admin.rpc('confirm_checkout_payment', {
    p_order_id: orderId,
    p_payment_id: paymentId,
    p_amount: payment.transaction_amount,
    p_currency: payment.currency_id,
  });
  if (confirmationError) {
    console.error('mercadopago-webhook confirmation failed', {
      paymentId,
      orderId,
      code: confirmationError.code,
      message: confirmationError.message,
    });
    return json(503, { received: false, code: 'ORDER_CONFIRMATION_FAILED' });
  }

  const transitioned = Boolean((confirmation as Record<string, unknown> | null)?.transitioned);
  if (transitioned) {
    try {
      await invokeOrderEmail(supabaseUrl, serviceRoleKey, orderId);
    } catch (emailError) {
      console.error('mercadopago-webhook confirmation email failed', {
        orderId,
        message: emailError instanceof Error ? emailError.message : 'unknown',
      });
    }
  }

  console.log('mercadopago-webhook processed', { paymentId, orderId, transitioned });
  return json(200, { received: true, orderId, transitioned });
});
