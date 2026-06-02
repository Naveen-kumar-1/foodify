import { useSyncExternalStore } from 'react'
import { MOBILE_MEDIA_QUERY } from '@/lib/deviceBreakpoints'

const subscribe = (callback) => {
  const media = window.matchMedia(MOBILE_MEDIA_QUERY)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

const getSnapshot = () => window.matchMedia(MOBILE_MEDIA_QUERY).matches

const getServerSnapshot = () => false

/** True when viewport is phone-sized (< 768px). Tablet and desktop return false. */
export const useIsMobile = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
