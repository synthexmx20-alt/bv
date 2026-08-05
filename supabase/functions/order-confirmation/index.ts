import { createClient } from 'npm:@supabase/supabase-js@2.89.0';

type OrderItem = {
  product_name: string | null;
  quantity: number | null;
  size: string | null;
  addons: unknown;
  price: string | number | null;
};

type AddonSnapshot = {
  name?: unknown;
  price?: unknown;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const json = (status: number, body: unknown): Response => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
});

const escapeHtml = (value: unknown): string => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const money = (value: unknown): string => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
    : '$0.00';
};

const recordValue = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

const addonRows = (value: unknown): AddonSnapshot[] =>
  Array.isArray(value)
    ? value.filter(addon => typeof addon === 'object' && addon !== null) as AddonSnapshot[]
    : [];

const sendEmail = async (
  resendKey: string,
  to: string,
  subject: string,
  html: string,
): Promise<void> => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Blue Velvet <pedidos@bluevelvetcuu.com>',
      to: [to],
      subject,
      html,
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    throw new Error(`Resend returned ${response.status}`);
  }
};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  if (request.method !== 'POST') {
    return json(405, { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const adminEmail = Deno.env.get('ORDER_ADMIN_EMAIL') ?? 'pedidos@bluevelvetcuu.com';
  if (!supabaseUrl || !serviceRoleKey || !resendKey) {
    console.error('order-confirmation missing server configuration');
    return json(503, { error: 'Service unavailable', code: 'SERVICE_NOT_CONFIGURED' });
  }

  if (request.headers.get('authorization') !== `Bearer ${serviceRoleKey}`) {
    return json(401, { error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  let orderId: string;
  try {
    const body = await request.json() as Record<string, unknown>;
    orderId = typeof body.orderId === 'string' ? body.orderId : '';
  } catch {
    return json(400, { error: 'Invalid JSON', code: 'INVALID_JSON' });
  }
  if (!UUID_PATTERN.test(orderId)) {
    return json(400, { error: 'Invalid order ID', code: 'ORDER_ID_INVALID' });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('id,user_id,total_amount,status,created_at,shipping_details,confirmation_email_sent_at')
    .eq('id', orderId)
    .maybeSingle();
  if (orderError) {
    console.error('order-confirmation order lookup failed', { orderId, code: orderError.code });
    return json(503, { error: 'Database unavailable', code: 'ORDER_LOOKUP_FAILED' });
  }
  if (!order) {
    return json(404, { error: 'Order not found', code: 'ORDER_NOT_FOUND' });
  }
  if (order.status !== 'confirmed' && order.status !== 'pending_transfer') {
    return json(409, { error: 'Order is not ready for confirmation', code: 'ORDER_STATUS_INVALID' });
  }
  if (order.confirmation_email_sent_at) {
    return json(200, { success: true, duplicate: true });
  }

  const [{ data: items, error: itemsError }, { data: profile, error: profileError }, authResult] = await Promise.all([
    admin
      .from('order_items')
      .select('product_name,quantity,size,addons,price')
      .eq('order_id', orderId),
    admin
      .from('profiles')
      .select('full_name')
      .eq('id', order.user_id)
      .maybeSingle(),
    admin.auth.admin.getUserById(order.user_id),
  ]);
  if (itemsError || profileError || authResult.error || !authResult.data.user?.email) {
    console.error('order-confirmation detail lookup failed', {
      orderId,
      itemsCode: itemsError?.code,
      profileCode: profileError?.code,
      authMessage: authResult.error?.message,
    });
    return json(503, { error: 'Order details unavailable', code: 'ORDER_DETAILS_FAILED' });
  }

  const claimedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await admin
    .from('orders')
    .update({ confirmation_email_sent_at: claimedAt })
    .eq('id', orderId)
    .is('confirmation_email_sent_at', null)
    .select('id')
    .maybeSingle();
  if (claimError) {
    console.error('order-confirmation claim failed', { orderId, code: claimError.code });
    return json(503, { error: 'Could not reserve email delivery', code: 'EMAIL_CLAIM_FAILED' });
  }
  if (!claimed) {
    return json(200, { success: true, duplicate: true });
  }

  const shipping = recordValue(order.shipping_details);
  const customerName = String(profile?.full_name ?? shipping.fullName ?? 'Cliente');
  const isPendingTransfer = order.status === 'pending_transfer';
  const orderItems = (items ?? []) as OrderItem[];
  const itemsHtml = orderItems.map(item => {
    const addons = addonRows(item.addons);
    const addonsHtml = addons.length > 0
      ? `<div style="margin-top:6px;color:#666;font-size:12px">${addons.map(addon =>
        `+ ${escapeHtml(addon.name)} (${escapeHtml(money(addon.price))})`).join('<br>')}</div>`
      : '';
    return `<tr>
      <td style="padding:12px 0;border-bottom:1px solid #e8e3dc">
        <strong>${escapeHtml(item.product_name)}</strong><br>
        <span style="color:#6f6a64;font-size:13px">${escapeHtml(item.size)}</span>${addonsHtml}
      </td>
      <td style="padding:12px;border-bottom:1px solid #e8e3dc;text-align:center">${escapeHtml(item.quantity)}</td>
      <td style="padding:12px 0;border-bottom:1px solid #e8e3dc;text-align:right">${escapeHtml(money(item.price))}</td>
    </tr>`;
  }).join('');

  const statusTitle = isPendingTransfer ? 'Pedido recibido · pago pendiente' : 'Pago confirmado';
  const statusCopy = isPendingTransfer
    ? 'Tu arreglo quedó reservado. Realiza la transferencia y envíanos el comprobante para confirmar el pago.'
    : 'Tu pago fue confirmado. Prepararemos cada detalle para la fecha elegida.';
  const emailHtml = `<!doctype html>
  <html lang="es"><body style="margin:0;background:#f4f1ec;font-family:Arial,sans-serif;color:#1d2433">
    <div style="max-width:640px;margin:0 auto;padding:28px 16px">
      <div style="background:#07101f;color:#fff;padding:28px;border-radius:18px 18px 0 0;text-align:center">
        <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#a9c5ee">Blue Velvet</div>
        <h1 style="margin:12px 0 6px;font-family:Georgia,serif;font-weight:normal">${escapeHtml(statusTitle)}</h1>
        <p style="margin:0;color:#dce5f2">Pedido #${escapeHtml(order.id.slice(0, 8))}</p>
      </div>
      <div style="background:#fff;padding:30px;border-radius:0 0 18px 18px">
        <p style="font-size:17px">Hola, ${escapeHtml(customerName)}.</p>
        <p style="line-height:1.6;color:#514d48">${escapeHtml(statusCopy)}</p>
        <table style="width:100%;border-collapse:collapse;margin:24px 0">
          <thead><tr style="color:#6f6a64;font-size:12px;text-transform:uppercase">
            <th style="text-align:left;padding-bottom:8px">Arreglo</th><th>Cant.</th><th style="text-align:right">Precio</th>
          </tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="font-size:20px;text-align:right;margin:20px 0"><strong>Total: ${escapeHtml(money(order.total_amount))}</strong></div>
        <div style="background:#f6f7f9;border-radius:12px;padding:18px;line-height:1.7">
          <strong>Entrega</strong><br>
          ${escapeHtml(shipping.date ?? 'Fecha por confirmar')} · ${escapeHtml(shipping.timeSlot ?? 'Horario por confirmar')}<br>
          ${escapeHtml(shipping.fullName ?? '')}<br>
          ${escapeHtml(shipping.street ?? '')}, ${escapeHtml(shipping.colonia ?? '')}
        </div>
        <p style="text-align:center;margin:28px 0 4px">
          <a href="https://bluevelvetcuu.com/#/order-confirmation/${escapeHtml(order.id)}" style="display:inline-block;background:#195dac;color:#fff;text-decoration:none;padding:13px 22px;border-radius:999px">Ver mi pedido</a>
        </p>
        <p style="text-align:center;color:#8a837b;font-size:12px;margin-top:28px">Blue Velvet Florería · Chihuahua, Chihuahua</p>
      </div>
    </div>
  </body></html>`;
  const subject = `${statusTitle} #${order.id.slice(0, 8)} · Blue Velvet`;

  try {
    await Promise.all([
      sendEmail(resendKey, authResult.data.user.email, subject, emailHtml),
      sendEmail(resendKey, adminEmail, `[NUEVO PEDIDO] ${subject}`, emailHtml),
    ]);
  } catch (error) {
    await admin
      .from('orders')
      .update({ confirmation_email_sent_at: null })
      .eq('id', orderId)
      .eq('confirmation_email_sent_at', claimedAt);
    console.error('order-confirmation Resend failure', {
      orderId,
      message: error instanceof Error ? error.message : 'unknown',
    });
    return json(502, { error: 'Email delivery failed', code: 'EMAIL_DELIVERY_FAILED' });
  }

  console.log('order-confirmation sent', { orderId, status: order.status });
  return json(200, { success: true, duplicate: false });
});
