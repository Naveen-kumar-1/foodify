import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const StatCard = ({ title, value, icon: Icon, trend, className }) => (
  <Card className={cn('transition-shadow hover:shadow-md', className)}>
    <CardContent className="flex items-start justify-between gap-4 p-6">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
      </div>
      {Icon && (
        <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
          <Icon className="size-5" />
        </div>
      )}
    </CardContent>
  </Card>
)

export default StatCard
