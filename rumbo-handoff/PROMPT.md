Copia la carpeta `rumbo-handoff/` en la raíz de un repo vacío con el nombre `handoff/` y pega esto en Claude Code:

---

Vamos a construir el front-end de **rumbo.**, un catálogo de servicios de coaching con reservas y backoffice. Toda la especificación está en `handoff/HANDOFF.md`; léela entera antes de empezar, junto con `handoff/CLAUDE.md`.

Stack: Vite + React 18 + TypeScript, React Router v6, Tailwind CSS v4 (`@tailwindcss/vite`), shadcn/ui, TanStack Query, react-hook-form + zod, lucide-react, sonner y date-fns. Datos mock con persistencia en `localStorage`.

Plan:

1. Monta el proyecto, inicializa shadcn y sustituye `src/index.css` por `handoff/theme/index.css`. Carga las fuentes en `index.html`, copia `handoff/assets/` a `public/brand/` y mueve `handoff/CLAUDE.md` a la raíz. Aplica las personalizaciones de Button, Badge e Input de HANDOFF §2.1 y crea una página `/_kit` para revisar el tema en claro y oscuro. **Para aquí y enséñame el kit.**
2. Tipos, capa mock y seed (HANDOFF §3).
3. Router, guardas y layouts (§4).
4. Pantallas en orden: Login → Catálogo → Detalle → Reserva → Tus reservas → Backoffice (§5). Para cada una, abre su referencia en `handoff/design/screens/` (versión escritorio y `Movil-*`), constrúyela y comprueba los criterios de §7 antes de seguir. Haz un commit por pantalla.

Si algo del diseño choca con la especificación, manda HANDOFF.md; si falta información, pregúntame en lugar de inventar.
