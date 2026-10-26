import { Link, Outlet } from '@tanstack/react-router'
import { CalendarCheck, ChevronDown, LayoutGrid, UserRound } from 'lucide-react'

import { Logo } from '#/components/brand/Logo'
import type { User } from '#/lib/api/types'
import { UserAvatar, UserMenu } from './UserMenu'

// HANDOFF §4: header con nav en md+, header compacto + tab bar inferior en móvil.

const desktopLink =
  'flex min-h-10 items-center rounded-md px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

const tabLink =
  'flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-md text-xs font-medium text-muted-foreground'

export function ClientLayout({ user }: { user: User }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Escritorio */}
      <header className="hidden border-b bg-background md:block">
        <div className="mx-auto flex max-w-page items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-center gap-8">
            <Link
              to="/servicios"
              aria-label="rumbo. — inicio"
              className="flex min-h-11 items-center rounded-md"
            >
              <Logo />
            </Link>
            <nav aria-label="Principal" className="flex gap-1">
              <Link
                to="/servicios"
                className={desktopLink}
                activeProps={{
                  className: 'bg-accent font-semibold text-foreground',
                  'aria-current': 'page',
                }}
              >
                Servicios
              </Link>
              <Link
                to="/reservas"
                className={desktopLink}
                activeProps={{
                  className: 'bg-accent font-semibold text-foreground',
                  'aria-current': 'page',
                }}
              >
                Mis reservas
              </Link>
            </nav>
          </div>
          <UserMenu user={user}>
            <button
              type="button"
              className="flex min-h-11 items-center gap-2.5 rounded-md pr-1.5 pl-1 text-sm transition-colors hover:bg-accent"
            >
              <UserAvatar user={user} />
              {user.name}
              <ChevronDown aria-hidden className="size-4" />
            </button>
          </UserMenu>
        </div>
      </header>

      {/* Móvil */}
      <header className="flex items-center justify-between border-b bg-background px-4 pt-[max(env(safe-area-inset-top),0.625rem)] pb-2.5 md:hidden">
        <Link
          to="/servicios"
          aria-label="rumbo. — inicio"
          className="flex min-h-11 items-center rounded-md"
        >
          <Logo className="h-[26px] w-[93px]" />
        </Link>
        <UserMenu user={user}>
          <button
            type="button"
            aria-label="Tu cuenta"
            className="grid size-11 place-items-center rounded-md"
          >
            <UserAvatar user={user} className="size-[34px] text-xs" />
          </button>
        </UserMenu>
      </header>

      <div className="flex-1 pb-24 md:pb-0">
        <Outlet />
      </div>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t bg-background px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)] md:hidden"
      >
        <Link
          to="/servicios"
          className={tabLink}
          activeProps={{
            className: 'font-semibold text-primary',
            'aria-current': 'page',
          }}
        >
          <LayoutGrid aria-hidden className="size-[22px]" />
          Servicios
        </Link>
        <Link
          to="/reservas"
          className={tabLink}
          activeProps={{
            className: 'font-semibold text-primary',
            'aria-current': 'page',
          }}
        >
          <CalendarCheck aria-hidden className="size-[22px]" />
          Mis reservas
        </Link>
        <UserMenu user={user} side="top">
          <button type="button" className={tabLink}>
            <UserRound aria-hidden className="size-[22px]" />
            Perfil
          </button>
        </UserMenu>
      </nav>
    </div>
  )
}
