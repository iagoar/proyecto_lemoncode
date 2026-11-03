import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { StatePage } from '#/components/StatePage'
import { Button } from '#/components/ui/button'
import {
  ServiceDetail,
  ServiceDetailSkeleton,
} from '#/features/service-detail/ServiceDetail'
import { servicesQueries } from '#/lib/api/services'

export const Route = createFileRoute('/_cliente/servicios/$slug')({
  staticData: { hideMobileNav: true },
  head: () => ({ meta: [{ title: 'Servicio · rumbo.' }] }),
  component: ServiceDetailPage,
})

function ServiceDetailPage() {
  const { slug } = Route.useParams()
  const query = useQuery(servicesQueries.detail(slug))

  if (query.isPending) return <ServiceDetailSkeleton />

  if (query.isError) {
    return (
      <StatePage
        eyebrow="Error"
        title="No hemos podido cargar el servicio"
        text="Comprueba tu conexión y vuelve a intentarlo."
        action={<Button onClick={() => query.refetch()}>Reintentar</Button>}
      />
    )
  }

  // Slug inexistente o servicio no publicado (HANDOFF §5.3).
  if (!query.data) {
    return (
      <StatePage
        eyebrow="Error 404"
        title="No encontramos este servicio"
        text="Puede que ya no esté disponible o que el enlace no sea correcto."
      />
    )
  }

  return <ServiceDetail service={query.data} />
}
