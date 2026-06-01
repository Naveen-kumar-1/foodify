import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  Clock,
  DollarSign,
  ShoppingBag,
  Table2,
  XCircle,
} from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import RouteLoading from '@/components/routing/RouteLoading'
import { DASHBOARD_CONTENT } from '@/constants/content'
import { useRestaurantOrderSocket } from '@/hooks/useRestaurantOrderSocket'
import { formatINR, formatOrderTime } from '@/lib/customerUi'
import { dashboardService } from '@/services/dashboardService'
import { orderService } from '@/services/orderService'

const RANGE_OPTIONS = [
  { key: 'today', label: DASHBOARD_CONTENT.today },
  { key: 'yesterday', label: DASHBOARD_CONTENT.yesterday },
  { key: '7d', label: DASHBOARD_CONTENT.last7Days },
  { key: '30d', label: DASHBOARD_CONTENT.last30Days },
  { key: 'custom', label: DASHBOARD_CONTENT.customDate },
]

const statusVariant = {
  placed: 'warning',
  preparing: 'secondary',
  ready: 'default',
  served: 'default',
  completed: 'success',
  cancelled: 'destructive',
}

const SimpleBarChart = ({ data }) => {
  const max = Math.max(...data.map((d) => d.revenue), 1)
  return (
    <div className="flex h-44 items-end gap-1.5 overflow-x-auto pb-1">
      {data.map((item) => (
        <div key={item.label} className="flex min-w-[2rem] flex-1 flex-col items-center gap-1">
          <div
            className="w-full min-w-[1.25rem] rounded-t bg-primary/80 transition-all"
            style={{ height: `${(item.revenue / max) * 100}%`, minHeight: item.revenue ? 4 : 0 }}
            title={formatINR(item.revenue)}
          />
          <span className="max-w-full truncate text-[10px] text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

const DashboardHome = () => {
  const queryClient = useQueryClient()
  const [range, setRange] = useState('today')
  const [customDate, setCustomDate] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  const queryParams = {
    range,
    ...(range === 'custom' && customDate ? { date: customDate } : {}),
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['dashboardAnalytics', range, customDate],
    queryFn: () => dashboardService.getAnalytics(queryParams),
    enabled: range !== 'custom' || Boolean(customDate),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const { data: orderDetail } = useQuery({
    queryKey: ['order', selectedOrderId],
    queryFn: () => orderService.getOrder(selectedOrderId),
    enabled: Boolean(selectedOrderId),
  })

  useRestaurantOrderSocket({
    onOrderEvent: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['orderStats'] })
    },
  })

  if (isLoading && !data) return <RouteLoading />

  const summary = data?.summary || {}
  const daily = data?.dailySales || {}
  const chartData = data?.salesChart || []

  return (
    <div>
      <PageHeader
        title={DASHBOARD_CONTENT.title}
        description={DASHBOARD_CONTENT.description}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {isFetching && (
              <span className="text-xs text-muted-foreground">Updating…</span>
            )}
            {RANGE_OPTIONS.map(({ key, label }) => (
              <Button
                key={key}
                size="sm"
                variant={range === key ? 'default' : 'outline'}
                onClick={() => setRange(key)}
              >
                {label}
              </Button>
            ))}
            {range === 'custom' && (
              <Input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="h-9 w-40"
              />
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title={DASHBOARD_CONTENT.todayOrders}
          value={summary.todayOrders ?? 0}
          icon={ShoppingBag}
        />
        <StatCard
          title={DASHBOARD_CONTENT.todayRevenue}
          value={formatINR(summary.todayRevenue)}
          icon={DollarSign}
        />
        <StatCard
          title={DASHBOARD_CONTENT.pendingOrders}
          value={summary.pendingOrders ?? 0}
          icon={Clock}
        />
        <StatCard
          title={DASHBOARD_CONTENT.completedOrders}
          value={summary.completedOrders ?? 0}
          icon={CheckCircle2}
        />
        <StatCard
          title={DASHBOARD_CONTENT.cancelledOrders}
          value={summary.cancelledOrders ?? 0}
          icon={XCircle}
        />
        <StatCard
          title={DASHBOARD_CONTENT.activeTables}
          value={summary.activeTables ?? 0}
          icon={Table2}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{DASHBOARD_CONTENT.dailySales}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">{DASHBOARD_CONTENT.totalOrders}</p>
              <p className="text-2xl font-bold">{daily.totalOrders ?? 0}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">{DASHBOARD_CONTENT.totalRevenue}</p>
              <p className="text-2xl font-bold">{formatINR(daily.totalRevenue)}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">{DASHBOARD_CONTENT.avgOrderValue}</p>
              <p className="text-2xl font-bold">{formatINR(daily.averageOrderValue)}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">{DASHBOARD_CONTENT.peakTime}</p>
              <p className="text-2xl font-bold">{daily.peakOrderingTime ?? '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{DASHBOARD_CONTENT.salesOverview}</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length ? (
              <SimpleBarChart data={chartData} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No sales data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{DASHBOARD_CONTENT.orderStatus}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.statusBreakdown || []).map((item) => (
              <div key={item.status} className="flex items-center justify-between text-sm">
                <span className="capitalize">{item.status}</span>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            ))}
            {!data?.statusBreakdown?.length && (
              <p className="text-sm text-muted-foreground">No orders in this period</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{DASHBOARD_CONTENT.recentOrders}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Table</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {(data?.recentOrders || []).map((order) => (
                <tr key={order.orderId} className="border-b border-border/60 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                  <td className="px-4 py-3">{order.tableNumber}</td>
                  <td className="px-4 py-3">{formatINR(order.total)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[order.orderStatus]} className="capitalize">
                      {order.orderStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatOrderTime(order.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" onClick={() => setSelectedOrderId(order.orderId)}>
                      {DASHBOARD_CONTENT.viewOrder}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.recentOrders?.length && (
            <p className="py-8 text-center text-sm text-muted-foreground">No recent orders</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedOrderId)} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent onClose={() => setSelectedOrderId(null)} className="max-w-md">
          <DialogHeader>
            <DialogTitle>{orderDetail?.order?.orderNumber || 'Order details'}</DialogTitle>
          </DialogHeader>
          {orderDetail?.order && (
            <div className="space-y-3 text-sm">
              <p>
                Table {orderDetail.order.table?.tableNumber} ·{' '}
                <span className="capitalize">{orderDetail.order.orderStatus}</span>
              </p>
              <ul className="space-y-1 border-t border-border pt-3">
                {orderDetail.order.items.map((item) => (
                  <li key={item.foodId} className="flex justify-between">
                    <span>
                      {item.quantity} × {item.foodName}
                    </span>
                    <span>{formatINR(item.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <p className="border-t border-border pt-2 font-bold">
                Total: {formatINR(orderDetail.order.total)}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DashboardHome
