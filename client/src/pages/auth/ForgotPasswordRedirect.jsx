import { Navigate } from 'react-router-dom'
import { ROUTE_PATHS } from '@/routes/constants'

/** Legacy route — forgot password is triggered from the login page. */
const ForgotPasswordRedirect = () => <Navigate to={ROUTE_PATHS.LOGIN} replace />

export default ForgotPasswordRedirect
