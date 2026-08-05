import type { RequestedCheckoutItem } from './checkout-domain.ts';

export type CheckoutRequest = {
  attemptId: string;
  paymentMethod: 'card' | 'spei';
  couponCode?: string;
  items: RequestedCheckoutItem[];
  shipping: {
    fullName: string;
    phone: string;
    street: string;
    colonia: string;
    reference?: string;
    date: string;
    timeSlot: string;
    zipCode: string;
    city?: string;
    state?: string;
  };
  message: {
    from?: string;
    to?: string;
    note?: string;
    isAnonymous: boolean;
    withoutNote: boolean;
  };
  returnOrigin: string;
};

export class CheckoutRequestError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = 'CheckoutRequestError';
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COUPON_PATTERN = /^[A-Z0-9_-]{1,50}$/;
const ALLOWED_ORIGINS = new Set([
  'https://bluevelvetcuu.com',
  'https://www.bluevelvetcuu.com',
  'http://localhost:3000',
  'http://localhost:4173',
]);
const PAGES_ORIGIN_PATTERN = /^https:\/\/(?:[a-z0-9-]+\.)?bluevelvet-1zu\.pages\.dev$/;

const fail = (message: string, code: string): never => {
  throw new CheckoutRequestError(message, code);
};

const recordValue = (value: unknown, field: string): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return fail(`${field} no tiene un formato válido.`, 'INVALID_OBJECT');
  }
  return value as Record<string, unknown>;
};

const assertOnlyKeys = (
  record: Record<string, unknown>,
  keys: readonly string[],
  field: string,
): void => {
  const allowed = new Set(keys);
  const unexpected = Object.keys(record).find(key => !allowed.has(key));
  if (unexpected) {
    return fail(`${field} contiene el campo no permitido “${unexpected}”.`, 'UNEXPECTED_FIELD');
  }
};

const stringValue = (
  value: unknown,
  field: string,
  options: { min?: number; max: number; optional?: boolean } = { max: 200 },
): string | undefined => {
  if (value === undefined || value === null) {
    if (options.optional) return undefined;
    return fail(`${field} es obligatorio.`, 'REQUIRED_FIELD');
  }
  if (typeof value !== 'string') {
    return fail(`${field} debe ser texto.`, 'INVALID_STRING');
  }
  const normalized = value.trim().normalize('NFC');
  const minimum = options.min ?? 1;
  if (normalized.length < minimum || normalized.length > options.max) {
    return fail(`${field} debe contener entre ${minimum} y ${options.max} caracteres.`, 'INVALID_LENGTH');
  }
  return normalized;
};

const uuidValue = (value: unknown, field: string): string => {
  const parsed = stringValue(value, field, { max: 36 });
  if (!parsed || !UUID_PATTERN.test(parsed)) {
    return fail(`${field} no es un UUID válido.`, 'INVALID_UUID');
  }
  return parsed.toLowerCase();
};

const booleanValue = (value: unknown, field: string): boolean => {
  if (typeof value !== 'boolean') {
    return fail(`${field} debe ser verdadero o falso.`, 'INVALID_BOOLEAN');
  }
  return value;
};

const parseOrigin = (value: unknown): string => {
  const raw = stringValue(value, 'returnOrigin', { max: 200 });
  let origin: string;
  try {
    const url = new URL(raw);
    origin = url.origin;
    if (url.href !== `${origin}/` && url.href !== origin) {
      return fail('returnOrigin no puede incluir una ruta.', 'INVALID_ORIGIN');
    }
  } catch {
    return fail('returnOrigin no es una URL válida.', 'INVALID_ORIGIN');
  }

  if (!ALLOWED_ORIGINS.has(origin) && !PAGES_ORIGIN_PATTERN.test(origin)) {
    return fail('returnOrigin no está autorizado.', 'ORIGIN_NOT_ALLOWED');
  }
  return origin;
};

