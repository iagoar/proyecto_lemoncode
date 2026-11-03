import { cva } from 'class-variance-authority'

// Estados compartidos por días (calendario y tira) y franjas horarias.
// Lo no disponible va además tachado: el estado nunca depende solo del color.
export const pickerButton = cva(
  'rounded-md border font-mono transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed',
  {
    variants: {
      state: {
        selected:
          'border-primary bg-primary font-semibold text-primary-foreground',
        available:
          'border-input bg-background font-medium text-foreground hover:bg-accent',
        unavailable:
          'border-border bg-secondary text-muted-foreground line-through',
        past: 'border-transparent bg-transparent text-input',
      },
    },
  },
)
