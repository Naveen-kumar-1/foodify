import {
  LayoutDashboard,
  UtensilsCrossed,
  Clock,
  ShoppingBag,
  QrCode,
  User,
} from 'lucide-react'
import { LAYOUT_KEYS, ROUTE_PATHS } from '@/routes/constants'

/**
 * @typedef {Object} RouteMeta
 * @property {string} [title]
 * @property {import('lucide-react').LucideIcon} [icon]
 *
 * @typedef {Object} RouteConfig
 * @property {string} [path]
 * @property {boolean} [index]
 * @property {() => Promise<{ default: React.ComponentType }>} [page]
 * @property {keyof typeof LAYOUT_KEYS} [layout]
 * @property {boolean} [protected]
 * @property {boolean} [guestOnly]
 * @property {RouteMeta} [meta]
 * @property {RouteConfig[]} [children]
 */

/** @type {RouteConfig[]} */
export const routeConfig = [
  {
    path: ROUTE_PATHS.HOME,
    layout: LAYOUT_KEYS.PUBLIC,
    guestOnly: true,
    children: [
      {
        index: true,
        page: () => import('@/pages/landing/Landing'),
        meta: { title: 'Home' },
      },
    ],
  },
  {
    path: ROUTE_PATHS.LOGIN,
    layout: LAYOUT_KEYS.AUTH,
    guestOnly: true,
    children: [
      {
        index: true,
        page: () => import('@/pages/auth/Login'),
        meta: { title: 'Login' },
      },
    ],
  },
  {
    path: ROUTE_PATHS.SIGNUP,
    layout: LAYOUT_KEYS.AUTH,
    guestOnly: true,
    children: [
      {
        index: true,
        page: () => import('@/pages/auth/Signup'),
        meta: { title: 'Sign Up' },
      },
    ],
  },
  {
    path: ROUTE_PATHS.VERIFY_OTP,
    layout: LAYOUT_KEYS.AUTH,
    guestOnly: true,
    children: [
      {
        index: true,
        page: () => import('@/pages/auth/VerifyOtp'),
        meta: { title: 'Verify Email' },
      },
    ],
  },
  {
    path: ROUTE_PATHS.FORGOT_PASSWORD,
    layout: LAYOUT_KEYS.AUTH,
    children: [
      {
        index: true,
        page: () => import('@/pages/auth/ForgotPasswordRedirect'),
        meta: { title: 'Forgot Password' },
      },
    ],
  },
  {
    path: ROUTE_PATHS.RESET_PASSWORD,
    layout: LAYOUT_KEYS.AUTH,
    children: [
      {
        index: true,
        page: () => import('@/pages/auth/ResetPassword'),
        meta: { title: 'Reset Password' },
      },
      {
        path: ':token',
        page: () => import('@/pages/auth/ResetPassword'),
        meta: { title: 'Reset Password' },
      },
    ],
  },
  {
    path: 'order/:qrToken',
    layout: LAYOUT_KEYS.CUSTOMER,
    children: [
      {
        index: true,
        page: () => import('@/pages/customer/CustomerOrderPage'),
        meta: { title: 'Order' },
      },
      {
        path: 'cart',
        page: () => import('@/pages/customer/CartPage'),
        meta: { title: 'Cart' },
      },
      {
        path: 'success/:orderId',
        page: () => import('@/pages/customer/OrderSuccessPage'),
        meta: { title: 'Order Placed' },
      },
      {
        path: 'track/:orderId',
        page: () => import('@/pages/customer/OrderTrackingPage'),
        meta: { title: 'Track Order' },
      },
    ],
  },
  {
    path: 'kitchen',
    layout: LAYOUT_KEYS.KITCHEN,
    protected: true,
    children: [
      {
        index: true,
        page: () => import('@/pages/kitchen/KitchenDashboard'),
        meta: { title: 'Kitchen' },
      },
    ],
  },
  {
    layout: LAYOUT_KEYS.DASHBOARD,
    protected: true,
    children: [
      {
        path: 'dashboard',
        page: () => import('@/pages/dashboard/DashboardHome'),
        meta: { title: 'Dashboard', icon: LayoutDashboard },
      },
      {
        path: 'menu',
        page: () => import('@/pages/dashboard/MenuManagement'),
        meta: { title: 'Menu', icon: UtensilsCrossed },
      },
      {
        path: 'timeslots',
        page: () => import('@/pages/dashboard/TimeslotManagement'),
        meta: { title: 'Timeslots', icon: Clock },
      },
      {
        path: 'orders',
        page: () => import('@/pages/dashboard/OrdersManagement'),
        meta: { title: 'Orders', icon: ShoppingBag },
      },
      {
        path: 'qr-codes',
        page: () => import('@/pages/dashboard/QrCodeManagement'),
        meta: { title: 'QR Codes', icon: QrCode },
      },
      {
        path: 'profile',
        page: () => import('@/pages/dashboard/Profile'),
        meta: { title: 'Profile', icon: User },
      },
    ],
  },
  {
    path: ROUTE_PATHS.NOT_FOUND,
    page: () => import('@/pages/NotFound'),
    meta: { title: 'Not Found' },
  },
]
