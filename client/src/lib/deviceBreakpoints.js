/** Viewports below this width are treated as mobile (phones). Tablet starts at 768px. */
export const MOBILE_MAX_WIDTH_PX = 767

export const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_MAX_WIDTH_PX}px)`

export const isMobileViewport = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}
