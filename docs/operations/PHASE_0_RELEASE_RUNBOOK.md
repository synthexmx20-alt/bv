# Blue Velvet — Phase 0 release runbook

## Scope and production identifiers

- Supabase project ref: `zbzywcjkiyhodecpytnt`
- Production frontend: `https://bluevelvetcuu.com`
- Cloudflare Pages project: `bluevelvet-1zu`
- Production branch observed in Cloudflare: `main`
- Logical backup: `%LOCALAPPDATA%\BlueVelvetBackups\phase0-20260805-020929`
- Release branch: `codex/phase0-security`

Never record credentials, database connection strings, customer data, or secret values in this file.

## Verified preconditions

- The production roles, schema, and data logical backups are non-empty.
- Migration `20260115000000` was reconciled as applied only after confirming that its `payment_id` column already exists remotely.
- The remote-only migration `20260316071353` was recovered into the repository.
- `MP_ACCESS_TOKEN`, `RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` exist in Supabase secrets.
- The additive and restrictive SQL migrations pass locally; pgTAP reports 16/16.
- The browser suite reports 58/58 and lint, type-check, and build pass.

## Deployment order

The order is mandatory:

1. additive foundation migration `20260805030000`;
2. `checkout-order`, `mercadopago-webhook`, and private `order-confirmation` functions;
3. Cloudflare preview of the compatible frontend;
4. exact tested frontend commit promoted to production;
5. restrictive migration `20260805040000`;
6. legacy `create-preference` tombstone.

The restrictive migration must never run before the compatible frontend is confirmed live.

## Verification gate

Run from the release worktree:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm audit
npx supabase migration list --linked
npx supabase db push --dry-run --linked --include-all
```

The dry-run before backend deployment must contain only the reviewed Phase 0 migrations. Because the CLI does not support `--up-to`, temporarily move the restrictive migration outside `supabase/migrations`, push the foundation, and restore the exact file immediately. Confirm its Git hash/status before and after the move.

## Backend deployment

```powershell
npx supabase db push --linked --include-all
npx supabase functions deploy checkout-order --project-ref zbzywcjkiyhodecpytnt --no-verify-jwt
npx supabase functions deploy mercadopago-webhook --project-ref zbzywcjkiyhodecpytnt --no-verify-jwt
npx supabase functions deploy order-confirmation --project-ref zbzywcjkiyhodecpytnt --no-verify-jwt
npx supabase functions list --project-ref zbzywcjkiyhodecpytnt
```

Before frontend cutover, verify that an unauthenticated checkout returns `401`, malformed or tampered input returns a safe non-2xx response, and production's existing checkout remains available.

## Frontend smoke tests

Test the Cloudflare preview at 390×844 and desktop:

1. product → cart → shipping → message → payment;
2. form/cart remain intact after a rejected checkout;
3. coupon is validated by the server;
4. stored subtotal includes size, active extras, and shipping;
5. SPEI creates `pending_transfer` and emits no Purchase;
6. Mercado Pago preference total equals `orders.total_amount`;
7. callback URL cannot change order state;
8. failed/cancelled payment remains unconfirmed;
9. approved sandbox payment becomes `confirmed` only after the webhook;
10. confirmation reload/history emits no duplicate browser Purchase;
11. admin can still manage products, extras, settings, manual orders, and statuses.

Promote the exact preview commit to `main`, then verify the live domain serves that commit before applying restrictions.

## Post-cutover restrictions

After the production smoke test, `npx supabase db push --linked` must show only `20260805040000_phase0_checkout_restrictions.sql`. Apply it, then confirm:

- customer can select only their own orders and items;
- customer direct insert/update/delete on `orders` fails;
- customer insert on `order_items` fails;
- public coupon SELECT fails;
- admin mutations still work;
- `confirm_order_payment(uuid,text)` no longer exists;
- only `service_role` can execute the two Phase 0 RPCs.

## Rollback

Rollback order:

1. use Cloudflare Pages rollback to restore the previous production deployment;
2. apply `supabase/rollback/20260805_phase0_checkout_restrictions_down.sql` only if the old frontend needs its direct-write policies;
3. restore the previous Edge Function versions;
4. if additive schema rollback is genuinely required, restore from the logical backup in a controlled maintenance window instead of dropping columns in production.

The restrictions rollback intentionally reopens the legacy security exposure and is emergency-only. Reapply Phase 0 as soon as the compatible frontend is restored.

## Dependency audit decision

`npm audit fix` updated compatible transitive packages, including Vite and `ws`. The remaining React Router advisory affects its RSC/action server mode; this project is a client-only Vite SPA and does not use React Server Components or React Router server actions. The available automatic fix requires a major React Router upgrade, so it is deferred to a separately tested upgrade rather than forced into this checkout release.

## Release evidence

Record after deployment:

- production Git commit: pending;
- Cloudflare preview/deployment ID: pending;
- Supabase function versions: `checkout-order` v1, `mercadopago-webhook` v6, `order-confirmation` v13;
- applied migrations: `20260115000000` history repaired; `20260805030000` applied; restrictions pending;
- backend negative smoke test: 2026-08-05 03:48 America/Mexico_City — missing auth 401; tampered total 400;
- frontend smoke-test timestamp and operator: pending;
- rollback deployment ID: pending.
