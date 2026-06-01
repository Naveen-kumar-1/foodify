import { Navigate, useLocation } from 'react-router-dom'
import RouteLoading from '@/components/routing/RouteLoading'
import { useAuth } from '@/context/AuthContext'
import { ROUTE_PATHS } from '@/routes/constants'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isBootstrapping } = useAuth()
  const location = useLocation()

  if (isBootstrapping) return <RouteLoading />

  if (!isAuthenticated) {
    return <Navigate to={ROUTE_PATHS.LOGIN} replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute
