import type { Professional, Service } from './types'

// Datos de ejemplo. TODO: sustituir por contenido real (HANDOFF §11).

export const professionalsSeed: Professional[] = [
  {
    id: 'pro-1',
    name: 'Laura Gómez',
    title: 'Coach ejecutiva certificada (ICF PCC)',
    bio: 'Más de 12 años acompañando a equipos directivos en procesos de cambio.',
  },
  {
    id: 'pro-2',
    name: 'Daniel Ortega',
    title: 'Formador en comunicación y oratoria',
    bio: 'Ha preparado a cientos de profesionales para hablar en público con seguridad.',
  },
  {
    id: 'pro-3',
    name: 'Marta Ruiz',
    title: 'Instructora de mindfulness y dietista-nutricionista',
    bio: 'Combina hábitos saludables y atención plena para cambios sostenibles.',
  },
  {
    id: 'pro-4',
    name: 'Javier Sanz',
    title: 'Product lead y mentor',
    bio: 'Ha liderado producto en startups y empresas de más de 500 personas.',
  },
]

export const servicesSeed: Service[] = [
  {
    id: 'srv-1',
    slug: 'coaching-ejecutivo',
    name: 'Coaching ejecutivo',
    category: 'coaching',
    mode: 'online',
    durationMin: 60,
    priceCents: 6500,
    professionalId: 'pro-1',
    summary: 'Liderazgo, decisiones y gestión de equipos.',
    description:
      'Sesiones individuales para trabajar tu estilo de liderazgo, tomar decisiones con más claridad y gestionar equipos en momentos de cambio.',
    includes: [
      'Sesión individual por videollamada',
      'Plan de acción tras cada sesión',
      'Seguimiento por email entre sesiones',
    ],
    published: true,
  },
  {
    id: 'srv-2',
    slug: 'coaching-de-carrera',
    name: 'Coaching de carrera',
    category: 'coaching',
    mode: 'online',
    durationMin: 45,
    priceCents: 5000,
    professionalId: 'pro-1',
    summary: 'Cambio de rol, búsqueda de empleo y marca personal.',
    description:
      'Define tu siguiente paso profesional, prepara entrevistas y mejora cómo te presentas en tu sector.',
    includes: ['Revisión de CV y LinkedIn', 'Simulación de entrevista'],
    published: true,
  },
  {
    id: 'srv-3',
    slug: 'hablar-en-publico',
    name: 'Hablar en público',
    category: 'formacion',
    mode: 'presencial',
    durationMin: 90,
    priceCents: 8000,
    professionalId: 'pro-2',
    summary: 'Estructura, voz y gestión de nervios.',
    description:
      'Taller práctico para estructurar tus presentaciones, trabajar la voz y ganar confianza delante de cualquier audiencia.',
    includes: ['Grabación y análisis de tu intervención', 'Guía de estructura'],
    published: true,
  },
  {
    id: 'srv-4',
    slug: 'mindfulness-inicial',
    name: 'Mindfulness inicial',
    category: 'bienestar',
    mode: 'online',
    durationMin: 60,
    priceCents: 4000,
    professionalId: 'pro-3',
    summary: 'Primeros pasos en atención plena.',
    description:
      'Aprende técnicas sencillas de atención plena para reducir el estrés y mejorar tu concentración en el día a día.',
    includes: ['Prácticas guiadas', 'Audios para practicar en casa'],
    published: true,
  },
  {
    id: 'srv-5',
    slug: 'asesoria-nutricional',
    name: 'Asesoría nutricional',
    category: 'bienestar',
    mode: 'presencial',
    durationMin: 45,
    priceCents: 5500,
    professionalId: 'pro-3',
    summary: 'Hábitos y planificación de comidas.',
    description:
      'Revisamos tus hábitos y diseñamos una planificación de comidas realista y adaptada a tu ritmo.',
    includes: ['Valoración inicial', 'Plan semanal de comidas'],
    published: true,
  },
  {
    id: 'srv-6',
    slug: 'mentoria-de-producto',
    name: 'Mentoría de producto',
    category: 'formacion',
    mode: 'online',
    durationMin: 60,
    priceCents: 7000,
    professionalId: 'pro-4',
    summary: 'Discovery, roadmap y priorización.',
    description:
      'Mentoría para product managers: discovery con usuarios, construcción de roadmap y priorización con criterio.',
    includes: ['Revisión de tu roadmap', 'Plantillas de discovery'],
    published: true,
  },
]
