# Blue Velvet Phase 0 Checkout Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing authenticated checkout calculate every payable amount on the server, confirm Mercado Pago payments only from a verified webhook, and emit one browser `Purchase` only for a confirmed order.

**Architecture:** Keep Cloudflare Pages and the current Supabase Cloud project. Add an authenticated `checkout-order` Edge Function backed by a service-role-only atomic Postgres RPC, then deploy a hardened Mercado Pago webhook and private email function. Roll out database restrictions only after the compatible frontend is live so production never has an interval where customers cannot check out.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Vitest, Supabase Postgres/Auth/Edge Functions, Mercado Pago Checkout Pro REST API, Cloudflare Pages.

---

## File map

- `supabase/functions/_shared/checkout-domain.ts`: pure checkout validation and integer-centavo calculations; no Deno or Supabase imports.
- `supabase/functions/_shared/payment-domain.ts`: pure Mercado Pago/order matching rules; no network or runtime imports.
- `supabase/functions/_shared/http.ts`: origin-aware CORS, JSON responses, safe error mapping, and bearer-token parsing.
- `supabase/functions/checkout-order/index.ts`: authenticated checkout orchestration, authoritative database reads, atomic order creation, and Mercado Pago preference creation.
- `supabase/functions/mercadopago-webhook/index.ts`: Mercado Pago payment lookup, amount/currency/reference verification, and idempotent confirmation.
- `supabase/functions/order-confirmation/index.ts`: service-role-only email delivery after an appropriate server transition.
- `supabase/functions/create-preference/index.ts`: compatibility tombstone deployed only after the frontend cutover.
- `supabase/migrations/20260805030000_phase0_checkout_foundation.sql`: additive columns and service-role-only checkout/confirmation RPCs.
- `supabase/migrations/20260805040000_phase0_checkout_restrictions.sql`: post-cutover RLS and removal of the unsafe confirmation RPC.
- `supabase/rollback/20260805_phase0_checkout_restrictions_down.sql`: explicit emergency rollback for the restrictive policy migration.
- `supabase/tests/checkout_security.sql`: pgTAP checks for RPC privileges and idempotent server transitions.
- `lib/checkoutApi.ts`: typed browser client for `checkout-order`.
- `lib/purchaseTracking.ts`: confirmed-order eligibility and per-order browser deduplication.
- `pages/checkout/Payment.tsx`: submit IDs and customer-entered delivery/message fields, then use server totals and redirect.
- `pages/checkout/ConfirmationCallback.tsx`: display-only callback; never mutates payment state.
- `pages/OrderConfirmation.tsx`: confirmed-only, deduplicated Meta Purchase event.
- `context/CheckoutProvider.tsx`, `context/CheckoutContext.tsx`, `types.ts`: stable checkout attempt ID and reset behavior.
- `tests/checkout-domain.test.ts`, `tests/purchase-tracking.test.ts`: security regression tests.
- `package.json`, `package-lock.json`, `eslint.config.js`, `tsconfig.app.json`, `vite.config.ts`: repeatable lint, type-check, test, and build commands.
- `docs/operations/PHASE_0_RELEASE_RUNBOOK.md`: deployment, smoke tests, observability, and rollback commands.

### Task 0: Preserve the production baseline

**Files:**
- External backup: `C:\Users\aleja\AppData\Local\BlueVelvetBackups\phase0-20260805-020929\roles.sql`
- External backup: `C:\Users\aleja\AppData\Local\BlueVelvetBackups\phase0-20260805-020929\schema.sql`
- External backup: `C:\Users\aleja\AppData\Local\BlueVelvetBackups\phase0-20260805-020929\data.sql`
- Reference: `BLUE_VELVET_V2_AUDIT.md`
- Reference: `docs/superpowers/specs/2026-08-05-blue-velvet-phase-0-security-design.md`

- [x] **Step 1: Establish a local Git baseline**

Run:

```powershell
git status --short
git log --oneline -2
```

Expected: a clean tree with baseline commits `1f5a900` and `c36c3e9`; `.env.local` and `supabase/.temp` are untracked and ignored.

- [x] **Step 2: Create logical production backups outside Git**

Run:

```powershell
npx supabase db dump --linked --file "$env:LOCALAPPDATA\BlueVelvetBackups\phase0-20260805-020929\roles.sql" --role-only
npx supabase db dump --linked --file "$env:LOCALAPPDATA\BlueVelvetBackups\phase0-20260805-020929\schema.sql"
npx supabase db dump --linked --file "$env:LOCALAPPDATA\BlueVelvetBackups\phase0-20260805-020929\data.sql" --data-only --use-copy --exclude "storage.buckets_vectors" --exclude "storage.vector_indexes"
```

Expected: non-empty files of approximately 297 bytes, 27 KB, and 770 KB respectively.

- [x] **Step 3: Confirm the live security baseline**

The schema export must show:

```sql
GRANT ALL ON FUNCTION public.confirm_order_payment(uuid, text) TO anon;
CREATE POLICY "Users can update own orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete access for authenticated users" ON public.orders FOR DELETE USING (auth.role() = 'authenticated');
```

Expected: all three conditions are present and therefore included in the restriction migration.

