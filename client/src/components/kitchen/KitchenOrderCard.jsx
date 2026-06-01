import { Loader2 } from 'lucide-react'
import { formatINR, formatOrderTime } from '@/lib/customerUi'
import { cn } from '@/lib/utils'

const MAX_LINES = 2

const KitchenOrderCard = ({ order, action, isUpdating, onOpen, onAction }) => {
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0)
  const visibleItems = order.items.slice(0, MAX_LINES)
  const hiddenCount = order.items.length - visibleItems.length

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(order)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(order)}
      className={cn(
        'cursor-pointer rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm transition hover:border-gray-300 hover:shadow',
        isUpdating && 'pointer-events-none opacity-60',
      )}
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

      {action && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAction(order.orderId, action.next)
          }}
          disabled={isUpdating}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded-md bg-gray-900 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isUpdating ? <Loader2 className="size-3 animate-spin" /> : null}
          {action.label}
        </button>
      )}
    </article>
  )
}

export default KitchenOrderCard
