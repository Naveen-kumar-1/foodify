import { Link, useParams } from 'react-router-dom'
import { ChevronRight, Clock } from 'lucide-react'
import StatusBadge from '@/components/customer/StatusBadge'
import { CUSTOMER_CONTENT } from '@/constants/customerContent'
import { useCustomerSession } from '@/context/CustomerSessionContext'
import { formatINR, formatOrderTime } from '@/lib/customerUi'

const OrderRow = ({ order, qrToken }) => (
  <Link
    to={`/order/${qrToken}/track/${order.orderId}`}
    className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-3 transition hover:border-gray-200 hover:bg-white"
  >
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold text-gray-900">{order.orderNumber}</p>
        <StatusBadge status={order.orderStatus} pulse />
      </div>
      <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
        <Clock className="size-3" />
        {CUSTOMER_CONTENT.table} {order.tableNumber} · {formatOrderTime(order.createdAt)}
      </p>
    </div>
    <div className="text-right">
      <p className="font-semibold text-gray-900">{formatINR(order.total)}</p>
      <ChevronRight className="ml-auto size-4 text-gray-400" />
    </div>
  </Link>
)

const ActiveOrderSection = ({ className = '' }) => {
  const { qrToken } = useParams()
  const { activeOrders } = useCustomerSession()

  if (!activeOrders.length) return null

  return (
    <section className={className}>
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase">
        {CUSTOMER_CONTENT.yourActiveOrder}
      </h2>
      <div className="space-y-2">
        {activeOrders.map((order) => (
          <OrderRow key={order.orderId} order={order} qrToken={qrToken} />
        ))}
      </div>
    </section>
  )
}

export default ActiveOrderSection
