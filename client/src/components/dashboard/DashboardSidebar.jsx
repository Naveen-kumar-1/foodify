import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { DASHBOARD_NAV } from '@/routes/navigation'

const DashboardSidebar = ({ collapsed, onNavigate }) => {
  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {DASHBOARD_NAV.map(({ path, title, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              collapsed && 'justify-center px-2',
            )
          }
        >
          <Icon className="size-5 shrink-0" />
          {!collapsed && <span>{title}</span>}
        </NavLink>
      ))}
    </nav>
  )
}

export default DashboardSidebar
