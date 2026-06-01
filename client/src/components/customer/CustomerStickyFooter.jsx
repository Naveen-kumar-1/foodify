import { Link, useLocation, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import FloatingOrderTracker from '@/components/customer/FloatingOrderTracker'
import { CUSTOMER_CONTENT } from '@/constants/customerContent'
import { useCart } from '@/context/CartContext'
import { useCustomerSession } from '@/context/CustomerSessionContext'
import { formatINR } from '@/lib/customerUi'

const CustomerStickyFooter = () => {
  const { qrToken } = useParams()
  const location = useLocation()
  const { itemCount, subtotal } = useCart()
  const { primaryActiveOrder } = useCustomerSession()

  const onCartPage = location.pathname.includes('/cart')
  const onSuccessPage = location.pathname.includes('/success')
  const hideCartBar = onCartPage || onSuccessPage

  const hasCart = itemCount > 0 && !hideCartBar
  const hasTracker = Boolean(primaryActiveOrder)

  if (!hasCart && !hasTracker) return null

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-100 bg-white/95 p-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg flex-col gap-2">
        {hasTracker && <FloatingOrderTracker />}
        {hasCart && (
          <Link
            to={`/order/${qrToken}/cart`}
            className="flex items-center justify-between gap-4 rounded-xl bg-gray-900 px-5 py-3.5 text-white shadow-lg transition active:scale-[0.99]"
          >
            <div>
              <p className="text-sm text-gray-300">
                {itemCount} {CUSTOMER_CONTENT.itemsAdded}
              </p>
              <p className="text-lg font-bold">{formatINR(subtotal)}</p>
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold">
              {CUSTOMER_CONTENT.viewCart}
              <ChevronRight className="size-5" />
            </span>
          </Link>
        )}
      </div>
    </div>
  )
}

export default CustomerStickyFooter
