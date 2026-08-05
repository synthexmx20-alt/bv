# Blue Velvet V2 — Paquete de prompts para agentes de programación

Versión: 1.0
Baseline del paquete: commit `226fb55` y Fase 0 de seguridad ya desplegada
Uso: copiar un bloque completo, desde “Actúa como…” hasta “Reporte final”, y pegarlo en el agente que tenga acceso al repositorio.

## Cómo usar este documento

1. Sube el repositorio a GitHub sin archivos `.env`, tokens, respaldos o datos de clientes.
2. Ejecuta primero `BV2-00`; después respeta las dependencias de cada tarea.
3. Usa una conversación nueva por tarea cuando sea posible.
4. No pegues credenciales en el chat. Configúralas mediante secretos de GitHub, Supabase o Cloudflare.
5. Después de cada tarea, registra el resultado en `docs/handoff/BLUE_VELVET_V2_PROGRESS.md`.
6. Una tarea marcada `LOCAL` no autoriza despliegues. `STAGING` permite solo un preview aislado. Producción siempre exige una autorización nueva y explícita.

## Reglas que ningún agente puede romper

- El servidor reconstruye precios, envío, descuentos y total; el navegador nunca es autoridad.
- Tarjeta solo pasa a pagada/confirmada por webhook verificado de Mercado Pago.
- SPEI permanece pendiente hasta verificación confiable.
- `Purchase` se emite solo para una compra confirmada y con deduplicación browser/server.
- Conservar RLS, separación de roles, seguridad de Storage y restricciones de analytics de Fase 0.
- `create-preference` permanece retirado.
- Conservar Supabase, Mercado Pago, Storage, reglas de cobertura y URLs mientras no exista una razón comprobada para migrarlos.
- No exponer secretos, no hardcodear productos/precios y no introducir dependencias sin justificar tamaño, mantenimiento y beneficio.

## Dependencias resumidas

| Grupo | Prompts | Dependencia principal |
|---|---|---|
| Baseline | `BV2-00`–`BV2-01` | repositorio accesible |
| Fundamentos frontend | `BV2-02`–`BV2-05` | `BV2-00` |
| Datos y routing | `BV2-06`–`BV2-11` | baseline; migraciones por orden |
| Storefront | `BV2-12`–`BV2-19` | fundamentos y capa de datos |
| PDP y entrega | `BV2-20`–`BV2-24` | modelos comerciales; decisión `BV2-22` |
| Checkout | `BV2-25`–`BV2-28` | entrega y Fase 0 |
| Medición y SEO | `BV2-29`–`BV2-34` | rutas y estados finales estables |
| Calidad y release | `BV2-35`–`BV2-39` | funcionalidades correspondientes |

## Matriz de cobertura de requisitos

| Requisito original | Prompts responsables |
|---|---|
| Auditoría y conservación de backend funcional | Fase 0 completada, `BV2-00`, `BV2-06`, `BV2-39` |
| Mobile-first 360/375/390/430, tablet y desktop | `BV2-02`, `BV2-12`–`BV2-28`, `BV2-35`, `BV2-36`, `BV2-38` |
| Design system/tokens/componentes | `BV2-02`–`BV2-04` |
| CSS compilado, fonts, code splitting | `BV2-03`, `BV2-05`, `BV2-35` |
| Homepage ecommerce compacta | `BV2-15`–`BV2-17` |
| Announcement administrable | `BV2-09`, `BV2-12`, `BV2-37` |
| Header móvil, search, cart y menú | `BV2-13`, `BV2-14`, `BV2-18` |
| Categorías activas/estacionales | `BV2-08`, `BV2-16`, `BV2-37` |
| Cards 4:5, promociones y skeletons | `BV2-07`, `BV2-17`, `BV2-35` |
| Colecciones y landings para Meta Ads | `BV2-08`, `BV2-10`, `BV2-19`, `BV2-34` |
| PDP completa y CTA sticky | `BV2-20`, `BV2-21`, `BV2-24` |
| Fecha, cutoff, capacidad y días bloqueados | `BV2-09`, `BV2-22`–`BV2-24`, `BV2-37` |
| Cobertura y costo antes del pago | `BV2-22`–`BV2-24`, `BV2-26` |
| Dedicatoria opcional | `BV2-21`, `BV2-26` |
| Extras administrables | `BV2-07`, `BV2-21`, `BV2-37` |
| WhatsApp como asistencia | `BV2-12`, `BV2-20`, `BV2-24` |
| Cart drawer editable | `BV2-14` |
| Checkout rápido y guest-first | `BV2-25`, `BV2-26` |
| Pago verificado, wallets y resiliencia | Fase 0, `BV2-25`, `BV2-27` |
| Confirmación premium por estado | `BV2-28` |
| Meta Pixel/CAPI y deduplicación | `BV2-29`, `BV2-31`, `BV2-32` |
| GA4 ecommerce y UTMs | `BV2-29`, `BV2-30` |
| Performance/Core Web Vitals/imágenes | `BV2-03`, `BV2-05`, `BV2-17`, `BV2-20`, `BV2-35` |
| SEO, URLs, redirects, metadata y schema | `BV2-10`, `BV2-33`, `BV2-34` |
| Accesibilidad | `BV2-04`, `BV2-13`, `BV2-14`, `BV2-36` |
| Admin de productos/contenido/temporadas | `BV2-07`–`BV2-09`, `BV2-37` |
| Seguridad, validación y precios server-side | Fase 0, `BV2-07`–`BV2-09`, `BV2-23`, `BV2-25`, `BV2-27`, `BV2-32`, `BV2-37` |
| QA responsive/commerce/payment/tracking/SEO | `BV2-01`, `BV2-36`, `BV2-38` |
| Development/staging/production/backups/rollback | `BV2-01`, `BV2-39` |
| Documentos ANALYTICS, QA y MIGRATION | `BV2-30`–`BV2-32`, `BV2-38`, `BV2-39` |

---

## BV2-00 — Incorporación y baseline reproducible

**Dependencias:** ninguna.
**Despliegue:** LOCAL.

```text
Actúa como senior engineer responsable de incorporar Blue Velvet V2 sin modificar todavía su comportamiento.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Objetivo: verificar que el repositorio pueda instalarse, probarse y construirse de forma reproducible, y registrar un baseline técnico para los siguientes agentes.

Antes de actuar:
1. Ejecuta git status, git branch --show-current y git log -3 --oneline. No trabajes sobre archivos ajenos sin identificarlos.
2. Lee completos BLUE_VELVET_V2_AUDIT.md, docs/operations/PHASE_0_RELEASE_RUNBOOK.md y docs/handoff/BLUE_VELVET_V2_PROGRESS.md.
3. Revisa package.json, package-lock.json, vite.config.ts, tsconfig.app.json, eslint.config.js y supabase/config.toml.

Alcance:
- Instala con npm ci.
- Ejecuta npm run lint, npm run typecheck, npm test y npm run build por separado.
- Ejecuta npm audit y clasifica los hallazgos; no fuerces upgrades mayores.
- Comprueba que no estén versionados .env, tokens, dumps, archivos de respaldo o datos de clientes.
- Actualiza únicamente la sección “Baseline reproducible” de docs/handoff/BLUE_VELVET_V2_PROGRESS.md con versiones, resultados y problemas previos.

No cambies código de aplicación, dependencias, base de datos ni producción. No marques como regresión un fallo que ya existía.

Criterios de aceptación:
- Se conoce la versión de Node/npm usada y el resultado exacto de las cuatro verificaciones.
- Cualquier fallo previo queda documentado con comando y mensaje resumido.
- Git no contiene secretos detectables ni cambios no relacionados.

Antes del commit ejecuta git diff --check y revisa git diff. Commit: docs: record Blue Velvet V2 baseline

Reporte final: rama, commit inicial/final, comandos y resultados, hallazgos previos, archivos modificados y confirmación de que no hubo despliegue.
```

## BV2-01 — CI de GitHub y preview de staging

**Dependencias:** `BV2-00`.
**Despliegue:** STAGING, sin tocar el dominio principal.

```text
Actúa como senior DevOps/frontend engineer. Implementa una verificación automática y una ruta segura hacia previews de Blue Velvet V2.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee BLUE_VELVET_V2_AUDIT.md, el runbook de Fase 0, package.json, la configuración actual de Cloudflare y el tablero. Inspecciona primero si ya existe .github/workflows o configuración de Pages; reutilízala si es correcta.

Objetivo: cada pull request debe ejecutar instalación reproducible, lint, typecheck, tests y build. La rama principal debe poder producir un artifact dist verificable. Un preview puede desplegarse únicamente a un hostname no productivo.

Implementación:
- Crea .github/workflows/ci.yml con Node LTS fijado, npm ci, caché de npm y npm run check.
- Añade una comprobación de que el artifact dist contiene index.html y assets.
- Documenta en docs/operations/STAGING.md cómo conectar Cloudflare Pages al repositorio, qué rama es producción, cómo obtener un preview y cómo evitar modificar bluevelvetcuu.com.
- No incluyas secretos en YAML. Si el despliegue automático requiere credenciales, documenta nombres de secrets y deja el job de deploy condicionado a su existencia y a una rama de staging, o conserva solo CI si no puede configurarse con seguridad.
- No alteres DNS ni despliegues Supabase.

Criterios de aceptación:
- El workflow es válido, usa permisos mínimos y no ejecuta código privilegiado de forks con secretos.
- npm run check pasa localmente.
- STAGING.md incluye URL/branch, promoción, smoke test y rollback de preview.
- Cualquier preview creado no afecta el dominio principal.

Ejecuta npm run check y git diff --check. Commit: ci: verify Blue Velvet V2 pull requests

Reporte final: archivos, validaciones, estado real del preview, secrets que debe configurar el propietario y confirmación de que producción quedó intacta.
```

## BV2-02 — Dirección visual y design tokens

