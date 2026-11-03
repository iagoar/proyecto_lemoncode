import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { LogOut, Monitor, Moon, Sun } from 'lucide-react'

import { useTheme, type Theme } from '#/components/theme-provider'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import { UserAvatar } from '#/layouts/UserMenu'
import { auth } from '#/lib/api/auth'
import type { Role, User } from '#/lib/api/types'
import { formatMonth } from '#/lib/format'
import { cn } from '#/lib/utils'

// Piezas comunes del perfil de cliente, profesional y admin.

const roleLabel: Record<Role, string> = {
  cliente: 'Cliente',
  profesional: 'Profesional',
  admin: 'Admin',
}

export function ProfileHeader({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-4">
      <UserAvatar
        user={user}
        className="size-16 text-xl md:size-20 md:text-2xl"
      />
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-h2 font-bold">{user.name}</h1>
          <Badge variant={user.role === 'cliente' ? 'accent' : 'default'}>
            {roleLabel[user.role]}
          </Badge>
        </div>
        <p className="truncate text-sm text-muted-foreground md:text-body">
          {user.email}
          {user.createdAt && (
            <span className="hidden sm:inline">
              {' '}
              · Desde {formatMonth(user.createdAt.slice(0, 7)).toLowerCase()}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

export function ProfileSection({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4 md:p-6',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-h3 font-semibold">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function StatTile({
  label,
  value,
  loading,
}: {
  label: string
  value: React.ReactNode
  loading?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="font-mono text-2xl leading-8 font-semibold">
        {loading ? <Skeleton className="h-8 w-16" /> : value}
      </dd>
    </div>
  )
}

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'Sistema', icon: Monitor },
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
]

export function PreferencesSection() {
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  async function handleLogout() {
    await auth.logout()
    queryClient.clear()
    navigate({ to: '/login' })
  }

  return (
    <ProfileSection title="Preferencias">
      <div className="flex flex-col gap-1.5">
        <span id="tema-label" className="text-sm font-medium">
          Tema
        </span>
        <ToggleGroup
          type="single"
          variant="outline"
          aria-labelledby="tema-label"
          value={theme}
          onValueChange={(value) => value && setTheme(value as Theme)}
          className="w-full"
        >
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <ToggleGroupItem key={value} value={value} className="flex-1">
              <Icon aria-hidden />
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <Button
        variant="destructive-outline"
        className="self-start font-medium"
        onClick={handleLogout}
      >
        <LogOut aria-hidden />
        Cerrar sesión
      </Button>
    </ProfileSection>
  )
}
