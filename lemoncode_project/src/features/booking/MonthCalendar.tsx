import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import type { DayAvailability } from '#/lib/api/types'
import { addMonths, daysOfMonth, weekdayIndex } from '#/lib/dates'
import { formatDayFull, formatMonth } from '#/lib/format'
import { cn } from '#/lib/utils'
import { pickerButton } from './picker'

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// Calendario de mes completo, semana empezando en lunes (HANDOFF §5.4, paso 1).
export function MonthCalendar({
  month,
  onMonthChange,
  minMonth,
  maxMonth,
  days,
  loading,
  today,
  selected,
  onSelect,
  headingId,
}: {
  month: string
  onMonthChange: (month: string) => void
  minMonth: string
  maxMonth: string
  days?: DayAvailability[]
  loading: boolean
  today: string
  selected?: string
  onSelect: (date: string) => void
  headingId: string
}) {
  const dates = daysOfMonth(month)
  const leading = weekdayIndex(dates[0])
  const status = new Map(days?.map((d) => [d.date, d.status]))

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="text-h3 font-semibold" aria-live="polite">
          {formatMonth(month)}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Mes anterior"
            disabled={month <= minMonth}
            onClick={() => onMonthChange(addMonths(month, -1))}
          >
            <ChevronLeft className="size-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Mes siguiente"
            disabled={month >= maxMonth}
            onClick={() => onMonthChange(addMonths(month, 1))}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            aria-hidden
            className="pb-1.5 text-center font-mono text-xs font-medium text-muted-foreground"
          >
            {w}
          </div>
        ))}
        {Array.from({ length: leading }, (_, i) => (
          <div key={`empty-${i}`} aria-hidden />
        ))}
        {dates.map((date) =>
          loading ? (
            <Skeleton key={date} className="h-12" />
          ) : (
            <DayButton
              key={date}
              date={date}
              status={status.get(date) ?? 'cerrado'}
              past={date < today}
              selected={date === selected}
              onSelect={onSelect}
            />
          ),
        )}
      </div>

      <ul className="flex flex-wrap gap-5 text-caption text-muted-foreground">
        <LegendItem className="border-input bg-background">
          Disponible
        </LegendItem>
        <LegendItem className="border-primary bg-primary">
          Seleccionado
        </LegendItem>
        <LegendItem className="border-border bg-secondary">
          No disponible
        </LegendItem>
      </ul>
    </div>
  )
}

function DayButton({
  date,
  status,
  past,
  selected,
  onSelect,
}: {
  date: string
  status: DayAvailability['status']
  past: boolean
  selected: boolean
  onSelect: (date: string) => void
}) {
  const available = status === 'disponible'
  const suffix =
    status === 'completo' ? ', completo' : available ? '' : ', no disponible'

  return (
    <button
      type="button"
      disabled={!available}
      aria-pressed={selected}
      aria-label={`${formatDayFull(date)}${suffix}`}
      onClick={() => onSelect(date)}
      className={cn(
        pickerButton({
          state: selected
            ? 'selected'
            : available
              ? 'available'
              : past
                ? 'past'
                : 'unavailable',
        }),
        'h-12 text-body',
      )}
    >
      {Number(date.slice(8, 10))}
    </button>
  )
}

function LegendItem({
  className,
  children,
}: {
  className: string
  children: React.ReactNode
}) {
  return (
    <li className="flex items-center gap-2">
      <span
        aria-hidden
        className={cn('size-3.5 rounded-sm border', className)}
      />
      {children}
    </li>
  )
}
