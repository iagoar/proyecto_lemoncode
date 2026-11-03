import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { BookingHistory } from '#/features/profile/BookingHistory'
import { ProfessionalCardForm } from '#/features/profile/ProfessionalCardForm'
import { ProfileForm } from '#/features/profile/ProfileForm'
import {
  PreferencesSection,
  ProfileHeader,
  ProfileSection,
  StatTile,
} from '#/features/profile/ProfileParts'
import { bookingsQueries } from '#/lib/api/bookings'
import { professionalsQueries } from '#/lib/api/professionals'
import type { BookingWithService } from '#/lib/api/types'
import { formatPrice } from '#/lib/format'

export const Route = createFileRoute('/_cliente/perfil')({
  head: () => ({ meta: [{ title: 'Tu perfil · rumbo.' }] }),
  component: ClientProfilePage,
})

function statsOf(items: BookingWithService[]) {
  const upcoming = items.filter(
    (b) => b.status === 'confirmada' || b.status === 'pendiente_pago',
  )
  const completed = items.filter((b) => b.status === 'completada')
  const minutes = completed.reduce((sum, b) => sum + b.service.durationMin, 0)
  // Pagado: sesiones completadas y reservas activas ya pagadas con tarjeta.
  const paid = items
    .filter(
      (b) =>
        b.status === 'completada' ||
        (b.status === 'confirmada' && b.paymentMethod === 'tarjeta'),
    )
    .reduce((sum, b) => sum + (b.service.priceCents ?? 0), 0)
  return {
    upcoming: upcoming.length,
    completed: completed.length,
    hours: Math.round((minutes / 60) * 10) / 10,
    paid,
  }
}

function ClientProfilePage() {
  const { user } = Route.useRouteContext()
  const query = useQuery(bookingsQueries.mine())
  const items = query.data ?? []
  const stats = statsOf(items)
  const loading = query.isPending

  return (
    <main className="mx-auto flex w-full max-w-page flex-col gap-6 px-4 py-6 md:gap-8 md:px-6 md:py-10">
      <ProfileHeader user={user} />

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Próximas" value={stats.upcoming} loading={loading} />
        <StatTile
          label="Sesiones completadas"
          value={stats.completed}
          loading={loading}
        />
        <StatTile
          label="Horas de sesión"
          value={`${String(stats.hours).replace('.', ',')} h`}
          loading={loading}
        />
        <StatTile
          label="Pagado"
          value={formatPrice(stats.paid)}
          loading={loading}
        />
      </dl>

      <div className="flex flex-wrap items-start gap-6">
        <ProfileSection
          title="Historial de reservas"
          description="Todas tus sesiones, de la más reciente a la más antigua."
          className="flex-[999_1_520px]"
          action={
            <Button asChild variant="outline" size="sm" className="h-10">
              <Link to="/reservas">Gestionar reservas</Link>
            </Button>
          }
        >
          {query.isError ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm">No hemos podido cargar tus reservas.</p>
              <Button variant="outline" onClick={() => query.refetch()}>
                Reintentar
              </Button>
            </div>
          ) : (
            <BookingHistory items={items} loading={loading} />
          )}
        </ProfileSection>

        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-6">
          <ProfileSection title="Datos personales">
            <ProfileForm key={user.id} user={user} />
          </ProfileSection>
          {user.role === 'profesional' && <ProfessionalSection />}
          <PreferencesSection />
        </div>
      </div>
    </main>
  )
}

/** Solo profesionales: su ficha pública y acceso a sus servicios. */
function ProfessionalSection() {
  const query = useQuery(professionalsQueries.mine())

  return (
    <ProfileSection
      title="Tu ficha de profesional"
      description="Es lo que ven los clientes en «Tu profesional» de cada servicio."
      action={
        <Button asChild variant="outline" size="sm" className="h-10">
          <Link to="/mis-servicios">Mis servicios</Link>
        </Button>
      }
    >
      {query.isPending ? (
        <div className="flex flex-col gap-3" aria-hidden>
          <Skeleton className="h-16" />
          <Skeleton className="h-28" />
        </div>
      ) : query.data ? (
        <ProfessionalCardForm key={query.data.id} professional={query.data} />
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm">No hemos podido cargar tu ficha.</p>
          <Button variant="outline" onClick={() => query.refetch()}>
            Reintentar
          </Button>
        </div>
      )}
    </ProfileSection>
  )
}
