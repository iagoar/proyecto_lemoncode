import { useQueries, useQuery } from '@tanstack/react-query'
import { CalendarDays } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import { Skeleton } from '#/components/ui/skeleton'
import { availabilityQueries } from '#/lib/api/availability'
import type { DayAvailability } from '#/lib/api/types'
import { addMonths } from '#/lib/dates'
import { dayParts, formatDayFull, formatDayLong } from '#/lib/format'
import { cn } from '#/lib/utils'
import { MonthCalendar } from './MonthCalendar'
import { pickerButton } from './picker'

const MONTHS_AHEAD = 3
const STRIP_DAYS = 15

// Paso 1 (HANDOFF §5.4). Escritorio: calendario de mes + franjas.
// Móvil: tira horizontal de días, "Ver mes" en hoja inferior y franjas a 3 columnas.
export function DateTimeStep({
  serviceId,
  exceptBookingId,
  today,
  date,
  time,
  onDateChange,
  onTimeChange,
}: {
  serviceId: string
  /** Al reprogramar, la hora de la propia reserva no cuenta como ocupada. */
  exceptBookingId?: string
  today: string
  date?: string
  time?: string
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
}) {
  const minMonth = today.slice(0, 7)
  const maxMonth = addMonths(minMonth, MONTHS_AHEAD)
  const [month, setMonth] = useState(date?.slice(0, 7) ?? minMonth)
  const [sheetOpen, setSheetOpen] = useState(false)

  const daysQuery = useQuery(
    availabilityQueries.days(serviceId, month, exceptBookingId),
  )

  // Sin día elegido, se preselecciona el primero con hueco (avanzando de mes si hace falta).
  useEffect(() => {
    if (date || !daysQuery.data) return
    const first = daysQuery.data.find((d) => d.status === 'disponible')
    if (first) onDateChange(first.date)
    else if (month < maxMonth) setMonth(addMonths(month, 1))
  }, [date, daysQuery.data])

  function selectFromCalendar(next: string) {
    onDateChange(next)
    setSheetOpen(false)
  }

  const calendar = (headingId: string) => (
    <MonthCalendar
      headingId={headingId}
      month={month}
      onMonthChange={setMonth}
      minMonth={minMonth}
      maxMonth={maxMonth}
      days={daysQuery.data}
      loading={daysQuery.isPending}
      today={today}
      selected={date}
      onSelect={selectFromCalendar}
    />
  )

  return (
    <>
      {/* Escritorio */}
      <Card className="hidden gap-5 p-6 shadow-none md:flex">
        <section aria-labelledby="calendario" className="flex flex-col gap-5">
          {calendar('calendario')}
        </section>
        <div className="border-t pt-5">
          <SlotPicker
            serviceId={serviceId}
            exceptBookingId={exceptBookingId}
            date={date}
            time={time}
            onTimeChange={onTimeChange}
            title="Horas disponibles"
          />
        </div>
      </Card>

      {/* Móvil */}
      <div className="flex flex-col gap-5 md:hidden">
        <section aria-labelledby="m-dia" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2
              id="m-dia"
              className="font-display text-lg leading-6 font-semibold"
            >
              Elige día
            </h2>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2 text-primary hover:text-primary"
                >
                  <CalendarDays aria-hidden />
                  Ver mes
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="gap-4 rounded-t-2xl border-t-0 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),2rem)]"
              >
                <div
                  aria-hidden
                  className="h-1 w-10 self-center rounded-full bg-border"
                />
                <SheetTitle className="sr-only">
                  Elige un día del mes
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Los días tachados no tienen horas libres.
                </SheetDescription>
                <div className="pr-12">{calendar('m-calendario')}</div>
              </SheetContent>
            </Sheet>
          </div>
          <DateStrip
            serviceId={serviceId}
            exceptBookingId={exceptBookingId}
            today={today}
            selected={date}
            onSelect={onDateChange}
          />
        </section>
        <SlotPicker
          serviceId={serviceId}
          exceptBookingId={exceptBookingId}
          date={date}
          time={time}
          onTimeChange={onTimeChange}
          title="Horas"
        />
      </div>
    </>
  )
}

