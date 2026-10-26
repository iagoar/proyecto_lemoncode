# rumbo. — guía del repo

Front-end del catálogo de servicios rumbo.: **TanStack Start** (React 19 + TypeScript + TanStack Router con rutas por fichero, SSR con Nitro) + Tailwind CSS v4 + shadcn/ui, con datos mock. La especificación completa está en `../rumbo-handoff/HANDOFF.md`; léela antes de tocar una pantalla.

> El handoff se escribió para Vite + React Router. Aquí manda la especificación funcional y visual del handoff, pero el stack es el de este proyecto: donde el handoff diga React Router / `createBrowserRouter` / `index.html` / `src/index.css`, usa el equivalente de abajo.

## Comandos

- `npm run dev` — servidor de desarrollo (puerto 3000)
- `npm run build` — build de producción
- `npm run typecheck` — `tsc --noEmit`
- `npm run generate-routes` — regenera `src/routeTree.gen.ts` (también lo hace el dev server)

Ejecuta `typecheck` antes de dar una tarea por terminada.

## Equivalencias con el handoff

| Handoff | Este proyecto |
|---|---|
| `src/index.css` | `src/styles.css` (tema de `rumbo-handoff/theme/index.css`) |
| `index.html` (fuentes, `lang`) | `head` y `shellComponent` de `src/routes/__root.tsx` |
| `app/router.tsx`, `createBrowserRouter` | Rutas por fichero en `src/routes/`; router en `src/router.tsx` |
| Layouts (`ClientLayout`, `AdminLayout`…) | Rutas layout *pathless* (`_cliente.tsx`, `_admin.tsx`) con `<Outlet />` |
| Guardas de ruta | `beforeLoad` + `throw redirect({ to: '/login', search: { next } })` |
| Filtros en la URL (`?q=&cat=…`) | `validateSearch` de la ruta (zod) + `Route.useSearch()` / `navigate({ search })` |
| `useParams`, `useNavigate`, `<Link>` | Los de `@tanstack/react-router` |
| `public/brand/` | `public/brand/` (logo tinta, blanco y app icon) |

- Un fichero que empiece por `_` es una ruta pathless: para una ruta cuyo segmento empiece por `_` (p. ej. `/_kit`) escapa el nombre: `[_]kit.tsx`.
- La app se renderiza en servidor: `localStorage`, `window` y `matchMedia` solo dentro de efectos o handlers, nunca en el render ni a nivel de módulo. Excepción: la rama `_cliente` (y la futura `_admin`) lleva `ssr: false`, porque la sesión mock vive en el navegador y la guarda corre en `beforeLoad`.
- Si añades una utilidad tipográfica nueva al tema (`text-*`), regístrala también en `src/lib/utils.ts` (`extendTailwindMerge`) o `cn` la confundirá con un color.
- Importa con el alias `#/…` (`#/components/ui/button`, `#/lib/utils`).

## Reglas de UI

- Colores solo con los tokens del tema (`bg-canvas`, `bg-card`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `bg-accent`, `border-border`, `border-input`, `text-destructive`, `bg-success`, `bg-warning`…). Nunca la paleta por defecto de Tailwind ni hex en componentes.
- Tipografía: `font-display` para h1–h3 y eyebrows; `font-sans` por defecto; `font-mono` para precios, duraciones y horas.
- Usa los componentes de shadcn de `src/components/ui` antes de crear uno nuevo; personaliza variantes allí (ver HANDOFF §2.1), no con clases sueltas repetidas.
- Al añadir componentes con `npx shadcn@latest add …`, revisa los imports: el CLI resuelve mal el alias `#/lib/utils` y escribe `from "cn"`. Corrígelo a `#/lib/utils` y no instales el paquete `cn`.
- Una CTA `primary` por vista. Controles ≥ 44 px. Foco visible con `ring` (sólido 2px + offset 2px).
- Mobile-first; el cambio de patrón móvil/escritorio es en `md`.
- Copy en español de España, tuteo, mayúscula solo inicial. Sin emojis.
- Tema claro/oscuro: `ThemeProvider` y `useTheme` en `src/components/theme-provider.tsx`; logo con `src/components/brand/Logo.tsx`.
- `/_kit` (solo en dev) muestra botones, badges, inputs, chips y tarjetas para revisar el tema.

## Datos

- Las pantallas solo hablan con `src/lib/api/*` vía TanStack Query; nunca importan el seed directamente.
- Fechas y precios se formatean con `src/lib/format.ts` (`Intl`, date-fns `es`, Europe/Madrid).

## Diseño de referencia

`../rumbo-handoff/design/screens/*.html` son exportaciones de un lienzo de diseño: úsalas para medidas, copy y estados; su sintaxis (`<x-dc>`, `<sc-for>`, `{{…}}`) no se porta.
