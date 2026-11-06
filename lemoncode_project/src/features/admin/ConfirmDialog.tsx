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

// Confirmación de acciones destructivas del backoffice (HANDOFF §5.6):
// AlertDialog en escritorio, hoja inferior en móvil.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel,
  cancelLabel = 'Cancelar',
  blocked = false,
  pending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  pendingLabel: string
  cancelLabel?: string
  /** La acción no se puede hacer: solo se explica por qué, con un botón para cerrar. */
  blocked?: boolean
  pending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const isDesktop = useIsDesktop()

  if (isDesktop) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">
                {blocked ? 'Entendido' : cancelLabel}
              </Button>
            </AlertDialogCancel>
            {!blocked && (
              <AlertDialogAction asChild>
                <Button
                  variant="destructive"
                  disabled={pending}
                  onClick={(event) => {
                    event.preventDefault()
                    onConfirm()
                  }}
                >
                  {pending ? pendingLabel : confirmLabel}
                </Button>
              </AlertDialogAction>
            )}
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
        {!blocked && (
          <Button
            variant="destructive"
            size="xl"
            className="mt-2"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? pendingLabel : confirmLabel}
          </Button>
        )}
        <Button
          variant="outline"
          size="xl"
          className="font-medium"
          onClick={() => onOpenChange(false)}
        >
          {blocked ? 'Entendido' : cancelLabel}
        </Button>
      </SheetContent>
    </Sheet>
  )
}
