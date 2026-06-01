import { Clock, Coffee, Eye, EyeOff, UtensilsCrossed } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MENU_CONTENT } from '@/constants/menuContent'

const statConfig = [
  { key: 'totalFoods', label: MENU_CONTENT.stats.total, icon: UtensilsCrossed },
  { key: 'activeFoods', label: MENU_CONTENT.stats.active, icon: Eye },
  { key: 'inactiveFoods', label: MENU_CONTENT.stats.inactive, icon: EyeOff },
  { key: 'timeSlotFoods', label: MENU_CONTENT.stats.timeSlot, icon: Clock },
  { key: 'allDayFoods', label: MENU_CONTENT.stats.allDay, icon: Coffee },
]

const MenuStatsCards = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statConfig.map(({ key }) => (
          <Card key={key}>
            <CardContent className="p-4">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {statConfig.map(({ key, label, icon: Icon }) => (
        <Card
          key={key}
          className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
        >
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{stats?.[key] ?? 0}</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
              <Icon className="size-5" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default MenuStatsCards