### Task 1: Add a focused test and verification harness

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `eslint.config.js`
- Create: `tsconfig.app.json`
- Modify: `vite.config.ts`

- [ ] **Step 1: Install the development-only verification packages**

Run:

```powershell
npm install --save-dev vitest eslint @eslint/js typescript-eslint eslint-plugin-react-hooks globals @types/node
```

Expected: `package-lock.json` records the packages and `npm audit` completes; audit findings are recorded but are not auto-fixed with breaking upgrades.

- [ ] **Step 2: Add deterministic project scripts**

Set the `scripts` object in `package.json` to:

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "eslint . --max-warnings=0",
  "typecheck": "tsc -p tsconfig.app.json --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "check": "npm run lint && npm run typecheck && npm test && npm run build"
}
```

- [ ] **Step 3: Separate browser TypeScript from the Deno runtime**

Create `tsconfig.app.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["vite/client", "vitest/globals"],
    "noEmit": true
  },
  "include": [
    "*.ts",
    "*.tsx",
    "components/**/*.ts",
    "components/**/*.tsx",
    "context/**/*.ts",
    "context/**/*.tsx",
    "hooks/**/*.ts",
    "lib/**/*.ts",
    "pages/**/*.ts",
    "pages/**/*.tsx",
    "tests/**/*.ts",
    "vite.config.ts"
  ],
  "exclude": ["dist", "node_modules", "supabase/functions"]
}
```

Create `eslint.config.js` with the browser, Node-config, and Deno-function globals explicitly separated. Ignore generated output, backups, Supabase link metadata, and the existing `tsc_output.txt`. Enable parser-level TypeScript validation and React Hooks rules while leaving legacy `any` types available during Phase 0.

```js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'supabase/.temp/**', 'tsc_output.txt'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  {
    files: ['supabase/functions/**/*.ts'],
    languageOptions: { globals: { ...globals.browser, Deno: 'readonly' } }
  }
);
```

- [ ] **Step 4: Run the baseline checks and classify pre-existing errors**

Run:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: tests report no test files before Task 2; lint/type errors in files touched by Phase 0 are corrected before the Task 1 commit. Existing unrelated errors are not hidden with blanket disable comments.

- [ ] **Step 5: Commit the harness**

```powershell
git add package.json package-lock.json eslint.config.js tsconfig.app.json vite.config.ts
git commit -m "test: add Phase 0 verification harness"
```

### Task 2: Build the authoritative checkout domain with TDD

**Files:**
- Create: `supabase/functions/_shared/checkout-domain.ts`
- Create: `tests/checkout-domain.test.ts`

- [ ] **Step 1: Write failing money and quantity tests**

Create tests that assert integer centavo behavior and rejection paths:

```ts
import { describe, expect, it } from 'vitest';
import { buildCheckoutQuote, moneyToCents } from '../supabase/functions/_shared/checkout-domain';

describe('moneyToCents', () => {
  it('converts MXN values without floating-point drift', () => {
    expect(moneyToCents('800.10')).toBe(80010);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1, '12.345'])('rejects invalid money %s', value => {
    expect(() => moneyToCents(value)).toThrow();
  });
});

describe('buildCheckoutQuote', () => {
  it('rejects zero, negative, fractional, and excessive quantities', () => {
    for (const quantity of [0, -1, 1.5, 21]) {
      expect(() => buildCheckoutQuote({
        requestedItems: [{ productId: 'p1', sizeName: 'Estándar', quantity, addonIds: [] }],
        products: [{ id: 'p1', name: 'Rosas', price: '500.00', sizes: null }],
        addons: [],
        shippingZone: { id: 'z1', status: 'standard', surcharge: 0 },
        coupon: null
      })).toThrow();
    }
  });
});
```

- [ ] **Step 2: Verify the domain tests fail**

Run:

```powershell
npm test -- tests/checkout-domain.test.ts
```

Expected: FAIL because `checkout-domain.ts` does not exist.

- [ ] **Step 3: Implement exact domain contracts and integer arithmetic**

Export these types and functions from `checkout-domain.ts`:

```ts
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
  addons: Array<{ id: string; name: string; type: string; priceCents: number }>;
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

