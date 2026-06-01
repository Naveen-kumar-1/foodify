import { Link, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import StatusBadge from '@/components/customer/StatusBadge'
import { CUSTOMER_CONTENT } from '@/constants/customerContent'
import { useCustomerSession } from '@/context/CustomerSessionContext'

const FloatingOrderTracker = () => {
  const { qrToken } = useParams()
  const { primaryActiveOrder } = useCustomerSession()

  if (!primaryActiveOrder) return null

  return (
    <Link
      to={`/order/${qrToken}/track/${primaryActiveOrder.orderId}`}
      className="mx-auto flex max-w-lg items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-md transition active:scale-[0.99]"
    >
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{primaryActiveOrder.orderNumber}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">
            {CUSTOMER_CONTENT.statusLabel}:{' '}
          </span>
          <StatusBadge status={primaryActiveOrder.orderStatus} pulse />
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-gray-900">
        {CUSTOMER_CONTENT.trackOrder}
        <ChevronRight className="size-4" />
      </span>
    </Link>
  )
}

export default FloatingOrderTracker