const parseItem = (value: unknown, index: number): RequestedCheckoutItem => {
  const item = recordValue(value, `items[${index}]`);
  assertOnlyKeys(item, ['productId', 'sizeName', 'quantity', 'addonIds'], `items[${index}]`);

  if (!Number.isInteger(item.quantity) || (item.quantity as number) < 1 || (item.quantity as number) > 20) {
    return fail(`items[${index}].quantity debe estar entre 1 y 20.`, 'INVALID_QUANTITY');
  }
  if (!Array.isArray(item.addonIds) || item.addonIds.length > 20) {
    return fail(`items[${index}].addonIds no es válido.`, 'INVALID_ADDONS');
  }

  const addonIds = item.addonIds.map((addonId, addonIndex) =>
    uuidValue(addonId, `items[${index}].addonIds[${addonIndex}]`));
  if (new Set(addonIds).size !== addonIds.length) {
    return fail(`items[${index}] contiene extras duplicados.`, 'DUPLICATE_ADDON');
  }

  return {
    productId: uuidValue(item.productId, `items[${index}].productId`),
    sizeName: stringValue(item.sizeName, `items[${index}].sizeName`, { max: 100 }) as string,
    quantity: item.quantity as number,
    addonIds,
  };
};

export function parseCheckoutRequest(value: unknown): CheckoutRequest {
  const input = recordValue(value, 'checkout');
  assertOnlyKeys(
    input,
    ['attemptId', 'paymentMethod', 'couponCode', 'items', 'shipping', 'message', 'returnOrigin'],
    'checkout',
  );

  if (input.paymentMethod !== 'card' && input.paymentMethod !== 'spei') {
    return fail('paymentMethod no es válido.', 'INVALID_PAYMENT_METHOD');
  }
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 20) {
    return fail('El carrito debe contener entre 1 y 20 partidas.', 'INVALID_ITEMS');
  }

  const shipping = recordValue(input.shipping, 'shipping');
  assertOnlyKeys(
    shipping,
    ['fullName', 'phone', 'street', 'colonia', 'reference', 'date', 'timeSlot', 'zipCode', 'city', 'state'],
    'shipping',
  );
  const phone = stringValue(shipping.phone, 'shipping.phone', { max: 30 }) as string;
  const phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    return fail('shipping.phone no es válido.', 'INVALID_PHONE');
  }
  const date = stringValue(shipping.date, 'shipping.date', { max: 10 }) as string;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) !== date) {
    return fail('shipping.date debe usar YYYY-MM-DD.', 'INVALID_DATE');
  }
  const zipCode = stringValue(shipping.zipCode, 'shipping.zipCode', { max: 5 }) as string;
  if (!/^\d{5}$/.test(zipCode)) {
    return fail('shipping.zipCode debe contener cinco dígitos.', 'INVALID_ZIP');
  }

  const message = recordValue(input.message, 'message');
  assertOnlyKeys(message, ['from', 'to', 'note', 'isAnonymous', 'withoutNote'], 'message');

  let couponCode: string | undefined;
  if (input.couponCode !== undefined && input.couponCode !== null && input.couponCode !== '') {
    couponCode = (stringValue(input.couponCode, 'couponCode', { max: 50 }) as string).toUpperCase();
    if (!COUPON_PATTERN.test(couponCode)) {
      return fail('couponCode contiene caracteres no permitidos.', 'INVALID_COUPON_CODE');
    }
  }

  return {
    attemptId: uuidValue(input.attemptId, 'attemptId'),
    paymentMethod: input.paymentMethod,
    couponCode,
    items: input.items.map(parseItem),
    shipping: {
      fullName: stringValue(shipping.fullName, 'shipping.fullName', { max: 120 }) as string,
      phone,
      street: stringValue(shipping.street, 'shipping.street', { max: 180 }) as string,
      colonia: stringValue(shipping.colonia, 'shipping.colonia', { max: 120 }) as string,
      reference: stringValue(shipping.reference, 'shipping.reference', { max: 300, optional: true }),
      date,
      timeSlot: stringValue(shipping.timeSlot, 'shipping.timeSlot', { max: 80 }) as string,
      zipCode,
      city: stringValue(shipping.city, 'shipping.city', { max: 100, optional: true }),
      state: stringValue(shipping.state, 'shipping.state', { max: 100, optional: true }),
    },
    message: {
      from: stringValue(message.from, 'message.from', { max: 120, optional: true }),
      to: stringValue(message.to, 'message.to', { max: 120, optional: true }),
      note: stringValue(message.note, 'message.note', { min: 0, max: 600, optional: true }),
      isAnonymous: booleanValue(message.isAnonymous, 'message.isAnonymous'),
      withoutNote: booleanValue(message.withoutNote, 'message.withoutNote'),
    },
    returnOrigin: parseOrigin(input.returnOrigin),
  };
}
