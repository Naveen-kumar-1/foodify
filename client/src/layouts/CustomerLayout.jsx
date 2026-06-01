import { Outlet, useParams } from 'react-router-dom'
import CustomerStickyFooter from '@/components/customer/CustomerStickyFooter'
import { CartProvider } from '@/context/CartContext'
import { CustomerSessionProvider } from '@/context/CustomerSessionContext'

const CustomerLayout = () => {
  const { qrToken } = useParams()

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased">
      <CustomerSessionProvider qrToken={qrToken}>
        <CartProvider qrToken={qrToken}>
          <Outlet />
          <CustomerStickyFooter />
        </CartProvider>
      </CustomerSessionProvider>
    </div>
  )
}

export default CustomerLayout
