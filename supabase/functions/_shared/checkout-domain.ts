export type RequestedCheckoutItem = {
  productId: string;
  sizeName: string;
  quantity: number;
  addonIds: string[];
};

export type CatalogProduct = {
  id: string;
  name: string;
  price: string | number;
  sizes: unknown;
};

export type CatalogAddon = {
  id: string;
  name: string;
  price: string | number;
  active: boolean;
  type: string;
};

export type ShippingZone = {
  id: string;
  status: 'standard' | 'surcharge' | 'blocked';
  surcharge: string | number;
};

export type CheckoutCoupon = {
  code: string;
  discount_type: 'percentage' | 'fixed';
  value: string | number;
  expiration_date: string | null;
  usage_limit: number | null;
  usage_count: number;
  active: boolean;
};

export type QuoteItem = {
  productId: string;
  productName: string;
  sizeName: string;
  quantity: number;
  unitPriceCents: number;
  addons: Array<{
    id: string;
    name: string;
    type: string;
    priceCents: number;
  }>;
  lineTotalCents: number;
};

export type CheckoutQuote = {
  items: QuoteItem[];
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  couponCode: string | null;
};

export type BuildCheckoutQuoteInput = {
  requestedItems: RequestedCheckoutItem[];
  products: CatalogProduct[];
  addons: CatalogAddon[];
  shippingZone: ShippingZone;
  coupon: CheckoutCoupon | null;
  now?: Date;
};

type ProductSizeRow = {
  name: string;
  price: string | number;
};

export class CheckoutValidationError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = 'CheckoutValidationError';
  }
}

const fail = (message: string, code: string): never => {
  throw new CheckoutValidationError(message, code);
};

const normalizeLabel = (value: string): string =>
  value.trim().normalize('NFC').toLocaleLowerCase('es-MX');

const assertSafeCents = (value: number, label: string): number => {
  if (!Number.isSafeInteger(value) || value < 0) {
    return fail(`${label} no es un importe válido.`, 'INVALID_MONEY');
  }
  return value;
};

export function moneyToCents(value: string | number): number {
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
      return fail('El importe no tiene un formato monetario válido.', 'INVALID_MONEY');
    }

    const [whole, decimals = ''] = normalized.split('.');
    const cents = Number(whole) * 100 + Number(decimals.padEnd(2, '0'));
    return assertSafeCents(cents, 'El importe');
  }

  if (!Number.isFinite(value) || value < 0) {
    return fail('El importe no es un número válido.', 'INVALID_MONEY');
  }

  const scaled = value * 100;
  const rounded = Math.round(scaled);
  if (Math.abs(scaled - rounded) > 1e-7) {
    return fail('El importe tiene más de dos decimales.', 'INVALID_MONEY');
  }

  return assertSafeCents(rounded, 'El importe');
}

export function centsToMoney(cents: number): number {
  return assertSafeCents(cents, 'El total') / 100;
}

const parseSizes = (sizes: unknown): ProductSizeRow[] => {
  if (!Array.isArray(sizes)) return [];

  return sizes.map(size => {
    if (
      typeof size !== 'object'
      || size === null
      || typeof (size as Record<string, unknown>).name !== 'string'
      || !['string', 'number'].includes(typeof (size as Record<string, unknown>).price)
    ) {
      return fail('La configuración de variantes del producto no es válida.', 'INVALID_PRODUCT_SIZES');
    }

    return {
      name: (size as Record<string, unknown>).name as string,
      price: (size as Record<string, unknown>).price as string | number,
    };
  });
};

const indexUnique = <T extends { id: string }>(rows: T[], label: string): Map<string, T> => {
  const result = new Map<string, T>();
  for (const row of rows) {
    if (result.has(row.id)) {
      return fail(`${label} contiene identificadores duplicados.`, 'DUPLICATE_CATALOG_ROW');
    }
    result.set(row.id, row);
  }
  return result;
};