**Dependencias:** `BV2-00`.
**Despliegue:** LOCAL.

```text
Actúa como product designer ecommerce y senior UI engineer. Define el sistema visual Blue Velvet V2 antes de rediseñar pantallas.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee la sección de identidad y UX de BLUE_VELVET_V2_AUDIT.md, src/index.css, index.html y los componentes actuales. Diseña primero para 390x844 y comprueba 360, 375, 430, tablet y desktop.

Objetivo: crear tokens CSS centralizados que expresen una boutique floral premium contemporánea: navy casi negro, superficies oscuras, blanco cálido, grises suaves y azul Blue Velvet como acento. Las fotografías aportan el color.

Implementación:
- Crea src/styles/tokens.css con colores semánticos, tipografía, escala de spacing, radius, sombras, contenedores, breakpoints documentados, motion y z-index.
- Crea docs/design/BLUE_VELVET_V2_DESIGN_SYSTEM.md explicando uso, ejemplos permitidos y anti-patrones.
- Importa tokens.css desde src/index.css sin cambiar aún componentes.
- Respeta prefers-reduced-motion, contraste WCAG AA y touch targets de 44px.
- Evita glow, neón, gradientes tecnológicos, glassmorphism, bordes en todas las cards y azul dominante.

Criterios de aceptación:
- No hay valores duplicados dentro del archivo de tokens.
- Existen variables para estados focus, success, warning y error, además de superficies y texto.
- La documentación define imagen 4:5, jerarquía editorial, densidad móvil y límites de animación.
- El aspecto actual no se rompe por importar los tokens.

Ejecuta npm run check y git diff --check. Commit: style: define Blue Velvet V2 design tokens

Reporte final: decisiones visuales, tokens creados, verificaciones y capturas de cualquier cambio visible.
```

## BV2-03 — CSS local, fuentes e iconos sin CDN de Tailwind

**Dependencias:** `BV2-02`.
**Despliegue:** LOCAL.

```text
Actúa como senior frontend y web performance engineer. Sustituye la infraestructura CSS remota por una compilación local sin rediseñar aún las pantallas.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Inspecciona index.html, src/index.css, package.json y todas las clases usadas. Determina si conviene instalar Tailwind local compatible con la base actual o migrar gradualmente a CSS Modules; elige la opción con menor riesgo y documenta la decisión. No elimines utilidades hasta comprobar que el build genera sus estilos.

Objetivo: eliminar cdn.tailwindcss.com y Material Symbols remotos, reducir dependencias de render y mantener paridad visual.

Implementación:
- Configura el pipeline CSS local con content paths exactos si conservas Tailwind.
- Sustituye Material Symbols por un componente Icon local con SVGs accesibles usados actualmente; no agregues una biblioteca grande solo para pocos iconos.
- Define una estrategia de fuentes: self-hosted con licencias válidas o system/font fallback; evita bloqueo del render.
- Elimina scripts/configuración inline únicamente después de validar paridad.
- Corrige lang="es-MX" y conserva favicon/touch icon.

Criterios de aceptación:
- La aplicación funciona con red bloqueada excepto datos/imágenes de Supabase.
- No quedan referencias a cdn.tailwindcss.com ni fonts.googleapis.com para iconos.
- No hay flash grave sin estilos y el CSS final está en assets versionados.
- Homepage, catálogo, PDP, checkout y admin siguen utilizables.

Ejecuta npm run check, sirve dist y realiza smoke visual a 390x844 y 1440x900. Commit: build: compile storefront styles locally

Reporte final: estrategia elegida, dependencias añadidas/eliminadas, tamaños antes/después, vistas verificadas y riesgos.
```

## BV2-04 — Primitivas UI accesibles

**Dependencias:** `BV2-02`, `BV2-03`.
**Despliegue:** LOCAL.

```text
Actúa como senior UX/UI frontend engineer. Construye una base pequeña de componentes accesibles sin cambiar páginas completas.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee el design system, busca botones, inputs, precios, mensajes y loaders duplicados en components y pages. Sigue el patrón actual de React/TypeScript y evita un paquete de UI externo.

Objetivo: crear primitivas reutilizables para reducir valores arbitrarios y preparar storefront y checkout.

Implementación:
- Crea componentes enfocados bajo components/ui para Button, IconButton, TextField, SelectField, Price, InlineAlert y Skeleton.
- Cada control debe reenviar refs cuando sea útil, aceptar className de forma controlada, conservar HTML semántico y exponer estados disabled/loading/error.
- Price debe usar Intl.NumberFormat es-MX, currency MXN, sin concatenar manualmente "$".
- Los fields deben asociar label, hint y error con ids/aria-describedby; no uses aria si HTML nativo basta.
- Añade tests de Price y de atributos accesibles con la infraestructura de pruebas más ligera compatible; si se requiere DOM, añade la dependencia mínima y justifícala.

Criterios de aceptación:
- Touch targets mínimos 44px, focus visible y reduced motion.
- Los componentes no fijan copy de negocio ni colores hex directos.
- Tests cubren moneda, disabled/loading y relación label-error.

Ejecuta los tests específicos y npm run check. Commit: feat: add accessible storefront primitives

Reporte final: API de cada componente, dependencias, pruebas, archivos y confirmación de que aún no se migraron páginas completas.
```

## BV2-05 — Route splitting y boundaries

**Dependencias:** `BV2-00`. Puede ejecutarse en paralelo con `BV2-02`–`BV2-04`.
**Despliegue:** LOCAL.

```text
Actúa como senior React performance engineer. Reduce el JavaScript inicial separando storefront, checkout, cuenta y administración.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Inspecciona App.tsx y el grafo de imports. Mide el build actual y registra los chunks. No cambies todavía HashRouter ni las rutas públicas; esa migración corresponde a BV2-10.

Objetivo: cargar de forma diferida páginas no necesarias para el primer viewport y ofrecer estados de carga/error consistentes.

Implementación:
- Extrae la tabla de rutas a archivos pequeños si App.tsx queda más claro.
- Usa React.lazy/Suspense para páginas de checkout, cuenta, políticas y especialmente admin/LiveChat.
- Crea components/routing/RouteFallback.tsx y un ErrorBoundary que muestre recuperación sin filtrar detalles internos.
- Mantén eager solo el shell y la entrada comercial necesaria.
- No agregues artificial manualChunks sin evidencia del analyzer/build.

Criterios de aceptación:
- Admin y LiveChat no aparecen en el chunk de entrada.
- Navegación directa y back/forward funcionan en todas las rutas existentes.
- Los fallos de un chunk muestran opción de recargar.
- Se documentan tamaños before/after del entry JS gzip o brotli disponible.

Ejecuta npm run check, inspecciona dist/assets y prueba al menos /, /product/:id, /checkout/shipping y /admin/login. Commit: perf: split Blue Velvet routes

Reporte final: chunks, tamaños comparativos, rutas probadas y archivos.
```

## BV2-06 — Snapshot reproducible del esquema y tipos Supabase

**Dependencias:** `BV2-00`.
**Despliegue:** LOCAL; lectura remota permitida sin mutaciones.

```text
Actúa como senior backend/Supabase engineer. Cierra la deriva documental del esquema antes de añadir modelos V2.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee la auditoría, todas las migraciones versionadas, SQL sueltos de raíz, supabase_schema.sql y los queries frontend. Si tienes acceso al proyecto vinculado, usa comandos de solo lectura para comparar esquema; nunca vuelques datos de clientes ni secretos.

Objetivo: establecer una referencia versionada del esquema y tipos TypeScript generados que reflejen producción sin alterar producción.

Implementación:
- Genera src/types/database.generated.ts mediante Supabase CLI o, si no hay acceso, documenta el comando exacto y genera solo desde una fuente local confiable.
- Crea docs/data/SCHEMA_INVENTORY.md con tablas, RPC, functions, buckets, RLS y SQL raíz aún no reconciliado.
- Añade un script package.json para regenerar/verificar tipos sin incluir project refs secretos.
- No conviertas SQL antiguo incierto en migraciones aplicables automáticamente.
- Cambia como máximo un query pequeño para demostrar la integración del tipo generado, sin refactor masivo.

Criterios de aceptación:
- Se distingue claramente esquema confirmado, legado no reconciliado y CRM externo.
- Los tipos compilan y no contienen filas/datos reales.
- No se ejecuta db push, migration repair ni deploy.

Ejecuta npm run typecheck, npm test y git diff --check. Commit: docs: baseline Supabase schema and types

Reporte final: fuente del snapshot, divergencias, archivos, comandos y confirmación de cero mutaciones remotas.
```

## BV2-07 — Modelo de producto, promociones y merchandising

**Dependencias:** `BV2-06`.
**Despliegue:** PRODUCCIÓN CON AUTORIZACIÓN EXPLÍCITA; preparar y probar localmente primero.

```text
Actúa como ecommerce architect y senior Supabase engineer. Diseña una migración aditiva para productos V2 conservando los 34 productos y la API actual.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee el inventario de esquema, ProductsPage, ProductDetails, ProductCard, checkout-order y tests de seguridad. Inspecciona columnas reales antes de escribir SQL.

Objetivo: soportar slug, estado/activo, stock o disponibilidad, destacado, orden, promoción programada y galería 4:5 sin hardcodear ofertas.

Implementación:
- Crea una migración timestamped que añada columnas compatibles: slug único, active, featured, sort_order, regular_price, sale_price, sale_start, sale_end, availability_status y gallery JSON o una tabla de imágenes si la evidencia favorece normalización.
- Conserva price/original_price durante transición y define backfill determinista; no borres columnas.
- Añade constraints: precios no negativos, sale_price válida, ventana coherente y slug normalizado.
- Actualiza tipos de dominio y funciones puras para precio activo/estado de promoción.
- Añade pgTAP para constraints/RLS y Vitest para ventanas antes/durante/después.
- El backend de checkout debe seguir siendo autoritativo; adapta su lectura solo si puede mantener compatibilidad.

Criterios de aceptación:
- La migración es aditiva, reversible por rollback explícito y preserva productos actuales.
- La oferta activa depende de datos y tiempo, nunca de copy/precios en UI.
- Productos inactivos no desaparecen del admin.

Ejecuta tests SQL en entorno aislado, npm run check y supabase db push --dry-run. Detente antes de remoto. Commit: feat: add product merchandising model

Reporte final: esquema, backfill, pruebas, dry-run, rollback y autorización requerida.
```

