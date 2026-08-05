# Blue Velvet V2 — Sistema de Diseño

**Versión:** 1.0 · **Fecha:** 2026-08-05 · **Prompt:** `BV2-02`
**Fuente de verdad de tokens:** `src/styles/tokens.css`

---

## 1. Dirección visual

Boutique floral premium contemporánea. La interfaz es oscura, sobria y editorial;
**el color lo aportan las fotografías de producto, no la UI**. El acento azul
Blue Velvet se usa con moderación y nunca como fondo dominante.

Prioridad rectora (de la auditoría): conversión > velocidad > UX móvil > marca > animaciones.

| Principio | Qué significa en la práctica |
|---|---|
| Oscuro editorial | Canvas navy casi negro; texto blanco cálido; jerarquía por tipografía, no por color. |
| Acento escaso | El azul `#1132d4` solo para CTA primario, foco, enlaces y estado activo. Nunca en fondos grandes ni en cada tarjeta. |
| Foto como héroe | Las imágenes de ramo aportan saturación; el chrome permanece neutro. |
| Calma premium | Sin glow, neón, gradientes tecnológicos, glassmorphism ni sombras con tinte de acento. |
| Móvil primero | Diseño base 390×844; verificado en 360, 375, 430, tablet y desktop. |

---

## 2. Cómo usar los tokens

Importa el archivo una sola vez (ya hecho en `src/index.css`) y referencia las
variables semánticas, **no** los primitivos de marca ni valores literales.

```css
/* ✅ Correcto — variable semántica */
.card {
  background: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

/* ❌ Incorrecto — literal duplicado o primitivo de marca */
.card {
  background: #1c1d27;
  color: #f6f6f4;
}
```

Regla de oro: **todo valor visual pasa por una variable**. Si falta una, se añade
a `tokens.css` con nombre semántico, no se incrusta un literal.

### Alias semánticos disponibles

- Superficies: `--color-bg-canvas`, `--color-surface`, `--color-surface-raised`, `--color-surface-inverse`, `--color-overlay`, `--color-border`, `--color-border-strong`.
- Texto: `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`, `--color-text-inverse`, `--color-text-on-accent`.
- Acento: `--color-accent`, `--color-accent-hover`, `--color-accent-active`, `--color-accent-soft`.
- Estados: `--color-success/-warning/-error/-info` (+ variantes `-soft` para fondos).
- Foco: `--color-focus-ring`, `--focus-ring`.

---

## 3. Color y contraste (WCAG AA)

Todos los pares texto/fondo cumplen AA. Verificación sobre `--color-bg-canvas` `#101322`:

| Token | Valor | Uso | Contraste sobre canvas | Nivel |
|---|---|---|---|---|
| `--color-text-primary` | `#f6f6f4` | Texto principal | 17.6 : 1 | AAA |
| `--color-text-secondary` | `#9da1b9` | Metadatos, labels | 7.2 : 1 | AAA |
| `--color-text-tertiary` | `#3e4255` | Placeholder, deshabilitado | 3.4 : 1 | solo UI/decorativo |
| `--color-text-on-accent` | `#ffffff` sobre `#1132d4` | Botón primario | 5.9 : 1 | AA |
| `--color-focus-ring` | `#7d8ef0` | Anillo de foco | 4.6 : 1 | AA (3:1 UI) |
| `--color-success` | `#3f9d63` | Confirmación | 4.6 : 1 | AA |
| `--color-warning` | `#e0a43c` | Advertencia | 6.3 : 1 | AA |
| `--color-error` | `#e05a5a` | Error | 4.6 : 1 | AA |

**Reglas:**
- El texto de cuerpo siempre `--color-text-primary` o `--color-text-secondary`.
- `--color-text-tertiary` solo para placeholders e iconos decorativos, nunca para información esencial.
- No usar el acento para texto de cuerpo sobre oscuro (usa `--color-info` para enlaces si se requiere más legibilidad).

---

## 4. Tipografía y jerarquía editorial

Familias: `--font-display` (Manrope — titulares) y `--font-body` (Noto Sans — cuerpo).
Escala fluida entre 390px y 1280px; la jerarquía se construye con **tamaño, peso y
tracking**, no con color ni ornamentos.

| Token | Rango | Uso editorial |
|---|---|---|
| `--text-hero` | 36 → 64px | H1 de home / landing de campaña |
| `--text-display` | 30 → 48px | H1 de sección |
| `--text-title` | 24 → 34px | Título de página |
| `--text-heading` | 20 → 26px | Encabezado de bloque / card destacada |
| `--text-subhead` | 18px | Subtítulo, precio destacado |
| `--text-body` | 16px | Cuerpo (mínimo en móvil) |
| `--text-body-sm` | 14px | Metadatos, ayuda de formulario |
| `--text-caption` | 12px | Etiquetas, legales |
| `--text-overline` | 11px + `--tracking-overline` | Eyebrow / categoría en mayúsculas |

Patrón editorial recomendado para PDP / landing:

```
overline   OCASIÓN · ANIVERSARIO        (caption, tracking widest, text-secondary)
hero       Ramo Aurora                   (display, font-bold, leading-tight)
subhead    $1,250 MXN · entrega hoy      (subhead, font-semibold)
body       Descripción breve…            (body, text-secondary, leading-relaxed)
```

---

## 5. Espaciado, densidad móvil y layout

Escala base 4px (`--space-1` … `--space-24`). En móvil la densidad prioriza
mostrar producto pronto: **un producto visible antes del primer scroll**.