export function moneyToCents(value: string | number): number;
export function centsToMoney(cents: number): number;
export function buildCheckoutQuote(input: {
  requestedItems: RequestedCheckoutItem[];
  products: CatalogProduct[];
  addons: CatalogAddon[];
  shippingZone: ShippingZone;
  coupon: CheckoutCoupon | null;
  now?: Date;
}): CheckoutQuote;
```

Implementation rules are exact: accept 1–20 whole units, reject duplicate add-on IDs per item, reject missing products, reject inactive/missing add-ons, use the named product size when `sizes` is a non-empty array, otherwise use the product base price, reject blocked shipping zones, cap percentage discounts at 100%, cap all discounts at the subtotal, and calculate `total = subtotal + shipping - discount` in centavos.

- [ ] **Step 4: Add tampering, add-on, coupon, and shipping tests**

Add cases that prove:

```ts
it('ignores all client prices by accepting IDs only', () => {
  const quote = buildCheckoutQuote({
    requestedItems: [{ productId: 'p1', sizeName: 'Grande', quantity: 2, addonIds: ['a1'] }],
    products: [{ id: 'p1', name: 'Rosas', price: 500, sizes: [{ name: 'Grande', price: 800 }] }],
    addons: [{ id: 'a1', name: 'Chocolates', price: 100, active: true, type: 'extra' }],
    shippingZone: { id: 'z1', status: 'surcharge', surcharge: 50 },
    coupon: { code: 'AMOR10', discount_type: 'percentage', value: 10, expiration_date: null, usage_limit: null, usage_count: 0, active: true }
  });

  expect(quote).toMatchObject({
    subtotalCents: 180000,
    shippingCents: 5000,
    discountCents: 18000,
    totalCents: 167000
  });
});
```

Also assert errors for expired/exhausted coupons, missing size, inactive add-on, duplicate add-on, blocked zone, and an empty cart.

- [ ] **Step 5: Run tests and commit**

Run:

```powershell
npm test -- tests/checkout-domain.test.ts
```

Expected: all checkout-domain tests PASS.

```powershell
git add supabase/functions/_shared/checkout-domain.ts tests/checkout-domain.test.ts
git commit -m "feat: add authoritative checkout calculator"
```

### Task 3: Add atomic database foundations

**Files:**
- Create: `supabase/migrations/20260805030000_phase0_checkout_foundation.sql`
- Create: `supabase/rollback/20260805_phase0_checkout_restrictions_down.sql`
- Create: `supabase/tests/checkout_security.sql`

- [ ] **Step 1: Write the additive migration**

The migration must add columns without rewriting existing rows:

```sql
alter table public.orders
  add column if not exists checkout_attempt_id uuid,
  add column if not exists payment_method text,
  add column if not exists payment_preference_id text,
  add column if not exists payment_currency text default 'MXN',
  add column if not exists payment_amount numeric(12,2),
  add column if not exists paid_at timestamptz,
  add column if not exists confirmation_email_sent_at timestamptz;

create unique index if not exists orders_user_checkout_attempt_uidx
  on public.orders (user_id, checkout_attempt_id)
  where checkout_attempt_id is not null;

create unique index if not exists orders_payment_id_uidx
  on public.orders (payment_id)
  where payment_id is not null;
```

Create the exact service RPC signature as `security definer set search_path = pg_catalog, public`:

```sql
public.create_checkout_order(
  p_user_id uuid,
  p_checkout_attempt_id uuid,
  p_payment_method text,
  p_total_amount numeric,
  p_shipping_details jsonb,
  p_message_details jsonb,
  p_coupon_code text,
  p_discount_amount numeric,
  p_items jsonb
) returns jsonb
```

It must:

1. reject a null user, invalid method, empty items, or non-positive total;
2. return the existing order for the same `(user_id, checkout_attempt_id)` before touching coupon usage;
3. lock the coupon row with `for update`, re-check active/expiration/usage limit, and increment usage once;
4. insert the order with `pending_payment` for card or `pending_transfer` for SPEI;
5. insert each `order_items` snapshot using `jsonb_to_recordset`;
6. return `jsonb_build_object('order_id', v_order_id, 'created', true)`;
7. revoke execution from `public`, `anon`, and `authenticated`, then grant only `service_role`.

Create `public.confirm_checkout_payment(p_order_id uuid, p_payment_id text, p_amount numeric, p_currency text) returns jsonb` with the same hardened ownership/search path. It must lock the order, compare the supplied MXN amount to `orders.total_amount`, reject a conflicting payment ID, update only `pending_payment` to `confirmed`, set `paid_at/payment_id/payment_amount/payment_currency`, and return whether this invocation performed the transition.

- [ ] **Step 2: Write the explicit restriction rollback before deploying restrictions**

The down script restores only the policies needed by the pre-cutover frontend and recreates the legacy confirmation function solely for emergency rollback:

```sql
create policy "Users can insert own orders" on public.orders
  for insert with check (auth.uid() = user_id);
create policy "Users can update own orders" on public.orders
  for update using (auth.uid() = user_id);
create policy "Users can insert own order items" on public.order_items
  for insert with check (
    exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
  );
create policy "Coupons are viewable by everyone" on public.coupons
  for select using (true);
