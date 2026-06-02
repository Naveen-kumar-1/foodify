import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  CUSTOMER_CANCELLATION_REASONS,
  OTHER_REASON,
  STAFF_CANCELLATION_REASONS,
} from '@/constants/cancellationReasons'

const CancelOrderModal = ({
  open,
  onOpenChange,
  actor = 'customer',
  loading = false,
  onConfirm,
}) => {
  const reasons = actor === 'customer' ? CUSTOMER_CANCELLATION_REASONS : STAFF_CANCELLATION_REASONS
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const handleOpenChange = (next) => {
    if (!next) {
      setSelectedReason('')
      setCustomReason('')
    }
    onOpenChange(next)
  }

  const isOther = selectedReason === OTHER_REASON
  const customValid = !isOther || customReason.trim().length >= 5
  const canSubmit = selectedReason && customValid && !loading

  const handleConfirm = () => {
    if (!canSubmit) return
    onConfirm({
      cancellationReason: selectedReason,
      customReason: isOther ? customReason.trim() : undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Order</DialogTitle>
          <DialogDescription>
            Please select a reason for cancelling this order. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cancel-reason-select">Reason</Label>
            <select
              id="cancel-reason-select"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={loading}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Select a reason…</option>
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {isOther && (
            <div className="space-y-2">
              <Label htmlFor="cancel-custom-reason">Please specify the reason</Label>
              <textarea
                id="cancel-custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                disabled={loading}
                rows={3}
                placeholder="Enter at least 5 characters"
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
              {customReason.trim().length > 0 && customReason.trim().length < 5 && (
                <p className="text-xs text-destructive">Minimum 5 characters required</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Keep order
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canSubmit}
          >
            {loading ? 'Cancelling...' : 'Confirm cancellation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CancelOrderModal
