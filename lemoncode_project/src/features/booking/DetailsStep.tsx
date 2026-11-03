import { zodResolver } from '@hookform/resolvers/zod'
import { Lock } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Card } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { RadioGroup, RadioGroupItem } from '#/components/ui/radio-group'
import { Textarea } from '#/components/ui/textarea'
import { paymentGatewayNote } from '#/content/legal'
import type { BookingContact, PaymentMethod } from '#/lib/api/types'
import { cn } from '#/lib/utils'

export const DETAILS_FORM_ID = 'datos-reserva'

const detailsSchema = z
  .object({
    name: z.string().trim().min(1, 'Introduce tu nombre y apellidos'),
    email: z
      .string()
      .trim()
      .min(1, 'Introduce tu email')
      .email('Introduce un email válido'),
    phone: z
      .string()
      .trim()
      .refine(
        (v) => !v || /^\+?[\d\s()-]{9,}$/.test(v),
        'Introduce un teléfono válido',
      ),
    notes: z.string().trim().max(500, 'Máximo 500 caracteres'),
    paymentMethod: z.enum(['tarjeta', 'en_sesion']),
    cardNumber: z.string(),
    cardExpiry: z.string(),
    cardCvc: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.paymentMethod !== 'tarjeta') return
    const digits = v.cardNumber.replace(/\s/g, '')
    if (!/^\d{13,19}$/.test(digits)) {
      ctx.addIssue({
        code: 'custom',
        path: ['cardNumber'],
        message: 'Introduce un número de tarjeta válido',
      })
    }
    const expiry = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(v.cardExpiry)
    if (!expiry) {
      ctx.addIssue({
        code: 'custom',
        path: ['cardExpiry'],
        message: 'Usa el formato MM/AA',
      })
    } else {
      const now = new Date()
      const expiresAt = new Date(2000 + Number(expiry[2]), Number(expiry[1]), 1)
      if (expiresAt <= now) {
        ctx.addIssue({
          code: 'custom',
          path: ['cardExpiry'],
          message: 'La tarjeta está caducada',
        })
      }
    }
    if (!/^\d{3,4}$/.test(v.cardCvc)) {
      ctx.addIssue({
        code: 'custom',
        path: ['cardCvc'],
        message: 'Introduce el CVC',
      })
    }
  })

type DetailsValues = z.infer<typeof detailsSchema>

export interface DetailsSubmit {
  contact: BookingContact
  notes?: string
  paymentMethod: PaymentMethod
}

const paymentOptions: { value: PaymentMethod; label: string; hint: string }[] =
  [
    {
      value: 'tarjeta',
      label: 'Tarjeta',
      hint: 'Pagas ahora y queda confirmada',
    },
    {
      value: 'en_sesion',
      label: 'Pagar en la sesión',
      hint: 'Queda pendiente de pago',
    },
  ]