```

The rollback must not delete the additive columns or any orders created by the new flow.

- [ ] **Step 3: Validate the migration in a local Supabase database**

Create `supabase/tests/checkout_security.sql` with pgTAP assertions for the final signatures:

```sql
begin;
select plan(6);
select ok(
  not has_function_privilege('anon', 'public.create_checkout_order(uuid,uuid,text,numeric,jsonb,jsonb,text,numeric,jsonb)', 'execute'),
  'anon cannot create checkout orders through the private RPC'
);
select ok(
  not has_function_privilege('authenticated', 'public.create_checkout_order(uuid,uuid,text,numeric,jsonb,jsonb,text,numeric,jsonb)', 'execute'),
  'authenticated cannot invoke the service RPC directly'
);
select ok(
  has_function_privilege('service_role', 'public.create_checkout_order(uuid,uuid,text,numeric,jsonb,jsonb,text,numeric,jsonb)', 'execute'),
  'service role can create checkout orders'
);
select ok(
  not has_function_privilege('anon', 'public.confirm_checkout_payment(uuid,text,numeric,text)', 'execute'),
  'anon cannot confirm payments'
);
select ok(
  not has_function_privilege('authenticated', 'public.confirm_checkout_payment(uuid,text,numeric,text)', 'execute'),
  'authenticated cannot confirm payments'
);
select ok(
  has_function_privilege('service_role', 'public.confirm_checkout_payment(uuid,text,numeric,text)', 'execute'),
  'service role can confirm payments'
);
select * from finish();
rollback;
```

Run:

```powershell
npx supabase start
npx supabase db reset
npx supabase test db
```

Expected: migration applies cleanly, RPC calls by `anon`/`authenticated` fail, and service-role calls succeed. If local startup is blocked by legacy migration drift, create an isolated SQL verification database from the production schema backup and apply only the new migration there; do not repair remote history by assumption.

- [ ] **Step 4: Commit the foundation migration**

```powershell
git add supabase/migrations/20260805030000_phase0_checkout_foundation.sql supabase/rollback/20260805_phase0_checkout_restrictions_down.sql supabase/tests/checkout_security.sql
git commit -m "feat: add atomic checkout database functions"
```

### Task 4: Implement the authenticated checkout Edge Function

**Files:**
- Create: `supabase/functions/_shared/http.ts`
- Create: `supabase/functions/checkout-order/index.ts`
- Modify: `supabase/config.toml`

- [ ] **Step 1: Add shared HTTP boundaries**

`http.ts` must export:

```ts
export const allowedOrigins = new Set([
  'https://bluevelvetcuu.com',
  'https://www.bluevelvetcuu.com',
  'http://localhost:3000',
  'http://localhost:4173'
]);

export function corsHeaders(origin: string | null): Record<string, string>;
export function jsonResponse(origin: string | null, status: number, body: unknown): Response;
export function getBearerToken(request: Request): string;
```

Allow `*.bluevelvet-1zu.pages.dev` preview origins without reflecting unrelated origins. Include `authorization, apikey, content-type, x-client-info` in allowed headers.

- [ ] **Step 2: Implement request authentication and validation**

`checkout-order/index.ts` accepts only `POST` and this payload:

```ts
type CheckoutRequest = {
  attemptId: string;
  paymentMethod: 'card' | 'spei';
  couponCode?: string;
  items: Array<{
    productId: string;
    sizeName: string;
    quantity: number;
    addonIds: string[];
  }>;
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
```

Use the caller bearer token with an anon Supabase client and `auth.getUser(token)`. Reject absent/invalid users with 401. Validate UUID syntax, bounded string lengths, phone, ISO delivery date, and a maximum of 20 line items before querying tables.

- [ ] **Step 3: Load only authoritative rows and build the quote**

With the service-role client:

```ts
const [{ data: products }, { data: addons }, { data: zones }, { data: coupon }] = await Promise.all([
  admin.from('products').select('id,name,price,sizes').in('id', productIds),
  addonIds.length ? admin.from('addons').select('id,name,price,type,active').in('id', addonIds) : Promise.resolve({ data: [] }),
  admin.from('shipping_zones').select('id,zip_code,colony,status,surcharge').eq('zip_code', shipping.zipCode),
  couponCode ? admin.from('coupons').select('code,discount_type,value,expiration_date,usage_limit,usage_count,active').eq('code', couponCode).maybeSingle() : Promise.resolve({ data: null })
]);
```

Match `colonia` exactly after Unicode normalization and case folding. Pass only these database rows to `buildCheckoutQuote`; never read a price, discount, or shipping charge from the browser payload.

- [ ] **Step 4: Create the order atomically and create the Mercado Pago preference idempotently**

Call `create_checkout_order` with monetary values converted back from centavos and immutable item/add-on snapshots. For card payments, call:

```ts
await fetch('https://api.mercadopago.com/checkout/preferences', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${mpAccessToken}`,
    'Content-Type': 'application/json',
    'X-Idempotency-Key': attemptId
  },
  body: JSON.stringify({
    items: [{
      id: orderId,
      title: `Pedido Blue Velvet #${orderId.slice(0, 8)}`,
      quantity: 1,
      unit_price: centsToMoney(quote.totalCents),
      currency_id: 'MXN'
    }],
    payer: { email: user.email },
    external_reference: orderId,
    back_urls: {
      success: `${returnOrigin}/#/checkout/callback?order_id=${orderId}`,
      failure: `${returnOrigin}/#/checkout/callback?order_id=${orderId}`,
      pending: `${returnOrigin}/#/checkout/callback?order_id=${orderId}`
    },
    notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`
  })
});
```

Persist `payment_preference_id` with the service role. Return only:

```ts
{
  orderId: string;
  status: 'pending_payment' | 'pending_transfer';
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  initPoint: string | null;
}
```

SPEI returns `initPoint: null`. Email failure is logged and does not roll back an already-created order.

- [ ] **Step 5: Configure gateway behavior explicitly**

Add:

```toml
[functions.checkout-order]
enabled = true
verify_jwt = false
entrypoint = "./functions/checkout-order/index.ts"

[functions.mercadopago-webhook]
enabled = true
verify_jwt = false
entrypoint = "./functions/mercadopago-webhook/index.ts"

[functions.order-confirmation]
enabled = true
verify_jwt = false
entrypoint = "./functions/order-confirmation/index.ts"
```