## BV2-08 — Categorías, ocasiones y colecciones con vigencia

**Dependencias:** `BV2-06`. Compatible con `BV2-07`.
**Despliegue:** PRODUCCIÓN CON AUTORIZACIÓN EXPLÍCITA.

```text
Actúa como ecommerce architect especializado en campañas. Añade taxonomías administrables y landings sin romper category texto existente.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee CategoriesPage, OccasionsPage, Catalog, las tablas reales y la auditoría. Mantén compatibilidad con categorías antiguas durante la migración.

Objetivo: categorías y ocasiones activables/ordenables, y colecciones con slug, vigencia, contenido SEO y productos ordenados.

Implementación:
- Crea migración aditiva para slug, active, sort_order, starts_at y ends_at donde corresponda.
- Crea collections y collection_products con slug único, estado, título, descripción breve, hero_image, CTA, meta fields, ventana y orden.
- Define RLS: lectura pública solo de contenido activo/vigente; escritura solo admin. Evita que una consulta pública filtre silenciosamente datos necesarios del admin.
- Backfill de slugs determinista y colisiones resueltas explícitamente.
- Conserva Product.category hasta que la capa de datos migre; no la elimines.
- Añade pgTAP para permisos, vigencia y unicidad.

Criterios de aceptación:
- “10 de Mayo” puede desactivarse o expirar sin cambio de código.
- `/promo-rosas` puede obtener productos y copy desde datos.
- No hay precios dentro de la colección; provienen del producto.

Ejecuta pruebas SQL, npm run check y dry-run local. No empujes migración. Commit: feat: model active categories and collections

Reporte final: tablas/columnas, RLS, backfill, pruebas, rollback y autorización requerida.
```

## BV2-09 — Settings de contenido y reglas operativas

**Dependencias:** `BV2-06`. La parte de entrega se terminará después de `BV2-22`.
**Despliegue:** PRODUCCIÓN CON AUTORIZACIÓN EXPLÍCITA.

```text
Actúa como ecommerce architect y backend engineer. Extiende configuración administrable sin convertir site_settings en un contenedor inseguro de cualquier cosa.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee create_settings_table, migraciones, SettingsPage, App.tsx y las reglas hardcodeadas de CheckoutProvider/Shipping. Inspecciona el esquema remoto antes de decidir entre settings tipados o tablas dedicadas.

Objetivo: administrar announcement bar, hero compacto, productos destacados y parámetros operativos sin editar código.

Implementación:
- Usa site_settings para contenido simple y no sensible: announcement enabled/text/link, hero enabled/headline/subheadline/image/CTA y WhatsApp de asistencia.
- Para horarios, bloqueos, cutoff, capacidad o excepciones crea tablas tipadas si requieren múltiples filas/fechas; no guardes reglas complejas como strings opacos.
- Añade validación server-side y RLS admin-write/public-read solo para claves públicas permitidas.
- Define valores por defecto que preserven la tienda actual cuando no existan filas V2.
- Añade pruebas SQL de permisos y validación; documenta claves en docs/data/CONTENT_SETTINGS.md.
- No introduzcas todavía reglas empresariales inventadas.

Criterios de aceptación:
- Announcement y hero pueden activarse/desactivarse y cambiar texto/link/imagen.
- Ninguna clave sensible es legible públicamente.
- La ausencia de settings no rompe el storefront.

Ejecuta tests SQL, npm run check y dry-run. Detente antes de remoto. Commit: feat: model storefront content settings

Reporte final: decisión de modelado, claves/tablas, defaults, RLS, pruebas y autorización requerida.
```

## BV2-10 — URLs limpias y compatibilidad con rutas antiguas

**Dependencias:** `BV2-05`, slugs de `BV2-07` y `BV2-08` disponibles al menos en tipos/entorno local.
**Despliegue:** STAGING.

```text
Actúa como senior frontend y SEO technical engineer. Migra HashRouter a BrowserRouter preservando tráfico y accesos antiguos.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee App.tsx, configuración de Cloudflare Pages, sitemap.xml, SEO.tsx y todas las construcciones de URLs. Extrae una lista de rutas hash actuales antes de cambiar nada.

Objetivo: habilitar /producto/:slug o una convención española consistente, /rosas, /promo-rosas, /cumpleanos y otras colecciones, sin dejar inaccesibles URLs #/product/:id ya compartidas.

Implementación:
- Sustituye HashRouter por BrowserRouter.
- Añade una capa de compatibilidad que transforme hashes conocidos a rutas limpias y preserve query params/UTMs una sola vez.
- Mantén resolución por ID durante transición y redirige al slug canónico cuando exista.
- Configura fallback SPA/redirects en Cloudflare de forma versionada si el repositorio lo permite.
- Elimina la ruta admin duplicada y ordena catch-all después de rutas válidas.
- Añade tests de transformación: producto por ID, checkout, admin, hash desconocido y UTM.

Criterios de aceptación:
- Recargar una ruta profunda en preview devuelve la app, no 404.
- Back/forward funciona y no crea loops.
- URLs antiguas llegan al contenido equivalente.
- Las rutas canónicas no contienen #.

Ejecuta tests específicos, npm run check y smoke en preview para /, producto, colección, checkout y admin. No promociones a producción. Commit: feat: add clean storefront routes

Reporte final: mapa old→new, tests, preview, cambios de hosting y plan de redirects para producción.
```

## BV2-11 — Capa tipada de datos ecommerce

**Dependencias:** `BV2-06`–`BV2-09`.
**Despliegue:** LOCAL.

```text
Actúa como senior frontend architect. Separa queries Supabase de componentes y unifica el modelo comercial V2.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee lib/supabase.ts, tipos generados, Catalog, ProductDetails, Home y admin. Localiza transformaciones snake_case/camelCase y queries duplicados.

Objetivo: ofrecer repositorios tipados para productos, categorías, colecciones y contenido, con mapeos explícitos y estados de error consistentes.

Implementación:
- Crea src/domain/commerce con tipos Product, ProductImage, Promotion, Category y Collection independientes del shape crudo.
- Crea src/data/storefrontRepository.ts con funciones pequeñas: listMerchandisedProducts, getProductBySlugOrId, listActiveCategories, getCollectionBySlug y getPublicContentSettings.
- Centraliza snake_case→dominio, promoción activa y fallback de datos legacy.
- Devuelve errores tipados o Result consistente; no hagas console.log de datos.
- Añade tests con filas Supabase de ejemplo para mappings, producto legacy, oferta activa/expirada y colección fuera de vigencia.
- Migra solo una lectura del catálogo como prueba de integración; otras pantallas tienen tareas propias.

Criterios de aceptación:
- Componentes consumidores no conocen nombres de columnas.
- No se usa any en la nueva capa.
- Query pública excluye inactivos/expirados pero admin conserva acceso por su capa existente.

Ejecuta tests específicos, npm run check y git diff --check. Commit: refactor: add typed storefront data layer

Reporte final: contratos, query migrada, compatibilidad legacy, pruebas y archivos.
```

## BV2-12 — Shell global, announcement, footer y WhatsApp

**Dependencias:** `BV2-02`–`BV2-05`, `BV2-09`, `BV2-11`.
**Despliegue:** LOCAL.

```text
Actúa como product designer y senior frontend engineer. Construye el shell global premium del storefront sin tocar checkout ni admin.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee App.tsx, Header, Footer, WhatsAppButton, Settings y el design system. Usa los settings públicos mediante la capa tipada.

Objetivo: un layout semántico consistente con announcement opcional, header slot, main, footer sobrio y asistencia WhatsApp que no tape acciones móviles.

Implementación:
- Crea components/layout/StorefrontLayout.tsx y AnnouncementBar.tsx.
- Announcement se oculta completamente cuando está disabled/vacío, admite link seguro y no provoca CLS al terminar loading.
- Refactoriza Footer con contacto real administrable, navegación, políticas y Organization basics; no inventes sellos ni testimonios.
- Reubica WhatsApp como CTA discreto. En móvil respeta el espacio de sticky CTA/cart/checkout y safe-area-inset-bottom.
- No muestres shell comercial en admin ni en checkout si perjudica el flujo.
- Añade tests de visibilidad/link y de ausencia en layouts excluidos.

Criterios de aceptación:
- HTML usa header/main/footer y solo un main.
- Announcement y WhatsApp no bloquean controles a 360–430px.
- No hay salto visible al cargar settings.
- Sin texto corporativo genérico ni datos falsos.

Ejecuta tests, npm run check y capturas 390x844/1440x900. Commit: feat: add premium storefront shell

Reporte final: estructura, settings usados, pruebas, capturas y páginas excluidas.
```

## BV2-13 — Header móvil y entrada de búsqueda

**Dependencias:** `BV2-04`, `BV2-10`, `BV2-12`.
**Despliegue:** LOCAL.

