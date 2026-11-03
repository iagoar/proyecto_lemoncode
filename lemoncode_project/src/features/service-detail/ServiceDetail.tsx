import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  Clock,
  MapPin,
  Star,
  Video,
} from 'lucide-react'
import { useState } from 'react'

import { PlaceholderMedia } from '#/components/brand/PlaceholderMedia'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { cancellationPolicy } from '#/content/legal'
import { initials } from '#/lib/api/auth'
import { availabilityQueries } from '#/lib/api/availability'
import { reviewsQueries } from '#/lib/api/reviews'
import type {
  Professional,
  Review,
  ReviewSummary,
  ServiceWithProfessional,
} from '#/lib/api/types'
import {
  categoryLabel,
  formatDayLong,
  formatDayShort,
  formatDayWithYear,
  formatDuration,
  formatPrice,
  formatRating,
  modeLabel,
} from '#/lib/format'
import { cn } from '#/lib/utils'

// HANDOFF §5.3. Escritorio: columna principal + aside de reserva en lg+.
// Móvil: imagen a sangre, hoja de contenido y barra de reserva fija.

const sectionTitle = 'font-display text-lg leading-6 font-semibold md:text-h3'

export function ServiceDetail({
  service,
}: {
  service: ServiceWithProfessional
}) {
  const reviewsQuery = useQuery(reviewsQueries.byService(service.id))
  const nextQuery = useQuery(availabilityQueries.next(service.id))
  const ModeIcon = service.mode === 'online' ? Video : MapPin

  const nextSlot = nextQuery.isPending ? (
    <Skeleton className="inline-block h-5 w-20 align-middle" />
  ) : nextQuery.data ? (
    <>
      <span className="md:hidden">{formatDayShort(nextQuery.data.date)}</span>
      <span className="hidden md:inline">
        {formatDayLong(nextQuery.data.date)} ·{' '}
        <span className="font-mono">{nextQuery.data.time}</span>
      </span>
    </>
  ) : (
    'Sin huecos'
  )

  return (
    <main className="mx-auto flex max-w-page flex-col pb-32 md:gap-6 md:px-6 md:pt-6 md:pb-14">
      <nav
        aria-label="Migas de pan"
        className="hidden text-sm text-muted-foreground md:block"
      >
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link
              to="/servicios"
              className="rounded-sm hover:text-foreground hover:underline"
            >
              Servicios
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link
              to="/servicios"
              search={{ cat: service.category }}
              className="rounded-sm hover:text-foreground hover:underline"
            >
              {categoryLabel[service.category]}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="font-medium text-foreground">
            {service.name}
          </li>
        </ol>
      </nav>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="flex min-w-0 flex-col md:gap-8">
          <PlaceholderMedia
            category={service.category}
            imageUrl={service.imageUrl}
            className="h-[260px] md:aspect-[16/7] md:h-auto md:rounded-2xl"
            iconClassName="size-14 md:size-[72px]"
          >
            <Link
              to="/servicios"
              aria-label="Volver al catálogo"
              className="absolute top-[max(env(safe-area-inset-top),3rem)] left-4 grid size-11 place-items-center rounded-full bg-background text-foreground md:hidden"
            >
              <ChevronLeft aria-hidden className="size-5" />
            </Link>
          </PlaceholderMedia>

          <div className="relative -mt-4 flex flex-col gap-6 rounded-t-2xl bg-canvas px-4 pt-5 md:mt-0 md:gap-8 md:rounded-none md:p-0">
            <div className="flex flex-col gap-2.5 md:gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="accent" className="px-3 text-caption">
                  {categoryLabel[service.category]}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-background px-3 text-caption"
                >
                  <ModeIcon aria-hidden className="hidden md:block" />
                  {modeLabel[service.mode]}
                </Badge>
              </div>
              <h1 className="text-h2 font-bold md:text-h1">{service.name}</h1>
              <RatingLine
                summary={reviewsQuery.data}
                pending={reviewsQuery.isPending}
                professional={service.professional}
              />
            </div>

            <dl className="grid grid-cols-3 gap-2 md:hidden">
              <MiniStat label="Duración">
                {formatDuration(service.durationMin)}
              </MiniStat>
              <MiniStat label="Modalidad">{modeLabel[service.mode]}</MiniStat>
              <MiniStat label="Próximo">{nextSlot}</MiniStat>
            </dl>

            <section
              aria-labelledby="descripcion"
              className="flex flex-col gap-2 md:gap-2.5"
            >
              <h2 id="descripcion" className={sectionTitle}>
                Descripción
              </h2>
              <p className="max-w-[680px]">{service.description}</p>
            </section>

            {service.includes.length > 0 && (
              <section
                aria-labelledby="incluye"
                className="flex flex-col gap-2.5 md:gap-3"
              >
                <h2 id="incluye" className={sectionTitle}>
                  Qué incluye
                </h2>
                <ul className="grid gap-2.5 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] md:gap-3">
                  {service.includes.map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <span
                        aria-hidden
                        className="grid size-6 shrink-0 place-items-center rounded-lg bg-accent text-primary"
                      >
                        <Check className="size-3.5" strokeWidth={2.5} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <ProfessionalCard professional={service.professional} />

            <ReviewsSection
              summary={reviewsQuery.data}
              pending={reviewsQuery.isPending}
              error={reviewsQuery.isError}
              onRetry={() => reviewsQuery.refetch()}
            />
          </div>
        </div>

        <aside
          aria-label="Reservar"
          className="mx-4 hidden flex-col gap-5 rounded-xl border bg-card p-6 md:mx-0 md:flex lg:sticky lg:top-6"
        >
          <p className="flex items-baseline gap-2">
            <span className="font-mono text-[28px] leading-8 font-semibold">
              {formatPrice(service.priceCents)}
            </span>
            {service.priceCents !== null && (
              <span className="text-sm text-muted-foreground">/ sesión</span>
            )}
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
            <AsideRow icon={Clock} label="Duración">
              <span className="font-mono">
                {formatDuration(service.durationMin)}
              </span>
            </AsideRow>
            <AsideRow icon={ModeIcon} label="Modalidad">
              {service.mode === 'online' ? 'Videollamada' : 'Presencial'}
            </AsideRow>
            <AsideRow icon={CalendarDays} label="Próximo hueco">
              {nextSlot}
            </AsideRow>
          </dl>
          <BookButton slug={service.slug} size="lg" className="w-full" />
          <p className="text-center text-caption text-muted-foreground">
            {cancellationPolicy}
          </p>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t bg-background px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] md:hidden">
        <p className="flex flex-col">
          <span className="font-mono text-xl leading-[26px] font-semibold">
            {formatPrice(service.priceCents)}
          </span>
          <span className="text-xs text-muted-foreground">
            por sesión · {formatDuration(service.durationMin)}
          </span>
        </p>
        <BookButton
          slug={service.slug}
          size="xl"
          className="max-w-[200px] flex-1"
        />
      </div>
    </main>
  )
}

function BookButton({
  slug,
  size,
  className,
}: {
  slug: string
  size: 'lg' | 'xl'
  className?: string
}) {
  return (
    <Button asChild size={size} className={className}>
      <Link to="/reservar/$slug" params={{ slug }}>
        Reservar
      </Link>
    </Button>
  )
}

function RatingLine({
  summary,
  pending,
  professional,
}: {
  summary?: ReviewSummary
  pending: boolean
  professional: Professional
}) {
  if (pending) return <Skeleton className="h-5 w-64 md:h-6" />

  return (
    <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground md:text-body">
      {summary?.average != null ? (
        <>
          <Star
            aria-hidden
            className="size-4 fill-foreground text-foreground"
          />
          <span className="font-semibold text-foreground">
            <span className="sr-only">Valoración media: </span>
            {formatRating(summary.average)}
          </span>
          · {summary.total} {summary.total === 1 ? 'opinión' : 'opiniones'}
        </>
      ) : (
        'Sin opiniones todavía'
      )}{' '}
      · con {professional.name}
    </p>
  )
}

function MiniStat({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold">{children}</dd>
    </div>
  )
}

function AsideRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  label: string
  children: React.ReactNode
}) {
  return (
    <>
      <dt className="flex items-center gap-2 text-muted-foreground">
        <Icon aria-hidden className="size-4" />
        {label}
      </dt>
      <dd className="text-right font-medium">{children}</dd>
    </>
  )
}

