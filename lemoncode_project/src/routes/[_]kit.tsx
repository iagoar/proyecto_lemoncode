import { createFileRoute, notFound } from '@tanstack/react-router'
import {
  ArrowRight,
  GraduationCap,
  Leaf,
  MapPin,
  Monitor,
  Moon,
  Navigation,
  Plus,
  Search,
  Sun,
  Trash2,
  Video,
} from 'lucide-react'

import { Logo } from '#/components/brand/Logo'
import { useTheme, type Theme } from '#/components/theme-provider'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'

// Página de revisión del tema (HANDOFF §9.1). Solo disponible en desarrollo.
export const Route = createFileRoute('/_kit')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  head: () => ({ meta: [{ title: 'Kit · rumbo.' }] }),
  component: KitPage,
})

const swatches = [
  { name: 'canvas', className: 'bg-canvas' },
  { name: 'background', className: 'bg-background' },
  { name: 'card', className: 'bg-card' },
  { name: 'foreground', className: 'bg-foreground' },
  { name: 'muted-foreground', className: 'bg-muted-foreground' },
  { name: 'primary', className: 'bg-primary' },
  { name: 'accent', className: 'bg-accent' },
  { name: 'secondary / muted', className: 'bg-secondary' },
  { name: 'destructive', className: 'bg-destructive' },
  { name: 'success', className: 'bg-success' },
  { name: 'warning', className: 'bg-warning' },
  { name: 'border', className: 'bg-border' },
  { name: 'input', className: 'bg-input' },
  { name: 'brand-ink', className: 'bg-brand-ink' },
  { name: 'brand-blue', className: 'bg-brand-blue' },
  { name: 'brand-blue-100', className: 'bg-brand-blue-100' },
]

const buttonVariants = [
  'default',
  'outline',
  'secondary',
  'ghost',
  'destructive',
  'destructive-outline',
  'link',
] as const

const buttonSizes = ['sm', 'default', 'lg', 'xl'] as const

function KitPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-6">
          <Logo />
          <ToggleGroup
            type="single"
            variant="outline"
            value={theme}
            onValueChange={(value) => value && setTheme(value as Theme)}
            aria-label="Tema"
          >
            <ToggleGroupItem value="system" aria-label="Tema del sistema">
              <Monitor />
            </ToggleGroupItem>
            <ToggleGroupItem value="light" aria-label="Tema claro">
              <Sun />
            </ToggleGroupItem>
            <ToggleGroupItem value="dark" aria-label="Tema oscuro">
              <Moon />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </header>

      <main className="mx-auto flex max-w-page flex-col gap-10 px-6 py-10">
        <div>
          <p className="font-display text-eyebrow text-muted-foreground uppercase">
            Design system
          </p>
          <h1 className="text-h1">Kit de rumbo.</h1>
          <p className="mt-2 text-body-lg text-muted-foreground">
            Revisión del tema en claro y oscuro antes de construir pantallas.
          </p>
        </div>

        <Section title="Tipografía">
          <div className="flex flex-col gap-3">
            <p className="font-display text-display">Encuentra tu rumbo.</p>
            <h1 className="text-h1">Encuentra tu servicio</h1>
            <h2 className="text-h2">Qué incluye</h2>
            <h3 className="text-h3">Sesión de coaching ejecutivo</h3>
            <p className="font-display text-eyebrow text-muted-foreground uppercase">
              Tu profesional
            </p>
            <p className="text-body-lg">
              Entradilla en body-lg: sesiones online y presenciales.
            </p>
            <p>Texto de interfaz por defecto en body (15/24).</p>
            <p className="text-sm text-muted-foreground">
              Metadato en text-sm con muted-foreground.
            </p>
            <p className="text-caption text-muted-foreground">
              Caption: política de cancelación.
            </p>
            <p className="font-mono">60 min · 65 € · 11:30–12:30</p>
          </div>
        </Section>

        <Section title="Color">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
            {swatches.map((swatch) => (
              <div key={swatch.name} className="flex flex-col gap-2">
                <div
                  className={`h-16 rounded-lg border ${swatch.className}`}
                  aria-hidden
                />
                <span className="font-mono text-caption">{swatch.name}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Botones">
          <div className="flex flex-col gap-4">
            {buttonVariants.map((variant) => (
              <div key={variant} className="flex flex-wrap items-center gap-3">
                <span className="w-40 font-mono text-caption text-muted-foreground">
                  {variant}
                </span>
                {buttonSizes.map((size) => (
                  <Button key={size} variant={variant} size={size}>
                    {size === 'sm' ? 'Ver detalle' : 'Reservar'}
                  </Button>
                ))}
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-40 font-mono text-caption text-muted-foreground">
                icon / disabled
              </span>
              <Button size="icon" variant="outline" aria-label="Buscar">
                <Search />
              </Button>
              <Button size="icon" variant="ghost" aria-label="Eliminar">
                <Trash2 className="text-destructive" />
              </Button>
              <Button>
                <Plus /> Nuevo servicio
              </Button>
              <Button disabled>Continuar</Button>
            </div>
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Coaching</Badge>
            <Badge variant="accent">Publicado</Badge>
            <Badge variant="draft">Borrador</Badge>
            <Badge variant="success">Confirmada</Badge>
            <Badge variant="warning">Pendiente de pago</Badge>
            <Badge variant="destructive-outline">Cancelada</Badge>
            <Badge variant="outline">Completada</Badge>
          </div>
        </Section>

        <Section title="Formularios">
          <div className="grid max-w-form gap-5">
            <div className="grid gap-2">
              <Label htmlFor="kit-email">Email</Label>
              <Input id="kit-email" type="email" placeholder="tu@email.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kit-password">Contraseña</Label>
              <Input
                id="kit-password"
                type="password"
                aria-invalid
                aria-describedby="kit-password-error"
              />
              <p id="kit-password-error" className="text-sm text-destructive">
                Introduce tu contraseña
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kit-notes">Notas (opcional)</Label>
              <Textarea
                id="kit-notes"
                placeholder="Cuéntale a tu profesional lo que necesites"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kit-disabled">Deshabilitado</Label>
              <Input id="kit-disabled" disabled value="No editable" readOnly />
            </div>
          </div>
        </Section>

        <Section title="Chips de categoría">
          <ToggleGroup
            type="single"
            variant="pill"
            spacing={2}
            defaultValue="todos"
            aria-label="Categoría"
            className="flex-wrap"
          >
            <ToggleGroupItem value="todos">Todos</ToggleGroupItem>
            <ToggleGroupItem value="coaching">Coaching</ToggleGroupItem>
            <ToggleGroupItem value="bienestar">Bienestar</ToggleGroupItem>
            <ToggleGroupItem value="formacion">Formación</ToggleGroupItem>
          </ToggleGroup>
        </Section>

        <Section title="Tarjetas">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            <KitServiceCard
              tint="bg-brand-blue-100 text-brand-ink"
              icon={<Navigation className="size-10" />}
              category="Coaching"
              title="Coaching ejecutivo"
              mode="Online"
              modeIcon={<Video className="size-4" />}
              price="60 min · 65 €"
            />
            <KitServiceCard
              tint="bg-accent text-foreground"
              icon={<Leaf className="size-10" />}
              category="Bienestar"
              title="Mindfulness para equipos"
              mode="Presencial"
              modeIcon={<MapPin className="size-4" />}
              price="90 min · 80 €"
            />
            <KitServiceCard
              tint="bg-border text-foreground"
              icon={<GraduationCap className="size-10" />}
              category="Formación"
              title="Taller de comunicación"
              mode="Online"
              modeIcon={<Video className="size-4" />}
              price="120 min · 120 €"
            />
          </div>
        </Section>

        <Section title="Bloque de marca">
          <div className="flex flex-col gap-6 overflow-hidden rounded-2xl bg-brand-ink p-8 md:p-12">
            <Logo tone="white" />
            <p className="font-display text-eyebrow text-brand-blue-100 uppercase">
              Catálogo de coaching
            </p>
            <p className="font-display text-h1 text-brand-mist md:text-display">
              Encuentra tu rumbo.
            </p>
            <div className="flex gap-3" aria-hidden>
              <div className="size-16 rounded-[28px] bg-brand-blue" />
              <div className="size-16 rounded-[28px] bg-brand-blue-100" />
            </div>
          </div>
        </Section>
      </main>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h3">{title}</h2>
      <Card>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  )
}

function KitServiceCard({
  tint,
  icon,
  category,
  title,
  mode,
  modeIcon,
  price,
}: {
  tint: string
  icon: React.ReactNode
  category: string
  title: string
  mode: string
  modeIcon: React.ReactNode
  price: string
}) {
  return (
    <Card className="gap-0 overflow-hidden py-0 transition-shadow hover:shadow-sm">
      <div
        className={`relative grid aspect-video place-items-center ${tint}`}
      >
        {icon}
        <Badge variant="outline" className="absolute top-3 left-3 bg-background">
          {category}
        </Badge>
      </div>
      <CardHeader className="pt-5">
        <CardTitle className="font-display text-h3">{title}</CardTitle>
        <CardDescription className="flex items-center gap-1.5">
          {modeIcon} {mode} · con Laura Gómez
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3 py-5">
        <span className="font-mono text-sm">{price}</span>
        <Button variant="outline" size="sm">
          Ver detalle <ArrowRight />
        </Button>
      </CardContent>
    </Card>
  )
}
