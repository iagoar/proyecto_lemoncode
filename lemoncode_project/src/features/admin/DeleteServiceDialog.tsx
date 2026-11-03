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
import type { Service } from '#/lib/api/types'

const DESCRIPTION =
  'Se quitará del catálogo. Las reservas ya hechas no se cancelan automáticamente.'

// HANDOFF §5.6: AlertDialog en escritorio, hoja inferior en móvil.
export function DeleteServiceDialog({
  service,
  pending,
  onOpenChange,
  onConfirm,
}: {
  service: Service | null
  pending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const isDesktop = useIsDesktop()
  const open = service !== null
  const title = service ? `¿Eliminar «${service.name}»?` : ''

  if (isDesktop) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{DESCRIPTION}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancelar</Button>
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
                {pending ? 'Eliminando…' : 'Eliminar'}
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
          {DESCRIPTION}
        </SheetDescription>
        <Button
          variant="destructive"
          size="xl"
          className="mt-2"
          disabled={pending}
          onClick={onConfirm}
        >
          {pending ? 'Eliminando…' : 'Eliminar'}
        </Button>
        <Button
          variant="outline"
          size="xl"
          className="font-medium"
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
      </SheetContent>
    </Sheet>
  )
}
