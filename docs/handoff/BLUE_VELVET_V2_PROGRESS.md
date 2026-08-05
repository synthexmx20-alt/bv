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

| Campo | Valor conocido |
|---|---|
| Repositorio local al crear el paquete | `C:\Users\aleja\Downloads\blue-velvet-florería` |
| Rama | `main` |
| Commit anterior al paquete | `226fb55` — `docs: design Blue Velvet V2 agent handoff` |
| Stack | React 19, TypeScript 5.8, Vite 6, Vitest, Supabase, Mercado Pago, Cloudflare Pages |
| Comando integral | `npm run check` |
| Última evidencia previa | 63 tests; lint, typecheck, tests y build aprobados después de Fase 0 |
| Producción | `https://bluevelvetcuu.com` |
| Cloudflare Pages | proyecto `bluevelvet`, rama productiva observada `main` |
| Supabase principal | ref pública operativa registrada en el runbook; no copiar secretos aquí |
| Estado Fase 0 | desplegada y verificada; migraciones hasta `20260805050000` |
| Functions conocidas | `checkout-order` v2, `mercadopago-webhook` v6, `order-confirmation` v13, `create-preference` retirada v24 |
| Deployment frontend conocido | `50993b20-77fe-441f-953b-32c1d131f899` |

El agente de `BV2-00` debe sustituir o complementar esta evidencia con resultados obtenidos desde el clon de GitHub que se usará para continuar.

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
| BV2-00 | Baseline reproducible | — | PENDIENTE | — | — | — | LOCAL |
| BV2-01 | CI y staging | BV2-00 | PENDIENTE | — | — | — | STAGING |
| BV2-02 | Design tokens | BV2-00 | PENDIENTE | — | — | — | LOCAL |
| BV2-03 | CSS/fonts/icons locales | BV2-02 | PENDIENTE | — | — | — | LOCAL |
| BV2-04 | Primitivas UI | BV2-02,03 | PENDIENTE | — | — | — | LOCAL |
| BV2-05 | Route splitting | BV2-00 | PENDIENTE | — | — | — | LOCAL |
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
