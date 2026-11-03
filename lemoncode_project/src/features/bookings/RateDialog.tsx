import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/components/ui/dialog'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import type { BookingWithService } from '#/lib/api/types'
import { cn } from '#/lib/utils'

type Rating = 1 | 2 | 3 | 4 | 5

const RATINGS: Rating[] = [1, 2, 3, 4, 5]

// "Valorar" en Pasadas (HANDOFF §5.5): estrellas + texto opcional.
export function RateDialog({
  booking,
  pending,
  onOpenChange,
  onSubmit,
}: {
  booking: BookingWithService | null
  pending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (rating: Rating, text: string) => void
}) {
  const [rating, setRating] = useState<Rating | null>(null)
  const [text, setText] = useState('')
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    if (!booking) return
    setRating(null)
    setText('')
    setShowError(false)
  }, [booking])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!rating) {
      setShowError(true)
      return
    }
    onSubmit(rating, text.trim())
  }

  return (
    <Dialog open={booking !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Valorar «{booking?.service.name}»</DialogTitle>
        <DialogDescription>
          Tu opinión aparecerá en la ficha del servicio.
        </DialogDescription>
        <form noValidate onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span id="valoracion" className="text-sm font-medium">
              Valoración
            </span>
            <div
              role="radiogroup"
              aria-labelledby="valoracion"
              aria-describedby={showError ? 'valoracion-error' : undefined}
              className="flex gap-1"
            >
              {RATINGS.map((value) => {
                const filled = rating !== null && value <= rating
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} de 5`}
                    onClick={() => {
                      setRating(value)
                      setShowError(false)
                    }}
                    className="grid size-11 place-items-center rounded-md outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <Star
                      aria-hidden
                      className={cn(
                        'size-7',
                        filled
                          ? 'fill-foreground text-foreground'
                          : 'text-input',
                      )}
                    />
                  </button>
                )
              })}
            </div>
            {showError && (
              <p id="valoracion-error" className="text-sm text-destructive">
                Elige de 1 a 5 estrellas
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="opinion">Tu opinión (opcional)</Label>
            <Textarea
              id="opinion"
              rows={4}
              maxLength={500}
              placeholder="¿Qué tal fue la sesión?"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Publicando…' : 'Publicar opinión'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