```text
Actúa como UX/UI designer de mobile commerce y senior React engineer. Rediseña el header priorizando logo, búsqueda, carrito y menú.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee Header actual, CheckoutContext, rutas y design system. No mezcles aún la implementación de resultados de búsqueda de BV2-18.

Objetivo: navegación limpia, accesible y estable en 360, 375, 390 y 430px.

Implementación:
- Refactoriza Header en piezas pequeñas: logo, icon actions, MobileMenu y SearchTrigger.
- El contador del carrito suma cantidades, no líneas; muestra 99+ si excede.
- Botones tienen nombres accesibles en español, 44px, focus visible y estado expanded/control para menús.
- SearchTrigger abre input/overlay liviano, enfoca correctamente y envía query mediante formulario, no solo Enter.
- El menú bloquea scroll de fondo, cierra con Escape/ruta y restaura focus.
- Cuenta pasa al menú secundario; en primer nivel conserva catálogo/colecciones/contacto útiles.

Criterios de aceptación:
- No hay overflow horizontal ni acciones solapadas.
- Funciona con teclado y lector de pantalla básico.
- Logo conserva proporción y no domina el viewport.
- Search y cart requieren como máximo un toque.

Ejecuta tests de contador/interacciones, npm run check y capturas en cuatro anchos móviles. Commit: feat: redesign mobile storefront header

Reporte final: comportamiento, pruebas, capturas, conteo de carrito y archivos.
```

## BV2-14 — Cart drawer accesible y rápido

**Dependencias:** `BV2-04`, `BV2-13`, Fase 0 intacta.
**Despliegue:** LOCAL.

```text
Actúa como CRO specialist y senior frontend engineer. Reconstruye CartDrawer conservando el contexto actual y los IDs/opciones necesarios para checkout seguro.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee CartDrawer, CheckoutProvider, checkoutApi, tests y tipos. Recuerda que los precios mostrados son estimados; el servidor confirma el total.

Objetivo: editar cantidad/eliminar sin recarga, ver subtotal/entrega y avanzar al checkout en menos fricción.

Implementación:
- Convierte drawer en dialog accesible con aria-modal, título, focus trap liviano, Escape, backdrop y restauración de focus sin dependencia grande.
- Muestra imagen 4:5, nombre, variante, extras, cantidad, precio estimado, subtotal y estado de envío conocido/desconocido.
- Añade incrementar, disminuir y eliminar; cantidad mínima 1 y confirmación no bloqueante solo si evita borrado accidental.
- Persiste mediante APIs actuales y tolera errores sin cerrar ni perder carrito.
- CTA “Continuar compra” y “Ir a checkout”; evita dos CTAs visualmente equivalentes.
- Safe areas y scroll interno; no solapar WhatsApp.

Criterios de aceptación:
- Contador/header se actualiza por unidades.
- Edición funciona anónimo y autenticado.
- Error de sincronización deja el estado recuperable.
- Teclado no sale del dialog mientras está abierto.

Añade tests de subtotal, cantidades, focus/close y error. Ejecuta npm run check y smoke 390x844. Commit: feat: rebuild accessible cart drawer

Reporte final: interacciones, persistencia, pruebas, captura móvil y riesgos.
```

## BV2-15 — Homepage híbrida con hero compacto y promoción

**Dependencias:** `BV2-07`–`BV2-12`, `BV2-18` podrá completar el grid.
**Despliegue:** LOCAL.

```text
Actúa como product designer ecommerce, CRO specialist y senior frontend engineer. Convierte / en una entrada comercial compacta, no en homepage corporativa larga.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee Home, Catalog, HeroSlider, settings/collections y la dirección visual. Usa copy administrable y datos reales; elimina sliders innecesarios.

Objetivo: en 390x844 mostrar propuesta, CTA y comienzo de compra casi inmediatamente.

Implementación:
- Crea/reestructura Home como: hero compacto, colección/promoción destacada, categorías, destacados, ocasiones, productos adicionales, confianza verificable y footer.
- Hero obtiene imagen/headline/subheadline/CTA desde settings, reserva dimensiones y no supera aproximadamente 55–65% del primer viewport junto con header.
- La promoción destacada toma colección y precios activos desde datos; nunca hardcodees 24/50/100 rosas.
- Si falta contenido, usa fallback sobrio de marca, no lorem ni afirmaciones falsas.
- Elimina autoplay/carrusel; una única imagen LCP con prioridad y sizes correctos.
- Deja slots compatibles con ProductGrid de BV2-17.

Criterios de aceptación:
- Producto/categoría o promoción aparece antes o inmediatamente después del primer scroll corto.
- CTA principal lleva a catálogo/colección válida.
- No hay layout shift por hero ni loaders gigantes.
- Se mantiene lectura editorial y contraste.

Añade tests de fallback/CTA, ejecuta npm run check y captura 390x844/1440x900. Commit: feat: build hybrid ecommerce homepage

Reporte final: orden, fuentes de contenido, fallbacks, pruebas, capturas y LCP candidate.
```

## BV2-16 — Category chips, vigencia y orden comercial

**Dependencias:** `BV2-08`, `BV2-11`, `BV2-15`.
**Despliegue:** LOCAL.

```text
Actúa como mobile commerce UX engineer. Sustituye el sidebar de categorías por chips horizontales administrables.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee Catalog, homepage y listActiveCategories. No vuelvas a filtrar por listas hardcodeadas.

Objetivo: permitir explorar Rosas, Cumpleaños, Aniversario y categorías activas en una fila compacta, sin mostrar temporadas vencidas.

Implementación:
- Crea components/catalog/CategoryChips.tsx con scroll horizontal, snap suave opcional, teclado y indicador seleccionado sin bordes pesados.
- Ordena por sort_order estable; “Todos” es una opción UI, no una fila de base.
- Sincroniza selección con URL/query o ruta de colección para compartir/volver atrás.
- Oculta inactive, future y expired usando una función de dominio testeable y la fecha del sistema inyectable.
- Mantén visible el focus al desplazar y añade affordance de scroll sin carrusel JS.

Criterios de aceptación:
- “10 de Mayo” no aparece fuera de vigencia.
- Back/forward restaura el filtro.
- No hay sidebar antes de productos en móvil.
- Touch targets y contraste cumplen el sistema.

Añade tests de vigencia, orden y URL; ejecuta npm run check y smoke 360/390/430. Commit: feat: add active category chips

Reporte final: reglas de visibilidad, estado URL, pruebas y capturas.
```

## BV2-17 — Product cards, grid 4:5 y skeletons

**Dependencias:** `BV2-04`, `BV2-07`, `BV2-11`, `BV2-16`.
**Despliegue:** LOCAL.

```text
Actúa como ecommerce UI designer y web performance engineer. Rediseña ProductCard y ProductGrid para exploración móvil rápida.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee ProductCard, Catalog y modelos de promoción. Usa Price de UI y rutas por slug.

Objetivo: fotografía dominante 4:5, jerarquía limpia, precio/promoción claros y CTA usable en touch.

Implementación:
- Crea ProductGrid y ProductCard V2 sin border fuerte ni overlay dependiente de hover.
- Usa dos columnas desde 360px si el contenido sigue legible; ajusta tablet/desktop con container tokens.
- Imagen con aspect-ratio 4/5, width/height o aspect reservado, object-fit cover y object-position/focal fallback; below-fold lazy.
- Muestra nombre, precio MXN, precio regular tachado solo durante promoción real, etiqueta “Promoción” discreta y disponibilidad breve.
- CTA accesible “Ver arreglo” o agregar rápido solo si no omite variantes/fecha necesarias.
- Skeleton replica geometría exacta y respeta reduced motion.

Criterios de aceptación:
- No hay CLS al cargar imágenes/cards.
- Todas las fotos mantienen proporción consistente y alt útil.
- Oferta expirada no muestra precio promocional.
- Cards completas son navegables sin enlaces anidados inválidos.

Añade tests de precio/promoción/loading, ejecuta npm run check y captura grid 360/390/430/desktop con fotos de ratios distintos. Commit: feat: redesign product grid and cards

Reporte final: comportamiento responsive, imágenes, pruebas, capturas y fallbacks.
```

## BV2-18 — Búsqueda rápida y resultados útiles

**Dependencias:** `BV2-11`, `BV2-13`, `BV2-17`.
**Despliegue:** LOCAL.

```text
Actúa como UX engineer especializado en ecommerce search. Implementa búsqueda sencilla para el catálogo actual sin añadir un motor externo prematuramente.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee Header/SearchTrigger, Catalog, repository y taxonomías. Para 34 productos, prioriza velocidad local y arquitectura reemplazable.

Objetivo: buscar por nombre, descripción breve, categoría y ocasión; preservar query en URL y emitir una interfaz lista para tracking posterior.

Implementación:
- Crea src/domain/search/searchProducts.ts con normalización es-MX: trim, minúsculas, diacríticos y token matching básico.
- Crea/ajusta una vista /buscar?q= o /catalog?q= consistente con routing aprobado.
- Muestra término, cantidad, ProductGrid, clear y estado sin resultados con categorías sugeridas reales.
- Debounce solo para sugerencias; el submit debe responder inmediatamente.
- No envíes cada tecla a Supabase ni expongas datos admin.
- Añade un callback/evento interno searchSubmitted para BV2-29 sin llamar todavía a vendors.

Criterios de aceptación:
- “rosas” encuentra “Rosas”; espacios/acentos no rompen.
- Recargar y compartir conserva resultados.
- Query vacía no se registra como Search.
- Estado vacío ofrece salida comercial clara.

Añade tests de normalización/ranking y vista; ejecuta npm run check y smoke móvil. Commit: feat: add fast storefront search

Reporte final: campos buscados, algoritmo, pruebas, URLs y límites de escala.
```

## BV2-19 — Plantilla de colección y landing de campaña

**Dependencias:** `BV2-08`, `BV2-10`, `BV2-11`, `BV2-17`.
**Despliegue:** STAGING.