function ProfessionalCard({ professional }: { professional: Professional }) {
  return (
    <section
      aria-labelledby="profesional"
      className="flex items-center gap-3.5 rounded-xl border bg-card p-4 md:flex-wrap md:items-start md:gap-5 md:p-6"
    >
      <span
        aria-hidden
        className="grid size-14 shrink-0 place-items-center rounded-full bg-foreground font-display font-semibold text-background md:size-[72px] md:text-[22px]"
      >
        {initials(professional.name)}
      </span>
      <div className="flex flex-col md:flex-[1_1_260px] md:gap-1.5">
        <p className="hidden font-display text-eyebrow text-muted-foreground uppercase md:block">
          Tu profesional
        </p>
        <h2
          id="profesional"
          className="font-display text-[17px] leading-6 font-semibold md:text-h3"
        >
          {professional.name}
        </h2>
        <p className="text-caption text-muted-foreground md:text-sm">
          {professional.title}
        </p>
        <p className="hidden pt-1 md:block">{professional.bio}</p>
      </div>
    </section>
  )
}

function ReviewsSection({
  summary,
  pending,
  error,
  onRetry,
}: {
  summary?: ReviewSummary
  pending: boolean
  error: boolean
  onRetry: () => void
}) {
  const [showAll, setShowAll] = useState(false)
  const items = summary?.items ?? []
  // Móvil muestra una opinión y escritorio dos; "Ver todas" despliega el resto.
  const visible = showAll ? items : items.slice(0, 2)

  return (
    <section
      aria-labelledby="opiniones"
      className="flex flex-col gap-2.5 md:gap-3"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="opiniones" className={sectionTitle}>
          Opiniones
        </h2>
        {!showAll && items.length > 2 && (
          <ShowAllButton
            className="hidden md:inline-flex"
            onClick={() => setShowAll(true)}
          />
        )}
      </div>

      {pending ? (
        <div className="grid gap-4 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="hidden h-28 rounded-xl md:block" />
        </div>
      ) : error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 md:p-5">
          <p className="text-muted-foreground">
            No hemos podido cargar las opiniones.
          </p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border bg-card p-4 text-muted-foreground md:p-5">
          Este servicio aún no tiene opiniones.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
          {visible.map((review, i) => (
            <ReviewCard
              key={review.id}
              review={review}
              className={cn(i > 0 && !showAll && 'hidden md:flex')}
            />
          ))}
        </ul>
      )}

      {!showAll && items.length > 1 && (
        <ShowAllButton
          className="self-start md:hidden"
          onClick={() => setShowAll(true)}
          long
        />
      )}
    </section>
  )
}

