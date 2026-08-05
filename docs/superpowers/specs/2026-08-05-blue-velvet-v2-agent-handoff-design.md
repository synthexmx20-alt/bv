# Blue Velvet V2 — Diseño del paquete de traspaso a agentes de IA

Fecha: 2026-08-05
Estado: propuesta para aprobación

## 1. Objetivo

Preparar la continuación de Blue Velvet V2 para que pueda ejecutarla cualquier agente de programación con acceso al repositorio de GitHub y a una terminal, sin depender del historial de esta conversación.

El trabajo restante se dividirá en tareas pequeñas, comprobables y reversibles. Cada tarea tendrá un prompt autocontenido, un alcance único, criterios de aceptación, verificaciones obligatorias y una instrucción de commit. El paquete no autorizará despliegues a producción por defecto.

## 2. Entregables posteriores a la aprobación

Una vez aprobada esta especificación se crearán:

1. `docs/handoff/BLUE_VELVET_V2_AGENT_PROMPTS.md`: prompts numerados y listos para copiar y pegar.
2. `docs/handoff/BLUE_VELVET_V2_PROGRESS.md`: tablero de progreso con dependencias, commits, migraciones, despliegues y notas de rollback.
3. `docs/superpowers/plans/2026-08-05-blue-velvet-v2-agent-handoff.md`: plan detallado para producir y validar ambos documentos.

Los requerimientos originales de Blue Velvet V2 se mapearán a uno o más identificadores de prompt para que nada quede implícito.

## 3. Unidad de trabajo

Cada prompt corresponderá a una microtarea:

- Un solo objetivo funcional o técnico.
- Normalmente entre uno y cuatro archivos modificados; se admitirán más únicamente cuando el cambio sea mecánico o el subsistema lo requiera.
- Un solo subsistema y un solo commit coherente.
- Dependencias previas explícitas.
- Sin placeholders, productos, precios ni credenciales hardcodeados.
- Sin cambios colaterales de arquitectura por preferencia tecnológica.

Las tareas que requieran una decisión empresarial no inferible se separarán como puertas de decisión. El agente deberá obtener la respuesta del propietario antes de implementar la parte afectada.

## 4. Contrato común de todos los prompts

Cada prompt indicará al agente que debe:

1. Confirmar la rama, `git status` y el último commit antes de modificar archivos.
2. Leer `BLUE_VELVET_V2_AUDIT.md`, `docs/operations/PHASE_0_RELEASE_RUNBOOK.md` y los archivos directamente relacionados con la tarea.
3. Inspeccionar primero la implementación existente y conservar la lógica segura y funcional.
4. Trabajar únicamente en el alcance asignado.
5. Añadir o actualizar pruebas antes de la implementación cuando se trate de una función o corrección comprobable.
6. Ejecutar las verificaciones específicas de la tarea y, como mínimo cuando aplique, lint, type check, tests y build.
7. Corregir únicamente regresiones causadas por su cambio y reportar cualquier problema previo por separado.
8. Revisar el diff en busca de secretos, credenciales, archivos generados y cambios no relacionados.
9. Crear un commit con el mensaje indicado, solo si las verificaciones requeridas pasan.
10. Entregar un reporte corto con archivos cambiados, pruebas ejecutadas, resultado, commit, riesgos y pasos manuales pendientes.

Si encuentra una diferencia entre el prompt y el repositorio real, el agente deberá basarse en evidencia del código, documentar la discrepancia y evitar improvisar una reescritura amplia.

## 5. Invariantes heredados de la Fase 0

Ningún prompt podrá debilitar estas reglas:

- El frontend nunca es la autoridad del precio final.
- El pedido pagado con tarjeta solo se confirma después de una verificación confiable del proveedor mediante backend/webhook.
- Un pago SPEI permanece pendiente hasta que exista verificación manual o automatizada confiable.
- `Purchase` solo se dispara para una compra confirmada y debe permitir deduplicación.
- Las políticas endurecidas de RLS, roles, almacenamiento y analytics permanecen activas.
- La función heredada `create-preference` permanece retirada.
- No se deben exponer service-role keys, tokens de pago ni secretos en el cliente o en Git.
- Las URLs actuales se conservan o reciben una migración y redirect explícitos.
- Las integraciones actuales de Supabase y Mercado Pago no se reemplazan sin una justificación basada en fallos o requisitos incompatibles.

## 6. Estructura prevista del paquete

El paquete tendrá aproximadamente entre 35 y 45 prompts, agrupados así:

0. Incorporación, baseline reproducible y aceptación manual pendiente de Fase 0.
1. GitHub, integración continua y entorno de staging.
2. Design system, CSS compilado, componentes base y división de código.
3. Routing, slugs, compatibilidad de URLs y modelos de contenido/comercio.
4. Layout global, announcement bar, header móvil, búsqueda y cart drawer.
5. Homepage híbrida, catálogo, categorías, product cards y skeletons.
6. PDP, galería, entrega, cobertura, dedicatoria, extras y CTA sticky.
7. Checkout guest-first, confirmación y landings para campañas.
8. GA4, Meta Pixel, Conversions API, deduplicación y atribución.
9. SEO técnico, rendimiento y accesibilidad.
10. Administración, QA, documentación de migración y liberación.

El número y los identificadores definitivos se fijarán al construir el documento completo. El orden reflejará las dependencias reales; una tarea solo podrá adelantarse cuando su ficha indique que es independiente.