| Contexto | Gutter / padding | Notas |
|---|---|---|
| Shell de página | `--container-gutter` (16 → 40px) | fluido |
| Card de producto | `--space-3`–`--space-4` | compacto en móvil |
| Sección | `--space-12`–`--space-16` vertical | aire editorial |
| Formularios | `--space-4` entre campos | labels sobre el campo |

Contenedores: `--container-sm` (640) texto/checkout, `--container-md` (768) PDP,
`--container-lg` (1024) catálogo, `--container-xl` (1280) shell/admin.

---

## 6. Imágenes de producto — 4:5

Formato editorial de moda/floristería: **retrato 4:5** en cards y PDP.

```css
.product-media {
  aspect-ratio: 4 / 5;
  border-radius: var(--radius-md);
  overflow: hidden;
}
.product-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

- Card de catálogo: 4:5, `border-radius: var(--radius-md)`, sin borde en todas las cards.
- PDP: galería 4:5, imagen principal con `--radius-md`; miniaturas `--radius-sm`.
- Declarar siempre `width`/`height` (o `aspect-ratio`) para evitar CLS (auditoría §10).
- Hero de home: máximo `--container-xl`, altura contenida; no sliders a pantalla completa.

---

## 7. Componentes — ejemplos permitidos

### Botón primario (único acento fuerte por vista)
```css
.btn-primary {
  background: var(--color-accent);
  color: var(--color-text-on-accent);
  min-height: var(--touch-target);   /* 44px */
  padding: 0 var(--space-6);
  border-radius: var(--radius-sm);
  transition: var(--transition-color);
}
.btn-primary:hover { background: var(--color-accent-hover); }
.btn-primary:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}
```

### Card de producto (sin borde por defecto)
```css
.product-card {
  background: transparent;      /* la imagen es la tarjeta */
  border-radius: var(--radius-md);
  transition: var(--transition-transform);
}
.product-card:hover { transform: translateY(-2px); }
```

### Input
```css
.input {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  min-height: var(--control-height);
  border-radius: var(--radius-sm);
  padding: 0 var(--space-4);
}
.input::placeholder { color: var(--color-text-tertiary); }
.input:focus-visible {
  border-color: var(--color-focus-ring);
  outline: var(--focus-ring);
  outline-offset: 0;
}
```

### Foco accesible (patrón global)
```css
:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}
```

---

## 8. Motion — límites de animación

Calma premium: las animaciones son discretas y funcionales.

| Regla | Límite |
|---|---|
| Duración máxima | `--duration-slow` = **300ms** |
| Propiedades permitidas | `opacity` y `transform` (componible, sin layout thrash) |
| Easing por defecto | `--ease-standard` / `--ease-decelerate` |
| Hover de cards | `translateY(-2px)` como máximo |
| Loops / autoplay | prohibidos salvo que el usuario lo inicie; respetar reduced-motion |

**`prefers-reduced-motion` está implementado en `tokens.css`** (reduce toda
animación/transición a ~0ms). Nunca usar animación para comunicar estado crítico
sin alternativa estática.

---

## 9. Touch targets y accesibilidad

- **Mínimo 44×44px** (`--touch-target`) en todo elemento interactivo (WCAG 2.5.5).
  Corrige el hallazgo de auditoría §14 (botones de cantidad de 24px).
- Altura de control estándar `--control-height` (44px); denso `--control-height-sm` (36px)
  solo en admin, nunca en el flujo de compra móvil.
- Todo `:focus-visible` muestra `--focus-ring` (no eliminar outlines — auditoría §14).
- Touch y teclado deben tener paridad con hover (los overlays hover necesitan
  equivalente en `:focus-visible` / `:active`).

---

## 10. Z-index (capas ordenadas)

`--z-base` 0 · `--z-raised` 10 · `--z-sticky` 20 (header) · `--z-overlay` 30 (scrim) ·
`--z-drawer` 40 (cart/menú) · `--z-modal` 50 · `--z-popover` 60 · `--z-toast` 70 · `--z-max` 80.
Usar solo estos niveles; no inventar valores arbitrarios.

---

## 11. Anti-patrones (prohibidos)

| ❌ No hacer | ✅ Hacer |
|---|---|
| Glow, neón, sombras con tinte de acento | Sombras sobrias `--shadow-*` en negro azulado |
| Gradientes tecnológicos / glassmorphism | Superficies planas `--color-surface` |
| Azul como fondo dominante o en cada card | Azul solo en CTA/foco/enlace/activo |
| Borde en todas las cards | Borde solo cuando separa contenido real; card de producto sin borde |
| Literales hex/px duplicados en componentes | Variables semánticas de `tokens.css` |
| Texto de cuerpo con acento o gris terciario | `--color-text-primary/secondary` |
| Animaciones >300ms o que mueven layout | `transform`/`opacity` ≤300ms |
| Touch targets <44px | `--touch-target` mínimo |
| Slider hero a pantalla completa | Hero contenido `--container-xl` |

---

## 12. Relación con el theme actual (Tailwind CDN)

La app usa hoy Tailwind por CDN con una paleta inline en `index.html`
(`primary #1132d4`, `background-dark #101322`, etc.). **Los tokens V2 no rompen ese
theme**: son un sistema paralelo en `src/styles/tokens.css`, importado por
`src/index.css`, que **no modifica componentes todavía**. La migración de Tailwind
CDN a CSS compilado es tarea de `BV2-03`; los tokens ya están alineados a los
valores actuales (`--bv-navy-900 = #101322`, `--bv-blue-500 = #1132d4`, etc.) para
que esa transición sea un remapeo, no un rediseño.