```text
Actúa como CRO specialist para Meta Ads y senior frontend engineer. Crea una plantilla de colección cuyo contenido anunciado sea visible inmediatamente.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee el modelo collections, rutas limpias, ProductGrid y SEO existente. No construyas una página distinta por campaña.

Objetivo: resolver /rosas, /promo-rosas, /cumpleanos, /aniversario y temporadas desde datos, con oferta/colección y productos above-the-fold.

Implementación:
- Crea pages/CollectionLanding.tsx y componentes mínimos para hero compacto/copy/productos.
- Resuelve slug por repository; inactive/expired devuelve 404 o estado no disponible, nunca contenido viejo.
- Hero no debe desplazar el producto anunciado más de un scroll corto en 390x844.
- Permite link directo a producto destacado y preserva UTMs al navegar internamente sin duplicarlas en URL innecesariamente.
- Meta title/description/canonical quedan preparados para BV2-33.
- Añade estados loading/error/empty con geometría estable.

Criterios de aceptación:
- Un anuncio de “50 rosas” puede enlazar a producto específico o /promo-rosas sin pasar por homepage.
- Precios provienen del producto y respetan ventana de promoción.
- Slug inválido devuelve NotFound semántico.
- Vista no contiene navegación distractora antes de la oferta.

Añade tests de active/expired/not-found, npm run check y preview con dos colecciones de fixtures o staging. Commit: feat: add campaign collection landings

Reporte final: rutas, fuentes de datos, pruebas, preview y capturas 390/desktop.
```

## BV2-20 — PDP: galería, contenido y promoción

**Dependencias:** `BV2-07`, `BV2-10`, `BV2-11`, `BV2-17`.
**Despliegue:** LOCAL.

```text
Actúa como product designer ecommerce, CRO specialist y senior React engineer. Reconstruye la parte superior de la PDP manteniendo la lógica de carrito compatible.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee ProductDetails, tipos, repository, ProductCard y checkout tests. No implementes todavía agenda/cobertura; corresponde a BV2-24.

Objetivo: galería optimizada, nombre, precio, promoción, descripción breve, disponibilidad y confianza cerca del CTA.

Implementación:
- Divide ProductDetails en ProductGallery y ProductSummary con responsabilidades claras.
- Galería usa imágenes 4:5, thumbnails accesibles, alt/focal point, primera imagen eager/prioritaria y siguientes lazy; funciona con una sola foto legacy.
- Precio usa regla de promoción activa; regular tachado discreto y sale destacado sin estética de supermercado.
- Incluye entrega a domicilio en Chihuahua y personalización solo como información verificable/configurable.
- Enlace WhatsApp: “¿Quieres personalizar este arreglo? Escríbenos.” con producto/URL, sin sustituir compra web.
- Slug/ID inexistente muestra 404 y no consulta infinitamente.

Criterios de aceptación:
- Contenido principal y precio aparecen rápido en 390x844.
- Cambio de imagen funciona por touch/teclado sin carrusel pesado.
- Producto legacy de una foto y producto con galería se renderizan.
- No hay Purchase/AddToCart nuevo en esta tarea.

Añade tests de galería/fallback/promoción, ejecuta npm run check y capturas 390/desktop. Commit: feat: rebuild product gallery and summary

Reporte final: componentes, imágenes, pruebas, capturas y compatibilidad legacy.
```

## BV2-21 — PDP: variantes, extras y dedicatoria opcional

**Dependencias:** `BV2-14`, `BV2-20`.
**Despliegue:** LOCAL.

```text
Actúa como mobile commerce UX engineer. Simplifica la configuración del arreglo antes de agregar al carrito.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee ProductDetails, CheckoutProvider, tipos ProductSize/ProductAddon y AddonsPage. Conserva IDs y selección para que checkout-order reconstruya precios.

Objetivo: variantes claras, extras fáciles de agregar/quitar y dedicatoria opcional sin sobrecargar la PDP.

Implementación:
- Crea ProductOptions con selección semántica de variante; si solo hay Standard implícita, no muestres un selector inútil.
- Crea AddonPicker compacto agrupando chocolates, globos, peluches, floreros/u otros según datos; solo active.
- Añade dedicatoria con textarea limitado, “Sin dedicatoria” y campos necesarios; no la hagas obligatoria.
- Persiste estas elecciones en la línea de carrito con IDs/texto, pero trata precios como estimados.
- Valida longitud/campos en cliente por UX y mantén validación server-side existente o planifica su extensión segura.
- Evita accordions múltiples y selección preactivada que aumente precio sin consentimiento.

Criterios de aceptación:
- Agregar/quitar extras actualiza estimado y cart drawer.
- “Sin dedicatoria” funciona sin mensajes de error.
- Volver desde carrito conserva configuración.
- Un extra inactivo no puede seleccionarse desde UI y el servidor sigue validándolo.

Añade tests de variante única/múltiple, extras y dedicatoria; npm run check. Commit: feat: add product options and optional dedication

Reporte final: estado guardado, validaciones, pruebas y casos legacy.
```

## BV2-22 — Decisiones empresariales de entrega y operación

**Dependencias:** ninguna técnica; debe completarse antes de `BV2-23` y `BV2-24`.
**Despliegue:** LOCAL; documentación únicamente.

```text
Actúa como product manager ecommerce. No escribas lógica de entrega hasta obtener respuestas del propietario.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Objetivo: convertir decisiones operativas no inferibles en reglas aprobadas y testeables.

Lee la auditoría, CheckoutProvider, Shipping, shipping_zones y settings. Después presenta al propietario una sola lista breve y numerada con:
1. Zona horaria oficial.
2. Días y horario de operación/entrega.
3. Cutoff y tiempo mínimo para “Hoy”.
4. Días bloqueados, festivos y excepciones de temporada.
5. Slots de horario y capacidad por día/slot, si existe.
6. Tarifa base, zonas con recargo, envío gratuito y momento de mostrar costo.
7. Política cuando CP existe pero colonia no coincide.
8. Stock, sustitución de flores y qué significa disponibilidad.
9. Estado de reserva para SPEI y plazo de expiración.
10. Evidencia real permitida para confianza/social proof.

Detente y espera respuestas; no inventes defaults comerciales. Cuando respondan:
- Crea docs/business/COMMERCE_RULES.md con reglas, ejemplos de fechas límite y casos borde en America/Chihuahua o la zona aprobada.
- Marca cada respuesta como APROBADA, NO APLICA o PENDIENTE DE OPERACIÓN.
- Define una matriz Given/When/Then para hoy, mañana, fecha bloqueada, capacidad llena, zona estándar, recargo y bloqueada.
- No modifiques código, Supabase ni producción.

Criterios de aceptación:
- Todas las decisiones que alteran disponibilidad/precio tienen respuesta explícita.
- Casos ambiguos quedan bloqueados y no convertidos en código.
- El propietario puede leer y validar el documento sin lenguaje técnico.

Ejecuta git diff --check. Commit: docs: define Blue Velvet commerce rules

Reporte final: decisiones aprobadas, abiertas, archivo, commit y prompts bloqueados por respuestas faltantes.
```

## BV2-23 — Disponibilidad y cobertura autoritativas

**Dependencias:** `BV2-09`, `BV2-22` aprobado.
**Despliegue:** PRODUCCIÓN CON AUTORIZACIÓN EXPLÍCITA.

```text
Actúa como senior backend/Supabase engineer. Implementa reglas de fecha, capacidad y cobertura como fuente autoritativa sin confiar en el reloj ni costo del cliente.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee COMMERCE_RULES.md, shipping_zones, checkout-order, checkout-domain y pruebas Phase 0. Conserva las 845 reglas existentes.

Objetivo: un endpoint/RPC seguro que reciba fecha, slot, CP/colonia y devuelva disponibilidad/costo; checkout-order debe repetir o consumir la misma lógica dentro de la operación autoritativa.

Implementación:
- Modela schedule, blackout dates/capacity solo según reglas aprobadas y migraciones previas.
- Implementa funciones puras compartidas para timezone/cutoff y tests con reloj inyectado.
- Normaliza CP/colonia de forma conservadora; no aceptes coincidencia parcial que salte zonas bloqueadas.
- Devuelve códigos estables: AVAILABLE, CUTOFF_PASSED, CLOSED, BLOCKED_DATE, CAPACITY_FULL, OUT_OF_AREA y surcharge/base cost.
- Rate-limit lógico o protección equivalente para endpoint público sin bloquear compra normal.
- checkout-order valida nuevamente fecha/zona/costo y rechaza payload manipulado.
- No reserves capacidad permanentemente sin política aprobada de expiración/idempotencia.

Criterios de aceptación:
- “Hoy” solo está disponible antes del cutoff real.
- Zona bloqueada y costo manipulado fallan server-side.
- DST/timezone y medianoche tienen tests.
- RLS/functions no exponen reglas sensibles ni permiten escribir capacidad.

Ejecuta Vitest, pgTAP, npm run check y dry-run/deploy local. Detente antes de remoto. Commit: feat: validate delivery availability server-side

Reporte final: API/códigos, reglas, pruebas, migraciones, carga/rate limit, rollback y autorización.
```

## BV2-24 — PDP: fecha, cobertura y CTA sticky

**Dependencias:** `BV2-20`–`BV2-23`.
**Despliegue:** STAGING.

```text
Actúa como CRO specialist y mobile commerce engineer. Completa la PDP con selección temprana de entrega y CTA inferior.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee ProductDetails V2, API de disponibilidad, CheckoutProvider y reglas comerciales. No dupliques reglas de cutoff en frontend; consume respuestas del servidor.

Objetivo: elegir Hoy/Mañana/fecha válida, validar zona/costo y agregar al carrito con confianza desde móvil.

Implementación:
- Crea DeliveryDatePicker que muestra “Hoy” solo si API lo permite, “Mañana” si válido y selector con min/max/días disabled obtenidos de disponibilidad.
- Crea DeliveryCoverageCheck por CP y colonia/zona con estados coverage/costo/error claros.
- Conserva selección al agregar y al volver; revalida en checkout.
- Añade sticky CTA móvil “$estimado · Agregar al carrito”, respetando safe area y sin tapar WhatsApp.
- Deshabilita CTA con explicación accionable si falta una opción requerida o no hay cobertura.
- Maneja offline/timeout permitiendo reintento, nunca asumiendo cobertura.

Criterios de aceptación:
- No se pueden seleccionar fechas imposibles.
- El costo aparece antes del checkout cuando la zona es conocida.
- Sticky CTA no cubre contenido/teclado en 360–430px.
- AddToCart interno se emite una sola vez por acción para tracking posterior.

Añade tests con API mock para todos los códigos, npm run check y preview 390x844. Commit: feat: add PDP delivery selection and sticky CTA

Reporte final: estados, pruebas, preview, capturas y fallbacks de red.
```

