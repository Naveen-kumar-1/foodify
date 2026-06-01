import StatCard from '@/components/common/StatCard'
import { formatINR } from '@/lib/customerUi'
import { DollarSign, ShoppingBag, TrendingUp } from 'lucide-react'

const RevenueCards = ({ overview, loading }) => {
  if (loading || !overview) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  const cards = [
    { title: "Today's Revenue", value: formatINR(overview.todayRevenue), icon: DollarSign },
    { title: "This Week's Revenue", value: formatINR(overview.weekRevenue), icon: TrendingUp },
    { title: "This Month's Revenue", value: formatINR(overview.monthRevenue), icon: TrendingUp },
    { title: 'Total Revenue', value: formatINR(overview.totalRevenue), icon: DollarSign },
    { title: 'Total Orders', value: overview.totalOrders, icon: ShoppingBag },
    { title: 'Average Order Value', value: formatINR(overview.averageOrderValue), icon: DollarSign },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <StatCard key={card.title} title={card.title} value={card.value} icon={card.icon} />
      ))}
    </div>
  )
}

export default RevenueCards
