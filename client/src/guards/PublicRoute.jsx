import { Navigate } from 'react-router-dom'
import RouteLoading from '@/components/routing/RouteLoading'
import { useAuth } from '@/context/AuthContext'
import { ROUTE_PATHS } from '@/routes/constants'

const PublicRoute = ({ children, redirectTo = ROUTE_PATHS.DASHBOARD }) => {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) return <RouteLoading />

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}

export default PublicRoute
