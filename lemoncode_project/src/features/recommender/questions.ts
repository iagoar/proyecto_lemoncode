import { z } from 'zod'

// Encuesta del recomendador: preguntas fijas tipo test + un comentario libre.
// Las respuestas viajan al servidor (IA) y también alimentan las reglas de respaldo.

// Cada pregunta acepta además «otro»: el usuario escribe su propia respuesta
// (en `other[clave]`) si ninguna opción le convence.
export const OTHER = 'otro'
export const OTHER_MAX_LENGTH = 200

const otherText = z.string().trim().min(1).max(OTHER_MAX_LENGTH)

export const answersSchema = z.object({
  goal: z.enum(['carrera', 'comunicar', 'bienestar', 'aprender', OTHER]),
  mode: z.enum(['online', 'presencial', 'indiferente', OTHER]),
  budget: z.enum(['50', '75', 'indiferente', OTHER]),
  duration: z.enum(['corta', 'larga', 'indiferente', OTHER]),
  other: z
    .object({
      goal: otherText,
      mode: otherText,
      budget: otherText,
      duration: otherText,
    })
    .partial()
    .default({}),
  comment: z.string().trim().max(500).optional(),
})

export type Answers = z.infer<typeof answersSchema>
export type ChoiceKey = Exclude<keyof Answers, 'comment' | 'other'>

export interface Question<K extends ChoiceKey = ChoiceKey> {
  key: K
  title: string
  options: {
    value: Exclude<Answers[K], typeof OTHER>
    label: string
    hint?: string
  }[]
  /** Ejemplo para el campo de respuesta libre. */
  otherPlaceholder: string
}

export const QUESTIONS: Question[] = [
  {
    key: 'goal',
    title: '¿Qué te gustaría conseguir?',
    options: [
      {
        value: 'carrera',
        label: 'Avanzar en mi carrera',
        hint: 'Liderar mejor, cambiar de rol o tomar decisiones',
      },
      {
        value: 'comunicar',
        label: 'Comunicar con seguridad',
        hint: 'Presentaciones, reuniones o hablar en público',
      },
      {
        value: 'bienestar',
        label: 'Cuidarme y reducir el estrés',
        hint: 'Hábitos, descanso y atención plena',
      },
      {
        value: 'aprender',
        label: 'Aprender una habilidad concreta',
        hint: 'Formación práctica con un especialista',
      },
    ],
    otherPlaceholder: 'Por ejemplo: mejorar mi relación con mi equipo',
  },
  {
    key: 'mode',
    title: '¿Cómo prefieres las sesiones?',
    options: [
      { value: 'online', label: 'Online', hint: 'Por videollamada' },
      { value: 'presencial', label: 'Presencial', hint: 'En persona' },
      { value: 'indiferente', label: 'Me da igual' },
    ],
    otherPlaceholder: 'Por ejemplo: online, pero alguna sesión en persona',
  },
  {
    key: 'budget',
    title: '¿Cuánto quieres gastar por sesión?',
    options: [
      { value: '50', label: 'Hasta 50 €' },
      { value: '75', label: 'Hasta 75 €' },
      { value: 'indiferente', label: 'No tengo un límite' },
    ],
    otherPlaceholder: 'Por ejemplo: unos 100 € en total',
  },
  {
    key: 'duration',
    title: '¿Cuánto tiempo puedes dedicar a cada sesión?',
    options: [
      { value: 'corta', label: 'Poco, 45 min o menos' },
      { value: 'larga', label: 'Una hora o más' },
      { value: 'indiferente', label: 'Me da igual' },
    ],
    otherPlaceholder: 'Por ejemplo: solo los fines de semana',
  },
]

/** Respuesta en texto legible, para el prompt de la IA. */
export function answerLabel(key: ChoiceKey, answers: Answers) {
  if (answers[key] === OTHER) {
    return `Otra respuesta, escrita por el usuario: """${answers.other[key] ?? ''}"""`
  }
  const question = QUESTIONS.find((q) => q.key === key)
  const option = question?.options.find((o) => o.value === answers[key])
  return option
    ? `${option.label}${option.hint ? ` (${option.hint})` : ''}`
    : ''
}