`verify_jwt = false` is paired with explicit `auth.getUser` in `checkout-order` and exact service-role authorization in `order-confirmation`; the Mercado Pago webhook is public by necessity and verifies payment through Mercado Pago.

- [ ] **Step 6: Run tests and commit**

```powershell
npm test -- tests/checkout-domain.test.ts
npx supabase functions serve checkout-order --env-file .env.local --no-verify-jwt
git add supabase/functions/_shared/http.ts supabase/functions/checkout-order/index.ts supabase/config.toml
git commit -m "feat: create secure checkout endpoint"
```

Expected: OPTIONS succeeds, missing JWT returns 401, malformed payload returns 400, and no client-supplied price field is accepted.

### Task 5: Harden payment confirmation and email delivery

**Files:**
- Modify: `supabase/functions/mercadopago-webhook/index.ts`
- Modify: `supabase/functions/order-confirmation/index.ts`
- Create: `supabase/functions/_shared/payment-domain.ts`
- Create: `tests/payment-verification.test.ts`

- [ ] **Step 1: Write failing payment verification tests**

Create `supabase/functions/_shared/payment-domain.ts` and test this pure decision function:

```ts
export function verifyPaymentMatchesOrder(payment: {
  status: string | null;
  currency_id: string | null;
  transaction_amount: number | null;
  external_reference: string | null;
}, order: { id: string; total_amount: number }): void;
```

Tests must reject a pending payment, non-MXN currency, missing/mismatched reference, missing amount, and any centavo mismatch. An approved MXN payment with exact order total must pass.

- [ ] **Step 2: Replace webhook trust with a Mercado Pago lookup**

The webhook must accept `data.id` from body or query string, then fetch:

```ts
const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
  headers: { Authorization: `Bearer ${mpAccessToken}` }
});
```

Load the order named by `external_reference`, call `verifyPaymentMatchesOrder`, then invoke `confirm_checkout_payment`. Return 200 for valid duplicate/non-approved notifications, 400 for malformed notifications, and 500 only for recoverable Mercado Pago/database failures so retries remain useful. Do not log customer payloads or full shipping details.

- [ ] **Step 3: Make confirmation email service-only**

At the beginning of `order-confirmation/index.ts`, require:

```ts
const authorization = request.headers.get('authorization');
if (authorization !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
}
```

Require a UUID `orderId`, fetch order/item/profile data with the service role, escape every customer string before interpolation, and return real non-2xx status codes on failure. After both Resend calls succeed, set `confirmation_email_sent_at`; if it is already set, return `{ success: true, duplicate: true }` without sending again.

- [ ] **Step 4: Trigger email only after the appropriate server transition**

For card, invoke `order-confirmation` only when `confirm_checkout_payment` returns `transitioned: true`. For SPEI, invoke it only when `create_checkout_order` returns `created: true`. Both internal calls carry the service-role bearer and API key.

- [ ] **Step 5: Run verification and commit**

```powershell
npm test -- tests/payment-verification.test.ts
git add supabase/functions/_shared/payment-domain.ts supabase/functions/mercadopago-webhook/index.ts supabase/functions/order-confirmation/index.ts tests/payment-verification.test.ts
git commit -m "fix: verify payments before confirming orders"
```

### Task 6: Move the browser checkout to the secure endpoint

**Files:**
- Create: `lib/checkoutApi.ts`
- Modify: `types.ts`
- Modify: `context/CheckoutContext.tsx`
- Modify: `context/CheckoutProvider.tsx`
- Modify: `pages/checkout/Payment.tsx`

- [ ] **Step 1: Add stable attempt state**

Extend `CheckoutState`:

```ts
checkoutAttemptId?: string;
```

When an item is added, removed, or its quantity changes, clear `checkoutAttemptId`. On the payment page, create it once with `crypto.randomUUID()` and store it through `updateCheckoutData`; retries and reloads use the same ID. `clearCart()` clears items, discount, and `checkoutAttemptId` only after the secure endpoint succeeds.

- [ ] **Step 2: Add a typed Edge Function client**

`checkoutApi.ts` must map the cart to IDs only:

```ts
export function toCheckoutRequest(data: CheckoutState, returnOrigin: string) {
  if (!data.checkoutAttemptId) throw new Error('No se pudo iniciar el intento de compra.');
  return {
    attemptId: data.checkoutAttemptId,
    paymentMethod: data.paymentMethod,
    couponCode: data.discount?.code,
    items: data.items.map(item => ({
      productId: item.product.id,
      sizeName: item.size.name,
      quantity: item.quantity,
      addonIds: (item.selectedAddons ?? []).map(addon => addon.id)
    })),
    shipping: data.shipping,
    message: data.message,
    returnOrigin
  };
}
```

Invoke `checkout-order` with the active Supabase session. Surface a concise Spanish error message and preserve checkout state on every failure.

- [ ] **Step 3: Remove direct order, order-item, coupon, email, and preference writes**

Delete from `Payment.tsx` every browser call to:

