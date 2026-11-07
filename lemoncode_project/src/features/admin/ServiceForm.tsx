import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, Plus, X } from 'lucide-react'
import { useId, useState } from 'react'
import {
  Controller,
  useFieldArray,
  useForm,
  type Control,
} from 'react-hook-form'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Switch } from '#/components/ui/switch'
import { Textarea } from '#/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import { DEFAULT_SCHEDULE } from '#/lib/api/availability'
import type {
  Category,
  Mode,
  Professional,
  ServiceInput,
  ServiceWithProfessional,
} from '#/lib/api/types'
import { categoryLabel, modeLabel } from '#/lib/format'
import { uploadImage } from '#/lib/api/images'
import { cn } from '#/lib/utils'

// HANDOFF §5.6. Validación: nombre y categoría obligatorios, duración entera
// de 15 a 240 y precio ≥ 0 con hasta 2 decimales (coma decimal).
// Además: resumen opcional, "Qué incluye" (hasta 8 puntos) y disponibilidad
// semanal (al menos un día y una franja).

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_INCLUDES = 8

const WEEKDAYS = [
  { value: 0, short: 'L', label: 'Lunes' },
  { value: 1, short: 'M', label: 'Martes' },
  { value: 2, short: 'X', label: 'Miércoles' },
  { value: 3, short: 'J', label: 'Jueves' },
  { value: 4, short: 'V', label: 'Viernes' },
  { value: 5, short: 'S', label: 'Sábado' },
  { value: 6, short: 'D', label: 'Domingo' },
]

const serviceSchema = z.object({
  name: z.string().trim().min(1, 'Introduce el nombre del servicio'),
  category: z.string().min(1, 'Elige una categoría'),
  summary: z.string().trim().max(80, 'Máximo 80 caracteres'),
  description: z.string().trim().max(1000, 'Máximo 1000 caracteres'),
  includes: z.array(
    z.object({ value: z.string().trim().max(120, 'Máximo 120 caracteres') }),
  ),
  weekdays: z.array(z.number()).min(1, 'Elige al menos un día'),
  times: z.array(z.string()).min(1, 'Añade al menos una franja horaria'),
  durationMin: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Usa minutos enteros')
    .refine(
      (v) => Number(v) >= 15 && Number(v) <= 240,
      'Entre 15 y 240 minutos',
    ),
  price: z
    .string()
    .trim()
    .regex(/^\d+([,.]\d{1,2})?$/, 'Usa el formato 65 o 65,50'),
  mode: z.enum(['online', 'presencial']),
  professionalId: z.string().min(1, 'Elige un profesional'),
  // Sin imagen = cadena vacía: con `undefined` react-hook-form vuelve al valor
  // por defecto y «Quitar imagen» no tendría efecto si el servicio ya tenía una.
  imageUrl: z.string(),
  published: z.boolean(),
})

type ServiceValues = z.infer<typeof serviceSchema>

function toValues(
  service?: ServiceWithProfessional,
  fixedProfessionalId?: string,
): ServiceValues {
  return {
    name: service?.name ?? '',
    category: service?.category ?? '',
    summary: service?.summary ?? '',
    description: service?.description ?? '',
    includes: (service?.includes ?? []).map((value) => ({ value })),
    weekdays: (service?.schedule ?? DEFAULT_SCHEDULE).weekdays,
    times: (service?.schedule ?? DEFAULT_SCHEDULE).times,
    durationMin: service ? String(service.durationMin) : '',
    price:
      service?.priceCents != null
        ? (service.priceCents / 100)
            .toFixed(2)
            .replace('.', ',')
            .replace(',00', '')
        : '',
    mode: service?.mode ?? 'online',
    professionalId: fixedProfessionalId ?? service?.professionalId ?? '',
    imageUrl: service?.imageUrl ?? '',
    published: service?.published ?? false,
  }
}

