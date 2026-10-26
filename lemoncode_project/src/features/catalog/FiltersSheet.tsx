import { SlidersVertical } from 'lucide-react'
import { useState } from 'react'

import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import type { Mode, ServiceSort } from '#/lib/api/types'
import { ModeSelect, SortSelect } from './CatalogFilters'

/** Hoja inferior de filtros en móvil (HANDOFF §5.2). */
export function FiltersSheet({
  mode,
  sort,
  onApply,
}: {
  mode: Mode | undefined
  sort: ServiceSort | undefined
  onApply: (filters: { mode?: Mode; sort?: ServiceSort }) => void
}) {
  const [open, setOpen] = useState(false)
  const [draftMode, setDraftMode] = useState(mode)
  const [draftSort, setDraftSort] = useState(sort)
  const activeCount = Number(Boolean(mode)) + Number(Boolean(sort))

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraftMode(mode)
      setDraftSort(sort)
    }
    setOpen(next)
  }

  function apply(filters: { mode?: Mode; sort?: ServiceSort }) {
    onApply(filters)
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon-lg"
          aria-label={
            activeCount ? `Filtros (${activeCount} activos)` : 'Filtros'
          }
          className="relative shrink-0"
        >
          <SlidersVertical className="size-5" />
          {activeCount > 0 && (
            <span
              aria-hidden
              className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-primary font-mono text-[11px] text-primary-foreground"
            >
              {activeCount}
            </span>
          )}
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
        <div className="flex min-h-11 items-center pr-12">
          <SheetTitle className="font-display text-h3 font-semibold">
            Filtros
          </SheetTitle>
        </div>
        <SheetDescription className="sr-only">
          Filtra el catálogo por modalidad y cambia el orden.
        </SheetDescription>
        <ModeSelect id="m-modalidad" value={draftMode} onChange={setDraftMode} />
        <SortSelect id="m-orden" value={draftSort} onChange={setDraftSort} />
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => apply({})}
          >
            Limpiar
          </Button>
          <Button
            size="lg"
            className="flex-[2]"
            onClick={() => apply({ mode: draftMode, sort: draftSort })}
          >
            Ver resultados
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
