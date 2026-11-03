import { useQueryClient } from '@tanstack/react-query'
import {
  Link,
  Outlet,
  useNavigate,
  useRouteContext,
} from '@tanstack/react-router'
import {
  CalendarCheck,
  Contact,
  LayoutGrid,
  LogOut,
  Menu,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'

import { Logo } from '#/components/brand/Logo'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import { auth } from '#/lib/api/auth'
import { UserAvatar } from './UserMenu'

// HANDOFF §4 (AdminLayout): sidebar fija en md+, hoja lateral en móvil.
// Solo Servicios y el perfil entran en el alcance; el resto lleva a "Próximamente".

const sections: { seccion: string; label: string; icon: LucideIcon }[] = [
  { seccion: 'servicios', label: 'Servicios', icon: LayoutGrid },
  { seccion: 'reservas', label: 'Reservas', icon: CalendarCheck },
  { seccion: 'profesionales', label: 'Profesionales', icon: Users },
  { seccion: 'clientes', label: 'Clientes', icon: Contact },
  { seccion: 'ajustes', label: 'Ajustes', icon: Settings },
]

const navLink =
  'flex min-h-11 items-center gap-2.5 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:min-h-10'

export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 border-r bg-background px-3 py-5 md:flex">
        <AdminBrand />
        <AdminNav />
      </aside>

      <header className="sticky top-0 z-30 flex items-center gap-2 border-b bg-background px-2 pt-[max(env(safe-area-inset-top),0.5rem)] pb-2 md:hidden">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Abrir menú"
              className="grid size-11 place-items-center rounded-md text-foreground"
            >
              <Menu aria-hidden className="size-6" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[280px] gap-6 px-3 pt-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]"
          >
            <SheetTitle className="sr-only">Menú del backoffice</SheetTitle>
            <SheetDescription className="sr-only">
              Secciones del backoffice y cierre de sesión.
            </SheetDescription>
            <AdminBrand />
            <AdminNav onNavigate={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>
        <AdminBrand compact />
      </header>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}

function AdminBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/admin/servicios"
      aria-label="rumbo. — backoffice"
      className="flex min-h-11 items-center gap-2.5 rounded-md px-2"
    >
      <Logo className={compact ? 'h-6 w-[86px]' : 'h-[26px] w-[93px]'} />
      <span className="rounded-sm bg-foreground px-2 font-mono text-[11px] leading-5 font-semibold tracking-[0.08em] text-background">
        ADMIN
      </span>
    </Link>
  )
}

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useRouteContext({ from: '/_admin' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  async function handleLogout() {
    await auth.logout()
    queryClient.clear()
    navigate({ to: '/login' })
  }

  return (
    <>
      <nav aria-label="Backoffice" className="flex flex-col gap-0.5">
        {sections.map(({ seccion, label, icon: Icon }) => (
          <Link
            key={seccion}
            // "servicios" tiene ruta propia; el resto cae en /admin/$seccion.
            to="/admin/$seccion"
            params={{ seccion }}
            onClick={onNavigate}
            className={navLink}
            activeProps={{
              className: 'bg-accent font-semibold text-foreground',
              'aria-current': 'page',
            }}
          >
            <Icon aria-hidden className="size-[18px]" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-0.5 border-t pt-3">
        <Link
          to="/admin/perfil"
          onClick={onNavigate}
          className="flex min-h-13 items-center gap-2.5 rounded-md px-2 text-sm transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          activeProps={{ className: 'bg-accent', 'aria-current': 'page' }}
        >
          <UserAvatar user={user} className="size-8 text-xs" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-semibold">{user.name}</span>
            <span className="truncate text-caption text-muted-foreground">
              Tu perfil
            </span>
          </span>
        </Link>
        <button type="button" onClick={handleLogout} className={navLink}>
          <LogOut aria-hidden className="size-[18px]" />
          Cerrar sesión
        </button>
      </div>
    </>
  )
}
