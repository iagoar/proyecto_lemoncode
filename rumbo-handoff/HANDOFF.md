# rumbo. — Handoff de diseño a desarrollo

Catálogo de servicios de coaching, bienestar y formación con reserva de sesiones y un backoffice para gestionar el catálogo. Este documento es la especificación para construir el **front-end** con datos mock. El diseño está cerrado en escritorio (1280) y móvil (390); el flujo, en `design/Flujo.html`.

## 0. Qué hay en este paquete

| Ruta | Qué es | Cómo usarlo |
|---|---|---|
| `HANDOFF.md` | Esta especificación | Fuente de verdad del alcance y comportamiento |
| `CLAUDE.md` | Convenciones del repo | Copiar a la raíz del proyecto |
| `PROMPT.md` | Primer mensaje para Claude Code | Pegar al empezar |
| `theme/index.css` | Tema completo Tailwind v4 + shadcn (claro y `.dark`) | Sustituye `src/index.css` tras `shadcn init` |
| `design/tokens/tokens.json` | Tokens del design system con notas de uso | Referencia; los valores ya están en `index.css` |
| `design/screens/*.html` | Pantallas de alta fidelidad (escritorio y `Movil-*`) | **Referencia visual**, no código a copiar (ver §0.1) |
| `design/Flujo.html` | Diagrama del flujo cliente y admin | Referencia |
| `assets/` | Logo (tinta y blanco, PNG transparente) y app icon | `public/brand/` |

### 0.1 Cómo leer `design/screens/*.html`

Son ficheros de un lienzo de diseño. Tienen sintaxis propia del lienzo que **no** se porta: `<x-dc>`, `<helmet>`, `<sc-for>`, `<sc-if>`, `{{huecos}}`, `support.js` y la clase `Component extends DCLogic`. Úsalos para sacar **espaciados, tamaños, colores, copy, estados y lógica de interacción** (la clase al final de cada fichero tiene los datos de ejemplo y la lógica de estado). Los estilos van inline con hex: tradúcelos a las utilidades/tokens de §2, nunca copies hex sueltos.

- Enlaces `X.dc.html` → rutas de §4.
- `/_blob/a0ab3f6c…` = `assets/rumbo-logo.png`; `/_blob/88535d97…` = `assets/rumbo-logo-white.png`.

## 1. Stack

- **Vite + React 18 + TypeScript** (strict).
- **React Router v6** (data router: `createBrowserRouter`).
- **Tailwind CSS v4** (`@tailwindcss/vite`) + **shadcn/ui** (estilo `new-york`, base color `neutral`, CSS variables). El tema real lo pone `theme/index.css`.
- **TanStack Query** para datos (sobre la capa mock), **react-hook-form + zod** para formularios (componente `Form` de shadcn).
- **lucide-react** para iconos. **sonner** para toasts. **date-fns** con locale `es` para fechas.
- Fuentes: Google Fonts en `index.html`:
  `https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap`
- `<html lang="es">`. Zona horaria mostrada: Europe/Madrid.

## 2. Design system (tema)

Todo el color sale de variables CSS con los **nombres de shadcn**, así que los componentes de shadcn heredan la marca sin tocarlos. No uses colores de la paleta por defecto de Tailwind (`blue-600`, `gray-500`…).