## BV2-25 — Backend de guest checkout

**Dependencias:** `BV2-23`, Fase 0 verificada.
**Despliegue:** PRODUCCIÓN CON AUTORIZACIÓN EXPLÍCITA.

```text
Actúa como senior backend, security y ecommerce engineer. Permite pedido invitado sin reabrir escrituras directas ni exponer datos.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee checkout-order, checkout-request/domain, AuthContext, RLS, order-confirmation y tests de seguridad. El frontend nunca inserta orders/order_items directamente.

Objetivo: checkout-order acepta invitado con datos mínimos, crea pedido/líneas transaccional e idempotente y devuelve un token opaco para consultar solo ese pedido.

Implementación:
- Define request guest con nombre/teléfono y email si la operación lo requiere; valida/normaliza server-side.
- Conserva checkout_attempt_id idempotente y reconstrucción autoritativa de precio/cupón/envío/extras.
- Genera access token aleatorio, almacena solo hash/expiración y úsalo en order-confirmation; nunca order ID solo como autorización.
- Autenticados mantienen ownership; guest no obtiene acceso a otros pedidos ni tablas.
- Añade rate limit y respuestas que no permitan enumeración.
- Revisa retención/PII y evita logs con dirección/teléfono completos.
- Mantén tarjeta confirmada solo por webhook y SPEI pendiente.

Criterios de aceptación:
- Invitado válido obtiene checkout; sin token no puede leer confirmación.
- Repetir attempt devuelve el mismo resultado seguro, no duplica pedido/capacidad/cupón.
- Manipular total, product/addon/coupon/shipping sigue fallando.
- pgTAP confirma que anon no escribe orders directamente.

Ejecuta unit/integration/pgTAP, npm run check y pruebas negativas locales. Detente antes de remoto. Commit: feat: support secure guest checkout

Reporte final: contrato, token/TTL, PII, pruebas positivas/negativas, migraciones, rollback y autorización.
```

## BV2-26 — Checkout guest-first progresivo

**Dependencias:** `BV2-04`, `BV2-14`, `BV2-23`–`BV2-25`.
**Despliegue:** STAGING.

```text
Actúa como checkout product designer, CRO specialist y senior React engineer. Reconstruye el checkout móvil sin exigir cuenta y sin formularios gigantes.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee Shipping, Message, Payment, CheckoutProvider, checkoutApi y reglas. Decide si mantener rutas por paso o una pantalla progresiva según menor riesgo, pero conserva back/refresh.

Objetivo: pasos claros: Destinatario, Entrega, Fecha/horario, Dedicatoria y Pago, con resumen persistente.

Implementación:
- Permite anónimo; ofrece login/cuenta como opción secundaria.
- Usa campos con autocomplete/inputmode apropiados, labels reales y errores junto al campo indicando corrección exacta.
- Revalida cobertura/fecha server-side y muestra costo antes de pago.
- Dedicatoria no obligatoria y datos capturados no se borran ante error.
- Resumen sticky/accordion móvil muestra productos, subtotal estimado, envío, descuento y total confirmado al enviar.
- Persiste versión del draft y migra/descarta shapes viejos de forma segura.
- Previene doble submit y conserva carrito si backend/pago falla.

Criterios de aceptación:
- Invitado completa hasta Mercado Pago/SPEI sin login.
- Refresh, back y error 4xx/5xx conservan campos válidos.
- Teclado móvil no tapa CTA y primer error recibe focus.
- Total mostrado como estimado hasta respuesta autoritativa.

Añade tests de validación/persistencia/doble submit y E2E invitado con backend mock. npm run check y preview 360/390/430. Commit: feat: rebuild guest-first checkout

Reporte final: flujo, validaciones, persistencia, pruebas, preview y capturas.
```

## BV2-27 — Handoff de pago, resiliencia y wallets

**Dependencias:** `BV2-25`, `BV2-26`, Fase 0.
**Despliegue:** STAGING; cambios remotos solo con autorización explícita.

```text
Actúa como senior payments engineer. Endurece la transición entre pedido y Mercado Pago/SPEI sin cambiar de proveedor.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee checkout-order, webhook, Payment, PaymentWaiting, callback y runbook. Verifica capacidades reales de la cuenta antes de prometer Apple Pay/Google Pay.

Objetivo: pago recuperable, sin limpiar carrito prematuramente y con estado final controlado por backend.

Implementación:
- Limpia carrito solo después de que el pedido/preferencia se creó correctamente y guarda referencia recuperable.
- Si redirect/popup falla, ofrece “Reintentar pago” idempotente sin crear otro pedido.
- Callback/query params jamás actualizan estado; solo solicitan estado al endpoint privado.
- SPEI muestra instrucciones y pending_transfer, no compra confirmada.
- Documenta en docs/payments/MERCADO_PAGO_CAPABILITIES.md evidencia de wallets según cuenta/Checkout Pro; si no hay evidencia, marca no confirmadas y no muestres logos.
- Webhook compara monto, currency MXN, external_reference/order y estado antes de confirmar.

Criterios de aceptación:
- Pago cancelado/fallido conserva recuperación y no emite Purchase.
- Reintento no duplica pedido ni cupón.
- Monto/currency incorrectos no confirman.
- Navegador no tiene ruta para marcar pagado.

Añade tests de reintento/callback/webhook mismatch y npm run check. Prueba sandbox en staging si hay credenciales seguras. Commit: fix: make payment handoff recoverable

Reporte final: estados, tests, evidencia sandbox, wallets, cambios backend y autorización pendiente.
```

## BV2-28 — Confirmación de pedido por estado real

**Dependencias:** `BV2-25`–`BV2-27`.
**Despliegue:** STAGING.

```text
Actúa como ecommerce UX y senior frontend engineer. Crea una confirmación premium que refleje el estado real y proteja pedidos invitados.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee OrderConfirmation, order-confirmation Edge Function, purchaseTracking y estados backend. No implemente vendors de analytics aún; solo expone un evento interno confirmado.

Objetivo: mostrar número, producto, total, destinatario, fecha/horario, dirección resumida y estado de pago con próximos pasos correctos.

Implementación:
- Consulta autenticado por ownership o guest por token opaco; no pongas token sensible en logs/referrers y evalúa fragment/session storage según arquitectura.
- Diferencia pending_payment, pending_transfer, confirmed/paid, failed/cancelled y estados de preparación.
- Nunca muestres “Pago confirmado” por query params.
- Añade refresh/polling limitado solo para pending; detén al alcanzar terminal y ofrece reintento manual.
- Minimiza PII visible y evita indexación/canonical de páginas de pedido.
- Emite commerce:purchaseConfirmed interno una sola vez por order/event id para BV2-29–32.

Criterios de aceptación:
- Sin autorización retorna estado seguro, no datos.
- Reload no duplica el evento interno.
- SPEI muestra instrucciones pendientes; tarjeta confirmada muestra siguientes pasos.
- Navegación histórica funciona sin carrito.

Añade tests por estado, autorización y dedup local; npm run check y staging smoke. Commit: feat: rebuild state-driven order confirmation

Reporte final: estados/copy, seguridad guest, pruebas, preview y evento interno.
```

## BV2-29 — Data layer y preservación de atribución

**Dependencias:** `BV2-10`, eventos internos de `BV2-18`, `BV2-24`, `BV2-26`, `BV2-28`.
**Despliegue:** LOCAL.

```text
Actúa como analytics engineer. Construye una capa vendor-neutral antes de conectar GA4/Meta.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee purchaseTracking, Pixel hardcodeado, rutas y eventos internos. Define una taxonomía única de ecommerce para evitar disparos duplicados desde componentes.

Objetivo: preservar UTM, fbclid y landing original durante la sesión/checkout y publicar eventos tipados una vez por acción.

Implementación:
- Crea src/analytics/types.ts, attribution.ts y commerceEvents.ts.
- Captura solo parámetros permitidos al primer landing: utm_source/medium/campaign/content/term, fbclid y landing/referrer; aplica TTL documentado y first/last touch según regla explícita.
- No incluyas PII en URLs, localStorage de analytics o payloads browser.
- Define eventos PageView, ViewContent/view_item, Search, select_item, AddToCart, InitiateCheckout/begin_checkout, add_shipping_info, AddPaymentInfo/add_payment_info y Purchase/purchase.
- IDs usan UUID de producto/pedido; value usa total confirmado y currency MXN.
- Dedup local por event_id/action; Purchase depende exclusivamente de commerce:purchaseConfirmed.
- Añade modo debug solo por env no productiva.

Criterios de aceptación:
- UTMs sobreviven navegación y checkout, y expiración limpia valores.
- Reload no duplica Purchase.
- No se dispara Purchase en pending_transfer.
- Tests cubren first landing, TTL, sanitización y event_id.

Ejecuta tests, npm run check y git diff --check. Commit: feat: add typed ecommerce data layer

Reporte final: esquema, atribución/TTL, eventos, pruebas y privacidad.
```

## BV2-30 — GA4 ecommerce

**Dependencias:** `BV2-29`.
**Despliegue:** STAGING; producción con autorización explícita.

