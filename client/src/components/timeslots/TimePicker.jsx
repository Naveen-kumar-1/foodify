import { useEffect, useRef, useState } from 'react'
import { Clock, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatTime12h, to12hParts, toTime24h } from '@/lib/time'

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
const PERIODS = ['AM', 'PM']

const TimePicker = ({ value = '09:00', onChange, disabled, label, error }) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const parts = to12hParts(value)
  const [draft, setDraft] = useState(parts)

  useEffect(() => {
    setDraft(to12hParts(value))
  }, [value])

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const applyTime = () => {
    onChange(toTime24h(draft.hours12, draft.minutes, draft.period))
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      {label && <p className="text-sm font-medium">{label}</p>}
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className={cn(
          'h-10 w-full justify-between font-normal',
          error && 'border-destructive',
        )}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          {formatTime12h(value)}
        </span>
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}

      {open && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-xl border border-border bg-background p-4 shadow-lg">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <p className="text-center text-xs text-muted-foreground">Hour</p>
              <div className="max-h-36 overflow-y-auto rounded-lg border border-border">
                {HOURS.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    className={cn(
                      'w-full px-2 py-1.5 text-sm hover:bg-muted',
                      draft.hours12 === hour && 'bg-primary text-primary-foreground',
                    )}
                    onClick={() => setDraft((d) => ({ ...d, hours12: hour }))}
                  >
                    {hour}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-center text-xs text-muted-foreground">Min</p>
              <div className="max-h-36 overflow-y-auto rounded-lg border border-border">
                {MINUTES.filter((_, i) => i % 5 === 0).map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    className={cn(
                      'w-full px-2 py-1.5 text-sm hover:bg-muted',
                      draft.minutes === minute && 'bg-primary text-primary-foreground',
                    )}
                    onClick={() => setDraft((d) => ({ ...d, minutes: minute }))}
                  >
                    {minute}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-center text-xs text-muted-foreground">Period</p>
              <div className="rounded-lg border border-border">
                {PERIODS.map((period) => (
                  <button
                    key={period}
                    type="button"
                    className={cn(
                      'w-full px-2 py-2 text-sm hover:bg-muted',
                      draft.period === period && 'bg-primary text-primary-foreground',
                    )}
                    onClick={() => setDraft((d) => ({ ...d, period }))}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Button type="button" className="mt-3 w-full" size="sm" onClick={applyTime}>
            Apply
          </Button>
        </div>
      )}
    </div>
  )
}

export default TimePicker