```ts
supabase.from('orders').insert(...)
supabase.from('order_items').insert(...)
supabase.from('coupons').update(...)
supabase.rpc('increment_coupon_usage', ...)
supabase.functions.invoke('order-confirmation', ...)
supabase.functions.invoke('create-preference', ...)
```

`handleFinishOrder` calls only `createCheckout(toCheckoutRequest(...))`. It uses response totals in the final UI state, clears the cart after success, routes SPEI to `/order-confirmation/:id?payment=spei`, and uses `window.location.assign(initPoint)` for card so pop-up blockers cannot strand the customer.

- [ ] **Step 4: Treat coupon display as an estimate**

Keep the current client coupon preview temporarily, but label the result `Descuento estimado; se validará al crear el pedido.` The server response is the only final discount. A rejected/expired coupon must leave fields/cart intact and show the returned error.

- [ ] **Step 5: Run browser checks and commit**

```powershell
npm run typecheck
npm test
npm run build
git add lib/checkoutApi.ts types.ts context/CheckoutContext.tsx context/CheckoutProvider.tsx pages/checkout/Payment.tsx
git commit -m "fix: submit checkout through trusted backend"
```

Expected: build passes; searching `Payment.tsx` for `.from('orders')`, `.from('order_items')`, `create-preference`, and `order-confirmation` returns no matches.

### Task 7: Make callbacks display-only and Purchase truthful

**Files:**
- Create: `lib/purchaseTracking.ts`
- Create: `tests/purchase-tracking.test.ts`
- Modify: `pages/checkout/ConfirmationCallback.tsx`
- Modify: `pages/OrderConfirmation.tsx`
- Modify: `pages/checkout/PaymentWaitingPage.tsx`

- [ ] **Step 1: Write failing Purchase eligibility tests**

```ts
import { describe, expect, it } from 'vitest';
import { isPurchaseEligible, purchaseStorageKey } from '../lib/purchaseTracking';

describe('isPurchaseEligible', () => {
  it.each(['pending', 'pending_payment', 'pending_transfer', 'failed'])('rejects %s', status => {
    expect(isPurchaseEligible({ status, fromHistory: false, alreadyTracked: false })).toBe(false);
  });

  it('accepts a first confirmed direct confirmation', () => {
    expect(isPurchaseEligible({ status: 'confirmed', fromHistory: false, alreadyTracked: false })).toBe(true);
  });

  it('rejects history and duplicate views', () => {
    expect(isPurchaseEligible({ status: 'confirmed', fromHistory: true, alreadyTracked: false })).toBe(false);
    expect(isPurchaseEligible({ status: 'confirmed', fromHistory: false, alreadyTracked: true })).toBe(false);
  });

  it('keys browser deduplication by order', () => {
    expect(purchaseStorageKey('abc')).toBe('bv:meta-purchase:abc');
  });
});
```

- [ ] **Step 2: Implement the pure tracking helper**

```ts
export function purchaseStorageKey(orderId: string): string {
  return `bv:meta-purchase:${orderId}`;
}

export function isPurchaseEligible(input: {
  status: string;
  fromHistory: boolean;
  alreadyTracked: boolean;
}): boolean {
  return input.status === 'confirmed' && !input.fromHistory && !input.alreadyTracked;
}
```

- [ ] **Step 3: Remove callback payment mutation**

`ConfirmationCallback.tsx` may read `order_id`, render `Pago no completado` for a failure result, and poll the authenticated user's order. It must never call `confirm_order_payment`, never trust `collection_status` as proof, and must route approved/pending browser returns to the waiting page until the server-confirmed order status is visible.

- [ ] **Step 4: Gate and deduplicate Meta Purchase**

Query `order_items(product_id, product_name, quantity, price)` and the order status/total. Emit:

```ts
window.fbq('track', 'Purchase', {
  content_ids: order.items.map(item => item.product_id).filter(Boolean),
  content_type: 'product',
  value: Number(order.total_amount),
  currency: 'MXN',
  order_id: order.id
});
```

Immediately store `localStorage.setItem(purchaseStorageKey(order.id), '1')` after the call. Read `history=true`, persisted status, and the storage key before calling Meta. SPEI stays `pending_transfer` and emits no Purchase, including after a new tab or browser session.

- [ ] **Step 5: Run tests, build, and commit**

```powershell
npm test -- tests/purchase-tracking.test.ts
npm run typecheck
npm run build
git add lib/purchaseTracking.ts tests/purchase-tracking.test.ts pages/checkout/ConfirmationCallback.tsx pages/checkout/PaymentWaitingPage.tsx pages/OrderConfirmation.tsx
git commit -m "fix: emit Purchase only for confirmed orders"
```

### Task 8: Write and validate the post-cutover restrictions

**Files:**
- Create: `supabase/migrations/20260805040000_phase0_checkout_restrictions.sql`
- Modify: `hooks/useVisitorTracker.ts`

- [ ] **Step 1: Remove browser order mutation and coupon disclosure policies**

The migration must run these exact policy removals idempotently:

```sql
drop policy if exists "Enable delete access for authenticated users" on public.orders;
drop policy if exists "Users can insert own orders" on public.orders;
drop policy if exists "Users can update own orders" on public.orders;
drop policy if exists "Users can insert own order items" on public.order_items;
drop policy if exists "Coupons are viewable by everyone" on public.coupons;
drop policy if exists "Enable write access for authenticated users" on public.addons;
drop policy if exists "Enable write access for authenticated users" on public.site_settings;
drop policy if exists "Allow public insert and update to unique_visitors" on public.unique_visitors;
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;

revoke execute on function public.confirm_order_payment(uuid, text) from public, anon, authenticated;
drop function if exists public.confirm_order_payment(uuid, text);
```

Add admin-only `FOR ALL` policies for `addons` and `site_settings` using `exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')`. Preserve public SELECT for products/categories/occasions/addons/site settings/shipping zones and preserve customers' SELECT of their own orders/items.

- [ ] **Step 2: Stop the insecure anonymous visitor upsert cleanly**

Change `useVisitorTracker.ts` so Phase 0 does not write to `unique_visitors`. Retain a no-op hook with the same signature and an explanatory comment that the analytics phase will replace it with a rate-limited endpoint; do not leave repeated 403 requests in production.

- [ ] **Step 3: Validate the restrictive migration locally**

Run SQL assertions as `anon`, `authenticated`, and admin:

```sql
select has_function_privilege('anon', 'public.confirm_checkout_payment(uuid,text,numeric,text)', 'execute');
select has_function_privilege('authenticated', 'public.create_checkout_order(uuid,uuid,text,numeric,jsonb,jsonb,text,numeric,jsonb)', 'execute');
select has_function_privilege('service_role', 'public.create_checkout_order(uuid,uuid,text,numeric,jsonb,jsonb,text,numeric,jsonb)', 'execute');
```

Expected: `false`, `false`, `true`. Authenticated direct insert/update/delete on orders and insert on order_items fail; selecting the caller's existing order still succeeds.

- [ ] **Step 4: Commit the restrictions**

```powershell
git add supabase/migrations/20260805040000_phase0_checkout_restrictions.sql hooks/useVisitorTracker.ts
git commit -m "fix: restrict browser database mutations"
```

### Task 9: Reconcile Supabase migration history without guessing

**Files:**
- Modify only if verified: `supabase/migrations/*`
- Create: `docs/operations/PHASE_0_RELEASE_RUNBOOK.md`

- [ ] **Step 1: Compare history and live schema**

Run:

```powershell
npx supabase migration list
rg -n 'payment_id|create_whatsapp_order' "$env:LOCALAPPDATA\BlueVelvetBackups\phase0-20260805-020929\schema.sql"
```

Expected: local-only `20260115000000` is already represented in the live schema; remote-only `20260316071353` contains the live WhatsApp function. Do not mark any migration applied until its effects are confirmed from the schema export.

- [ ] **Step 2: Record verified history reconciliation**

Use `supabase migration repair --status applied` only for a local-only migration whose exact schema effect already exists remotely. Fetch or document the remote-only migration before adding new history. Run `npx supabase db push --dry-run --include-all` and require that only the two Phase 0 migrations are proposed.

- [ ] **Step 3: Write the release runbook**

The runbook records:

```text
Project ref: zbzywcjkiyhodecpytnt
Production frontend: https://bluevelvetcuu.com
Backup: %LOCALAPPDATA%\BlueVelvetBackups\phase0-20260805-020929
Deployment order: foundation migration -> functions -> preview frontend -> production frontend -> restrictions -> legacy tombstone
Rollback order: Cloudflare Pages rollback -> restrictions down script -> function version rollback
```

Include the exact smoke checks from Task 11 and state that the restriction migration is never applied before the compatible frontend is live.

- [ ] **Step 4: Commit the runbook/history correction**

```powershell
git add supabase/migrations docs/operations/PHASE_0_RELEASE_RUNBOOK.md
git commit -m "docs: add Phase 0 release and rollback runbook"
```

### Task 10: Deploy the additive backend safely

**Files:**
- Deploy: `supabase/migrations/20260805030000_phase0_checkout_foundation.sql`
- Deploy: `checkout-order`, `mercadopago-webhook`, `order-confirmation`

- [ ] **Step 1: Run the complete local gate**

```powershell
npm run check
npx supabase db push --dry-run --include-all
```

Expected: lint, type-check, tests, and build all pass; dry run proposes only reviewed SQL.

- [ ] **Step 2: Apply only the additive foundation migration**

```powershell
npx supabase db push --include-all
```

Before confirming, compare the displayed migration list to the dry run. If it includes either unverified historical migration, cancel and reconcile history rather than applying it.

- [ ] **Step 3: Deploy new/hardened functions**

```powershell
npx supabase functions deploy checkout-order --project-ref zbzywcjkiyhodecpytnt --no-verify-jwt
npx supabase functions deploy mercadopago-webhook --project-ref zbzywcjkiyhodecpytnt --no-verify-jwt
npx supabase functions deploy order-confirmation --project-ref zbzywcjkiyhodecpytnt --no-verify-jwt
npx supabase functions list --project-ref zbzywcjkiyhodecpytnt
```

Expected: new versions are ACTIVE and current production checkout still works because direct-write policies have not yet been removed.

- [ ] **Step 4: Exercise backend negative paths before frontend cutover**

