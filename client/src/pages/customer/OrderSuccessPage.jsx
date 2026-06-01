import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import ActiveOrderSection from '@/components/customer/ActiveOrderSection'
import CustomerHeader from '@/components/customer/CustomerHeader'
import OrderHistorySection from '@/components/customer/OrderHistorySection'
import OrderTimeline from '@/components/customer/OrderTimeline'
import LiveTrackingIndicator from '@/components/customer/LiveTrackingIndicator'
import CancelOrderButton from '@/components/customer/CancelOrderButton'
import CancellationDetails from '@/components/orders/CancellationDetails'
import RefreshOrderButton from '@/components/customer/RefreshOrderButton'
import StatusBadge from '@/components/customer/StatusBadge'
import RouteLoading from '@/components/routing/RouteLoading'
import { CUSTOMER_CONTENT } from '@/constants/customerContent'
import { useCustomerSession } from '@/context/CustomerSessionContext'
import { formatINR, formatOrderTime } from '@/lib/customerUi'

const OrderSuccessPage = () => {
  const { qrToken, orderId } = useParams()
  const location = useLocation()
  const { registerOrder, refreshOrderFromApi, orders, connectionState } = useCustomerSession()
  const initialOrder = location.state?.order
  const cached = orders.find((o) => o.orderId === orderId)
  const [order, setOrder] = useState(initialOrder || cached || null)
  const [loading, setLoading] = useState(!initialOrder && !cached)

  useEffect(() => {
    if (initialOrder) registerOrder(initialOrder)
  }, [initialOrder, registerOrder])

  useEffect(() => {
    const latest = orders.find((o) => o.orderId === orderId)
    if (latest) setOrder(latest)
  }, [orders, orderId])

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
    if (!initialOrder && !cached) loadOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const display = order || cached || initialOrder

  if (loading && !display) return <RouteLoading />

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <CustomerHeader title={CUSTOMER_CONTENT.orderSuccess} />

      <div className="mx-auto max-w-lg space-y-6 px-4 py-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          <CheckCircle2 className="mx-auto size-14 text-emerald-500" strokeWidth={1.5} />
          <h1 className="mt-3 text-xl font-bold text-gray-900">{CUSTOMER_CONTENT.orderSuccess}</h1>
          {display && (
            <div className="mt-5 space-y-3 text-left">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-xs text-gray-500">{CUSTOMER_CONTENT.orderNumber}</p>
                  <p className="font-bold text-gray-900">{display.orderNumber}</p>
                </div>
                <StatusBadge status={display.orderStatus} pulse />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-500">{CUSTOMER_CONTENT.table}</p>
                  <p className="font-semibold">
                    {display.table?.tableNumber ?? display.tableNumber}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-500">{CUSTOMER_CONTENT.orderTime}</p>
                  <p className="font-semibold">{formatOrderTime(display.createdAt)}</p>
                </div>
              </div>
              <p className="text-center text-2xl font-bold text-gray-900">
                {formatINR(display.total)}
              </p>
            </div>
          )}
        </div>

        {display && (
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-gray-900">
                {CUSTOMER_CONTENT.yourActiveOrder}
              </h2>
              <div className="flex items-center gap-2">
                <LiveTrackingIndicator connectionState={connectionState} />
                <RefreshOrderButton onRefresh={loadOrder} />
              </div>
            </div>
            <OrderTimeline currentStatus={display.orderStatus} />
            <CancellationDetails order={display} className="mt-4" />
            <CancelOrderButton order={display} className="mt-4 w-full" variant="destructive" />
            <Link
              to={`/order/${qrToken}/track/${orderId}`}
              className="mt-4 block text-center text-sm font-semibold text-gray-700 underline-offset-2 hover:underline"
            >
              {CUSTOMER_CONTENT.viewDetails}
            </Link>
          </section>
        )}

        <ActiveOrderSection />
        <OrderHistorySection />

        <Link
          to={`/order/${qrToken}`}
          className="block rounded-xl bg-gray-900 py-3.5 text-center text-sm font-semibold text-white shadow-sm"
        >
          {CUSTOMER_CONTENT.browseMore}
        </Link>
      </div>
    </div>
  )
}

export default OrderSuccessPage
