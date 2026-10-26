import { Link } from '@tanstack/react-router'
import { ChevronRight, MapPin, Video } from 'lucide-react'

import { PlaceholderMedia } from '#/components/brand/PlaceholderMedia'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import type { ServiceWithProfessional } from '#/lib/api/types'
import {
  categoryLabel,
  formatDuration,
  formatPrice,
  modeLabel,
} from '#/lib/format'

// HANDOFF §5.2. En escritorio el enlace es el botón "Ver detalle";
// en móvil el título se estira para que toda la tarjeta sea el enlace.
export function ServiceCard({ service }: { service: ServiceWithProfessional }) {
  const ModeIcon = service.mode === 'online' ? Video : MapPin

  return (
    <article className="relative flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground transition-shadow focus-within:shadow-sm hover:shadow-sm">
      <PlaceholderMedia
        category={service.category}
        imageUrl={service.imageUrl}
        className="h-[140px] md:aspect-video md:h-auto"
        iconClassName="size-10 md:size-12"
      >
        <Badge
          variant="outline"
          className="absolute top-2.5 left-2.5 border-transparent bg-background md:top-3 md:left-3"
        >
          {categoryLabel[service.category]}
        </Badge>
      </PlaceholderMedia>

      <div className="flex flex-1 flex-col gap-1 px-4 pt-3.5 pb-4 md:gap-2 md:p-5">
        <h2 className="font-display text-lg leading-6 font-semibold md:text-h3">
          <Link
            to="/servicios/$slug"
            params={{ slug: service.slug }}
            className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl hover:underline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring md:after:hidden md:focus-visible:outline-2 md:focus-visible:outline-offset-2 md:focus-visible:outline-ring"
          >
            {service.name}
          </Link>
        </h2>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ModeIcon aria-hidden className="hidden size-4 md:block" />
          {modeLabel[service.mode]} · con {service.professional.name}
        </p>
        <p className="hidden text-sm text-muted-foreground md:block">
          {service.summary}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2 md:mt-auto md:border-t md:pt-3">
          <span className="font-mono text-sm font-medium">
            {formatDuration(service.durationMin)} ·{' '}
            {formatPrice(service.priceCents)}
          </span>
          <ChevronRight
            aria-hidden
            className="size-[18px] text-muted-foreground md:hidden"
          />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="relative hidden font-semibold md:inline-flex"
          >
            <Link to="/servicios/$slug" params={{ slug: service.slug }}>
              Ver detalle <ChevronRight />
              <span className="sr-only">de {service.name}</span>
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}

export function ServiceCardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex flex-col overflow-hidden rounded-xl border bg-card"
    >
      <Skeleton className="h-[140px] rounded-none md:aspect-video md:h-auto" />
      <div className="flex flex-col gap-2 px-4 pt-3.5 pb-4 md:p-5">
        <Skeleton className="h-6 w-2/3 md:h-7" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="hidden h-5 w-5/6 md:block" />
        <div className="mt-2 flex items-center justify-between md:border-t md:pt-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="hidden h-10 w-28 md:block" />
        </div>
      </div>
    </div>
  )
}