| Token / utilidad | Claro | Oscuro | Uso |
|---|---|---|---|
| `bg-canvas` | #F2F4F8 | #101216 | Fondo de página (`body`) |
| `bg-background` / `bg-card` | #FFF / #FFF | #16181D / #1D2027 | Header, tarjetas, paneles |
| `text-foreground` | #16181D | #F2F4F8 | Texto principal |
| `text-muted-foreground` | #5B6170 | #A3A9B6 | Metadatos, ayudas |
| `bg-primary` | #2C5AF5 | #7C9BFF | CTA, selección, foco. **Una CTA primaria por vista** |
| `bg-accent` | #EBF0FF | #252B3D | Hover ghost/outline, nav activa, badge “Publicado” |
| `bg-secondary` / `bg-muted` | #F2F4F8 | #262A33 | Chips/celdas no disponibles, skeletons |
| `destructive` | #D92D20 | #F97066 | Cancelar, eliminar, errores |
| `success` | #157F3D | #47CD89 | Estado “Confirmada” |
| `warning` | #B54708 | #FDB022 | Estado “Pendiente de pago” |
| `border` | #DDE1E8 | #2C313B | Bordes decorativos (tarjetas, separadores) |
| `input` | #8A91A0 | #646B7A | Borde de **controles** (inputs, selects, chips, botón outline). Cumple 3:1 |
| `ring` | = primary | | Foco: anillo sólido 2px + offset 2px |
| `brand-ink`, `brand-blue` (#3D6BFF), `brand-mist`, `brand-blue-100` (#C9D6FF) | fijos | | Solo piezas de marca (login, imágenes placeholder). `brand-blue` **no** lleva texto encima (4.43:1) |

**Tipografía**

- `font-display` (Space Grotesk) para `h1`–`h3` y etiquetas `eyebrow` en MAYÚSCULAS; `font-sans` (Geist) para la interfaz; `font-mono` (Geist Mono) para precios, duraciones, horas y fechas en calendario.
- Escala (utilidades definidas en el tema): `text-display` 56/60, `text-h1` 36/40 (en móvil 28/34), `text-h2` 28/34, `text-h3` 20/28, `text-eyebrow` 12/16 + `tracking` 0.12em + `uppercase`, `text-body-lg` 17/26, `text-body` 15/24 (por defecto), `text-sm` 14/20, `text-caption` 13/18.

**Radios**: `--radius` 12px. Botones/inputs `rounded-md` (10px), tarjetas y paneles `rounded-xl` (16px), bloques de marca y hero `rounded-2xl` (24px), chips/badges/avatares `rounded-full`.

**Sombras**: ninguna en reposo. `shadow-xs` inputs, `shadow-sm` hover de tarjeta, `shadow-lg` en lo que flota (dialog, popover, sheet).

**Layout**: `max-w-page` (1200px) + `px-6` en catálogo, detalle y reserva; `max-w-narrow` (960px) en Tus reservas; `max-w-form` (420px) en login. Parrilla: `grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6`. Breakpoint de cambio móvil/escritorio: **`md` (768px)**; columnas detalle/reserva a partir de `lg`.

**Dark mode**: clase `.dark` en `<html>`, con un `ThemeProvider` mínimo (system / light / dark) guardado en `localStorage`. Las pantallas solo están diseñadas en claro; el oscuro sale de los tokens.

### 2.1 Personalizaciones de componentes shadcn

Tras `npx shadcn add …`, ajusta:

- **Button** (`components/ui/button.tsx`):
  - tamaños: `sm` = `h-10 px-3.5 text-sm`, `default` = `h-11 px-4`, `lg` = `h-12 px-5 text-base`, `xl` = `h-13 px-6 text-base` (CTA móvil), `icon` = `size-11`. Todos `rounded-md font-semibold` (outline/ghost `font-medium`).
  - variante `outline`: `border-input bg-background`.
  - variante nueva `destructive-outline`: `border border-destructive text-destructive bg-background hover:bg-destructive/5`.
- **Badge**: variantes `success`, `warning`, `secondary`, `destructive-outline` y `draft` (`border border-dashed border-input text-muted-foreground bg-background`). Siempre `rounded-full text-xs font-medium px-2.5`.
- **Input / Select / Textarea**: `h-11` en escritorio, `h-12` y `text-base` (16px, evita zoom en iOS) en móvil; borde `border-input`.
- **Chip de categoría**: `Toggle`/`ToggleGroup` `type="single"` con estilo pill: inactivo `bg-background border-input`, activo `bg-foreground text-background`.

## 3. Modelo de datos (mock)

```ts
type Category = 'coaching' | 'bienestar' | 'formacion';
type Mode = 'online' | 'presencial';

interface Professional { id: string; name: string; title: string; bio: string; avatarUrl?: string }
interface Service {
  id: string; slug: string; name: string; category: Category; mode: Mode;
  durationMin: number; priceCents: number | null; professionalId: string;
  summary: string; description: string; includes: string[];
  imageUrl?: string; published: boolean;
}
interface Review { id: string; serviceId: string; author: string; rating: 1|2|3|4|5; text: string; date: string }
type BookingStatus = 'confirmada' | 'pendiente_pago' | 'completada' | 'cancelada';
type PaymentMethod = 'tarjeta' | 'en_sesion';
interface Booking {
  id: string; serviceId: string; userId: string; start: string; end: string; // ISO
  status: BookingStatus; paymentMethod: PaymentMethod; notes?: string;
  contact: { name: string; email: string; phone?: string };
}
interface Slot { time: string /* 'HH:mm' */; available: boolean }
interface User { id: string; name: string; email: string; role: 'cliente' | 'admin' }
```

Capa `src/lib/api/` con funciones async (latencia simulada 200–400 ms) que más adelante se cambian por fetch a una API, sin tocar las pantallas:

- `services.list({ q, category, mode, sort, page })` → `{ items, total }` (solo `published` para clientes) · `services.get(slug)` · `services.listAdmin()` · `services.save(input)` · `services.remove(id)`
- `availability.days(serviceId, month)` → días con hueco · `availability.slots(serviceId, date)` → `Slot[]`
- `bookings.listMine()` · `bookings.create(input)` · `bookings.cancel(id)` · `bookings.reschedule(id, start)`
- `auth.login(email, password)` / `auth.loginWithGoogle()` / `auth.logout()` / `auth.me()`

Persistencia mock en `localStorage` (reservas, servicios editados) para que el flujo sobreviva a recargas. Semilla: los 6 servicios, 2 próximas + 1 pendiente + 2 pasadas que aparecen en las pantallas.

**Reglas mock de disponibilidad**: sin huecos en fines de semana ni en días pasados; un día al mes completo; franjas 09:00, 10:00, 11:30, 13:00, 16:00, 17:30, 19:00, 20:00 con algunas ocupadas.

**Auth mock**: cualquier email entra como cliente; un email que empiece por `admin@` entra como admin. Guardar sesión en `localStorage`.

## 4. Rutas y layouts

| Ruta | Pantalla (diseño) | Layout | Acceso |
|---|---|---|---|
| `/login` | `Login`, `Movil-Login` | AuthLayout | público |
| `/` | → redirect `/servicios` | | |
| `/servicios` | `Servicios`, `Movil-Servicios` | ClientLayout | cliente |
| `/servicios/:slug` | `Detalle`, `Movil-Detalle` | ClientLayout (móvil sin tab bar, con barra de reserva fija) | cliente |
| `/reservar/:slug?paso=1\|2\|3` | `Reserva`, `Movil-Reserva` | ClientLayout (móvil: layout de flujo sin tab bar) | cliente |
| `/reservas?tab=proximas\|pasadas\|canceladas` | `MisReservas`, `Movil-MisReservas` | ClientLayout | cliente |
| `/admin/servicios` (`?editar=:id` / `?nuevo=1`) | `Backoffice`, `Movil-Backoffice` | AdminLayout | admin |

- **ClientLayout**: en `md+` header blanco con logo (enlace a `/servicios`), nav (Servicios · Mis reservas; activa con `bg-accent font-semibold`) y menú de usuario (`DropdownMenu` con avatar de iniciales: Perfil, Tema, Cerrar sesión). En móvil: header con logo + avatar y **tab bar inferior** fija (Servicios · Mis reservas · Perfil; activa en `text-primary`) con `pb-[env(safe-area-inset-bottom)]`.
- **AdminLayout**: `Sidebar` de shadcn (logo + badge ADMIN, Servicios · Reservas · Profesionales · Clientes · Ajustes, Cerrar sesión abajo). En móvil, la sidebar se abre como `Sheet` desde el botón de menú. Solo **Servicios** entra en este alcance; el resto son enlaces a una página “Próximamente”.
- Guardas de ruta: sin sesión → `/login?next=…`; cliente en `/admin` → `/servicios`.

## 5. Pantallas

En cada pantalla: estado de carga con `Skeleton` que mantiene el layout, estado de error con reintento, y estado vacío cuando aplique.

### 5.1 Login

- Escritorio: dos columnas `flex-wrap`. Izquierda, panel de marca `bg-brand-ink` con logo blanco, eyebrow “Catálogo de coaching”, `text-display` “Encuentra tu rumbo.” y bloques decorativos (cuadrados `rounded-[28px]` en `#262A33`, `brand-blue`, `brand-blue-100`; `aria-hidden`). Derecha, `Card` de 420px.
- Móvil: el panel de marca se reduce a una cabecera oscura y el formulario va debajo.
- Campos: Email, Contraseña (con enlace “¿Olvidaste tu contraseña?”), Recordarme (`Checkbox`), botón **Entrar**, separador “o con tu email”, **Continuar con Google** (outline), “¿No tienes cuenta? Regístrate”, enlace discreto “Acceso administración”.
- Validación zod: email válido, contraseña obligatoria; errores bajo cada campo en `text-destructive text-sm`.

### 5.2 Catálogo (`/servicios`)

- Cabecera: eyebrow “Catálogo”, `h1` “Encuentra tu servicio”, entradilla.
- Filtros (escritorio, dentro de una `Card`): búsqueda con icono, `Select` Modalidad (Todas/Online/Presencial), `Select` Ordenar por (Relevancia, Precio ↑, Precio ↓, Duración). Debajo, chips de categoría (Todos, Coaching, Bienestar, Formación) y contador “N servicios”.
- Móvil: búsqueda + botón icono **Filtros** que abre un `Sheet` inferior (Modalidad, Ordenar, botones Limpiar / Ver resultados). Chips en fila con scroll horizontal.
- Todos los filtros viven en la **URL** (`?q=&cat=&modo=&orden=&pagina=`); búsqueda con debounce de 300 ms.
- Tarjeta de servicio: imagen 16:9 (si falta, bloque de color por categoría con icono lucide: Coaching `Navigation`, Bienestar `Leaf`, Formación `GraduationCap`; tintes `brand-blue-100` / `accent` / `border`), badge de categoría sobre la imagen, título `text-h3`, “Modalidad · con Profesional” con icono `Video`/`MapPin`, resumen de una línea, pie con `font-mono` “60 min · 65 €” y botón outline **Ver detalle**. En móvil toda la tarjeta es el enlace.
- Paginación (`Pagination`) de 9 por página en escritorio; en móvil “Cargar más”.
- Vacío: “No hay servicios con esos filtros” + botón **Quitar filtros**.

### 5.3 Detalle (`/servicios/:slug`)

- `Breadcrumb` Servicios / Categoría / Nombre.
- Columna principal: imagen 16:7 `rounded-2xl`, badges (categoría, modalidad), `h1`, línea de valoración (estrella + media + nº opiniones + profesional), Descripción, **Qué incluye** (lista con check en cuadrado `bg-accent text-primary`), tarjeta del profesional (avatar, eyebrow “Tu profesional”, nombre, titulación, bio) y Opiniones (2 tarjetas + “Ver todas”).
- Aside `lg+` (320px, `sticky top-6`): precio `font-mono` 28px + “/ sesión”, lista Duración · Modalidad · Próximo hueco con iconos, CTA **Reservar** (`size="lg"`, ancho completo), política de cancelación en `text-caption`.
- Móvil: imagen a sangre con botón volver circular, contenido en hoja que monta 16px sobre la imagen, tres mini-tarjetas (Duración, Modalidad, Próximo) y **barra inferior fija** con precio + **Reservar** (`size="xl"`).
- Slug inexistente o servicio no publicado → página 404 con enlace al catálogo.

### 5.4 Reserva (`/reservar/:slug`) — una ruta, 3 pasos

Paso en `?paso=` (1 Fecha y hora · 2 Datos y pago · 3 Confirmación). No se puede saltar a 2 sin día+hora ni a 3 sin reserva creada (redirige al paso válido). Estado del borrador en un hook `useBookingDraft` (contexto o `sessionStorage`).

- **Stepper** (escritorio): 3 pasos con círculo numerado; actual `bg-primary`, completado `bg-foreground` con ✓, pendiente borde `input`. `aria-current="step"`. Móvil: cabecera con volver, nombre del servicio, “Paso N de 3 · Nombre” y `Progress`.
- **Paso 1**
  - Escritorio: `Calendar` (react-day-picker) de mes completo, semana empieza en lunes, días como botones de 48px en `font-mono`. Estados: disponible (borde `input`), seleccionado (`bg-primary`), completo (`bg-muted` tachado, deshabilitado), pasado (texto `input`, deshabilitado). Leyenda debajo. Mes anterior deshabilitado si es el actual.
  - Móvil: **tira horizontal de días** (tarjetas 64×84: día de la semana, número, mes) con scroll y botón “Ver mes” que abre el `Calendar` en un `Drawer`.
  - Franjas: `ToggleGroup type="single"` en rejilla (`auto-fill minmax(96px,1fr)` escritorio, 3 columnas móvil), ocupadas deshabilitadas y tachadas. Al cambiar de día se limpia la hora. Nota “Horario en tu zona horaria: Europa/Madrid”.
  - CTA **Continuar** deshabilitado (estilo discontinuo, texto “Elige una hora para continuar”) hasta tener hora.
- **Paso 2**: Nombre y apellidos (prerrellenado), Email, Teléfono (opcional), Notas (opcional). **Método de pago** como `RadioGroup` en tarjetas: Tarjeta (“Pagas ahora y queda confirmada”) / Pagar en la sesión (“Queda pendiente de pago”). Con tarjeta: Número, Caducidad, CVC en `font-mono` y nota con candado “Pago seguro gestionado por [pasarela]”. CTA: “Pagar 65 € y confirmar” o “Confirmar reserva”. Secundario: “Cambiar fecha u hora”.
- **Paso 3**: icono check en cuadrado `bg-success`, “¡Reserva confirmada!”, texto del email, resumen (Servicio, Fecha, Hora, Pago), botones **Añadir al calendario** (genera `.ics`) y **Ver mis reservas** (→ `/reservas?confirmada=:id`).
- Aside “Resumen” (escritorio, pasos 1–2): miniatura, servicio, profesional, Fecha, Hora (`font-mono`, “11:30–12:30”), Duración, Modalidad, Total. En móvil el resumen va en la barra inferior fija (fecha · hora · precio + CTA).
- Resultado: tarjeta → `confirmada`; en la sesión → `pendiente_pago`.

### 5.5 Tus reservas (`/reservas`)

- `h1` “Tus reservas” + botón outline **Nueva reserva** (escritorio).
- `Tabs` con contador: Próximas · Pasadas · Canceladas (pestaña en la URL). Escritorio: lista segmentada dentro de una `Card`, activa `bg-foreground text-background`. Móvil: control segmentado a 3 columnas en el header.
- Si llega `?confirmada=`, `Alert` de éxito descartable: “Reserva confirmada · Servicio · fecha · hora. Te hemos enviado los detalles por email.”
- Fila: “tarjeta de fecha” (mes en `font-mono` sobre `bg-foreground`, día en `font-display` 28px), nombre, badge de estado, “Día · hh:mm–hh:mm · Modalidad · con Profesional”. Acciones:
  - Próximas: **Reprogramar** (outline → `/reservar/:slug?reprogramar=:id`, reutiliza el paso 1 y luego confirma) y **Cancelar** (`destructive-outline`).
  - Pasadas: **Valorar** (outline, abre un `Dialog` con estrellas + texto) y **Volver a reservar** (primary → detalle).
- Cancelar: `AlertDialog` en escritorio / `Drawer` en móvil: “¿Cancelar «Servicio»?”, política, botones **Mantener reserva** y **Cancelar reserva** (destructive). Al confirmar pasa a Canceladas y sale un toast.
- Vacíos por pestaña: “No tienes reservas próximas / Aún no tienes sesiones pasadas / No tienes reservas canceladas” + **Explorar servicios**.

### 5.6 Backoffice · Servicios (`/admin/servicios`)

- Cabecera: `h1` “Servicios”, entradilla, **Nuevo servicio** (primary con `Plus`).
- Escritorio, dos columnas:
  - `Table` dentro de `Card` con buscador y filtro de estado (Todos / Publicado / Borrador). Columnas: Nombre, Categoría, Duración, Precio (`font-mono`), Estado (badge `accent` “Publicado” / `draft` “Borrador”), Acciones (iconos Editar `Pencil` y Eliminar `Trash2` en rojo, con `aria-label`). La fila en edición se marca con `bg-muted` y una barra `primary` de 3px a la izquierda. Pie con “Mostrando 1–6 de N” y Anterior/Siguiente. Tabla con `overflow-x-auto`.
  - Panel “Nuevo servicio” / “Editar servicio”: Nombre, Categoría, Descripción, Duración (min), Precio (€, coma decimal), Modalidad, Profesional, Imagen (zona de arrastre), `Switch` “Publicado (visible para clientes)”, **Guardar** / **Descartar**.
- Móvil: lista en `Card` (nombre, categoría · duración · precio, badge, botón editar). **Nuevo servicio** en barra inferior fija. El formulario se abre a pantalla completa (cabecera con ✕, mismos campos, **Eliminar servicio** al editar, barra inferior Descartar / Guardar).
- Eliminar: `AlertDialog` / `Drawer`: “¿Eliminar «Servicio»? Se quitará del catálogo. Las reservas ya hechas no se cancelan automáticamente.”
- Validación zod: nombre y categoría obligatorios, duración entera de 15 a 240, precio ≥ 0 con 2 decimales. Los borradores no aparecen en `/servicios`.

## 6. Contenido y tono

- Español de España, tuteo. Mayúscula solo inicial en títulos y botones.
- Verbos concretos: Reservar, Continuar, Reprogramar, Cancelar reserva, Volver a reservar. Nunca “Enviar” ni “Aceptar”.
- Formatos: `65 €` (símbolo detrás, espacio fino o normal), `60 min`, “martes 27 oct”, horas `11:30–12:30`. Todo con `Intl` / date-fns `es`.
- Sin emojis. Los textos entre corchetes del diseño (`[Profesional]`, `XX €`, `[Política de cancelación]`…) son **contenido pendiente**: rellénalos con los datos mock y deja el copy legal en una constante `src/content/legal.ts` marcada como TODO.

## 7. Accesibilidad (criterios de aceptación)

- Todo control táctil ≥ 44×44 px; CTA móvil 52 px.
- Foco visible: anillo sólido `ring` 2px + offset 2px en todo lo enfocable.
- Contraste: texto ≥ 4.5:1 (los pares del tema ya cumplen; no inventar grises nuevos). Bordes de control y foco ≥ 3:1 (`input`, `ring`).
- Botones solo-icono con `aria-label`. Chips con `aria-pressed`, tabs con roles de `Tabs`, días/horas con `aria-pressed` y `aria-label` completo (“martes 27 de octubre, completo”).
- Estados nunca solo por color: badge con texto, días/horas ocupados además tachados.
- Diálogos y sheets atrapan el foco y lo devuelven al cerrar (lo da Radix).
- Respetar `prefers-reduced-motion`.

## 8. Estructura de carpetas sugerida

```
src/
  app/router.tsx            rutas y guardas
  layouts/                  AuthLayout, ClientLayout, AdminLayout, FlowLayout
  pages/                    login, servicios, servicio-detalle, reservar, reservas, admin/servicios
  features/
    catalog/                ServiceCard, CategoryChips, CatalogFilters, FiltersSheet
    booking/                Stepper, DayPicker, DateStrip, SlotPicker, PaymentMethod, BookingSummary, useBookingDraft
    bookings/               BookingRow, DateTile, CancelBookingDialog, RateDialog
    admin/                  ServicesTable, ServiceForm, DeleteServiceDialog
  components/ui/            shadcn
  components/brand/         Logo, BrandBlocks, PlaceholderMedia
  lib/api/                  mock API + seed
  lib/format.ts             precio, duración, fechas
  content/legal.ts
```

## 9. Orden de trabajo y definición de hecho

1. Proyecto Vite + TS, Tailwind v4, `shadcn init`, sustituir `src/index.css` por `theme/index.css`, fuentes, assets. Página `/_kit` (solo en dev) con botones, badges, inputs, chips y tarjetas para revisar el tema en claro y oscuro.
2. Capa mock + tipos + seed.
3. Layouts y router con guardas.
4. Pantallas en el orden del flujo: Login → Catálogo → Detalle → Reserva → Tus reservas → Backoffice.
5. Responsive y accesibilidad (§7) en cada pantalla antes de pasar a la siguiente.

**Hecho** = la pantalla se parece al diseño a 1280 y 390 px, funciona con datos mock y estados de carga, vacío y error, pasa `tsc --noEmit` y `eslint` sin errores, y el flujo completo login → reserva → cancelar funciona tras recargar la página.

## 10. Fuera de alcance (por ahora)

Backend real, pasarela de pago, registro y recuperación de contraseña (solo pantallas enlazadas a “Próximamente”), secciones Reservas / Profesionales / Clientes / Ajustes del backoffice, notificaciones por email, i18n.

## 11. Pendientes de negocio

- Logo en SVG (el actual es PNG recortado de la hoja de marca).
- Precios, profesionales, descripciones, opiniones y fotos reales.
- Política de cancelación y plazo para reprogramar.
- Pasarela de pago y si “Pagar en la sesión” se mantiene.