```text
Actúa como GA4 ecommerce implementation engineer. Conecta la capa tipada a GA4 sin cargar scripts si no existe un measurement ID válido.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee analytics layer, settings/env y rutas. Usa gtag directo o Google Tag Manager solo si ya existe una decisión documentada; no agregues ambos.

Objetivo: emitir view_item, select_item, add_to_cart, begin_checkout, add_shipping_info, add_payment_info y purchase con items coherentes.

Implementación:
- Crea un adapter GA4 aislado y carga async tras consentimiento si aplica a la política aprobada.
- Mapea item_id, item_name, item_category, item_variant, price, quantity, coupon, value y currency MXN.
- view_item en PDP resuelta; select_item desde listas; shipping/payment al completar el paso, no al render.
- purchase usa transaction_id/order_id, total confirmado y se deduplica por event_id/order.
- Mantén PageView compatible con BrowserRouter y evita doble page_view automático/manual.
- Crea ANALYTICS_TRACKING.md con tabla trigger→payload→fuente→dedup y procedimiento DebugView.

Criterios de aceptación:
- Payloads cumplen nomenclatura GA4 ecommerce.
- No hay PII en eventos.
- Pending/failure/SPEI no verificado no emiten purchase.
- Navegación SPA genera una sola page_view por ruta.

Añade tests del adapter y usa un transport mock. Ejecuta npm run check y valida en GA4 DebugView de staging si hay ID seguro. Commit: feat: implement GA4 ecommerce tracking

Reporte final: eventos/payloads, pruebas, DebugView, configuración pendiente y confirmación sobre producción.
```

## BV2-31 — Meta Pixel browser-side

**Dependencias:** `BV2-29`.
**Despliegue:** STAGING; producción con autorización explícita.

```text
Actúa como Meta Ads tracking engineer. Sustituye el Pixel hardcodeado por un adapter configurable y controlado por eventos.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee index.html, site_settings/meta_pixel_id, analytics layer y ANALYTICS_TRACKING.md. No dejes dos inicializaciones.

Objetivo: PageView, ViewContent, Search, AddToCart, InitiateCheckout, AddPaymentInfo y Purchase correctos para tráfico Meta móvil.

Implementación:
- Elimina snippet/ID hardcodeados de index.html después de crear loader async configurable por env/setting público validado.
- Implementa adapter Meta con event_id en eventos deduplicables.
- ViewContent incluye content_ids, content_name, content_type=product, value y MXN cuando producto está resuelto.
- AddToCart refleja variante/cantidad; Purchase usa order_id, content_ids, value confirmado y MXN.
- PageView reacciona a rutas limpias una sola vez.
- Respeta ausencia/bloqueo del script sin romper compra; no envíes PII.
- Actualiza ANALYTICS_TRACKING.md con Meta Pixel Helper/Test Events.

Criterios de aceptación:
- rg no encuentra el ID histórico dentro de código fuente público salvo documentación de migración redactada sin secreto.
- No hay eventos duplicados por StrictMode/reload.
- Pending_transfer no emite Purchase.
- La tienda funciona si connect.facebook.net falla.

Añade tests del adapter/loader, npm run check y valida Test Events en staging si hay Pixel configurado. Commit: feat: implement configurable Meta Pixel

Reporte final: eventos, IDs/configuración, pruebas, Test Events y estado de producción.
```

## BV2-32 — Meta Conversions API y deduplicación

**Dependencias:** `BV2-25`, `BV2-28`, `BV2-29`, `BV2-31`.
**Despliegue:** PRODUCCIÓN CON AUTORIZACIÓN EXPLÍCITA.

```text
Actúa como senior backend y Meta CAPI engineer. Implementa eventos server-side confirmados con deduplicación browser/server.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee webhook Mercado Pago, order-confirmation, migración pg_notify existente, CRM/n8n separado y tracking browser. Determina si el repo actual puede enviar CAPI directamente desde Edge Function o si n8n es el dueño aprobado; no crees dos emisores.

Objetivo: Purchase server-side solo después de confirmación confiable y con el mismo event_id que browser cuando ambos existan.

Implementación:
- Documenta arquitectura elegida y ownership en ANALYTICS_TRACKING.md.
- Persiste/deriva event_id estable por order + evento, con constraint/idempotencia.
- En webhook confirmado, encola o envía Purchase CAPI con content_ids, content_type, value, currency MXN, order_id, event_time y action_source=website.
- Usa token Meta solo en secreto backend. Hash SHA-256 de user_data permitido tras normalizar; no loguees PII/hash completos.
- Reintentos con backoff/idempotencia; una falla de Meta nunca revierte pago.
- SPEI emite Purchase únicamente cuando una acción backend verificada lo confirma.
- Añade registro de delivery mínimo para auditoría sin almacenar payload sensible.

Criterios de aceptación:
- Browser y server comparten event_id para dedup.
- Webhook repetido produce un solo evento lógico.
- Pago inválido/monto incorrecto/pending no envía Purchase.
- Secrets no aparecen en bundle/Git.

Añade unit/integration tests con Meta mock, pgTAP si cambia esquema, npm run check y prueba Test Events en staging. Detente antes de producción. Commit: feat: add deduplicated Meta CAPI purchases

Reporte final: ownership, event flow, dedup, PII/secrets, pruebas, Test Events, rollback y autorización.
```

## BV2-33 — SEO dinámico, canonical y Open Graph

**Dependencias:** `BV2-10`, `BV2-19`, `BV2-20`.
**Despliegue:** STAGING.

```text
Actúa como SEO technical specialist y frontend engineer. Haz que cada URL comercial tenga metadata única y compartible.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee SEO.tsx, settings, productos/colecciones, index.html y rutas. Conserva títulos/descripciones existentes cuando sean buenos.

Objetivo: title, description, canonical, robots y OpenGraph/Twitter por homepage, colección, producto y páginas no indexables.

Implementación:
- Refactoriza SEO para aceptar canonical absoluto, og:type, imagen, disponibilidad y robots.
- Producto usa meta_title/meta_description o fallback comercial corto; canonical por slug e imagen válida.
- Colección usa su SEO administrable; homepage usa settings.
- Checkout, cuenta, admin, búsqueda interna y confirmación usan noindex,follow o noindex,nofollow según sensibilidad.
- Elimina canonicals duplicados y evita que query UTMs cambie canonical.
- Define fallback de OG 1200x630 real o documenta el asset requerido; no estires logo cuadrado.
- Evalúa limitación de SPA para crawlers y documenta prerender/SSR como decisión de BV2-34, sin vender metadata client-only como garantía total.

Criterios de aceptación:
- Cada ruta probada tiene un title, description y canonical únicos.
- Compartir producto/colección usa imagen/copy correctos en debugger compatible.
- Páginas privadas no indexan ni filtran datos.

Añade tests de metadata por ruta, npm run check y valida HTML/DOM en preview. Commit: feat: add dynamic storefront metadata

Reporte final: reglas/fallbacks, rutas, pruebas, preview y limitaciones de render.
```

## BV2-34 — Sitemap, datos estructurados y redirects SEO

**Dependencias:** `BV2-08`, `BV2-10`, `BV2-33`.
**Despliegue:** STAGING; producción con autorización explícita.

```text
Actúa como SEO technical engineer. Construye artefactos SEO basados en catálogo activo y una estrategia de render adecuada para la SPA.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee public/robots.txt, sitemap.xml, rutas, modelo de producto/colección y hosting Cloudflare. Comprueba URLs indexadas históricas si hay Search Console; no inventes tráfico.

Objetivo: sitemap actualizado, Product/Organization/Breadcrumb JSON-LD válidos y redirects 301 cuando una URL cambie.

Implementación:
- Crea script de build que consulte una fuente segura/publicable o use snapshot controlado para generar sitemap con homepage, productos activos y colecciones vigentes; falla de forma explícita si no puede generar datos confiables.
- Actualiza robots.txt apuntando al dominio canónico y excluyendo admin/checkout/account sin depender solo de robots para privacidad.
- Añade JSON-LD con schema.org Product/Offer (MXN, precio activo, availability real), Organization y BreadcrumbList; no inventes reviews/ratings.
- Evalúa prerender de rutas comerciales en build o solución compatible con Cloudflare. Implementa la opción mínima que entregue metadata útil en HTML inicial sin reescribir backend.
- Versiona mapa redirects old hash/IDs→slugs cuando sea técnicamente posible; hashes no llegan al servidor, por lo que conserva bridge cliente.
- Valida sin contenido duplicado.

Criterios de aceptación:
- Sitemap solo contiene URLs canónicas 200 e indexables.
- Rich Results/Schema validator no reporta errores críticos.
- Producto agotado no se declara InStock.
- Rutas profundas funcionan tras deploy preview.

Añade tests del generador, npm run check, valida XML/JSON-LD y preview. Commit: feat: generate storefront SEO artifacts

Reporte final: render strategy, URLs, validadores, redirects, preview y pasos Search Console.
```

## BV2-35 — Presupuesto de performance e imágenes responsive

**Dependencias:** storefront `BV2-12`–`BV2-24` estable.
**Despliegue:** STAGING.