function DateStrip({
  serviceId,
  exceptBookingId,
  today,
  selected,
  onSelect,
}: {
  serviceId: string
  /** Al reprogramar, la hora de la propia reserva no cuenta como ocupada. */
  exceptBookingId?: string
  today: string
  selected?: string
  onSelect: (date: string) => void
}) {
  const month = today.slice(0, 7)
  const queries = useQueries({
    queries: [0, 1].map((n) =>
      availabilityQueries.days(serviceId, addMonths(month, n), exceptBookingId),
    ),
  })
  const pending = queries.some((q) => q.isPending)

  // Próximos días laborables; si se ha elegido uno más lejano desde "Ver mes", se añade.
  let days: DayAvailability[] = queries
    .flatMap((q) => q.data ?? [])
    .filter((d) => d.status !== 'cerrado')
    .slice(0, STRIP_DAYS)
  if (selected && !days.some((d) => d.date === selected)) {
    days = [...days, { date: selected, status: 'disponible' }]
  }

  // Mantiene a la vista el día elegido.
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-pressed="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [selected, pending])

  return (
    <div
      ref={listRef}
      role="group"
      aria-label="Días disponibles"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
    >
      {pending
        ? Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-21 w-16 shrink-0 rounded-[14px]" />
          ))
        : days.map(({ date, status }) => {
            const parts = dayParts(date)
            const isSelected = date === selected
            const full = status === 'completo'
            return (
              <button
                key={date}
                type="button"
                disabled={full}
                aria-pressed={isSelected}
                aria-label={`${formatDayFull(date)}${full ? ', completo' : ''}`}
                onClick={() => onSelect(date)}
                className={cn(
                  pickerButton({
                    state: isSelected
                      ? 'selected'
                      : full
                        ? 'unavailable'
                        : 'available',
                  }),
                  'flex min-h-21 w-16 shrink-0 flex-col items-center justify-center rounded-[14px] font-sans font-normal',
                )}
              >
                <span className="text-xs font-medium tracking-[0.06em] uppercase">
                  {parts.weekday}
                </span>
                <span className="font-display text-[22px] leading-7 font-bold">
                  {parts.day}
                </span>
                <span className="text-xs">{parts.month}</span>
              </button>
            )
          })}
    </div>
  )
}

function SlotPicker({
  serviceId,
  exceptBookingId,
  date,
  time,
  onTimeChange,
  title,
}: {
  serviceId: string
  /** Al reprogramar, la hora de la propia reserva no cuenta como ocupada. */
  exceptBookingId?: string
  date?: string
  time?: string
  onTimeChange: (time: string) => void
  title: string
}) {
  const query = useQuery({
    ...availabilityQueries.slots(serviceId, date ?? '', exceptBookingId),
    enabled: Boolean(date),
  })
  const headingId = `horas-${title === 'Horas' ? 'm' : 'd'}`

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h3
        id={headingId}
        className="font-display text-lg leading-6 font-semibold md:text-[17px]"
      >
        {title}
        {date && ` · ${formatDayLong(date)}`}
      </h3>

      {!date || query.isPending ? (
        <SlotGrid>
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-12 md:h-11" />
          ))}
        </SlotGrid>
      ) : query.isError ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground">
            No hemos podido cargar las horas.
          </p>
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : (
        <SlotGrid>
          {query.data.map((slot) => {
            const selected = slot.time === time
            return (
              <button
                key={slot.time}
                type="button"
                disabled={!slot.available}
                aria-pressed={selected}
                aria-label={
                  slot.available ? slot.time : `${slot.time}, ocupada`
                }
                onClick={() => onTimeChange(slot.time)}
                className={cn(
                  pickerButton({
                    state: selected
                      ? 'selected'
                      : slot.available
                        ? 'available'
                        : 'unavailable',
                  }),
                  'min-h-12 text-body md:min-h-11',
                )}
              >
                {slot.time}
              </button>
            )
          })}
        </SlotGrid>
      )}

      <p className="text-caption text-muted-foreground">
        Horario en tu zona horaria: Europa/Madrid
      </p>
    </section>
  )
}

function SlotGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 md:grid-cols-[repeat(auto-fill,minmax(96px,1fr))]">
      {children}
    </div>
  )
}
