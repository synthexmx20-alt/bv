# Blue Velvet V2 Agent Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Producir un paquete portable de 40 micro-prompts y un tablero de continuidad que permitan terminar Blue Velvet V2 con agentes de programación sin depender de esta conversación.

**Architecture:** El documento de prompts será la fuente de instrucciones ejecutables y el tablero será la fuente de estado entre sesiones. Cada prompt tendrá una dependencia explícita, un único resultado, criterios observables, verificaciones y una clase de despliegue; los cambios de pagos, datos y producción conservarán las invariantes de seguridad de Fase 0.

**Tech Stack:** Markdown, Git, React 19, TypeScript, Vite, Vitest, Supabase Postgres/Edge Functions/Storage, Mercado Pago, Cloudflare Pages, GA4 y Meta Pixel/CAPI.

---

## Estructura de archivos

- Crear `docs/handoff/BLUE_VELVET_V2_AGENT_PROMPTS.md`: instrucciones globales, matriz de dependencias y 40 prompts copiables.
- Crear `docs/handoff/BLUE_VELVET_V2_PROGRESS.md`: estado inicial, invariantes, registro de tareas, decisiones, migraciones, despliegues y rollback.
- Modificar este archivo al finalizar: marcar las cinco tareas como completadas después de verificar los documentos.

### Task 1: Inventario y matriz de cobertura

**Files:**
- Read: `BLUE_VELVET_V2_AUDIT.md`
- Read: `docs/operations/PHASE_0_RELEASE_RUNBOOK.md`
- Read: `docs/superpowers/specs/2026-08-05-blue-velvet-v2-agent-handoff-design.md`
- Create: `docs/handoff/BLUE_VELVET_V2_AGENT_PROMPTS.md`

- [x] **Step 1: Enumerar exactamente 40 unidades de trabajo**

Usar identificadores consecutivos `BV2-00` a `BV2-39`. Mantener una sola responsabilidad por unidad y asignar dependencias explícitas.

- [x] **Step 2: Mapear los requisitos originales**

Cubrir baseline, CI/staging, sistema visual, routing, modelos, shell, navegación, catálogo, PDP, entrega, guest checkout, pagos, confirmación, landings, analytics, SEO, rendimiento, accesibilidad, administración, QA y migración.

- [x] **Step 3: Comprobar la secuencia**

Confirmar que ninguna tarea depende de otra posterior y que las tareas con decisiones empresariales puedan bloquearse sin impedir trabajo independiente.

### Task 2: Contrato y plantilla de ejecución

**Files:**
- Modify: `docs/handoff/BLUE_VELVET_V2_AGENT_PROMPTS.md`

- [x] **Step 1: Escribir el preámbulo operativo**

Incluir preparación de Git, lectura obligatoria, protección de secretos, invariantes de Fase 0, TDD, verificaciones, commits y formato de reporte final.

- [x] **Step 2: Definir las clases de despliegue**

Usar únicamente `LOCAL`, `STAGING` y `PRODUCCIÓN CON AUTORIZACIÓN EXPLÍCITA`; ninguna instrucción deberá convertir una autorización histórica en permiso permanente.

- [x] **Step 3: Definir la plantilla de uso**

Indicar al propietario que copie un prompt completo, proporcione las respuestas empresariales cuando corresponda y actualice el tablero después de cada commit o acción externa.

### Task 3: Redactar los 40 micro-prompts

**Files:**
- Modify: `docs/handoff/BLUE_VELVET_V2_AGENT_PROMPTS.md`

- [x] **Step 1: Redactar `BV2-00` a `BV2-11`**

Cubrir baseline, automatización, sistema visual, CSS, primitivas, route splitting, esquema/tipos, modelos comerciales, settings, routing y capa de datos.

- [x] **Step 2: Redactar `BV2-12` a `BV2-24`**

Cubrir shell, navegación, carrito, homepage, categorías, cards, búsqueda, colecciones, PDP, decisiones y validación de entrega.

- [x] **Step 3: Redactar `BV2-25` a `BV2-33`**

Cubrir guest checkout, UX de checkout, pagos, confirmación, atribución, GA4, Pixel, CAPI y SEO dinámico.

- [x] **Step 4: Redactar `BV2-34` a `BV2-39`**

Cubrir sitemap/datos estructurados, performance, accesibilidad, administración, QA/E2E y release/migración.

- [x] **Step 5: Verificar cada prompt individualmente**

Cada bloque debe contener objetivo, dependencias, inspección previa, alcance, exclusiones, implementación, criterios de aceptación, pruebas, despliegue, commit y reporte.

### Task 4: Crear el tablero de continuidad

**Files:**
- Create: `docs/handoff/BLUE_VELVET_V2_PROGRESS.md`

- [x] **Step 1: Registrar el baseline conocido**

Anotar rama y commit de partida, estado de Fase 0, producción conocida y comandos de verificación, sin copiar secretos.

- [x] **Step 2: Crear la tabla de 40 tareas**

Incluir estado, dependencias, rama/PR, commit, pruebas, despliegue y notas. El estado inicial será `PENDIENTE` salvo evidencia ya registrada.

- [x] **Step 3: Crear registros operativos**

Añadir secciones para decisiones empresariales, migraciones, Edge Functions, Cloudflare, analytics, incidencias y rollback.

### Task 5: Autorrevisión y commit

**Files:**
- Verify: `docs/handoff/BLUE_VELVET_V2_AGENT_PROMPTS.md`
- Verify: `docs/handoff/BLUE_VELVET_V2_PROGRESS.md`
- Modify: `docs/superpowers/plans/2026-08-05-blue-velvet-v2-agent-handoff.md`

- [x] **Step 1: Validar cantidad y unicidad**

Run:

```powershell
rg -o "^## BV2-[0-9]{2}" docs/handoff/BLUE_VELVET_V2_AGENT_PROMPTS.md | Measure-Object
```

Expected: `Count : 40`.

- [x] **Step 2: Escanear placeholders prohibidos**

Run:

```powershell
rg -n "T[B]D|T[O]DO|implement[ ]later|similar[ ]to|rest[ ]of[ ]code|for[ ]brevity" docs/handoff docs/superpowers/plans/2026-08-05-blue-velvet-v2-agent-handoff.md
```

Expected: ninguna coincidencia usada como sustituto de contenido pendiente.

- [x] **Step 3: Comprobar formato y estado de Git**

Run:

```powershell
git diff --check
git status --short
```

Expected: sin errores de whitespace; solo los tres documentos previstos aparecen modificados o nuevos.

- [x] **Step 4: Marcar este plan como completado**

Cambiar todos los checkboxes de este archivo a `[x]` después de que los pasos anteriores pasen.

- [x] **Step 5: Commit**

```powershell
git add docs/handoff/BLUE_VELVET_V2_AGENT_PROMPTS.md docs/handoff/BLUE_VELVET_V2_PROGRESS.md docs/superpowers/plans/2026-08-05-blue-velvet-v2-agent-handoff.md
git commit -m "docs: add Blue Velvet V2 agent prompt pack"
```