## 7. Formato de cada prompt

Cada bloque copiable incluirá:

- Identificador y título.
- Objetivo.
- Contexto indispensable del proyecto.
- Prerrequisitos y prompts dependientes.
- Archivos o áreas que debe inspeccionar, sin asumir que su contenido sigue idéntico.
- Alcance incluido y exclusiones.
- Pasos concretos.
- Criterios de aceptación observables.
- Casos de prueba y comandos de verificación.
- Clase de despliegue autorizada.
- Mensaje de commit.
- Plantilla de reporte final.

Los prompts evitarán instrucciones vagas como “hazlo apropiadamente” o “agrega lo necesario”. Cuando exista margen de diseño, incluirán restricciones de marca, móvil, conversión, rendimiento y accesibilidad.

## 8. Clases de despliegue

Cada microtarea tendrá una de estas clases:

- **Local solamente:** modificar, probar y hacer commit; no desplegar.
- **Staging autorizado:** puede desplegarse a staging después de pasar las verificaciones indicadas.
- **Producción con autorización explícita:** el agente debe detenerse después de preparar y validar el release; solo desplegará si el propietario lo autoriza en ese momento.

Una autorización previa para acelerar producción no se reutilizará automáticamente en futuras tareas. Las migraciones, Edge Functions, cambios de DNS, pagos y tracking de compra tendrán una puerta de liberación explícita y un procedimiento de rollback.

## 9. Flujo de Git y continuidad entre agentes

La estrategia predeterminada será:

- Actualizar desde la rama estable antes de cada tarea.
- Crear una rama corta por prompt, salvo que la plataforma del agente ya proporcione un worktree aislado.
- Hacer un commit pequeño con el mensaje especificado.
- No hacer force push, rebase destructivo ni cambios directos no revisados sobre producción.
- Registrar en el tablero el identificador del prompt, rama, commit, estado de pruebas y cualquier acción externa.
- Antes de comenzar el siguiente prompt, integrar o confirmar la disponibilidad de todas sus dependencias.

El tablero de progreso será la fuente de continuidad si cambia el agente o se pierde el contexto de conversación.

## 10. Puertas de decisión empresarial

Se prepararán prompts breves para capturar, documentar y luego implementar estas decisiones sin inventarlas:

- Hora límite y tiempo de preparación para entrega el mismo día.
- Horarios, días sin entrega, festivos y temporadas pico.
- Tarifas base, envío gratuito y recargos por zona.
- Capacidad diaria y por horario.
- Política de stock y sustitución de flores.
- Momento de confirmación de compra para SPEI.
- Disponibilidad real de Apple Pay y Google Pay en la cuenta de Mercado Pago.
- Responsabilidad de CRM/n8n y destinos de los datos.
- Evidencia real permitida para social proof.

Las partes no dependientes de estas respuestas podrán avanzar. Las reglas comerciales afectadas quedarán bloqueadas hasta recibir una decisión explícita.

## 11. Diseño visual dentro del traspaso

No se generarán mockups como parte de este documento. El paquete incluirá una tarea específica para convertir la dirección de marca ya definida en tokens y referencias aprobables antes de extenderla a toda la interfaz.

La implementación visual deberá mantener:

- Mobile-first con referencia principal de 390 × 844 px.
- Ecommerce visible casi inmediatamente.
- Fotografía floral como principal fuente de color.
- Navy muy oscuro, blanco cálido, grises suaves y azul Blue Velvet solo como acento.
- Composición editorial, limpia y premium.
- Conversión, velocidad y claridad por encima de animaciones.

## 12. Evidencia y verificación

Cada tarea deberá dejar evidencia proporcional al riesgo:

- Pruebas unitarias para reglas puras y lógica comercial.
- Pruebas de integración para carrito, checkout, pedidos y tracking.
- Pruebas E2E para recorridos críticos cuando la infraestructura esté lista.
- Capturas o resultados responsive para las vistas visuales relevantes.
- Validación de eventos en herramientas de depuración antes de producción.
- Build reproducible y revisión de bundle para cambios de rendimiento.
- Verificación manual documentada para pagos, webhooks, DNS y servicios externos.

El agente no podrá afirmar que una tarea está completa si no ejecutó sus verificaciones o si solo inspeccionó el código sin probar el comportamiento requerido.

## 13. Criterios de éxito del paquete

El paquete estará listo cuando:

- Todos los requisitos originales estén asociados a uno o más prompts.
- Cada prompt sea comprensible sin el historial de esta conversación.
- Las dependencias formen una secuencia ejecutable y no circular.
- Los cambios de alto riesgo tengan rollback y autorización explícita.
- Las decisiones empresariales estén separadas de las decisiones técnicas.
- Las invariantes de seguridad de Fase 0 estén presentes donde corresponda.
- Exista una forma inequívoca de saber qué está terminado, probado, desplegado o pendiente.
- Ningún prompt solicite introducir secretos, hardcodear datos comerciales o reemplazar sistemas funcionales sin evidencia.

## 14. Fuera de alcance de esta especificación

Este documento no implementa cambios de producto, no modifica Supabase, no despliega Cloudflare y no altera producción. Su único propósito es definir el formato seguro y operativo del traspaso. La lista completa de prompts se escribirá después de la aprobación del propietario.
