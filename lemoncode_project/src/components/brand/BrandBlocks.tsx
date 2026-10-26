import { cn } from '#/lib/utils'

// Cuadrados decorativos del panel de marca (HANDOFF §5.1). Siempre aria-hidden.
const desktop = [
  'bg-brand-ink-soft',
  'bg-brand-blue',
  'bg-brand-ink-soft',
  'bg-brand-ink-soft',
  'bg-brand-blue-100',
  'bg-brand-blue',
]

const compact = [
  'bg-brand-ink-soft',
  'bg-brand-blue',
  'bg-brand-ink-soft',
  'bg-brand-blue-100',
]

export function BrandBlocks({
  variant = 'desktop',
  className,
}: {
  variant?: 'desktop' | 'compact'
  className?: string
}) {
  const isCompact = variant === 'compact'
  const blocks = isCompact ? compact : desktop

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute grid',
        isCompact
          ? 'top-8 -right-6 grid-cols-[repeat(2,64px)] gap-2.5'
          : 'top-30 -right-10 grid-cols-[repeat(3,120px)] gap-4',
        className,
      )}
    >
      {blocks.map((color, i) => (
        <div
          key={i}
          className={cn(
            color,
            isCompact ? 'h-16 rounded-[18px]' : 'h-30 rounded-[28px]',
          )}
        />
      ))}
    </div>
  )
}
