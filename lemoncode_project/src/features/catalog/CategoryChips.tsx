import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import type { Category } from '#/lib/api/types'
import { categoryOptions } from './search'

export function CategoryChips({
  value,
  onChange,
}: {
  value: Category | undefined
  onChange: (value: Category | undefined) => void
}) {
  return (
    <ToggleGroup
      type="single"
      variant="pill"
      spacing={2}
      value={value ?? 'todos'}
      onValueChange={(next) => {
        // Radix permite deseleccionar; un chip siempre queda activo.
        if (!next) return
        onChange(next === 'todos' ? undefined : (next as Category))
      }}
      aria-label="Categorías"
      className="-mx-4 w-[calc(100%+2rem)] flex-nowrap overflow-x-auto px-4 pb-0.5 md:mx-0 md:w-fit md:flex-wrap md:overflow-visible md:px-0 md:pb-0"
    >
      {categoryOptions.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value}>
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
