import { Toaster } from 'react-hot-toast'
import ErrorBoundary from '@/components/routing/ErrorBoundary'
import RouteLoading from '@/components/routing/RouteLoading'
import { useAuth } from '@/context/AuthContext'
import AppRoutes from '@/routes/index.jsx'

const App = () => {
  const { isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <RouteLoading />
  }

  return (
    <ErrorBoundary>
      <AppRoutes />
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </ErrorBoundary>
  )
}

export default App
