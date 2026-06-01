import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, X } from 'lucide-react'
import CancellationDetails from '@/components/orders/CancellationDetails'
import CancelOrderModal from '@/components/orders/CancelOrderModal'
import { Button } from '@/components/ui/button'
import { CUSTOMER_STATUS } from '@/constants/customerContent'
import { canStaffCancel } from '@/lib/orderCancel'
import { formatINR, formatOrderTime } from '@/lib/customerUi'

const KitchenOrderDrawer = ({
  order,
  open,
  onClose,
  action,
  isUpdating,
  onAction,
  onCancel,
  isCancelling,
}) => {
  const [cancelOpen, setCancelOpen] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open || !order) return null

  const showCancel = canStaffCancel(order.orderStatus) && onCancel

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-50 bg-black/25 transition-opacity"
        aria-label="Close"
        onClick={onClose}
      />
      <aside className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <p className="text-lg font-bold text-gray-900">{order.orderNumber}</p>
            <p className="text-sm text-gray-500">
              Table {order.table?.tableNumber} · {order.table?.tableName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium capitalize text-gray-700">
              {CUSTOMER_STATUS[order.orderStatus] || order.orderStatus}
            </span>
            <span className="text-gray-500">{formatOrderTime(order.createdAt)}</span>
          </div>

          <CancellationDetails order={order} className="mb-4" />

          <section className="mb-4">
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Items
            </h3>
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
              {order.items.map((item) => (
                <li
                  key={item.foodId}
                  className="flex justify-between gap-2 px-3 py-2 text-sm"
                >
                  <span className="text-gray-800">
                    {item.quantity} × {item.foodName}
                  </span>
                  <span className="shrink-0 font-medium text-gray-900">
                    {formatINR(item.lineTotal ?? item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {order.notes && (
            <section className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              <p className="text-xs font-semibold text-amber-700 uppercase">Note</p>
              <p className="mt-1">{order.notes}</p>
            </section>
          )}

          <section className="mb-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatINR(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>-{formatINR(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">GST</span>
              <span>{formatINR(order.tax)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2 font-bold">
              <span>Total</span>
              <span>{formatINR(order.total)}</span>
            </div>
          </section>

          {order.statusHistory?.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                Status history
              </h3>
              <ol className="space-y-2">
                {[...order.statusHistory].reverse().map((entry, i) => (
                  <li key={i} className="flex justify-between text-xs text-gray-600">
                    <span className="capitalize">{entry.status}</span>
                    <span>{formatOrderTime(entry.at)}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <footer className="space-y-2 border-t border-gray-100 p-4">
          {action && order.orderStatus !== 'cancelled' && (
            <button
              type="button"
              disabled={isUpdating || isCancelling}
              onClick={() => onAction(order.orderId, action.next)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="size-4 animate-spin" /> : null}
              {action.label}
            </button>
          )}
          {showCancel && (
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              disabled={isUpdating || isCancelling}
              onClick={() => setCancelOpen(true)}
            >
              Cancel order
            </Button>
          )}
        </footer>
      </aside>

      <CancelOrderModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        actor="kitchen"
        loading={isCancelling}
        onConfirm={(payload) => {
          onCancel(order.orderId, payload)
          setCancelOpen(false)
        }}
      />
    </>,
    document.body,
  )
}

export default KitchenOrderDrawer
