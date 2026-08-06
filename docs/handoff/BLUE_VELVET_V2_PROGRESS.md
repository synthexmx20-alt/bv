# Blue Velvet V2 — Tablero de progreso entre agentes

Última actualización del formato: 2026-08-05
Documento de prompts: `docs/handoff/BLUE_VELVET_V2_AGENT_PROMPTS.md`

## Cómo actualizar este tablero

Después de cada tarea, el agente debe:

1. Cambiar el estado de su fila.
2. Registrar rama/PR y commit exactos.
3. Escribir comandos de prueba y resultado, no solo “funciona”.
4. Registrar toda mutación externa en las bitácoras inferiores.
5. Anotar riesgo, siguiente dependencia y rollback cuando aplique.
6. Hacer commit de la actualización junto con la tarea o inmediatamente después.

Estados permitidos: `PENDIENTE`, `EN CURSO`, `BLOQUEADA`, `EN REVISIÓN`, `COMPLETA`, `DESPLEGADA STAGING`, `DESPLEGADA PRODUCCIÓN`.

## Baseline reproducible

Baseline verificada por `BV2-00` el 2026-08-05 desde el clon de GitHub. Entorno: Node `v24.14.1`, npm `11.11.0`, Linux x64 (sandbox).

| Campo | Valor verificado |
|---|---|
| Repositorio Git | `github.com/synthexmx20-alt/bv` (clon limpio; el path Windows original quedó solo como referencia histórica) |
| Rama | `main` |
| Commit de partida | `927c408` — `docs: add Blue Velvet V2 agent prompt pack` |
| Working tree al iniciar | limpio; `package-lock.json` intacto tras `npm ci` |
| Stack | React 19.2.3, TypeScript 5.8.2, Vite 6.4.3, Vitest 4.1.10, ESLint 10, Supabase, Mercado Pago, Cloudflare Pages |
| Comando integral | `npm run check` (lint && typecheck && test && build) |
| Instalación | `npm ci` — aprobada, sin cambios al lockfile |
| `npm run lint` | APROBADO (eslint . --max-warnings=0, exit 0) |
| `npm run typecheck` | APROBADO (tsc -p tsconfig.app.json --noEmit, exit 0) |
| `npm test` | APROBADO — 63/63 tests en 8 archivos (vitest run, exit 0) |
| `npm run build` | APROBADO — 143 módulos, bundle 685.24 kB min / 184.55 kB gzip (exit 0, warnings conocidos abajo) |
| `npm audit` | 2 vulnerabilidades HIGH — GHSA-qwww-vcr4-c8h2 en `react-router` 7.12.0–8.2.0 (instalado 7.18.2 vía `react-router-dom`); aplica solo a modo RSC/server actions, esta SPA es client-only. `npm audit fix` requiere upgrade mayor → diferido según decisión del runbook Fase 0, no forzado. |
| Secretos versionados | NINGUNO detectado: sin `.env*`, tokens, JWT, dumps ni respaldos en Git; Supabase se configura vía `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` (variables de entorno) |
| Producción | `https://bluevelvetcuu.com` |
| Cloudflare Pages | proyecto `bluevelvet`, rama productiva observada `main` |
| Supabase principal | ref pública operativa registrada en el runbook; no copiar secretos aquí |
| Estado Fase 0 | desplegada y verificada; migraciones hasta `20260805050000` |
| Functions conocidas | `checkout-order` v2, `mercadopago-webhook` v6, `order-confirmation` v13, `create-preference` retirada v24 |
| Deployment frontend conocido | `50993b20-77fe-441f-953b-32c1d131f899` |

Problemas previos conocidos (preexistentes, no regresiones — documentados sin corregir por estar fuera del alcance de `BV2-00`):