// Paso 2 (HANDOFF §5.4). El botón de envío vive fuera (aside o barra móvil)
// y apunta a este formulario con `form={DETAILS_FORM_ID}`.
export function DetailsStep({
  defaults,
  onChange,
  onSubmit,
  error,
}: {
  defaults: {
    contact: BookingContact
    notes?: string
    paymentMethod: PaymentMethod
  }
  onChange: (draft: DetailsSubmit) => void
  onSubmit: (values: DetailsSubmit) => void
  error?: string
}) {
  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      name: defaults.contact.name,
      email: defaults.contact.email,
      phone: defaults.contact.phone ?? '',
      notes: defaults.notes ?? '',
      paymentMethod: defaults.paymentMethod,
      cardNumber: '',
      cardExpiry: '',
      cardCvc: '',
    },
  })

  // Vuelca al borrador lo que no es de la tarjeta, para no perderlo al volver al paso 1.
  useEffect(() => {
    const sub = watch((v) =>
      onChange({
        contact: {
          name: v.name ?? '',
          email: v.email ?? '',
          phone: v.phone || undefined,
        },
        notes: v.notes || undefined,
        paymentMethod: v.paymentMethod ?? 'tarjeta',
      }),
    )
    return () => sub.unsubscribe()
  }, [watch, onChange])

  const paymentMethod = watch('paymentMethod')

  const submit = handleSubmit((v) =>
    onSubmit({
      contact: { name: v.name, email: v.email, phone: v.phone || undefined },
      notes: v.notes || undefined,
      paymentMethod: v.paymentMethod,
    }),
  )

  return (
    <Card className="gap-0 border-0 bg-transparent py-0 shadow-none md:border md:bg-card md:p-6">
      <form
        id={DETAILS_FORM_ID}
        noValidate
        onSubmit={submit}
        className="flex flex-col gap-4 md:gap-5"
      >
        <h2 className="font-display text-lg leading-6 font-semibold md:text-h3">
          Tus datos
        </h2>
        <div className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
          <Field
            id="nombre"
            label="Nombre y apellidos"
            error={errors.name?.message}
          >
            {(p) => <Input {...p} autoComplete="name" {...register('name')} />}
          </Field>
          <Field id="email" label="Email" error={errors.email?.message}>
            {(p) => (
              <Input
                {...p}
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                {...register('email')}
              />
            )}
          </Field>
          <Field
            id="telefono"
            label="Teléfono (opcional)"
            error={errors.phone?.message}
          >
            {(p) => (
              <Input
                {...p}
                type="tel"
                autoComplete="tel"
                placeholder="+34 600 000 000"
                {...register('phone')}
              />
            )}
          </Field>
        </div>
        <Field
          id="notas"
          label="Notas para el profesional (opcional)"
          error={errors.notes?.message}
        >
          {(p) => (
            <Textarea
              {...p}
              rows={3}
              placeholder="¿Qué te gustaría trabajar?"
              {...register('notes')}
            />
          )}
        </Field>

        <fieldset className="mt-2 flex flex-col gap-3 md:mt-0 md:border-t md:pt-5">
          <legend className="contents">
            <span className="font-display text-lg leading-6 font-semibold md:text-h3">
              Método de pago
            </span>
          </legend>
          <Controller
            control={control}
            name="paymentMethod"
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                aria-label="Método de pago"
                className="gap-2 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] md:gap-3"
              >
                {paymentOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border border-input bg-background px-3.5 py-3 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-accent has-data-[state=checked]:ring-1 has-data-[state=checked]:ring-primary md:px-4"
                  >
                    <RadioGroupItem
                      value={option.value}
                      aria-describedby={`pago-${option.value}-ayuda`}
                    />
                    <span className="flex flex-col">
                      <span className="font-semibold">{option.label}</span>
                      <span
                        id={`pago-${option.value}-ayuda`}
                        className="text-caption text-muted-foreground"
                      >
                        {option.hint}
                      </span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
            )}
          />

          {paymentMethod === 'tarjeta' && (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-[2fr_1fr_1fr]">
                <Field
                  id="tarjeta"
                  label="Número de tarjeta"
                  error={errors.cardNumber?.message}
                  className="col-span-2 md:col-span-1"
                >
                  {(p) => (
                    <Controller
                      control={control}
                      name="cardNumber"
                      render={({ field }) => (
                        <Input
                          {...p}
                          {...field}
                          inputMode="numeric"
                          autoComplete="cc-number"
                          placeholder="0000 0000 0000 0000"
                          className="font-mono"
                          onChange={(e) =>
                            field.onChange(formatCardNumber(e.target.value))
                          }
                        />
                      )}
                    />
                  )}
                </Field>
                <Field
                  id="caducidad"
                  label="Caducidad"
                  error={errors.cardExpiry?.message}
                >
                  {(p) => (
                    <Controller
                      control={control}
                      name="cardExpiry"
                      render={({ field }) => (
                        <Input
                          {...p}
                          {...field}
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          placeholder="MM/AA"
                          className="font-mono"
                          onChange={(e) =>
                            field.onChange(formatExpiry(e.target.value))
                          }
                        />
                      )}
                    />
                  )}
                </Field>
                <Field id="cvc" label="CVC" error={errors.cardCvc?.message}>
                  {(p) => (
                    <Input
                      {...p}
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      maxLength={4}
                      className="font-mono"
                      {...register('cardCvc')}
                    />
                  )}
                </Field>
              </div>
              <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
                <Lock aria-hidden className="size-3.5" />
                {paymentGatewayNote}
              </p>
            </>
          )}
        </fieldset>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </form>
    </Card>
  )
}

interface FieldProps {
  id: string
  'aria-invalid'?: true
  'aria-describedby'?: string
}

/** Etiqueta + control + error; el render prop recibe id y atributos aria. */
function Field({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string
  label: string
  error?: string
  className?: string
  children: (props: FieldProps) => React.ReactNode
}) {
  const errorId = `${id}-error`
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="leading-5">
        {label}
      </Label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}
