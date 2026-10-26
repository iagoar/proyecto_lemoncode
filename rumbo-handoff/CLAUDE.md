# rumbo. — guía del repo

Front-end del catálogo de servicios rumbo.: Vite + React 18 + TypeScript + React Router + Tailwind CSS v4 + shadcn/ui, con datos mock. La especificación completa está en `handoff/HANDOFF.md`; léela antes de tocar una pantalla.

## Comandos

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint

Ejecuta `typecheck` y `lint` antes de dar una tarea por terminada.

## Reglas de UI

- Colores solo con los tokens del tema (`bg-canvas`, `bg-card`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `bg-accent`, `border-border`, `border-input`, `text-destructive`, `bg-success`, `bg-warning`…). Nunca la paleta por defecto de Tailwind ni hex en componentes.
- Tipografía: `font-display` para h1–h3 y eyebrows; `font-sans` por defecto; `font-mono` para precios, duraciones y horas.
- Usa los componentes de shadcn de `src/components/ui` antes de crear uno nuevo; personaliza variantes allí (ver HANDOFF §2.1), no con clases sueltas repetidas.
- Una CTA `primary` por vista. Controles ≥ 44 px. Foco visible con `ring`.
- Mobile-first; el cambio de patrón móvil/escritorio es en `md`.
- Copy en español de España, tuteo, mayúscula solo inicial. Sin emojis.

## Datos

- Las pantallas solo hablan con `src/lib/api/*` vía TanStack Query; nunca importan el seed directamente.
- Fechas y precios se formatean con `src/lib/format.ts` (`Intl`, date-fns `es`, Europe/Madrid).

## Diseño de referencia

`handoff/design/screens/*.html` son exportaciones de un lienzo de diseño: úsalas para medidas, copy y estados; su sintaxis (`<x-dc>`, `<sc-for>`, `{{…}}`) no se porta.
