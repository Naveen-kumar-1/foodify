import StatCard from '@/components/common/StatCard'
import { formatINR } from '@/lib/customerUi'
import { Ban, CheckCircle2, Clock, Percent } from 'lucide-react'

const AnalyticsCards = ({ orderAnalytics, timeBased, loading }) => {
  if (loading || !orderAnalytics) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Completed orders"
          value={orderAnalytics.completedOrders}
          icon={CheckCircle2}
        />
        <StatCard title="Cancelled orders" value={orderAnalytics.cancelledOrders} icon={Ban} />
        <StatCard
          title="Cancellation rate"
          value={`${orderAnalytics.cancellationRate}%`}
          icon={Percent}
        />
        <StatCard
          title="Avg prep time"
          value={`${orderAnalytics.averagePreparationMinutes} min`}
          icon={Clock}
        />
        <StatCard
          title="Avg order value"
          value={formatINR(orderAnalytics.averageOrderValue)}
          icon={CheckCircle2}
        />
      </div>
      {timeBased && (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard title="Peak ordering hour" value={timeBased.peakOrderingHour} />
          <StatCard title="Highest revenue slot" value={timeBased.peakRevenueTimeSlot} />
        </div>
      )}
    </div>
  )
}

export default AnalyticsCards
