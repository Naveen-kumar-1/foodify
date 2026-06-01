import { Loader2 } from 'lucide-react'
import { canStaffCancel } from '@/lib/orderCancel'
import { formatINR, formatOrderTime } from '@/lib/customerUi'
import { cn } from '@/lib/utils'

const MAX_LINES = 2

const KitchenOrderCard = ({
  order,
  action,
  isUpdating,
  isCancelling,
  onOpen,
  onAction,
  onCancel,
}) => {
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0)
  const visibleItems = order.items.slice(0, MAX_LINES)
  const hiddenCount = order.items.length - visibleItems.length
  const busy = isUpdating || isCancelling
  const showCancel = canStaffCancel(order.orderStatus) && onCancel

  return (
    <article
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm transition',
        busy && 'opacity-60',
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(order)}
        className="w-full text-left"
        disabled={busy}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900">{order.orderNumber}</p>
            <p className="text-xs font-medium text-gray-600">
              Table {order.table?.tableNumber ?? '—'}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-gray-900">{formatINR(order.total)}</p>
            <p className="text-[10px] text-gray-400">{formatOrderTime(order.createdAt)}</p>
          </div>
        </div>

        <ul className="mt-2 space-y-0.5 text-xs text-gray-600">
          {visibleItems.map((item) => (
            <li key={item.foodId} className="truncate">
              {item.quantity} × {item.foodName}
            </li>
          ))}
          {hiddenCount > 0 && (
            <li className="font-medium text-gray-400">
              +{hiddenCount} more · {itemCount} items total
            </li>
          )}
        </ul>

        {order.notes && (
          <p className="mt-1.5 truncate rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-800">
            {order.notes}
          </p>
        )}
      </button>

      <div className="mt-2 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => onOpen(order)}
          disabled={busy}
          className="w-full rounded-md border border-gray-200 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          View details
        </button>

        {action && (
          <button
            type="button"
            onClick={() => onAction(order.orderId, action.next)}
            disabled={busy}
            className="flex w-full items-center justify-center gap-1 rounded-md bg-gray-900 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isUpdating ? <Loader2 className="size-3 animate-spin" /> : null}
            {action.label}
          </button>
        )}

        {showCancel && (
          <button
            type="button"
            onClick={() => onCancel(order)}
            disabled={busy}
            className="flex w-full items-center justify-center gap-1 rounded-md border border-red-200 bg-red-50 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            {isCancelling ? <Loader2 className="size-3 animate-spin" /> : null}
            Cancel order
          </button>
        )}
      </div>
    </article>
  )
}

export default KitchenOrderCard