function toInput(values: ServiceValues, id?: string): ServiceInput {
  return {
    id,
    name: values.name,
    category: values.category as Category,
    summary: values.summary,
    description: values.description,
    includes: values.includes.map((item) => item.value),
    schedule: {
      weekdays: [...values.weekdays].sort((a, b) => a - b),
      times: [...values.times].sort(),
    },
    durationMin: Number(values.durationMin),
    priceCents: Math.round(Number(values.price.replace(',', '.')) * 100),
    mode: values.mode,
    professionalId: values.professionalId,
    imageUrl: values.imageUrl || undefined,
    published: values.published,
  }
}

export function ServiceForm({
  formId,
  service,
  professionals,
  fixedProfessionalId,
  pending,
  onSubmit,
}: {
  formId: string
  service?: ServiceWithProfessional
  professionals: Professional[]
  /** Profesional con sesión: el servicio es suyo y no se muestra el selector. */
  fixedProfessionalId?: string
  pending: boolean
  onSubmit: (input: ServiceInput) => void
}) {
  const uid = useId()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: toValues(service, fixedProfessionalId),
  })

  const includes = useFieldArray({ control, name: 'includes' })

  const field = (name: string) => ({
    id: `${uid}-${name}`,
    errorId: `${uid}-${name}-error`,
  })

  const fieldProps = (name: keyof ServiceValues) => {
    const { id, errorId } = field(name)
    const error = errors[name]
    return {
      id,
      'aria-invalid': error ? (true as const) : undefined,
      'aria-describedby': error ? errorId : undefined,
    }
  }

  return (
    <form
      id={formId}
      noValidate
      onSubmit={handleSubmit((values) =>
        onSubmit(toInput(values, service?.id)),
      )}
      className="flex flex-col gap-4"
    >
      <fieldset disabled={pending} className="contents">
        <Field
          label="Nombre"
          htmlFor={field('name').id}
          error={errors.name?.message}
          errorId={field('name').errorId}
        >
          <Input
            placeholder="Ej. Coaching ejecutivo"
            {...fieldProps('name')}
            {...register('name')}
          />
        </Field>

        <Field
          label="Categoría"
          htmlFor={field('category').id}
          error={errors.category?.message}
          errorId={field('category').errorId}
        >
          <ControlledSelect
            control={control}
            name="category"
            placeholder="Seleccionar"
            triggerProps={fieldProps('category')}
            options={(Object.keys(categoryLabel) as Category[]).map(
              (value) => ({
                value,
                label: categoryLabel[value],
              }),
            )}
          />
        </Field>

        <Field
          label="Resumen"
          htmlFor={field('summary').id}
          error={errors.summary?.message}
          errorId={field('summary').errorId}
          hint="Se muestra en la tarjeta del catálogo. Si lo dejas vacío, usamos la primera frase de la descripción."
        >
          <Input
            placeholder="Ej. Liderazgo, decisiones y gestión de equipos."
            {...fieldProps('summary')}
            {...register('summary')}
          />
        </Field>

        <Field
          label="Descripción"
          htmlFor={field('description').id}
          error={errors.description?.message}
          errorId={field('description').errorId}
        >
          <Textarea
            rows={4}
            placeholder="Para quién es, cómo se trabaja y qué resultados esperar"
            {...fieldProps('description')}
            {...register('description')}
          />
        </Field>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm leading-5 font-medium">
            Qué incluye
          </legend>
          {includes.fields.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Añade lo que recibe el cliente: materiales, seguimiento,
              grabaciones…
            </p>
          )}
          {includes.fields.map((item, index) => (
            <div key={item.id} className="flex flex-col gap-1">
              <div className="flex gap-2">
                <Input
                  aria-label={`Punto ${index + 1} de lo que incluye`}
                  placeholder="Ej. Plan de acción tras cada sesión"
                  aria-invalid={errors.includes?.[index] ? true : undefined}
                  {...register(`includes.${index}.value`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0"
                  aria-label={`Quitar punto ${index + 1}`}
                  onClick={() => includes.remove(index)}
                >
                  <X aria-hidden />
                </Button>
              </div>
              {errors.includes?.[index]?.value && (
                <p className="text-sm text-destructive">
                  {errors.includes[index].value.message}
                </p>
              )}
            </div>
          ))}
          {includes.fields.length < MAX_INCLUDES && (
            <Button
              type="button"
              variant="outline"
              className="self-start"
              onClick={() => includes.append({ value: '' })}
            >
              <Plus aria-hidden />
              Añadir punto
            </Button>
          )}
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Duración (min)"
            htmlFor={field('durationMin').id}
            error={errors.durationMin?.message}
            errorId={field('durationMin').errorId}
          >
            <Input
              inputMode="numeric"
              placeholder="60"
              className="font-mono"
              {...fieldProps('durationMin')}
              {...register('durationMin')}
            />
          </Field>
          <Field
            label="Precio (€)"
            htmlFor={field('price').id}
            error={errors.price?.message}
            errorId={field('price').errorId}
          >
            <Input
              inputMode="decimal"
              placeholder="0,00"
              className="font-mono"
              {...fieldProps('price')}
              {...register('price')}
            />
          </Field>
          <Field
            label="Modalidad"
            htmlFor={field('mode').id}
            className={cn(
              'col-span-2',
              !fixedProfessionalId && 'md:col-span-1',
            )}
          >
            <ControlledSelect
              control={control}
              name="mode"
              triggerProps={fieldProps('mode')}
              options={(Object.keys(modeLabel) as Mode[]).map((value) => ({
                value,
                label: modeLabel[value],
              }))}
            />
          </Field>
          {!fixedProfessionalId && (
            <Field
              label="Profesional"
              htmlFor={field('professionalId').id}
              error={errors.professionalId?.message}
              errorId={field('professionalId').errorId}
              className="col-span-2 md:col-span-1"
            >
              <ControlledSelect
                control={control}
                name="professionalId"
                placeholder="Seleccionar"
                triggerProps={fieldProps('professionalId')}
                options={professionals.map((p) => ({
                  value: p.id,
                  label: p.name,
                }))}
              />
            </Field>
          )}
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1.5 text-sm leading-5 font-medium">
            Disponibilidad
          </legend>
          <Controller
            control={control}
            name="weekdays"
            render={({ field: { value, onChange } }) => (
              <div className="flex flex-col gap-1.5">
                <span
                  id={field('weekdays').id}
                  className="text-sm text-muted-foreground"
                >
                  Días de la semana
                </span>
                <ToggleGroup
                  type="multiple"
                  variant="pill"
                  spacing={1.5}
                  aria-labelledby={field('weekdays').id}
                  aria-describedby={
                    errors.weekdays ? field('weekdays').errorId : undefined
                  }
                  value={value.map(String)}
                  onValueChange={(days) => onChange(days.map(Number))}
                  className="flex-wrap"
                >
                  {WEEKDAYS.map((day) => (
                    <ToggleGroupItem
                      key={day.value}
                      value={String(day.value)}
                      aria-label={day.label}
                      className="w-11 px-0"
                    >
                      {day.short}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                {errors.weekdays && (
                  <p
                    id={field('weekdays').errorId}
                    className="text-sm text-destructive"
                  >
                    {errors.weekdays.message}
                  </p>
                )}
              </div>
            )}
          />
          <Controller
            control={control}
            name="times"
            render={({ field: { value, onChange } }) => (
              <TimeSlots
                value={value}
                onChange={onChange}
                error={errors.times?.message}
              />
            )}
          />
        </fieldset>

        <Controller
          control={control}
          name="imageUrl"
          render={({ field: { value, onChange } }) => (
            <ImageDrop value={value} onChange={onChange} />
          )}
        />

        <Controller
          control={control}
          name="published"
          render={({ field: { value, onChange } }) => (
            <div className="flex min-h-11 items-center justify-between gap-3 md:justify-start">
              <Label
                htmlFor={field('published').id}
                className="order-1 font-normal md:order-2"
              >
                Publicado (visible para clientes)
              </Label>
              <Switch
                id={field('published').id}
                checked={value}
                onCheckedChange={onChange}
                className="order-2 md:order-1"
              />
            </div>
          )}
        />
      </fieldset>
    </form>
  )
}

export function Field({
  label,
  htmlFor,
  error,
  errorId,
  hint,
  className,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  errorId?: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor} className="leading-5">
        {label}
      </Label>
      {children}
      {hint && !error && (
        <p className="text-caption text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function ControlledSelect({
  control,
  name,
  options,
  placeholder,
  triggerProps,
}: {
  control: Control<ServiceValues>
  name: 'category' | 'mode' | 'professionalId'
  options: { value: string; label: string }[]
  placeholder?: string
  triggerProps: React.ComponentProps<typeof SelectTrigger>
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={field.value || undefined} onValueChange={field.onChange}>
          <SelectTrigger
            {...triggerProps}
            onBlur={field.onBlur}
            ref={field.ref}
            className="w-full"
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  )
}

/** Franjas de inicio de sesión: chips con la hora y un campo para añadir más. */
function TimeSlots({
  value,
  onChange,
  error,
}: {
  value: string[]
  onChange: (value: string[]) => void
  error?: string
}) {
  const id = useId()
  const [draft, setDraft] = useState('')
  const [draftError, setDraftError] = useState<string | null>(null)
  const message = draftError ?? error

  function add() {
    if (!/^\d{2}:\d{2}$/.test(draft)) {
      setDraftError('Indica una hora válida')
      return
    }
    if (value.includes(draft)) {
      setDraftError('Esa franja ya está añadida')
      return
    }
    setDraftError(null)
    onChange([...value, draft].sort())
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="font-normal text-muted-foreground">
        Franjas horarias (hora de inicio)
      </Label>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Franjas añadidas">
          {value.map((time) => (
            <li
              key={time}
              className="flex h-9 items-center gap-0.5 rounded-full border bg-background pr-0.5 pl-3 font-mono text-sm"
            >
              {time}
              <button
                type="button"
                aria-label={`Quitar franja de las ${time}`}
                onClick={() => onChange(value.filter((t) => t !== time))}
                className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          id={id}
          type="time"
          step={300}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? `${id}-error` : undefined}
          className="w-36 font-mono"
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus aria-hidden />
          Añadir franja
        </Button>
      </div>
      {message && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {message}
        </p>
      )}
    </div>
  )
}

/** Zona de arrastre. La imagen se sube a RustFS (`uploadImage`) y se guarda su URL. */
function ImageDrop({
  value,
  onChange,
}: {
  value?: string
  onChange: (value: string) => void
}) {
  const id = useId()
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  function read(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('El archivo tiene que ser una imagen')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('La imagen pesa demasiado (máximo 5 MB)')
      return
    }
    setError(null)
    const form = new FormData()
    form.append('file', file)
    setUploading(true)
    uploadImage({ data: form })
      .then(({ url }) => onChange(url))
      .catch(() => setError('No hemos podido subir la imagen'))
      .finally(() => setUploading(false))
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm leading-5 font-medium">Imagen</span>
      {value ? (
        <div className="relative overflow-hidden rounded-lg border">
          <img
            src={value}
            alt="Imagen del servicio"
            className="aspect-video w-full object-cover"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => onChange('')}
          >
            <X aria-hidden />
            Quitar imagen
          </Button>
        </div>
      ) : (
        <label
          htmlFor={id}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            read(e.dataTransfer.files[0])
          }}
          className={cn(
            'flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-input bg-secondary px-4 py-3 text-center text-sm text-muted-foreground transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background hover:bg-accent md:min-h-24',
            dragging && 'border-primary bg-accent',
          )}
        >
          <ImagePlus aria-hidden className="hidden size-5 md:block" />
          <span className="md:hidden">Subir imagen del servicio</span>
          <span className="hidden md:inline">
            {uploading
              ? 'Subiendo imagen…'
              : 'Arrastra una imagen o haz clic para subirla'}
          </span>
          <input
            id={id}
            type="file"
            accept="image/*"
            disabled={uploading}
            className="sr-only"
            aria-describedby={error ? `${id}-error` : undefined}
            onChange={(e) => read(e.target.files?.[0])}
          />
        </label>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
