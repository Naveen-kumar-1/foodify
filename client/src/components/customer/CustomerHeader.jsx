import LiveTrackingIndicator from '@/components/customer/LiveTrackingIndicator'
import { useCustomerSession } from '@/context/CustomerSessionContext'
import { CUSTOMER_CONTENT } from '@/constants/customerContent'

const CustomerHeader = ({ title, showLive = true }) => {
  const { scanData, connectionState } = useCustomerSession()
  const restaurant = scanData?.restaurant
  const table = scanData?.table

  if (!restaurant) return null

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-lg px-4 py-3">
        <div className="flex items-center gap-3">
          {restaurant.logo || restaurant.logoUrl ? (
            <img
              src={restaurant.logoUrl || restaurant.logo}
              alt=""
              className="size-11 rounded-lg border border-gray-100 object-cover"
            />
          ) : (
            <div className="flex size-11 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold text-white">
              {restaurant.name?.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            {title ? (
              <h1 className="truncate text-base font-semibold text-gray-900">{title}</h1>
            ) : (
              <h1 className="truncate text-base font-semibold text-gray-900">{restaurant.name}</h1>
            )}
            <p className="text-xs text-gray-500">
              {CUSTOMER_CONTENT.orderingFrom}{' '}
              <span className="font-medium text-gray-800">
                {table?.tableName} · {CUSTOMER_CONTENT.table} {table?.tableNumber}
              </span>
            </p>
          </div>
          {showLive && <LiveTrackingIndicator connectionState={connectionState} />}
        </div>
      </div>
    </header>
  )
}

export default CustomerHeader