- Build advierte `/index.css doesn't exist at build time` (referencia quedará 404 en runtime) — ya citado en auditoría §10.
- Bundle único de 685 kB supera el límite de 500 kB de Vite; sin code splitting — auditoría §10, lo resuelve `BV2-05`.
- Warning de importación mixta estática/dinámica de `lib/supabase.ts` durante el build.
- `npm audit`: advisory de React Router diferido (ver tabla; coincide con la decisión documentada en el runbook de Fase 0).
- CLABE bancaria y beneficiario hardcodeados en `pages/OrderConfirmation.tsx` y en los `prompt_melissa_*.txt` versionados — ya citado en auditoría §9; dato operativo del negocio, no credencial; su administración queda para prompts posteriores.
- `.gitignore` cubre `*.local` (captura `.env.local`) pero no patrones `.env` genéricos; ningún `.env` está versionado hoy. Observación registrada para futuros prompts, sin cambios en esta tarea.
- Los 23 errores de `tsc` reportados por la auditoría pre-Fase 0 ya no existen: `npm run typecheck` pasa limpio tras Fase 0.

## Invariantes de seguridad

Marcar una tarea como completa implica comprobar que conserva:

- [ ] Precio, promociones, extras, cupón y envío reconstruidos por servidor.
- [ ] Tarjeta confirmada únicamente por webhook verificado.
- [ ] SPEI pendiente hasta verificación confiable.
- [ ] `Purchase` confirmado, idempotente y deduplicado.
- [ ] RLS, roles, Storage y analytics de Fase 0 sin aperturas.
- [ ] `create-preference` permanece retirada.
- [ ] Sin secretos, datos de clientes ni respaldos dentro de Git.
- [ ] URLs antiguas preservadas o migradas explícitamente.

## Matriz de tareas

