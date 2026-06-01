import { Link, Outlet } from 'react-router-dom'
import RestaurantLogo from '@/components/common/RestaurantLogo'
import { useAuth } from '@/context/AuthContext'
import { ROUTE_PATHS } from '@/routes/constants'

const KitchenLayout = () => {
  const { restaurant } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <header className="flex h-[57px] shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
        <div className="flex min-w-0 items-center gap-3">
          <RestaurantLogo
            name={restaurant?.name}
            logoUrl={restaurant?.logoUrl || restaurant?.logo}
            size="sm"
          />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold leading-tight">
              {restaurant?.name || 'Kitchen Display'}
            </h1>
            <p className="text-[10px] text-gray-500">Kitchen · Foodify</p>
          </div>
        </div>
        <Link
          to={ROUTE_PATHS.DASHBOARD}
          className="shrink-0 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          Admin
        </Link>
      </header>
      <Outlet />
    </div>
  )
}

export default KitchenLayout
