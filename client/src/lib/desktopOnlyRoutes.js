import { MOBILE_MAX_WIDTH_PX } from '@/lib/deviceBreakpoints'

/** Admin dashboard routes — desktop/tablet only */
export const ADMIN_ROUTE_PREFIXES = [
  '/dashboard',
  '/menu',
  '/timeslots',
  '/orders',
  '/revenue',
  '/qr-codes',
  '/profile',
]

export const KITCHEN_ROUTE_PREFIX = '/kitchen'

export const DESKTOP_ONLY_ROUTE_PREFIXES = [...ADMIN_ROUTE_PREFIXES, KITCHEN_ROUTE_PREFIX]

export const isDesktopOnlyRoute = (pathname) =>
  DESKTOP_ONLY_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

export { MOBILE_MAX_WIDTH_PX }