| ID | Resultado | Depende de | Estado | Rama / PR | Commit | Pruebas / evidencia | Deploy / notas |
|---|---|---|---|---|---|---|---|
| BV2-00 | Baseline reproducible | — | COMPLETA | `main` | `927c408` (partida) | npm ci, lint, typecheck, 63/63 tests y build aprobados con Node 24.14.1/npm 11.11.0; audit: 2 high (react-router RSC, diferido); sin secretos en Git | LOCAL |
| BV2-01 | CI y staging | BV2-00 | PENDIENTE | — | — | — | STAGING |
| BV2-02 | Design tokens | BV2-00 | COMPLETA | `main` | — | `src/styles/tokens.css` + `docs/design/BLUE_VELVET_V2_DESIGN_SYSTEM.md`; tokens importados en `src/index.css` (enlazado en `index.tsx`); `npm run check` exit 0; bundle JS idéntico a baseline (sin cambio visual); sin hex duplicados; estados focus/success/warning/error presentes | LOCAL |
| BV2-03 | CSS/fonts/icons locales | BV2-02 | COMPLETA | `main` | `ac054f9c` | Tailwind v3.4.19 local (PostCSS+autoprefixer, plugins forms/container-queries) replicando config inline; `components/Icon.tsx` con 71 SVGs Material Symbols (Apache-2.0, currentColor); fuentes Manrope+Noto Sans self-hosted inlineadas como data-URI woff2 en el CSS (SIL OFL 1.1, licencias en `src/assets/fonts/`), font-display swap; index.html sin CDN (lang es-MX, favicon conservado, Meta Pixel intacto); `npm run check` exit 0 (lint+typecheck+63/63 tests+build); CSS 4.35→159.87 kB min (1.49→76.76 kB gzip; incluye ~81 kB de fuentes inlineadas, ~78 kB de utilidades), JS 685.24→707.24 kB min (184.55→193.79 kB gzip); smoke 390×844 y 1440×900 con red bloqueada (solo Supabase/Meta Pixel intentan salir; sin requests de fuentes); cobertura de clases verificada | LOCAL |
| BV2-04 | Primitivas UI | BV2-02,03 | COMPLETA | `main` | `9d7ef28` | components/ui: Button, IconButton, TextField, SelectField, Price, InlineAlert, Skeleton (+cn helper, sin dep externa); forwardRef, className controlado, HTML semántico; touch targets >=44px, focus-visible con token, reduced-motion; Price con Intl.NumberFormat es-MX MXN (sin concatenar $); fields con label/hint/error por ids + aria-describedby/aria-invalid; jsdom@24.1.3 añadido (dev, mínimo) para tests de atributos accesibles con react-dom/server (sin @testing-library); tests/ui 23/23 (Price moneda, Button disabled/loading/aria, fields label-error, InlineAlert roles, Skeleton); npm run check exit 0 (86/86 tests, lint, typecheck, build); páginas NO migradas (solo primitivas nuevas) | LOCAL |
| BV2-05 | Route splitting | BV2-00 | COMPLETA | `main` | `HEAD` (commit de esta tarea) | components/routing: routes.tsx (tabla React.lazy por página, eager solo CatalogPage+shell), RouteFallback (Skeleton, role=status), ErrorBoundary (class, botón Recargar, detalles solo en consola); App.tsx reescrito con ErrorBoundary+Suspense; HashRouter y paths públicos sin cambios (BV2-10); admin/LiveChatPage/MetaEventsPage fuera del chunk de entrada (dynamic-import); desaparece warning de importación mixta de supabase; entry JS 707.24→495.85 kB min (193.79→148.22 kB gzip, -45.57 kB gzip / -23.5%); 40 chunks generados (LiveChatPage 24.19 kB separado); CSS 162.74→162.82 kB; npm run check exit 0 (86/86 tests, lint, typecheck, build); rutas probadas sirviendo dist con red bloqueada: / (solo entry), /product/1 (+ProductDetails), /checkout/shipping (+Shipping+CheckoutHeader), /admin/login (+AdminLogin), back/forward OK, 0 pageerrors; externos solo Supabase+Meta Pixel | LOCAL |
| BV2-06 | Snapshot/tipos Supabase | BV2-00 | PENDIENTE | — | — | — | LOCAL |
| BV2-07 | Producto/promociones | BV2-06 | PENDIENTE | — | — | — | PROD con autorización |
| BV2-08 | Categorías/colecciones | BV2-06 | PENDIENTE | — | — | — | PROD con autorización |
| BV2-09 | Settings/contenido | BV2-06 | PENDIENTE | — | — | — | PROD con autorización |
| BV2-10 | Routing limpio | BV2-05,07,08 | PENDIENTE | — | — | — | STAGING |
| BV2-11 | Capa de datos | BV2-06–09 | PENDIENTE | — | — | — | LOCAL |
| BV2-12 | Shell global | BV2-02–05,09,11 | PENDIENTE | — | — | — | LOCAL |
| BV2-13 | Header móvil | BV2-04,10,12 | PENDIENTE | — | — | — | LOCAL |
| BV2-14 | Cart drawer | BV2-04,13 | PENDIENTE | — | — | — | LOCAL |
| BV2-15 | Homepage híbrida | BV2-07–12 | PENDIENTE | — | — | — | LOCAL |
| BV2-16 | Category chips | BV2-08,11,15 | PENDIENTE | — | — | — | LOCAL |
| BV2-17 | Cards/grid/skeletons | BV2-04,07,11,16 | PENDIENTE | — | — | — | LOCAL |
| BV2-18 | Búsqueda | BV2-11,13,17 | PENDIENTE | — | — | — | LOCAL |
| BV2-19 | Landings/colecciones | BV2-08,10,11,17 | PENDIENTE | — | — | — | STAGING |
| BV2-20 | PDP galería/resumen | BV2-07,10,11,17 | PENDIENTE | — | — | — | LOCAL |
| BV2-21 | PDP variantes/extras | BV2-14,20 | PENDIENTE | — | — | — | LOCAL |
| BV2-22 | Reglas comerciales | — | PENDIENTE | — | — | Respuestas propietario | LOCAL |
| BV2-23 | Entrega autoritativa | BV2-09,22 | PENDIENTE | — | — | — | PROD con autorización |
| BV2-24 | PDP fecha/cobertura/CTA | BV2-20–23 | PENDIENTE | — | — | — | STAGING |
| BV2-25 | Guest checkout backend | BV2-23 | PENDIENTE | — | — | — | PROD con autorización |
| BV2-26 | Checkout guest-first UI | BV2-04,14,23–25 | PENDIENTE | — | — | — | STAGING |
| BV2-27 | Resiliencia de pago | BV2-25,26 | PENDIENTE | — | — | — | STAGING / PROD autorizada |
| BV2-28 | Confirmación por estado | BV2-25–27 | PENDIENTE | — | — | — | STAGING |
| BV2-29 | Data layer/atribución | BV2-10,18,24,26,28 | PENDIENTE | — | — | — | LOCAL |
| BV2-30 | GA4 ecommerce | BV2-29 | PENDIENTE | — | — | — | STAGING / PROD autorizada |
| BV2-31 | Meta Pixel | BV2-29 | PENDIENTE | — | — | — | STAGING / PROD autorizada |
| BV2-32 | Meta CAPI/dedup | BV2-25,28,29,31 | PENDIENTE | — | — | — | PROD con autorización |
| BV2-33 | Metadata SEO | BV2-10,19,20 | PENDIENTE | — | — | — | STAGING |
| BV2-34 | Sitemap/JSON-LD/redirects | BV2-08,10,33 | PENDIENTE | — | — | — | STAGING / PROD autorizada |
| BV2-35 | Performance | BV2-12–24 | PENDIENTE | — | — | — | STAGING |
| BV2-36 | Accesibilidad | BV2-12–28 | PENDIENTE | — | — | — | STAGING |
| BV2-37 | Administración V2 | BV2-07–09,22 | PENDIENTE | — | — | — | STAGING / PROD autorizada |
| BV2-38 | E2E y QA | Funciones objetivo | PENDIENTE | — | — | — | STAGING |
| BV2-39 | Migración/release | BV2-01,38 + release scope | PENDIENTE | — | — | — | PROD con autorización |

