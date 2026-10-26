import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { LogOut, Monitor, Moon, Sun, UserRound } from 'lucide-react'

import { useTheme, type Theme } from '#/components/theme-provider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { auth, initials } from '#/lib/api/auth'
import type { User } from '#/lib/api/types'
import { cn } from '#/lib/utils'

export function UserAvatar({
  user,
  className,
}: {
  user: User
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-[13px] font-semibold text-background',
        className,
      )}
    >
      {initials(user.name)}
    </span>
  )
}

export function UserMenu({
  user,
  children,
  side = 'bottom',
}: {
  user: User
  /** Disparador del menú (un botón). */
  children: React.ReactNode
  side?: 'top' | 'bottom'
}) {
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  async function handleLogout() {
    await auth.logout()
    queryClient.clear()
    navigate({ to: '/login' })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={side} className="w-60">
        <DropdownMenuLabel className="flex flex-col font-normal">
          <span className="font-semibold">{user.name}</span>
          <span className="truncate text-caption text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate({ to: '/proximamente' })}>
          <UserRound /> Perfil
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            <ThemeIcon theme={theme} /> Tema
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={theme}
              onValueChange={(value) => setTheme(value as Theme)}
            >
              <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Oscuro</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout}>
          <LogOut /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ThemeIcon({ theme }: { theme: Theme }) {
  const className = 'size-4 text-muted-foreground'
  if (theme === 'light') return <Sun className={className} />
  if (theme === 'dark') return <Moon className={className} />
  return <Monitor className={className} />
}
