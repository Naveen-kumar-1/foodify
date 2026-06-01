import { Link, Outlet } from 'react-router-dom'
import { COMMON_CONTENT } from '@/constants/content'
import { ROUTE_PATHS } from '@/routes/constants'

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <Link
        to={ROUTE_PATHS.HOME}
        className="mb-8 flex items-center gap-2 transition-opacity hover:opacity-80"
      >
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
          F
        </span>
        <span className="text-2xl font-semibold tracking-tight">{COMMON_CONTENT.appName}</span>
      </Link>
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-8 shadow-sm">
        <Outlet />
      </div>
    </div>
  )
}

export default AuthLayout
