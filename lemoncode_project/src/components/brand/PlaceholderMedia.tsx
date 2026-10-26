import { GraduationCap, Leaf, Navigation, type LucideIcon } from 'lucide-react'

import type { Category } from '#/lib/api/types'
import { cn } from '#/lib/utils'

// Bloque de color por categoría cuando un servicio no tiene imagen (HANDOFF §5.2).
const media: Record<Category, { icon: LucideIcon; className: string }> = {
  coaching: {
    icon: Navigation,
    className: 'bg-brand-blue-100 text-primary dark:text-brand-ink',
  },
  bienestar: { icon: Leaf, className: 'bg-accent text-primary' },
  formacion: { icon: GraduationCap, className: 'bg-border text-primary' },
}

export function PlaceholderMedia({
  category,
  imageUrl,
  className,
  iconClassName,
  children,
}: {
  category: Category
  imageUrl?: string
  className?: string
  iconClassName?: string
  children?: React.ReactNode
}) {
  const { icon: Icon, className: tint } = media[category]

  return (
    <div
      className={cn(
        'relative grid place-items-center overflow-hidden',
        !imageUrl && tint,
        className,
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <Icon aria-hidden strokeWidth={1.5} className={cn('size-12', iconClassName)} />
      )}
      {children}
    </div>
  )
}
