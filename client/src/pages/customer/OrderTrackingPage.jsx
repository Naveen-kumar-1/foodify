import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ActiveOrderSection from '@/components/customer/ActiveOrderSection'
import CustomerHeader from '@/components/customer/CustomerHeader'
import LiveTrackingIndicator from '@/components/customer/LiveTrackingIndicator'
import OrderHistorySection from '@/components/customer/OrderHistorySection'
import OrderTimeline from '@/components/customer/OrderTimeline'
import CancelOrderButton from '@/components/customer/CancelOrderButton'
import CancellationDetails from '@/components/orders/CancellationDetails'
import RefreshOrderButton from '@/components/customer/RefreshOrderButton'
import StatusBadge from '@/components/customer/StatusBadge'
import RouteLoading from '@/components/routing/RouteLoading'
import { CUSTOMER_CONTENT } from '@/constants/customerContent'
import { useCustomerSession } from '@/context/CustomerSessionContext'
import { formatINR, formatOrderTime } from '@/lib/customerUi'

const OrderTrackingPage = () => {
  const { qrToken, orderId } = useParams()
  const { registerOrder, refreshOrderFromApi, orders, connectionState } = useCustomerSession()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  const cached = orders.find((o) => o.orderId === orderId)

  useEffect(() => {
    if (cached) setOrder(cached)
  }, [cached])

  const loadOrder = async () => {
    setLoading(true)
    const fresh = await refreshOrderFromApi(orderId)
    if (fresh) {
      setOrder(fresh)
      registerOrder(fresh)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial fetch only
  }, [orderId])

  const display = order || cached

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <CustomerHeader title={CUSTOMER_CONTENT.trackOrder} showLive />

      <div className="mx-auto max-w-lg px-4 pt-2">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link
            to={`/order/${qrToken}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="size-4" />
            {CUSTOMER_CONTENT.continueShopping}
          </Link>
          <LiveTrackingIndicator connectionState={connectionState} showWhenIdle />
        </div>

        {loading && !display ? (
          <RouteLoading />
        ) : !display ? (
          <p className="py-12 text-center text-gray-500">Order not found or session expired.</p>
        ) : (
          <>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    {CUSTOMER_CONTENT.orderNumber}
                  </p>
                  <p className="text-xl font-bold text-gray-900">{display.orderNumber}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {CUSTOMER_CONTENT.table} {display.tableNumber ?? display.table?.tableNumber} ·{' '}
                    {formatOrderTime(display.createdAt)}
                  </p>
                </div>
                <StatusBadge
                  status={display.orderStatus}
                  pulse={['placed', 'preparing', 'ready', 'served'].includes(display.orderStatus)}
                />
              </div>
              <p className="mt-4 text-2xl font-bold text-gray-900">{formatINR(display.total)}</p>
              <CancellationDetails order={display} className="mt-4" />
              <p className="mt-2 text-xs text-gray-500">
                Updates appear automatically. Use refresh if needed.
              </p>
              <div className="mt-3 space-y-2">
                <CancelOrderButton order={display} className="w-full" variant="destructive" />
                <RefreshOrderButton onRefresh={loadOrder} className="w-full" />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-5 text-sm font-semibold text-gray-900">Order progress</h2>
              <OrderTimeline currentStatus={display.orderStatus} />
            </div>
          </>
        )}

        <div className="mt-8 space-y-8">
          <ActiveOrderSection />
          <OrderHistorySection />
        </div>

        <Link
          to={`/order/${qrToken}`}
          className="mt-8 block rounded-xl border border-gray-200 bg-white py-3.5 text-center text-sm font-semibold text-gray-900 shadow-sm"
        >
          {CUSTOMER_CONTENT.browseMore}
        </Link>
      </div>
    </div>
  )
}

export default OrderTrackingPage