Verify missing JWT returns 401, malformed UUID returns 400, blocked shipping returns 422, inactive/missing add-on returns 422, and a client payload containing fake price fields does not change the server total. Do not create an approved payment during these negative tests.

### Task 11: Deploy and smoke-test the compatible frontend

**Files:**
- Deployment source: Git branch connected to Cloudflare Pages

- [ ] **Step 1: Recover the connected Git remote or authenticate Wrangler**

Identify the GitHub/GitLab repository shown in Cloudflare Pages settings, copy its exact HTTPS clone URL, and add it without embedding credentials. Verify the result with:

```powershell
git fetch origin
git remote -v
```

If the connected repository cannot be recovered, authenticate Wrangler and deploy a preview with the existing Pages project name. Never create a second production project or repoint DNS during Phase 0.

- [ ] **Step 2: Deploy a Cloudflare preview**

Push the Phase 0 branch to the connected repository and wait for the preview build. Confirm environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present in Cloudflare without printing their values.

- [ ] **Step 3: Run preview smoke tests at 390×844 and desktop**

Test:

1. product → cart → shipping → message → payment;
2. coupon preview and server validation;
3. server subtotal includes add-ons and shipping surcharge;
4. form values remain after a rejected checkout;
5. SPEI creates `pending_transfer`, sends no Purchase, and shows confirmation;
6. card preference total equals stored order total;
7. callback cannot alter order state;
8. failed/cancelled card remains unconfirmed;
9. approved sandbox payment becomes confirmed only after webhook;
10. reloading confirmation emits no second browser Purchase.

- [ ] **Step 4: Promote the exact preview commit to production**

Push/merge the tested commit to Cloudflare Pages' production branch `main`. Verify `https://bluevelvetcuu.com` serves the same commit and keep the previous Pages deployment available for immediate rollback.

### Task 12: Apply post-cutover restrictions and retire legacy entry points

**Files:**
- Deploy: `supabase/migrations/20260805040000_phase0_checkout_restrictions.sql`
- Deploy: `supabase/functions/create-preference/index.ts`

- [ ] **Step 1: Apply the restrictive migration only after production verification**

```powershell
npx supabase db push
```

Expected: only `20260805040000_phase0_checkout_restrictions.sql` is pending.

- [ ] **Step 2: Verify policies from a real customer session**

Confirm the production customer can read their order/history but direct browser insert/update/delete on `orders`, insert on `order_items`, and coupon-table SELECT fail. Confirm admin products, add-ons, settings, and orders management still work.

- [ ] **Step 3: Replace the legacy preference function with a tombstone**

The replacement handler requires a valid user bearer token, logs no request body, and returns:

```json
{
  "error": "Este flujo de pago fue reemplazado. Actualiza la página e intenta de nuevo.",
  "code": "CHECKOUT_FLOW_RETIRED"
}
```

with HTTP 410. Deploy it only after production no longer calls `create-preference`.

- [ ] **Step 4: Run final production smoke tests and monitor**

For at least one sandbox card success and one SPEI order, reconcile:

```text
Mercado Pago amount = orders.total_amount = Meta Purchase value
Mercado Pago currency = orders.payment_currency = MXN
Mercado Pago external_reference = orders.id
confirmed order has payment_id and paid_at
pending_transfer has neither paid_at nor Purchase
```

Check function logs for `checkout-order`, `mercadopago-webhook`, and `order-confirmation` without exposing customer data.

- [ ] **Step 5: Commit the legacy tombstone and release notes**

```powershell
git add supabase/functions/create-preference/index.ts docs/operations/PHASE_0_RELEASE_RUNBOOK.md
git commit -m "chore: retire insecure checkout entry points"
```

### Task 13: Final verification and release evidence

**Files:**
- Modify: `docs/operations/PHASE_0_RELEASE_RUNBOOK.md`

- [ ] **Step 1: Run a fresh verification gate**

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm audit
npx supabase functions list --project-ref zbzywcjkiyhodecpytnt
npx supabase migration list
git status --short
```

Expected: lint/type-check/tests/build pass, the working tree is clean, remote migrations include both Phase 0 entries, and function versions match the runbook. Audit vulnerabilities are recorded with dependency/path and remediation decision.

- [ ] **Step 2: Record deployed identifiers and rollback points**

Append the production Git commit, Cloudflare deployment identifier, Supabase function versions, applied migration versions, backup path, and smoke-test timestamp to the runbook. Do not record tokens, database URLs, customer data, or environment values.

- [ ] **Step 3: Confirm Phase 0 acceptance criteria**

Acceptance requires all of the following:

```text
Browser sends IDs and customer-entered fields, never authoritative prices.
Server total includes products, selected sizes, active add-ons, shipping, and valid coupon.
Only the verified Mercado Pago webhook confirms card payment.
SPEI remains pending until manual verification.
No public/authenticated RPC can confirm arbitrary orders.
Customer cannot insert/update/delete orders directly after cutover.
Purchase is confirmed-only, uses product IDs/MXN/order ID, and is browser-deduplicated.
Cloudflare rollback and SQL restriction rollback are documented and usable.
```

- [ ] **Step 4: Commit final evidence**

```powershell
git add docs/operations/PHASE_0_RELEASE_RUNBOOK.md
git commit -m "docs: record Phase 0 production verification"
```
