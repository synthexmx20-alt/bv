import { createClient } from 'npm:@supabase/supabase-js@2.89.0';
import {
  buildCheckoutQuote,
  centsToMoney,
  CheckoutValidationError,
  moneyToCents,
  type CatalogAddon,
  type CatalogProduct,
  type CheckoutCoupon,
  type ShippingZone,
} from '../_shared/checkout-domain.ts';
import {
  CheckoutRequestError,
  parseCheckoutRequest,
} from '../_shared/checkout-request.ts';
import { applyExactCouponCodeFilter } from '../_shared/coupon-query.ts';
import {
  corsHeaders,
  getBearerToken,
  HttpError,
  isAllowedOrigin,
  jsonResponse,
  readJsonBody,
} from '../_shared/http.ts';

type CheckoutRpcResult = {
  order_id: string;
  created: boolean;
  status: 'pending_payment' | 'pending_transfer';
  total_amount: string | number;
  discount_amount: string | number;
  shipping_amount: string | number;
  payment_method: 'card' | 'spei';
  payment_preference_id: string | null;
  payment_init_point: string | null;
};

type MercadoPagoPreference = {
  id?: string;
  init_point?: string;
};

const normalizeLabel = (value: string): string =>
  value.trim().normalize('NFC').toLocaleLowerCase('es-MX');

const requireEnvironment = (name: string): string => {
  const value = Deno.env.get(name);
  if (!value) {
    throw new HttpError('El servicio de compra no está configurado.', 503, 'SERVICE_NOT_CONFIGURED');
  }
  return value;
};