const calculateDiscount = (
  coupon: CheckoutCoupon | null,
  subtotalCents: number,
  now: Date,
): { discountCents: number; couponCode: string | null } => {
  if (!coupon) return { discountCents: 0, couponCode: null };

  if (!coupon.active) {
    return fail('El cupón no está activo.', 'COUPON_INACTIVE');
  }

  if (coupon.expiration_date) {
    const expiration = new Date(coupon.expiration_date);
    if (Number.isNaN(expiration.getTime()) || expiration.getTime() < now.getTime()) {
      return fail('El cupón ha expirado.', 'COUPON_EXPIRED');
    }
  }

  if (
    coupon.usage_limit !== null
    && (!Number.isInteger(coupon.usage_limit)
      || coupon.usage_limit < 0
      || coupon.usage_count >= coupon.usage_limit)
  ) {
    return fail('El cupón alcanzó su límite de usos.', 'COUPON_EXHAUSTED');
  }

  let discountCents: number;
  if (coupon.discount_type === 'percentage') {
    const percentageBasisPoints = moneyToCents(coupon.value);
    if (percentageBasisPoints <= 0 || percentageBasisPoints > 10_000) {
      return fail('El porcentaje del cupón no es válido.', 'INVALID_COUPON_PERCENTAGE');
    }
    discountCents = Math.floor((subtotalCents * percentageBasisPoints) / 10_000);
  } else if (coupon.discount_type === 'fixed') {
    discountCents = moneyToCents(coupon.value);
  } else {
    return fail('El tipo de cupón no es válido.', 'INVALID_COUPON_TYPE');
  }

  return {
    discountCents: Math.min(discountCents, subtotalCents),
    couponCode: coupon.code.trim().toUpperCase(),
  };
};

export function buildCheckoutQuote(input: BuildCheckoutQuoteInput): CheckoutQuote {
  if (!Array.isArray(input.requestedItems) || input.requestedItems.length === 0) {
    return fail('El carrito está vacío.', 'EMPTY_CART');
  }
  if (input.requestedItems.length > 20) {
    return fail('El carrito excede el máximo de productos.', 'TOO_MANY_ITEMS');
  }

  const productsById = indexUnique(input.products, 'El catálogo de productos');
  const addonsById = indexUnique(input.addons, 'El catálogo de extras');

  const items = input.requestedItems.map(requestedItem => {
    if (!Number.isInteger(requestedItem.quantity) || requestedItem.quantity < 1 || requestedItem.quantity > 20) {
      return fail('La cantidad debe ser un número entero entre 1 y 20.', 'INVALID_QUANTITY');
    }

    const product = productsById.get(requestedItem.productId);
    if (!product) {
      return fail('Uno de los productos ya no está disponible.', 'PRODUCT_NOT_FOUND');
    }

    const sizes = parseSizes(product.sizes);
    const requestedSizeName = requestedItem.sizeName.trim();
    if (!requestedSizeName) {
      return fail('Debes seleccionar una variante.', 'SIZE_REQUIRED');
    }

    const selectedSize = sizes.length > 0
      ? sizes.find(size => normalizeLabel(size.name) === normalizeLabel(requestedSizeName))
      : null;
    if (sizes.length > 0 && !selectedSize) {
      return fail('La variante seleccionada ya no está disponible.', 'SIZE_NOT_FOUND');
    }

    const addonIds = Array.isArray(requestedItem.addonIds) ? requestedItem.addonIds : [];
    if (new Set(addonIds).size !== addonIds.length) {
      return fail('El pedido contiene un extra duplicado.', 'DUPLICATE_ADDON');
    }

    const addons = addonIds.map(addonId => {
      const addon = addonsById.get(addonId);
      if (!addon) {
        return fail('Uno de los extras ya no existe.', 'ADDON_NOT_FOUND');
      }
      if (!addon.active) {
        return fail(`El extra ${addon.name} ya no está disponible.`, 'ADDON_INACTIVE');
      }
      return {
        id: addon.id,
        name: addon.name,
        type: addon.type,
        priceCents: moneyToCents(addon.price),
      };
    });

    const unitPriceCents = moneyToCents(selectedSize?.price ?? product.price);
    const addonTotalCents = addons.reduce((sum, addon) => sum + addon.priceCents, 0);
    const lineTotalCents = assertSafeCents(
      (unitPriceCents + addonTotalCents) * requestedItem.quantity,
      'El total de la partida',
    );

    return {
      productId: product.id,
      productName: product.name,
      sizeName: selectedSize?.name ?? requestedSizeName,
      quantity: requestedItem.quantity,
      unitPriceCents,
      addons,
      lineTotalCents,
    } satisfies QuoteItem;
  });

  if (!input.shippingZone || input.shippingZone.status === 'blocked') {
    return fail('La zona seleccionada no tiene entrega disponible.', 'SHIPPING_BLOCKED');
  }

  const subtotalCents = assertSafeCents(
    items.reduce((sum, item) => sum + item.lineTotalCents, 0),
    'El subtotal',
  );
  const shippingCents = input.shippingZone.status === 'surcharge'
    ? moneyToCents(input.shippingZone.surcharge)
    : 0;
  const { discountCents, couponCode } = calculateDiscount(
    input.coupon,
    subtotalCents,
    input.now ?? new Date(),
  );
  const totalCents = assertSafeCents(
    subtotalCents + shippingCents - discountCents,
    'El total',
  );

  return {
    items,
    subtotalCents,
    shippingCents,
    discountCents,
    totalCents,
    couponCode,
  };
}
