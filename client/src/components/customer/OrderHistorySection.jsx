import { Link, useParams } from 'react-router-dom'
import StatusBadge from '@/components/customer/StatusBadge'
import { CUSTOMER_CONTENT } from '@/constants/customerContent'
import { useCustomerSession } from '@/context/CustomerSessionContext'
import { formatINR, formatOrderTime } from '@/lib/customerUi'

const OrderHistorySection = ({ className = '' }) => {
  const { qrToken } = useParams()
  const { orderHistory } = useCustomerSession()

  if (!orderHistory.length) return null

  return (
    <section className={className}>
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-gray-500 uppercase">
        {CUSTOMER_CONTENT.orderHistory}
      </h2>
      <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 bg-white">
        {orderHistory.map((order) => (
          <Link
            key={order.orderId}
            to={`/order/${qrToken}/track/${order.orderId}`}
            className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-gray-50"
          >
            <div>
              <p className="font-medium text-gray-900">{order.orderNumber}</p>
              <p className="text-xs text-gray-500">{formatOrderTime(order.createdAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={order.orderStatus} />
              <span className="text-sm font-semibold text-gray-900">{formatINR(order.total)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default OrderHistorySection