const asRpcResult = (value: unknown): CheckoutRpcResult => {
  if (typeof value !== 'object' || value === null) {
    throw new HttpError('No se pudo crear el pedido.', 502, 'ORDER_RESULT_INVALID');
  }
  const result = value as Record<string, unknown>;
  if (
    typeof result.order_id !== 'string'
    || typeof result.created !== 'boolean'
    || (result.status !== 'pending_payment' && result.status !== 'pending_transfer')
    || (result.payment_method !== 'card' && result.payment_method !== 'spei')
    || !['string', 'number'].includes(typeof result.total_amount)
  ) {
    throw new HttpError('No se pudo confirmar la creación del pedido.', 502, 'ORDER_RESULT_INVALID');
  }
  return result as CheckoutRpcResult;
};

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
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (request.method !== 'POST') {
    return jsonResponse(origin, 405, { error: 'Método no permitido.', code: 'METHOD_NOT_ALLOWED' });
  }

  try {
    if (!isAllowedOrigin(origin)) {
      throw new HttpError('El origen de la solicitud no está autorizado.', 403, 'ORIGIN_NOT_ALLOWED');
    }

    const supabaseUrl = requireEnvironment('SUPABASE_URL');
    const anonKey = requireEnvironment('SUPABASE_ANON_KEY');
    const serviceRoleKey = requireEnvironment('SUPABASE_SERVICE_ROLE_KEY');
    const mercadoPagoAccessToken = requireEnvironment('MP_ACCESS_TOKEN');
    const token = getBearerToken(request);
    const checkout = parseCheckoutRequest(await readJsonBody(request));

    if (checkout.returnOrigin !== origin) {
      throw new HttpError('El origen de retorno no coincide con la solicitud.', 403, 'RETURN_ORIGIN_MISMATCH');
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData.user?.id || !authData.user.email) {
      throw new HttpError('Tu sesión expiró. Inicia sesión de nuevo.', 401, 'AUTH_INVALID');
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const productIds = [...new Set(checkout.items.map(item => item.productId))];
    const addonIds = [...new Set(checkout.items.flatMap(item => item.addonIds))];

    const productsQuery = admin
      .from('products')
      .select('id,name,price,sizes')
      .in('id', productIds);
    const addonsQuery = addonIds.length > 0
      ? admin.from('addons').select('id,name,price,type,active').in('id', addonIds)
      : Promise.resolve({ data: [] as CatalogAddon[], error: null });
    const zonesQuery = admin
      .from('shipping_zones')
      .select('id,zip_code,colony,status,surcharge')
      .eq('zip_code', checkout.shipping.zipCode)
      .limit(100);
    const couponQuery = checkout.couponCode
      ? applyExactCouponCodeFilter(
        admin
          .from('coupons')
          .select('code,discount_type,value,expiration_date,usage_limit,usage_count,active'),
        checkout.couponCode,
      )
        .limit(2)
      : Promise.resolve({ data: [] as CheckoutCoupon[], error: null });

    const [productsResult, addonsResult, zonesResult, couponResult] = await Promise.all([
      productsQuery,
      addonsQuery,
      zonesQuery,
      couponQuery,
    ]);
    const queryError = productsResult.error || addonsResult.error || zonesResult.error || couponResult.error;
    if (queryError) {
      console.error('checkout-order catalog query failed', { code: queryError.code });
      throw new HttpError('No pudimos validar el catálogo. Intenta de nuevo.', 503, 'CATALOG_UNAVAILABLE');
    }

    const matchingZones = (zonesResult.data ?? []).filter(zone =>
      normalizeLabel(zone.colony) === normalizeLabel(checkout.shipping.colonia));
    if (matchingZones.length === 0) {
      throw new HttpError('La colonia seleccionada no tiene cobertura.', 422, 'SHIPPING_ZONE_NOT_FOUND');
    }
    const shippingZone = [...matchingZones].sort((left, right) => {
      if (left.status === 'blocked') return -1;
      if (right.status === 'blocked') return 1;
      return Number(right.surcharge ?? 0) - Number(left.surcharge ?? 0);
    })[0] as ShippingZone;

    if (checkout.couponCode && (couponResult.data?.length ?? 0) !== 1) {
      throw new HttpError('El cupón no es válido.', 422, 'COUPON_NOT_FOUND');
    }

    const quote = buildCheckoutQuote({
      requestedItems: checkout.items,
      products: (productsResult.data ?? []) as CatalogProduct[],
      addons: (addonsResult.data ?? []) as CatalogAddon[],
      shippingZone,
      coupon: (couponResult.data?.[0] ?? null) as CheckoutCoupon | null,
    });
    const itemSnapshots = quote.items.map(item => ({
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      price: centsToMoney(item.unitPriceCents),
      size: item.sizeName,
      addons: item.addons.map(addon => ({
        id: addon.id,
        name: addon.name,
        type: addon.type,
        price: centsToMoney(addon.priceCents),
      })),
    }));
    const shippingDetails = {
      ...checkout.shipping,
      cost: centsToMoney(quote.shippingCents),
      zoneId: shippingZone.id,
      paymentMethod: checkout.paymentMethod,
    };

    const { data: rpcData, error: rpcError } = await admin.rpc('create_checkout_order', {
      p_user_id: authData.user.id,
      p_checkout_attempt_id: checkout.attemptId,
      p_payment_method: checkout.paymentMethod,
      p_total_amount: centsToMoney(quote.totalCents),
      p_shipping_details: shippingDetails,
      p_message_details: checkout.message,
      p_coupon_code: quote.couponCode,
      p_discount_amount: centsToMoney(quote.discountCents),
      p_items: itemSnapshots,
    });
    if (rpcError) {
      const customerErrors = new Set([
        'COUPON_INVALID',
        'COUPON_EXPIRED',
        'COUPON_EXHAUSTED',
        'COUPON_DISCOUNT_MISMATCH',
        'CHECKOUT_TOTAL_MISMATCH',
      ]);
      if (customerErrors.has(rpcError.message)) {
        throw new HttpError('El precio o cupón cambió. Revisa el resumen e intenta nuevamente.', 409, rpcError.message);
      }
      console.error('checkout-order RPC failed', { code: rpcError.code, message: rpcError.message });
      throw new HttpError('No pudimos crear el pedido. Intenta de nuevo.', 503, 'ORDER_CREATE_FAILED');
    }

    const order = asRpcResult(rpcData);
    const totalCents = moneyToCents(order.total_amount);
    const shippingCents = moneyToCents(order.shipping_amount ?? 0);
    const discountCents = moneyToCents(order.discount_amount ?? 0);
    const subtotalCents = totalCents - shippingCents + discountCents;

    if (order.payment_method === 'spei') {
      if (order.created) {
        try {
          await invokeOrderEmail(supabaseUrl, serviceRoleKey, order.order_id);
        } catch (emailError) {
          console.error('checkout-order SPEI email failed', {
            orderId: order.order_id,
            message: emailError instanceof Error ? emailError.message : 'unknown',
          });
        }
      }

      return jsonResponse(origin, 200, {
        orderId: order.order_id,
        status: order.status,
        subtotal: centsToMoney(subtotalCents),
        shipping: centsToMoney(shippingCents),
        discount: centsToMoney(discountCents),
        total: centsToMoney(totalCents),
        initPoint: null,
      });
    }

    let preferenceId = order.payment_preference_id;
    let initPoint = order.payment_init_point;
    if (!preferenceId || !initPoint) {
      const preferenceResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mercadoPagoAccessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': checkout.attemptId,
        },
        body: JSON.stringify({
          items: [{
            id: order.order_id,
            title: `Pedido Blue Velvet #${order.order_id.slice(0, 8)}`,
            quantity: 1,
            unit_price: centsToMoney(totalCents),
            currency_id: 'MXN',
          }],
          payer: {
            email: authData.user.email,
            name: checkout.shipping.fullName.split(/\s+/)[0],
            surname: checkout.shipping.fullName.split(/\s+/).slice(1).join(' ') || undefined,
          },
          external_reference: order.order_id,
          back_urls: {
            success: `${checkout.returnOrigin}/#/checkout/callback?order_id=${order.order_id}`,
            failure: `${checkout.returnOrigin}/#/checkout/callback?order_id=${order.order_id}`,
            pending: `${checkout.returnOrigin}/#/checkout/callback?order_id=${order.order_id}`,
          },
          auto_return: 'approved',
          notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      const preferenceBody = await preferenceResponse.json().catch(() => ({})) as MercadoPagoPreference;
      if (!preferenceResponse.ok || !preferenceBody.id || !preferenceBody.init_point) {
        console.error('checkout-order preference failed', {
          orderId: order.order_id,
          status: preferenceResponse.status,
        });
        throw new HttpError('Mercado Pago no está disponible. Tu pedido quedó guardado; intenta pagar de nuevo.', 502, 'PREFERENCE_CREATE_FAILED');
      }

      preferenceId = preferenceBody.id;
      initPoint = preferenceBody.init_point;
      const { error: preferenceSaveError } = await admin
        .from('orders')
        .update({
          payment_preference_id: preferenceId,
          payment_init_point: initPoint,
        })
        .eq('id', order.order_id);
      if (preferenceSaveError) {
        console.error('checkout-order preference persistence failed', {
          orderId: order.order_id,
          code: preferenceSaveError.code,
        });
        throw new HttpError('El enlace de pago se creó, pero no pudo guardarse. Intenta de nuevo.', 503, 'PREFERENCE_SAVE_FAILED');
      }
    }

    return jsonResponse(origin, 200, {
      orderId: order.order_id,
      status: order.status,
      subtotal: centsToMoney(subtotalCents),
      shipping: centsToMoney(shippingCents),
      discount: centsToMoney(discountCents),
      total: centsToMoney(totalCents),
      initPoint,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse(origin, error.status, { error: error.message, code: error.code });
    }
    if (error instanceof CheckoutRequestError) {
      return jsonResponse(origin, 400, { error: error.message, code: error.code });
    }
    if (error instanceof CheckoutValidationError) {
      return jsonResponse(origin, 422, { error: error.message, code: error.code });
    }
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      return jsonResponse(origin, 504, { error: 'El servicio tardó demasiado. Intenta nuevamente.', code: 'UPSTREAM_TIMEOUT' });
    }

    console.error('checkout-order unexpected failure', {
      name: error instanceof Error ? error.name : 'unknown',
      message: error instanceof Error ? error.message : 'unknown',
    });
    return jsonResponse(origin, 500, { error: 'Ocurrió un error al procesar el pedido.', code: 'INTERNAL_ERROR' });
  }
});
