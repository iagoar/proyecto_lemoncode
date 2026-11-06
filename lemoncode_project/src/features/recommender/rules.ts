import type { Category, Service } from '#/lib/api/types'
import type { Answers } from './questions'

// Recomendación sin IA: se usa si no hay API key o si la IA falla.
// Puntúa cada servicio según las respuestas y elige el mejor.

type Goal = Exclude<Answers['goal'], 'otro'>

const goalCategories: Record<Goal, Category[]> = {
  carrera: ['coaching'],
  comunicar: ['formacion'],
  bienestar: ['bienestar'],
  aprender: ['formacion'],
}

const goalKeywords: Record<Goal, string[]> = {
  carrera: ['liderazgo', 'carrera', 'equipo', 'decision', 'empleo', 'rol'],
  comunicar: ['public', 'presenta', 'voz', 'comunica', 'oratoria'],
  bienestar: ['mindfulness', 'estres', 'habito', 'nutri', 'atencion'],
  aprender: ['producto', 'taller', 'practic', 'aprende', 'formacion'],
}

function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function scoreService(service: Service, answers: Answers) {
  let score = 0
  const text = normalize(
    `${service.name} ${service.summary} ${service.description}`,
  )

  if (answers.goal !== 'otro') {
    if (goalCategories[answers.goal].includes(service.category)) score += 5
    score += goalKeywords[answers.goal].filter((k) => text.includes(k)).length
  }

  // Las respuestas escritas a mano («otro») solo puntúan por palabras clave.
  if (answers.mode !== 'indiferente' && answers.mode !== 'otro') {
    score += service.mode === answers.mode ? 3 : -3
  }

  if (
    answers.budget !== 'indiferente' &&
    answers.budget !== 'otro' &&
    service.priceCents !== null
  ) {
    score += service.priceCents <= Number(answers.budget) * 100 ? 2 : -2
  }

  if (answers.duration === 'corta') score += service.durationMin <= 45 ? 2 : -1
  if (answers.duration === 'larga') score += service.durationMin >= 60 ? 2 : -1

  const freeText = [answers.comment, ...Object.values(answers.other)]
    .filter(Boolean)
    .join(' ')
  if (freeText) {
    const words = normalize(freeText)
      .split(/\W+/)
      .filter((w) => w.length > 4)
    score += words.filter((w) => text.includes(w)).length
  }

  return score
}

export function recommendByRules<S extends Service>(
  candidates: S[],
  answers: Answers,
) {
  const ranked = [...candidates].sort(
    (a, b) => scoreService(b, answers) - scoreService(a, answers),
  )
  return { best: ranked[0], alternative: ranked[1] }
}