```text
Actúa como web performance engineer. Optimiza móvil con mediciones reales, no con trucos para scores.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee build output, Home, ProductGrid, ProductGallery, fuentes/CSS y Cloudflare headers. Mide baseline en preview throttled mobile y registra LCP/CLS/INP o TBT proxy cuando INP no sea reproducible.

Objetivo: alcanzar de forma orientativa LCP <2.5s, CLS cercano a 0 e INP <200ms razonablemente, sin perder funcionalidad.

Implementación:
- Crea docs/performance/PERFORMANCE_BUDGET.md con límites de entry JS/CSS, imagen LCP y total inicial.
- Añade componente responsive image o integración Supabase transforms con srcset/sizes, WebP/AVIF cuando el origen lo soporte y fallback seguro.
- Prioriza/preload solo la imagen LCP real; lazy-load below fold con width/height/aspect.
- Optimiza/self-host fonts, elimina código/recursos muertos y revisa chunks tras BV2-05.
- Añade web-vitals reporting en modo debug o endpoint aprobado sin PII; no agregues analytics duplicado.
- Configura caché inmutable para assets hashed y política apropiada para HTML.

Criterios de aceptación:
- No hay regresión de funcionalidad/imágenes antiguas.
- CLS de catálogo/PDP/hero queda documentado y estable.
- Budget puede fallar CI con umbral razonable o al menos genera reporte reproducible.
- Comparación before/after usa mismo dispositivo/red.

Ejecuta npm run check, Lighthouse/WebPageTest equivalente en preview 390 y documenta evidencia. Commit: perf: optimize mobile storefront delivery

Reporte final: métricas antes/después, budgets, assets, capturas waterfall y límites pendientes.
```

## BV2-36 — Auditoría y corrección de accesibilidad

**Dependencias:** `BV2-12`–`BV2-28`.
**Despliegue:** STAGING.

```text
Actúa como accessibility specialist y senior frontend engineer. Audita los recorridos comerciales completos contra WCAG 2.2 AA sin cambiar la dirección visual.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Objetivo: storefront, PDP, cart y checkout utilizables con teclado, lector de pantalla, zoom y reduced motion.

Implementación:
- Integra axe en tests/E2E con dependencia mínima y ejecuta auditoría automatizada en homepage, colección, PDP, cart abierto, cada paso checkout y confirmación.
- Haz recorrido manual solo teclado: orden de focus, skip link, dialogs, menús, errores, sticky CTA y focus tras navegación.
- Corrige contraste, labels, nombres accesibles, headings, landmarks, alt, live regions y touch targets.
- Prueba zoom 200%, 320px reflow y prefers-reduced-motion.
- No añadas aria redundante ni ocultes texto crítico solo visualmente sin alternativa.
- Documenta excepciones justificadas con issue/propietario, no como aprobación permanente.

Criterios de aceptación:
- Cero violaciones axe críticas/serias en recorridos objetivo.
- Compra esencial se completa solo con teclado.
- Primer error de formulario se anuncia y los datos permanecen.
- Drawer/menu restauran focus.

Ejecuta tests a11y, npm run check y revisión manual en preview. Commit: fix: meet storefront accessibility baseline

Reporte final: violaciones corregidas, evidencias manuales, pruebas, excepciones y capturas relevantes.
```

## BV2-37 — Administración de contenido y merchandising V2

**Dependencias:** `BV2-07`–`BV2-09`, reglas `BV2-22`.
**Despliegue:** STAGING; migraciones remotas requieren autorización explícita.

```text
Actúa como senior admin UX y full-stack engineer. Extiende el panel existente sin reemplazarlo ni mezclar permisos públicos.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee AdminLayout, ProductsPage, CategoriesPage, OccasionsPage, SettingsPage y RLS. Reutiliza patrones funcionales, pero evita formularios gigantes.

Objetivo: administrar productos, categorías, promociones, stock/disponibilidad, colecciones, temporadas, hero, announcement y destacados sin código.

Implementación:
- Añade campos V2 a productos: slug con preview, activo, destacado/orden, regular/sale/window, disponibilidad y galería.
- Añade active/order/window a categorías/ocasiones.
- Crea CollectionsPage con productos ordenables, vigencia, hero/copy/SEO.
- Extiende Settings para announcement/hero y reglas operativas autorizadas, separando secciones.
- Validación cliente y servidor: sale < regular cuando aplique, fechas coherentes, slugs únicos, URLs seguras.
- Protege todas las mutaciones por admin server/RLS; prueba customer/anon negativos.
- Añade confirmaciones para cambios destructivos y feedback sin alert().

Criterios de aceptación:
- Crear promoción temporal cambia storefront solo durante ventana.
- Desactivar temporada la retira sin borrar datos.
- Errores conservan formulario.
- Customer no puede acceder/mutar aunque manipule frontend.

Añade tests de formularios y pgTAP permisos; npm run check y smoke admin en staging. Commit: feat: add V2 merchandising controls

Reporte final: controles, validaciones, permisos, pruebas, preview y migraciones/autorización.
```

## BV2-38 — Suite E2E y checklist QA

**Dependencias:** funcionalidades objetivo implementadas; puede iniciarse antes con smoke mínimo.
**Despliegue:** STAGING.

```text
Actúa como senior QA automation engineer. Crea una suite E2E pequeña pero crítica y el documento operativo de QA.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee todo el flujo V2, runbook y CI. Elige Playwright salvo que ya exista otra herramienta equivalente. Usa fixtures/staging aislados; nunca hagas compras reales ni modifiques productos de producción.

Objetivo: automatizar recorridos de mayor riesgo y documentar la matriz completa requerida.

Implementación:
- Configura E2E para 360x800, 390x844, 430x932, tablet y desktop; prioriza 390 en cada PR y matriz completa en release.
- Cubre producto→cart, cantidad/eliminar, search, colección, guest checkout, dirección válida/inválida, fecha no disponible, out of stock, promo vigente/expirada, error backend, refresh/back y confirmación por estado.
- Mockea Mercado Pago para CI; sandbox real queda como prueba manual controlada.
- Añade assertions de eventos GA4/Meta/CAPI mock y ausencia de Purchase en pending/failure.
- Crea BLUE_VELVET_V2_QA.md con responsive, producto, categoría, search, cart, checkout, success/failure, delivery, stock, discount, slow network, analytics, SEO y accesibilidad.
- Incluye datos de prueba, expected result, evidencia y severidad.

Criterios de aceptación:
- Suite es determinista, no depende de catálogo aleatorio ni reloj real.
- CI guarda trace/screenshot solo al fallo y no filtra PII/secrets.
- Checklist cubre todos los casos originales.
- npm run check y E2E crítica pasan.

Commit: test: add Blue Velvet V2 critical E2E coverage

Reporte final: casos automatizados/manuales, navegadores/viewports, comandos, resultados, artifacts y flakiness conocida.
```

## BV2-39 — Migración, release y validación de producción

**Dependencias:** `BV2-01`, tareas que entrarán al release, `BV2-38`.
**Despliegue:** PRODUCCIÓN CON AUTORIZACIÓN EXPLÍCITA.

```text
Actúa como release manager, ecommerce architect y security engineer. Prepara una liberación gradual de Blue Velvet V2 sin ejecutar producción hasta recibir autorización en esta tarea.

Contrato: confirma rama/status/último commit y lee la auditoría, el runbook de Fase 0, el tablero y los archivos citados. Conserva las invariantes de Fase 0, limita el cambio a esta tarea, no reveles secretos, prueba antes de afirmar éxito, revisa el diff, actualiza el tablero y crea un único commit. No despliegues fuera de la clase autorizada.

Lee PHASE_0_RELEASE_RUNBOOK.md, STAGING.md, todas las migraciones V2, QA, ANALYTICS_TRACKING y PERFORMANCE_BUDGET. Compara staging contra commit exacto.

Objetivo: crear BLUE_VELVET_V2_MIGRATION.md y un release candidate verificable con backup, orden, rollback y gates.

Implementación documental:
- Inventaría commit/tag, migrations, Edge Functions, secrets por nombre, Cloudflare config, redirects y cache.
- Define development→staging→production, backups lógicos sin datos en Git, dry-run, orden de migraciones aditivas, funciones, frontend y restricciones.
- Incluye rollback por capa y condiciones que obligan abortar.
- Añade pruebas sandbox: tarjeta aprobada/fallida/cancelada, webhook repetido/monto incorrecto, SPEI pendiente/verificado, guest token y carrito recuperable.
- Añade validación GA4 DebugView, Meta Test Events/Pixel Helper, dedup CAPI, UTMs, Search Console/rich results y Web Vitals.
- Añade redirects/URLs y smoke 390x844/desktop.
- No uses autorización de conversaciones anteriores. Presenta el plan, resultados staging y pide una confirmación explícita final.

Solo después de “autorizo desplegar este release candidate a producción”:
1. Confirma backup y rollback disponibles.
2. Despliega exactamente el commit/artifacts probados en el orden documentado.
3. Ejecuta smoke read-only y una transacción sandbox/controlada aprobada.
4. Si falla un gate, detén y aplica rollback definido.
5. Registra IDs/versiones sin secretos en docs/handoff/BLUE_VELVET_V2_PROGRESS.md.

Criterios de aceptación:
- BLUE_VELVET_V2_MIGRATION.md no tiene pasos implícitos.
- Producción queda asociada a commit, deployment IDs y versiones.
- Purchase solo aparece tras confirmación y dedup funciona.
- Existe rollback probado o comprobable para cada mutación.

Antes de commit ejecuta npm run check, E2E release, git diff --check y revisa secrets. Commit: docs: finalize Blue Velvet V2 release plan

Reporte final: release candidate, gates, evidencia, autorización recibida o estado detenido, despliegues, smoke y rollback.
```

---

## Orden recomendado de ejecución

Ejecuta en orden numérico salvo estas oportunidades seguras:

- `BV2-02` y `BV2-05` pueden avanzar en paralelo después del baseline.
- `BV2-07`, `BV2-08` y la parte de contenido de `BV2-09` pueden prepararse en ramas distintas después de `BV2-06`.
- `BV2-22` debe resolverse temprano; bloquea `BV2-23` y `BV2-24`, no el sistema visual.
- `BV2-30`, `BV2-31` y la preparación de `BV2-33` pueden desarrollarse en paralelo después de `BV2-29`.
- `BV2-35`–`BV2-38` deben repetirse sobre el release candidate final aunque hayan comenzado antes.

No integres dos migraciones que modifiquen las mismas tablas sin revisar su orden. No permitas que un agente despliegue una rama cuyo commit no esté registrado en el tablero.