## Decisiones empresariales

Completar durante `BV2-22`. No convertir una celda sin respuesta en una regla de código.

| Decisión | Estado | Respuesta aprobada | Fecha | Aprobó | Prompts afectados |
|---|---|---|---|---|---|
| Zona horaria oficial | SIN RESPUESTA | — | — | — | 23,24,26 |
| Horarios y días de entrega | SIN RESPUESTA | — | — | — | 09,23,24 |
| Cutoff y preparación para Hoy | SIN RESPUESTA | — | — | — | 23,24 |
| Festivos/bloqueos/temporada pico | SIN RESPUESTA | — | — | — | 09,23,24 |
| Slots y capacidad | SIN RESPUESTA | — | — | — | 09,23,26 |
| Tarifa base/gratis/recargos | SIN RESPUESTA | — | — | — | 23,24,26 |
| CP/colonia sin coincidencia | SIN RESPUESTA | — | — | — | 23,26 |
| Stock y sustitución | SIN RESPUESTA | — | — | — | 07,20,37 |
| Confirmación/expiración SPEI | SIN RESPUESTA | — | — | — | 25,27,28,32 |
| Evidencia de social proof | SIN RESPUESTA | — | — | — | 15 |
| Apple Pay / Google Pay real | SIN VERIFICAR | — | — | — | 27 |
| Ownership Meta CAPI/n8n | SIN DEFINIR | — | — | — | 32 |

## Registro de migraciones Supabase

| Migration | Prompt | Entorno | Dry-run | Aplicada UTC | Responsable | Backup | Rollback | Resultado |
|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | Sin movimientos V2 registrados |

## Registro de Edge Functions

| Function | Prompt | Commit | Versión anterior | Versión nueva | Entorno | Smoke | Rollback |
|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | Sin despliegues V2 registrados |

## Registro de Cloudflare

| Prompt | Commit/artifact | Entorno | Deployment ID / URL | Smoke 390 | Smoke desktop | Dominio afectado | Rollback ID |
|---|---|---|---|---|---|---|---|
| Fase 0 | `0e85562` artifact registrado | Producción | `50993b20-77fe-441f-953b-32c1d131f899` | aprobado | aprobado | bluevelvetcuu.com | `68459e41-1f73-4223-930a-f691db2077b2` |

## Registro de analytics

| Fecha | Entorno | Evento | Browser/Server | event_id/order | Herramienta de validación | Resultado | Evidencia sin PII |
|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | Sin validaciones V2 registradas | — |

## Incidencias y rollback

| Fecha | Prompt/release | Severidad | Síntoma | Causa confirmada | Acción | Datos afectados | Recuperación | Cerrada |
|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | — |

## Plantilla de cierre de una tarea

Copiar al final del reporte del agente y después trasladar los datos a la tabla:

```text
Prompt:
Estado final:
Rama / PR:
Commit:
Archivos modificados:
Pruebas ejecutadas y resultado:
Deploy o mutación externa:
Riesgos abiertos:
Rollback:
Siguiente prompt desbloqueado:
```
