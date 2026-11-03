import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { ProfileForm } from '#/features/profile/ProfileForm'
import {
  PreferencesSection,
  ProfileHeader,
  ProfileSection,
  StatTile,
} from '#/features/profile/ProfileParts'
import { servicesQueries } from '#/lib/api/services'
import { categoryLabel, formatPrice } from '#/lib/format'

export const Route = createFileRoute('/_admin/admin/perfil')({
  head: () => ({ meta: [{ title: 'Tu perfil · Backoffice · rumbo.' }] }),
  component: AdminProfilePage,
})

const RECENT_COUNT = 5

function AdminProfilePage() {
  const { user } = Route.useRouteContext()
  const query = useQuery(servicesQueries.admin())
  const all = query.data ?? []
  const published = all.filter((s) => s.published).length
  const loading = query.isPending
  // Los ids nuevos llevan marca de tiempo: los últimos del array son los más recientes.
  const recent = [...all].reverse().slice(0, RECENT_COUNT)

  return (
    <main className="flex flex-col gap-6 px-4 pt-4 pb-10 md:gap-8 md:p-8">
      <ProfileHeader user={user} />

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatTile label="Servicios" value={all.length} loading={loading} />
        <StatTile label="Publicados" value={published} loading={loading} />
        <StatTile
          label="Borradores"
          value={all.length - published}
          loading={loading}
        />
      </dl>

      <div className="flex flex-wrap items-start gap-6">
        <ProfileSection
          title="Tus servicios"
          description="Los últimos servicios del catálogo."
          className="flex-[999_1_520px]"
          action={
            <Button asChild variant="outline" size="sm" className="h-10">
              <Link to="/admin/servicios" search={{ nuevo: 1 }}>
                <Plus aria-hidden />
                Nuevo servicio
              </Link>
            </Button>
          }
        >
          {loading ? (
            <div className="flex flex-col gap-2" aria-hidden>
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : query.isError ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm">No hemos podido cargar los servicios.</p>
              <Button variant="outline" onClick={() => query.refetch()}>
                Reintentar
              </Button>
            </div>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay servicios. Crea el primero para que aparezca en el
              catálogo.
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {recent.map((service) => (
                <li
                  key={service.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <Link
                      to="/admin/servicios"
                      search={{ editar: service.id }}
                      className="truncate rounded-sm font-semibold underline-offset-4 hover:underline"
                    >
                      {service.name}
                    </Link>
                    <span className="text-caption text-muted-foreground">
                      {categoryLabel[service.category]} ·{' '}
                      {service.professional.name}
                    </span>
                  </div>
                  <Badge variant={service.published ? 'success' : 'draft'}>
                    {service.published ? 'Publicado' : 'Borrador'}
                  </Badge>
                  <span className="hidden shrink-0 font-mono text-sm sm:inline">
                    {formatPrice(service.priceCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {!loading && all.length > RECENT_COUNT && (
            <Link
              to="/admin/servicios"
              className="self-start rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Ver los {all.length} servicios
            </Link>
          )}
        </ProfileSection>

        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-6">
          <ProfileSection title="Datos de la cuenta">
            <ProfileForm key={user.id} user={user} />
          </ProfileSection>
          <PreferencesSection />
        </div>
      </div>
    </main>
  )
}
