import { Link, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { COMMON_CONTENT } from '@/constants/content'
import { ROUTE_PATHS } from '@/routes/constants'

const PublicLayout = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to={ROUTE_PATHS.HOME} className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
              F
            </span>
            <span className="text-xl font-semibold tracking-tight">{COMMON_CONTENT.appName}</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to={ROUTE_PATHS.LOGIN}>Login</Link>
            </Button>
            <Button asChild>
              <Link to={ROUTE_PATHS.SIGNUP}>Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  )
}

export default PublicLayout
