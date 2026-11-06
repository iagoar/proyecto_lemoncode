import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '#/components/ui/alert-dialog'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '#/components/ui/sheet'
import { useIsDesktop } from '#/hooks/use-media-query'
import { useCancellationPolicy } from '#/lib/api/settings'
import type { BookingWithService } from '#/lib/api/types'
import { formatDayLong } from '#/lib/format'
import { bookingWhen } from './BookingRow'

// HANDOFF §5.5: AlertDialog en escritorio, hoja inferior en móvil.
export function CancelBookingDialog({
  booking,
  pending,
  onOpenChange,
  onConfirm,
}: {
  booking: BookingWithService | null
  pending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const isDesktop = useIsDesktop()
  const cancellationPolicy = useCancellationPolicy()
  const open = booking !== null
  const title = booking ? `¿Cancelar «${booking.service.name}»?` : ''
  const when = booking ? bookingWhen(booking) : null
  const description = when
    ? `${formatDayLong(when.date)} · ${when.time}. ${cancellationPolicy}`
    : ''

  if (isDesktop) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Mantener reserva</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={(event) => {
                  event.preventDefault()
                  onConfirm()
                }}
              >
                {pending ? 'Cancelando…' : 'Cancelar reserva'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="gap-3 rounded-t-2xl border-t-0 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),2rem)]"
      >
        <div
          aria-hidden
          className="h-1 w-10 self-center rounded-full bg-border"
        />
        <SheetTitle className="mt-2 font-display text-h3 font-semibold">
          {title}
        </SheetTitle>
        <SheetDescription className="text-body text-muted-foreground">
          {description}
        </SheetDescription>
        <Button
          variant="destructive"
          size="xl"
          className="mt-2"
          disabled={pending}
          onClick={onConfirm}
        >
          {pending ? 'Cancelando…' : 'Cancelar reserva'}
        </Button>
        <Button
          variant="outline"
          size="xl"
          className="font-medium"
          onClick={() => onOpenChange(false)}
        >
          Mantener reserva
        </Button>
      </SheetContent>
    </Sheet>
  )
}
