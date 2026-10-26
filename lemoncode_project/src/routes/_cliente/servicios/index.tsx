import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { CatalogFilters, SearchInput } from '#/features/catalog/CatalogFilters'
import { CatalogPagination } from '#/features/catalog/CatalogPagination'
import { CategoryChips } from '#/features/catalog/CategoryChips'
import { FiltersSheet } from '#/features/catalog/FiltersSheet'
import {
  ServiceCard,
  ServiceCardSkeleton,
} from '#/features/catalog/ServiceCard'
import {
  catalogSearchSchema,
  toListParams,
  type CatalogSearch,
} from '#/features/catalog/search'
import { useIsDesktop } from '#/hooks/use-media-query'
import { SERVICES_PAGE_SIZE, servicesQueries } from '#/lib/api/services'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_cliente/servicios/')({
  validateSearch: (search) => catalogSearchSchema.parse(search),
  head: () => ({ meta: [{ title: 'Servicios · rumbo.' }] }),
  component: CatalogPage,
})

const SEARCH_DEBOUNCE_MS = 300

function CatalogPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const isDesktop = useIsDesktop()
  const page = search.pagina ?? 1

  // Escritorio: página a página. Móvil: "Cargar más" acumula páginas.
  const query = useQuery(
    servicesQueries.list({
      ...toListParams(search),
      page: isDesktop ? page : 1,
      pageSize: isDesktop ? SERVICES_PAGE_SIZE : SERVICES_PAGE_SIZE * page,
    }),
  )

  function updateSearch(patch: Partial<CatalogSearch>, replace = false) {
    navigate({
      search: (prev) => ({ ...prev, ...patch, pagina: undefined }),
      replace,
    })
  }

  // Búsqueda con debounce: el input es local y se vuelca a la URL a los 300 ms.
  const [queryText, setQueryText] = useState(search.q ?? '')
  useEffect(() => {
    setQueryText(search.q ?? '')
  }, [search.q])
  useEffect(() => {
    const next = queryText.trim() || undefined
    if (next === search.q) return
    const timeout = setTimeout(
      () => updateSearch({ q: next }, true),
      SEARCH_DEBOUNCE_MS,
    )
    return () => clearTimeout(timeout)
  }, [queryText])

  const total = query.data?.total ?? 0
  const totalPages = Math.ceil(total / SERVICES_PAGE_SIZE)
  const items = query.data?.items ?? []

  return (
    <main className="mx-auto flex max-w-page flex-col gap-4 px-4 pt-5 pb-6 md:gap-6 md:px-6 md:pt-10 md:pb-14">
      <div className="flex flex-col gap-1 md:gap-2">
        <p className="hidden font-display text-eyebrow text-muted-foreground uppercase md:block">
          Catálogo
        </p>
        <h1 className="text-h2 font-bold md:text-h1">Encuentra tu servicio</h1>
        <p className="text-sm text-muted-foreground md:text-body-lg">
          <span className="md:hidden">Coaching, bienestar y formación.</span>
          <span className="hidden md:inline">
            Coaching, bienestar y formación con profesionales verificados.
          </span>
        </p>
      </div>

      <CatalogFilters
        query={queryText}
        onQueryChange={setQueryText}
        mode={search.modo}
        onModeChange={(modo) => updateSearch({ modo })}
        sort={search.orden}
        onSortChange={(orden) => updateSearch({ orden })}
      />

      <div className="flex items-end gap-2 md:hidden">
        <SearchInput
          id="m-buscar"
          value={queryText}
          onChange={setQueryText}
          hideLabel
        />
        <FiltersSheet
          mode={search.modo}
          sort={search.orden}
          onApply={({ mode, sort }) =>
            updateSearch({ modo: mode, orden: sort })
          }
        />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3">
        <CategoryChips
          value={search.cat}
          onChange={(cat) => updateSearch({ cat })}
        />
        <p
          aria-live="polite"
          className="text-caption text-muted-foreground md:text-sm"
        >
          {query.isPending
            ? 'Cargando servicios…'
            : `${total} ${total === 1 ? 'servicio' : 'servicios'}`}
        </p>
      </div>

      {query.isPending ? (
        <ServiceGrid>
          {Array.from({ length: 6 }, (_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </ServiceGrid>
      ) : query.isError ? (
        <StateCard
          title="No hemos podido cargar los servicios"
          text="Comprueba tu conexión y vuelve a intentarlo."
          action={
            <Button variant="outline" onClick={() => query.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <StateCard
          title="No hay servicios con esos filtros"
          text="Prueba con otra búsqueda o quita los filtros para ver todo el catálogo."
          action={
            <Button
              variant="outline"
              onClick={() => navigate({ search: {} })}
            >
              Quitar filtros
            </Button>
          }
        />
      ) : (
        <>
          <ServiceGrid
            className={cn(
              query.isPlaceholderData && 'opacity-60 transition-opacity',
            )}
          >
            {items.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </ServiceGrid>

          {isDesktop ? (
            <CatalogPagination page={page} totalPages={totalPages} />
          ) : (
            items.length < total && (
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                disabled={query.isFetching}
                onClick={() =>
                  navigate({
                    search: (prev) => ({ ...prev, pagina: page + 1 }),
                    replace: true,
                    resetScroll: false,
                  })
                }
              >
                {query.isFetching ? 'Cargando…' : 'Cargar más'}
              </Button>
            )
          )}
        </>
      )}
    </main>
  )
}

function ServiceGrid({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] md:gap-6',
        className,
      )}
    >
      {children}
    </div>
  )
}

function StateCard({
  title,
  text,
  action,
}: {
  title: string
  text: string
  action: React.ReactNode
}) {
  return (
    <Card className="items-center gap-3 px-6 py-12 text-center">
      <h2 className="text-h3">{title}</h2>
      <p className="max-w-md text-muted-foreground">{text}</p>
      <div className="pt-2">{action}</div>
    </Card>
  )
}
