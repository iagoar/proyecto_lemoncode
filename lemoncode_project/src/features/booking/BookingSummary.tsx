import { PlaceholderMedia } from '#/components/brand/PlaceholderMedia'
import type { ServiceWithProfessional } from '#/lib/api/types'
import { addMinutes } from '#/lib/dates'
import {
  formatDayLong,
  formatDuration,
  formatPrice,
  formatTimeRange,
  modeLabel,
} from '#/lib/format'

export function slotRange(time: string | undefined, durationMin: number) {
  return time ? formatTimeRange(time, addMinutes(time, durationMin)) : '—'
}

// Aside "Resumen" de escritorio (pasos 1 y 2). Las acciones llegan como children.
export function BookingSummary({
  service,
  date,
  time,
  children,
}: {
  service: ServiceWithProfessional
  date?: string
  time?: string
  children: React.ReactNode
}) {
  return (
    <aside
      aria-labelledby="resumen"
      className="hidden flex-col gap-4 rounded-xl border bg-card p-6 md:flex lg:sticky lg:top-6"
    >
      <h2 id="resumen" className="text-h3 font-semibold">
        Resumen
      </h2>
      <div className="flex items-center gap-3.5">
        <PlaceholderMedia
          category={service.category}
          imageUrl={service.imageUrl}
          className="size-14 shrink-0 rounded-lg"
          iconClassName="size-6"
        />
        <div className="flex flex-col">
          <span className="font-semibold">{service.name}</span>
          <span className="text-sm text-muted-foreground">
            con {service.professional.name}
          </span>
        </div>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5">
        <SummaryRow label="Fecha">
          {date ? formatDayLong(date) : '—'}
        </SummaryRow>
        <SummaryRow label="Hora" mono>
          {slotRange(time, service.durationMin)}
        </SummaryRow>
        <SummaryRow label="Duración" mono>
          {formatDuration(service.durationMin)}
        </SummaryRow>
        <SummaryRow label="Modalidad">{modeLabel[service.mode]}</SummaryRow>
      </dl>
      <p className="flex items-baseline justify-between border-t pt-3.5 text-[17px] font-semibold">
        <span>Total</span>
        <span className="font-mono text-xl">
          {formatPrice(service.priceCents)}
        </span>
      </p>
      {children}
    </aside>
  )
}

export function SummaryRow({
  label,
  mono,
  children,
}: {
  label: string
  mono?: boolean
  children: React.ReactNode
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={
          mono ? 'text-right font-mono font-medium' : 'text-right font-medium'
        }
      >
        {children}
      </dd>
    </>
  )
}
