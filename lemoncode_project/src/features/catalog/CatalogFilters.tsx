import { Search } from 'lucide-react'

import { Card } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type { Mode, ServiceSort } from '#/lib/api/types'
import { modeOptions, sortOptions } from './search'

export function SearchInput({
  id,
  value,
  onChange,
  hideLabel = false,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  hideLabel?: boolean
}) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <Label htmlFor={id} className={hideLabel ? 'sr-only' : undefined}>
        Buscar
      </Label>
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={id}
          type="search"
          placeholder="Servicio o profesional"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="pl-10 md:pl-[42px]"
        />
      </div>
    </div>
  )
}

export function ModeSelect({
  id,
  value,
  onChange,
}: {
  id: string
  value: Mode | undefined
  onChange: (value: Mode | undefined) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>Modalidad</Label>
      <Select
        value={value ?? 'todas'}
        onValueChange={(next) =>
          onChange(next === 'todas' ? undefined : (next as Mode))
        }
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {modeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function SortSelect({
  id,
  value,
  onChange,
}: {
  id: string
  value: ServiceSort | undefined
  onChange: (value: ServiceSort | undefined) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>Ordenar por</Label>
      <Select
        value={value ?? 'relevancia'}
        onValueChange={(next) =>
          onChange(next === 'relevancia' ? undefined : (next as ServiceSort))
        }
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/** Barra de filtros de escritorio. */
export function CatalogFilters({
  query,
  onQueryChange,
  mode,
  onModeChange,
  sort,
  onSortChange,
}: {
  query: string
  onQueryChange: (value: string) => void
  mode: Mode | undefined
  onModeChange: (value: Mode | undefined) => void
  sort: ServiceSort | undefined
  onSortChange: (value: ServiceSort | undefined) => void
}) {
  return (
    <Card className="hidden flex-row flex-wrap items-end gap-3 p-4 md:flex">
      <div className="flex flex-[1_1_320px]">
        <SearchInput id="buscar" value={query} onChange={onQueryChange} />
      </div>
      <div className="flex-[0_1_200px]">
        <ModeSelect id="modalidad" value={mode} onChange={onModeChange} />
      </div>
      <div className="flex-[0_1_200px]">
        <SortSelect id="orden" value={sort} onChange={onSortChange} />
      </div>
    </Card>
  )
}
