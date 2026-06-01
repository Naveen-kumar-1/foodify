import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '@/components/common/PageHeader'
import { ORDERS_CONTENT } from '@/constants/content'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import RouteLoading from '@/components/routing/RouteLoading'
import { useDebounce } from '@/hooks/useDebounce'
import { useRestaurantOrderSocket } from '@/hooks/useRestaurantOrderSocket'
import { orderService } from '@/services/orderService'
import { getErrorMessage } from '@/services/api'

const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const statusVariant = {
  placed: 'warning',
  preparing: 'secondary',
  ready: 'default',
  served: 'default',
  completed: 'success',
  cancelled: 'destructive',
}

const STATUS_OPTIONS = [
  { value: 'all', label: ORDERS_CONTENT.allStatuses },
  { value: 'placed', label: 'Placed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'served', label: 'Served' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const OrdersManagement = () => {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState(null)

  useRestaurantOrderSocket({
    onOrderEvent: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['orderStats'] })
    },
  })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)
  const pageSize = 10

  const { data: statsData } = useQuery({
    queryKey: ['orderStats'],
    queryFn: () => orderService.getOrderStats(),
  })

  const {
    data: listData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['orders', debouncedSearch, status, page],
    queryFn: () =>
      orderService.getOrders({
        search: debouncedSearch || undefined,
        status,
        page,
        limit: pageSize,
      }),
  })

  const stats = statsData?.stats
  const orders = listData?.data || []
  const pagination = listData?.pagination || { page: 1, totalPages: 1, total: 0 }

  const openDetails = async (orderId) => {
    try {
      const { order } = await orderService.getOrder(orderId)
      setSelected(order)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const updateStatus = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus)
      toast.success(ORDERS_CONTENT.statusUpdated)
      if (selected?.orderId === orderId) {
        const { order } = await orderService.getOrder(orderId)
        setSelected(order)
      }
      refetch()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status])

  return (
    <div>
      <PageHeader title={ORDERS_CONTENT.title} description={ORDERS_CONTENT.description} />

      {stats && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Today's Orders", value: stats.todayOrders },
            { label: "Today's Revenue", value: formatINR(stats.todayRevenue) },
            { label: 'Pending', value: stats.pendingOrders },
            { label: 'Completed Today', value: stats.completedOrders },
            { label: 'Cancelled Today', value: stats.cancelledOrders },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder={ORDERS_CONTENT.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <RouteLoading />
      ) : !orders.length ? (
        <p className="text-center text-muted-foreground py-12">No orders found.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {orders.map((order) => (
              <Card key={order.orderId}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.table
                        ? `${order.table.tableName} · #${order.table.tableNumber}`
                        : 'Table —'}{' '}
                      · {formatINR(order.total)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant[order.orderStatus]} className="capitalize">
                      {order.orderStatus}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => openDetails(order.orderId)}>
                      <Eye className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} orders)
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          {selected && (
            <Card className="sticky top-20 h-fit">
              <CardContent className="p-4">
                <h3 className="font-semibold">{selected.orderNumber}</h3>
                {selected.table && (
                  <p className="text-sm text-muted-foreground">
                    {selected.table.tableName} · Table {selected.table.tableNumber}
                  </p>
                )}
                <p className="text-sm text-muted-foreground capitalize">
                  {selected.paymentMethod?.replace('_', ' ')} · {selected.paymentStatus}
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {selected.items?.map((item) => (
                    <li key={item.foodId} className="flex justify-between">
                      <span>
                        {item.foodName} ×{item.quantity}
                      </span>
                      <span>{formatINR(item.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 space-y-1 text-sm">
                  <p className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatINR(selected.subtotal)}</span>
                  </p>
                  {selected.discount > 0 && (
                    <p className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatINR(selected.discount)}</span>
                    </p>
                  )}
                  <p className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatINR(selected.total)}</span>
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {['placed', 'preparing', 'ready', 'served', 'completed', 'cancelled'].map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selected.orderStatus === s ? 'default' : 'outline'}
                      onClick={() => updateStatus(selected.orderId, s)}
                      className="capitalize"
                    >
                      {s}
                    </Button>
                  ))}
                </div>
                <Button
                  className="mt-3 w-full"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected(null)}
                >
                  Close
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export default OrdersManagement
