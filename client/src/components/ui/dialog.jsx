import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const Dialog = ({ open, onOpenChange, children }) => {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onOpenChange])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-lg">{children}</div>
    </div>,
    document.body,
  )
}

const DialogContent = ({ className, children, onClose }) => (
  <div
    className={cn(
      'relative max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl',
      className,
    )}
    role="dialog"
    aria-modal="true"
  >
    {onClose && (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-3 right-3"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="size-4" />
      </Button>
    )}
    {children}
  </div>
)

const DialogHeader = ({ className, ...props }) => (
  <div className={cn('mb-4 space-y-1.5 pr-8', className)} {...props} />
)

const DialogTitle = ({ className, ...props }) => (
  <h2 className={cn('text-lg font-semibold leading-none', className)} {...props} />
)

const DialogDescription = ({ className, ...props }) => (
  <p className={cn('text-sm text-muted-foreground', className)} {...props} />
)

const DialogFooter = ({ className, ...props }) => (
  <div className={cn('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
)

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter }
