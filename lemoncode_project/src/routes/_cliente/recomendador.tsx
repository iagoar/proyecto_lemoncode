import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { ChevronLeft, RotateCcw, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { Label } from '#/components/ui/label'
import { Progress } from '#/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '#/components/ui/radio-group'
import { Skeleton } from '#/components/ui/skeleton'
import { Textarea } from '#/components/ui/textarea'
import { ServiceCard } from '#/features/catalog/ServiceCard'
import { Input } from '#/components/ui/input'
import {
  OTHER,
  OTHER_MAX_LENGTH,
  QUESTIONS,
  type Answers,
  type ChoiceKey,
} from '#/features/recommender/questions'
import { recommend } from '#/lib/api/recommend'
import { servicesQueries } from '#/lib/api/services'
import { getSettings } from '#/lib/api/settings'

export const Route = createFileRoute('/_cliente/recomendador')({
  // Ajustes del backoffice: con el recomendador desactivado, vuelve al catálogo.
  beforeLoad: async () => {
    const { recommenderEnabled } = await getSettings()
    if (!recommenderEnabled) throw redirect({ to: '/servicios' })
  },
  head: () => ({ meta: [{ title: 'Te ayudamos a elegir · rumbo.' }] }),
  component: RecommenderPage,
})

// Preguntas fijas + un último paso de comentario libre.
const TOTAL_STEPS = QUESTIONS.length + 1

function RecommenderPage() {
  const catalog = useQuery(servicesQueries.list({ pageSize: 100 }))
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<Omit<Answers, 'other'>>>({})
  // Texto de «Otra cosa» por pregunta; se conserva aunque cambie la opción.
  const [otherText, setOtherText] = useState<
    Partial<Record<ChoiceKey, string>>
  >({})
  const mutation = useMutation({
    mutationFn: (complete: Answers) =>
      recommend(complete, catalog.data?.items ?? []),
  })

  function restart() {
    mutation.reset()
    setAnswers({})
    setOtherText({})
    setStep(0)
  }

  const question = QUESTIONS[step]
  const isCommentStep = step === QUESTIONS.length
  const choice = question ? answers[question.key] : undefined
  const canContinue = question
    ? choice !== undefined &&
      (choice !== OTHER || Boolean(otherText[question.key]?.trim()))
    : true

  function next() {
    if (!isCommentStep) return setStep(step + 1)
    // Solo viaja el texto libre de las preguntas respondidas con «Otra cosa».
    const other: Answers['other'] = {}
    for (const q of QUESTIONS) {
      if (answers[q.key] === OTHER) other[q.key] = otherText[q.key]?.trim()
    }
    mutation.mutate({
      ...(answers as Omit<Answers, 'other'>),
      other,
      comment: answers.comment?.trim() || undefined,
    })
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 pt-5 pb-6 md:gap-6 md:px-6 md:pt-10 md:pb-14">
      <div className="flex flex-col gap-1 md:gap-2">
        <p className="flex items-center gap-1.5 font-display text-eyebrow text-muted-foreground uppercase">
          <Sparkles aria-hidden className="size-4" />
          Recomendador
        </p>
        <h1 className="text-h2 font-bold md:text-h1">Te ayudamos a elegir</h1>
        <p className="text-sm text-muted-foreground md:text-body-lg">
          Responde unas preguntas rápidas y te recomendamos el servicio que
          mejor encaja contigo.
        </p>
      </div>

      {mutation.isSuccess ? (
        <Result recommendation={mutation.data} onRestart={restart} />
      ) : mutation.isPending ? (
        <Card
          className="items-center gap-3 px-6 py-12 text-center"
          aria-live="polite"
        >
          <Sparkles aria-hidden className="size-8 animate-pulse text-primary" />
          <p className="font-display text-h3">Buscando tu servicio ideal…</p>
          <p className="text-sm text-muted-foreground">
            Estamos comparando tus respuestas con el catálogo.
          </p>
        </Card>
      ) : catalog.isPending ? (
        <Skeleton className="h-80 w-full rounded-xl" />
      ) : catalog.isError ? (
        <Card className="items-center gap-3 px-6 py-12 text-center">
          <h2 className="text-h3">No hemos podido cargar los servicios</h2>
          <Button variant="outline" onClick={() => catalog.refetch()}>
            Reintentar
          </Button>
        </Card>
      ) : (
        <Card className="gap-5 p-5 md:p-7">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-caption text-muted-foreground">
              Paso {step + 1} de {TOTAL_STEPS}
            </p>
            <Progress
              value={((step + 1) / TOTAL_STEPS) * 100}
              aria-label={`Paso ${step + 1} de ${TOTAL_STEPS}`}
            />
          </div>

          {question ? (
            <fieldset className="flex flex-col gap-4">
              <legend className="mb-4 font-display text-h3 font-semibold">
                {question.title}
              </legend>
              <RadioGroup
                value={answers[question.key] ?? ''}
                onValueChange={(value) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [question.key as ChoiceKey]: value,
                  }))
                }
              >
                {question.options.map((option) => {
                  const id = `${question.key}-${option.value}`
                  return (
                    <Label
                      key={option.value}
                      htmlFor={id}
                      className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-input p-4 font-normal transition-colors hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
                    >
                      <RadioGroupItem id={id} value={option.value} />
                      <span className="flex flex-col gap-0.5">
                        <span className="font-medium">{option.label}</span>
                        {option.hint && (
                          <span className="text-sm text-muted-foreground">
                            {option.hint}
                          </span>
                        )}
                      </span>
                    </Label>
                  )
                })}
                <Label
                  htmlFor={`${question.key}-${OTHER}`}
                  className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input p-4 font-normal transition-colors hover:bg-accent has-[[data-state=checked]]:border-solid has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
                >
                  <RadioGroupItem
                    id={`${question.key}-${OTHER}`}
                    value={OTHER}
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium">Otra cosa</span>
                    <span className="text-sm text-muted-foreground">
                      Si ninguna opción te encaja, escríbelo con tus palabras
                    </span>
                  </span>
                </Label>
              </RadioGroup>
              {choice === OTHER && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${question.key}-${OTHER}-texto`}>
                    Tu respuesta
                  </Label>
                  <Input
                    id={`${question.key}-${OTHER}-texto`}
                    autoFocus
                    maxLength={OTHER_MAX_LENGTH}
                    placeholder={question.otherPlaceholder}
                    value={otherText[question.key] ?? ''}
                    onChange={(e) =>
                      setOtherText((prev) => ({
                        ...prev,
                        [question.key]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && canContinue) next()
                    }}
                  />
                </div>
              )}
            </fieldset>
          ) : (
            <div className="flex flex-col gap-3">
              <Label
                htmlFor="comment"
                className="font-display text-h3 font-semibold"
              >
                ¿Algo más que debamos saber?
              </Label>
              <p className="text-sm text-muted-foreground">
                Opcional. Cuéntanos tu situación en una o dos frases: cuanto más
                concreto, mejor será la recomendación.
              </p>
              <Textarea
                id="comment"
                rows={4}
                maxLength={500}
                placeholder="Por ejemplo: acabo de ascender y me cuesta delegar en mi equipo."
                value={answers.comment ?? ''}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, comment: e.target.value }))
                }
              />
            </div>
          )}

          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              No hemos podido generar la recomendación. Vuelve a intentarlo.
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <Button
              variant="ghost"
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
            >
              <ChevronLeft /> Atrás
            </Button>
            <Button size="lg" disabled={!canContinue} onClick={next}>
              {isCommentStep ? 'Ver mi recomendación' : 'Siguiente'}
            </Button>
          </div>
        </Card>
      )}
    </main>
  )
}

function Result({
  recommendation,
  onRestart,
}: {
  recommendation: Awaited<ReturnType<typeof recommend>>
  onRestart: () => void
}) {
  const { service, alternative, reason, source } = recommendation

  return (
    <div className="flex flex-col gap-5" aria-live="polite">
      <Card className="gap-3 p-5 md:p-7">
        <Badge variant="outline" className="w-fit gap-1">
          <Sparkles aria-hidden className="size-3.5" />
          {source === 'ia' ? 'Recomendado con IA' : 'Recomendación orientativa'}
        </Badge>
        <h2 className="font-display text-h3 font-semibold">
          Te recomendamos {service.name}
        </h2>
        <p className="text-muted-foreground">
          {reason ??
            'Es el servicio que mejor encaja con tu objetivo, la modalidad, el presupuesto y el tiempo que nos has indicado.'}
        </p>
      </Card>

      <ServiceCard service={service} />

      <div className="flex flex-col gap-3 md:flex-row">
        <Button asChild size="lg" className="md:flex-1">
          <Link to="/reservar/$slug" params={{ slug: service.slug }}>
            Reservar este servicio
          </Link>
        </Button>
        <Button variant="outline" size="lg" onClick={onRestart}>
          <RotateCcw /> Volver a empezar
        </Button>
      </div>

      {alternative && (
        <section className="flex flex-col gap-3 pt-2">
          <h2 className="font-display text-eyebrow text-muted-foreground uppercase">
            También podría interesarte
          </h2>
          <ServiceCard service={alternative} />
        </section>
      )}

      <Button asChild variant="link" className="self-center">
        <Link to="/servicios">Ver todo el catálogo</Link>
      </Button>
    </div>
  )
}
