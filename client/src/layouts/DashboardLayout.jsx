import { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Bell, ChevronLeft, ChevronRight, LogOut, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import RestaurantLogo from '@/components/common/RestaurantLogo'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import LogoutConfirmDialog from '@/components/dashboard/LogoutConfirmDialog'
import { DASHBOARD_CONTENT } from '@/constants/content'
import { useAuth } from '@/context/AuthContext'
import { ROUTE_PATHS } from '@/routes/constants'

const DashboardLayout = () => {
  const { restaurant, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)

  const handleLogoutClick = () => setLogoutOpen(true)

  const handleLogoutConfirm = async () => {
    setLogoutLoading(true)
    try {
      logout()
      queryClient.clear()
      toast.success(DASHBOARD_CONTENT.logoutSuccess)
      navigate(ROUTE_PATHS.LOGIN, { replace: true })
    } finally {
      setLogoutLoading(false)
      setLogoutOpen(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside
        className={`hidden border-r border-border bg-background transition-all duration-300 lg:flex lg:flex-col ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link
            to={ROUTE_PATHS.DASHBOARD}
            className={`flex items-center gap-2 ${collapsed ? 'mx-auto' : ''}`}
          >
            <RestaurantLogo
              name={restaurant?.name}
              logoUrl={restaurant?.logoUrl || restaurant?.logo}
              size="sm"
            />
            {!collapsed && (
              <span className="truncate font-semibold">{restaurant?.name || 'Foodify'}</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>
        <DashboardSidebar collapsed={collapsed} />
        <div className="mt-auto border-t border-border p-3">
          <Button
            variant="ghost"
            className={`w-full ${collapsed ? 'justify-center px-2' : 'justify-start'}`}
            onClick={handleLogoutClick}
          >
            <LogOut className="size-4" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col bg-background shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <span className="font-semibold">Foodify</span>
              <Button variant="ghost" size="icon-sm" onClick={() => setMobileOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>
            <DashboardSidebar onNavigate={() => setMobileOpen(false)} />
            <div className="mt-auto border-t border-border p-3">
              <Button variant="ghost" className="w-full justify-start" onClick={handleLogoutClick}>
                <LogOut className="size-4" />
                <span className="ml-2">Logout</span>
              </Button>
            </div>
          </aside>
        </div>
      )}

      <LogoutConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={handleLogoutConfirm}
        loading={logoutLoading}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
            <p className="hidden text-sm text-muted-foreground sm:block">
              {restaurant?.name || 'Restaurant'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" aria-label="Notifications">
              <Bell className="size-5" />
            </Button>
            <Link
              to={ROUTE_PATHS.PROFILE}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 hover:bg-muted/50"
            >
              <RestaurantLogo
                name={restaurant?.name}
                logoUrl={restaurant?.logoUrl || restaurant?.logo}
                size="sm"
                className="rounded-full"
              />
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-none">{restaurant?.name}</p>
                <p className="text-xs text-muted-foreground">{restaurant?.email}</p>
              </div>
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
