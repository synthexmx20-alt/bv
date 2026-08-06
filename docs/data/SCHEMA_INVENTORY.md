# Blue Velvet — Inventario del esquema Supabase

**Versión:** 1.0 · **Fecha:** 2026-08-06 · **Prompt:** `BV2-06`
**Tipos generados:** `src/types/database.generated.ts`

> Snapshot **documental** del esquema. NO proviene de una lectura en vivo de
> producción (en este entorno no hay project-ref vinculado ni credenciales);
> se reconstruye desde `supabase_schema.sql` (histórico), `supabase/migrations/*`,
> el SQL suelto de raíz y los queries del frontend. **No se volcaron datos de
> clientes ni secretos. Cero mutaciones remotas (sin db push / repair / deploy).**

---

## 1. Esquema confirmado (versionado o histórico confiable)

Tablas cuya estructura está respaldada por migraciones versionadas o por
`supabase_schema.sql`. Mapeadas en `database.generated.ts`.

| Tabla | Fuente | Columnas clave | RLS |
|---|---|---|---|
| `profiles` | supabase_schema.sql | id (uuid FK auth.users), role | SELECT público; INSERT/UPDATE propio |
| `orders` | supabase_schema.sql + migraciones Fase 0 | id, user_id, total_amount, status, shipping_details, message_details, coupon_code, discount_amount, payment_id, checkout_attempt_id, payment_method, payment_preference_id, payment_init_point, payment_currency, payment_amount, paid_at, confirmation_email_sent_at | propio + admin; restringido por Fase 0 (server-side checkout) |
| `order_items` | supabase_schema.sql + add_addons_to_order_items.sql | id, order_id, product_id, product_name, quantity, price, size, addons (jsonb) | propio + admin; INSERT restringido Fase 0 |
| `products` | legado (creada fuera de migraciones) + apply_products_rls.sql + add_seo_columns | id, name, price, originalPrice, image, description, category, occasions, sizes (jsonb), meta_title, meta_description | SELECT público; INSERT/UPDATE/DELETE admin |
| `occasions` | supabase_schema.sql | id, name, created_at | SELECT público; admin CRUD |
| `addons` | migración create_addons_table | id, name, price, type, active, created_at | SELECT público; write autenticado |
| `coupons` | supabase_schema.sql | id, code, discount_type, value, expiration_date, usage_limit, usage_count, active | SELECT público (restringido a vacío por Fase 0); admin CRUD |
| `cart_items` | supabase_schema.sql | id, user_id, product_id (uuid FK products), quantity, size (jsonb), addons (jsonb) | propio (CRUD propio) |
| `site_settings` | migración create_settings_table | key (PK), value, description | SELECT público; write autenticado |

### RPC (funciones SQL llamadas desde el frontend)

| RPC | Uso | Nota |
|---|---|---|
| `confirm_checkout_payment` | confirmar pago (webhook/server) | Fase 0; solo service_role |
| `create_checkout_order` | crear pedido server-side | Fase 0; solo service_role |
| `get_users_with_email` | admin: listar usuarios con email | admin |

### Edge Functions (supabase/functions)

| Function | Estado |
|---|---|
| `checkout-order` | activa (v2) |
| `mercadopago-webhook` | activa (v6) |
| `order-confirmation` | activa (v13) |
| `create-preference` | **retirada** (v24, Fase 0) — no reactivar |

### Storage (buckets)

| Bucket | Fuente | Acceso |
|---|---|---|
| `products` | setup_storage.sql | SELECT público; mutación admin (Fase 0) |

---

## 2. Legado no reconciliado (SQL suelto de raíz)

Estos scripts crean/alteran tablas o políticas pero **no están en
`supabase/migrations`**, por lo que su estado aplicado es incierto. NO se
convirtieron en migraciones aplicables automáticamente (decisión de BV2-06).

| Archivo | Qué hace | Tabla afectada |
|---|---|---|
| `setup_categories.sql` | CREATE TABLE categories + RLS | `categories` |
| `create_shipping_zones.sql` | CREATE TABLE shipping_zones + índice + RLS | `shipping_zones` |
| `create_visitor_counter.sql` | CREATE TABLE unique_visitors + RLS | `unique_visitors` |
| `create_addresses_table.sql` | CREATE TABLE user_addresses + RLS | `user_addresses` |
| `create_settings_table.sql` | CREATE TABLE site_settings + seed | (ya migrada) |
| `create_addons_table.sql` | CREATE TABLE addons + seed | (ya migrada) |
| `seed_categories.sql` | INSERT categorías | categories (datos) |
| `seed_shipping_zones.sql` | INSERT zonas de envío | shipping_zones (datos) |
| `setup_storage.sql` | bucket products + policies | storage |
| `apply_policies_safe.sql` | policies adicionales | varias |
| `apply_products_rls.sql` | RLS de products | products |
| `fix_orders_policy.sql` | ajuste policy orders | orders |
| `fix_schema.sql` | payment_id + grants | orders |
| `rpc_confirm_payment.sql` | RPC legacy de confirmación | (reemplazada por Fase 0) |
| `add_addons_to_order_items.sql` | ADD COLUMN addons | order_items |
| `update_site_settings.sql` | UPDATE settings | site_settings (datos) |
| `check_title.sql` | diagnóstico | — |
| `supabase_schema.sql` | DDL histórico base | profiles, orders, order_items, occasions, cart_items, coupons |

**Tablas usadas por el frontend sin CREATE en migraciones versionadas**
(viven en legado o creadas fuera de banda): `categories`, `products`,
`shipping_zones`, `unique_visitors`, `user_addresses`.

---

## 3. CRM externo (proyecto Supabase separado)

Accedido vía `lib/supabase-crm.ts` con `VITE_CRM_SUPABASE_URL` /
`VITE_CRM_SUPABASE_ANON_KEY` (proyecto distinto al principal). Fuera del
alcance del snapshot del esquema principal.

| Tabla (CRM) | Uso |
|---|---|
| `crm_settings` | config del bot de WhatsApp |
| `customers` | clientes del CRM |
| `messages` | mensajes de WhatsApp |
| `whatsapp_media` | media de WhatsApp |
| `orders` | compartida (el CRM también la lee) |

---

## 4. Regenerar / verificar tipos (sin escribir en remoto)

Cuando haya acceso al proyecto vinculado (solo lectura), regenerar desde la
base real en lugar de este snapshot documental:

```bash
# requiere SUPABASE_ACCESS_TOKEN en el entorno y el PROJECT_REF del runbook
npx supabase gen types typescript --project-id <PROJECT_REF> > src/types/database.generated.ts
```

El `PROJECT_REF` operativo está en `docs/operations/PHASE_0_RELEASE_RUNBOOK.md`;
**no** se incluye en el repo ni en scripts committeados. Ver `types:generate`
en `package.json`.
