import { formatCancellationDisplay } from '@/constants/cancellationReasons'
import { formatOrderTime } from '@/lib/customerUi'

const CancellationDetails = ({ order, className = '' }) => {
  if (!order || order.orderStatus !== 'cancelled') return null

  const reasonText = formatCancellationDisplay(order)

  return (
    <div
      className={`rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-900 ${className}`}
    >
      <p className="text-xs font-semibold tracking-wide text-red-700 uppercase">Cancelled</p>
      <dl className="mt-2 space-y-1 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-red-600">Reason</dt>
          <dd className="text-right font-medium">{reasonText}</dd>
        </div>
        {order.cancelledBy && (
          <div className="flex justify-between gap-2">
            <dt className="text-red-600">Cancelled by</dt>
            <dd className="capitalize">{order.cancelledBy}</dd>
          </div>
        )}
        {order.previousOrderStatus && (
          <div className="flex justify-between gap-2">
            <dt className="text-red-600">Previous status</dt>
            <dd className="capitalize">{order.previousOrderStatus}</dd>
          </div>
        )}
        {order.cancelledAt && (
          <div className="flex justify-between gap-2">
            <dt className="text-red-600">Cancelled at</dt>
            <dd>{formatOrderTime(order.cancelledAt)}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}

export default CancellationDetails
