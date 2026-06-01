import {
  LayoutDashboard,
  UtensilsCrossed,
  Clock,
  ShoppingBag,
  QrCode,
  ChefHat,
  User,
  BarChart3,
} from 'lucide-react'
import { ROUTE_PATHS } from '@/routes/constants'

export const DASHBOARD_NAV = [
  {
    path: ROUTE_PATHS.DASHBOARD,
    title: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    path: ROUTE_PATHS.MENU,
    title: 'Menu',
    icon: UtensilsCrossed,
  },
  {
    path: ROUTE_PATHS.TIMESLOTS,
    title: 'Timeslots',
    icon: Clock,
  },
  {
    path: ROUTE_PATHS.ORDERS,
    title: 'Orders',
    icon: ShoppingBag,
  },
  {
    path: ROUTE_PATHS.REVENUE,
    title: 'Revenue',
    icon: BarChart3,
  },
  {
    path: ROUTE_PATHS.KITCHEN,
    title: 'Kitchen',
    icon: ChefHat,
  },
  {
    path: ROUTE_PATHS.QR_CODES,
    title: 'QR Codes',
    icon: QrCode,
  },
  {
    path: ROUTE_PATHS.PROFILE,
    title: 'Profile',
    icon: User,
  },
]
