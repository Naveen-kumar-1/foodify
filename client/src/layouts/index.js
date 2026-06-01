import { LAYOUT_KEYS } from '@/routes/constants'
import AuthLayout from '@/layouts/AuthLayout'
import CustomerLayout from '@/layouts/CustomerLayout'
import DashboardLayout from '@/layouts/DashboardLayout'
import KitchenLayout from '@/layouts/KitchenLayout'
import PublicLayout from '@/layouts/PublicLayout'

export const layouts = {
  [LAYOUT_KEYS.PUBLIC]: PublicLayout,
  [LAYOUT_KEYS.AUTH]: AuthLayout,
  [LAYOUT_KEYS.DASHBOARD]: DashboardLayout,
  [LAYOUT_KEYS.CUSTOMER]: CustomerLayout,
  [LAYOUT_KEYS.KITCHEN]: KitchenLayout,
}
