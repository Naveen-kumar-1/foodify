export const ROUTE_PATHS = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  VERIFY_OTP: '/verify-otp',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  MENU: '/menu',
  TIMESLOTS: '/timeslots',
  ORDERS: '/orders',
  QR_CODES: '/qr-codes',
  PROFILE: '/profile',
  KITCHEN: '/kitchen',
  ORDER: '/order',
  NOT_FOUND: '*',
}

export const LAYOUT_KEYS = {
  PUBLIC: 'public',
  AUTH: 'auth',
  DASHBOARD: 'dashboard',
  CUSTOMER: 'customer',
  KITCHEN: 'kitchen',
}

export const PUBLIC_PATHS = [
  ROUTE_PATHS.HOME,
  ROUTE_PATHS.LOGIN,
  ROUTE_PATHS.SIGNUP,
  ROUTE_PATHS.VERIFY_OTP,
  ROUTE_PATHS.FORGOT_PASSWORD,
  ROUTE_PATHS.RESET_PASSWORD,
]

export const PROTECTED_PATHS = [
  ROUTE_PATHS.DASHBOARD,
  ROUTE_PATHS.MENU,
  ROUTE_PATHS.TIMESLOTS,
  ROUTE_PATHS.ORDERS,
  ROUTE_PATHS.QR_CODES,
  ROUTE_PATHS.PROFILE,
  ROUTE_PATHS.KITCHEN,
]