function ShowAllButton({
  onClick,
  className,
  long,
}: {
  onClick: () => void
  className?: string
  long?: boolean
}) {
  return (
    <Button
      variant="link"
      size="sm"
      className={cn('h-11 px-0 font-medium md:h-auto', className)}
      onClick={onClick}
    >
      {long ? 'Ver todas las opiniones' : 'Ver todas'}
    </Button>
  )
}

function ReviewCard({
  review,
  className,
}: {
  review: Review
  className?: string
}) {
  return (
    <li
      className={cn(
        'flex flex-col gap-1 rounded-xl border bg-card p-4 md:gap-2 md:p-5',
        className,
      )}
    >
      <div className="flex justify-between gap-2">
        <span className="font-semibold">{review.author}</span>
        <time
          dateTime={review.date}
          className="font-mono text-caption text-muted-foreground"
        >
          {formatDayWithYear(review.date)}
        </time>
      </div>
      <span className="text-sm text-muted-foreground">
        {review.rating} de 5
      </span>
      {review.text && <p>{review.text}</p>}
    </li>
  )
}

export function ServiceDetailSkeleton() {
  return (
    <div
      aria-hidden
      className="mx-auto flex max-w-page flex-col md:gap-6 md:px-6 md:pt-6"
    >
      <Skeleton className="hidden h-5 w-64 md:block" />
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col md:gap-8">
          <Skeleton className="h-[260px] rounded-none md:aspect-[16/7] md:h-auto md:rounded-2xl" />
          <div className="flex flex-col gap-3 px-4 pt-5 md:p-0">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-3/4 md:h-10" />
            <Skeleton className="h-5 w-64" />
            <Skeleton className="mt-6 h-24 w-full" />
          </div>
        </div>
        <Skeleton className="hidden h-80 rounded-xl md:block" />
      </div>
    </div>
  )
}
