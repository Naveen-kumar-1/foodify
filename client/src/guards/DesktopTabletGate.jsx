import MobileRestrictedScreen from '@/components/routing/MobileRestrictedScreen'
import { useIsMobile } from '@/hooks/useIsMobile'

/**
 * Blocks Admin and Kitchen experiences on mobile viewports.
 * Renders nothing from children on phones — only the restriction message.
 */
const DesktopTabletGate = ({ children }) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <MobileRestrictedScreen />
  }

  return children
}

export default DesktopTabletGate
