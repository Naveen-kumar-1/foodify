import { useMemo, useState } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, RefreshCw, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import KitchenOrderCard from '@/components/kitchen/KitchenOrderCard'
import KitchenOrderDrawer from '@/components/kitchen/KitchenOrderDrawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { KITCHEN_COLUMNS, KITCHEN_FILTERS } from '@/constants/kitchenContent'
import { useRestaurantOrderSocket } from '@/hooks/useRestaurantOrderSocket'
import { orderService } from '@/services/orderService'
import { getErrorMessage } from '@/services/api'
import { formatINR, formatOrderTime } from '@/lib/customerUi'
import { cn } from '@/lib/utils'

const COLUMN_LIMIT = 12
const LIST_LIMIT = 20

const KitchenDashboard = () => {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('board')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [columnPages, setColumnPages] = useState({
    placed: 1,
    preparing: 1,
    ready: 1,
    served: 1,
  })
  const [listPage, setListPage] = useState(1)

  useRestaurantOrderSocket({
    enabled: true,
    onOrderEvent: (payload) => {
      if (payload?.orderStatus === 'placed') {
        toast.success(`New order ${payload.orderNumber}`, { duration: 4000 })
      }
      queryClient.invalidateQueries({ queryKey: ['kitchenCol'] })
      queryClient.invalidateQueries({ queryKey: ['kitchenList'] })
    },
  })

  const isBoardView = filter === 'board' || KITCHEN_COLUMNS.some((c) => c.key === filter)
  const visibleColumns =
    filter === 'board' ? KITCHEN_COLUMNS : KITCHEN_COLUMNS.filter((c) => c.key === filter)

  const columnQueries = useQueries({
    queries: visibleColumns.map((col) => ({
      queryKey: ['kitchenCol', col.key, search, columnPages[col.key]],
      queryFn: () =>
        orderService.getKitchenBoard({
          status: col.key,
          search: search || undefined,
          sort: 'oldest',
          page: columnPages[col.key],
          limit: COLUMN_LIMIT,
        }),
      enabled: isBoardView,
      staleTime: 20_000,
      refetchOnWindowFocus: false,
    })),
  })

  const listQuery = useQuery({
    queryKey: ['kitchenList', filter, search, listPage],
    queryFn: () =>
      orderService.getKitchenBoard({
        status: filter,
        search: search || undefined,
        sort: 'latest',
        page: listPage,
        limit: LIST_LIMIT,
      }),
    enabled: !isBoardView,
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  })

  const statusMutation = useMutation({
    mutationFn: ({ orderId, nextStatus }) =>
      orderService.kitchenUpdateStatus(orderId, nextStatus),
    onMutate: ({ orderId }) => setUpdatingId(orderId),
    onSuccess: (data, { nextStatus, orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['kitchenCol'] })
      queryClient.invalidateQueries({ queryKey: ['kitchenList'] })
      toast.success('Order updated')
      if (data?.order?.orderId === orderId) {
        if (nextStatus === 'completed' || nextStatus === 'cancelled') {
          setSelectedOrder(null)
        } else {
          setSelectedOrder(data.order)
        }
      }
    },
    onError: (err) => toast.error(getErrorMessage(err)),
    onSettled: () => setUpdatingId(null),
  })

  const handleAction = (orderId, nextStatus) => {
    statusMutation.mutate({ orderId, nextStatus })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setListPage(1)
    setColumnPages({ placed: 1, preparing: 1, ready: 1, served: 1 })
  }

  const refreshAll = () => {
    if (isBoardView) columnQueries.forEach((q) => q.refetch())
    else listQuery.refetch()
  }

  const isFetching = isBoardView
    ? columnQueries.some((q) => q.isFetching)
    : listQuery.isFetching

  const stats = useMemo(() => {
    const counts = { placed: 0, preparing: 0, ready: 0, served: 0, completed: 0, cancelled: 0 }
    columnQueries.forEach((q, i) => {
      const key = visibleColumns[i]?.key
      if (key && q.data?.pagination) counts[key] = q.data.pagination.total
    })
    return counts
  }, [columnQueries, visibleColumns])

  const drawerAction = selectedOrder
    ? KITCHEN_COLUMNS.find((c) => c.key === selectedOrder.orderStatus)?.action
    : null

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col bg-gray-50">
      {/* Top bar */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-3 py-2 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'placed', label: 'New', count: stats.placed, color: 'text-blue-600' },
            { key: 'preparing', label: 'Prep', count: stats.preparing, color: 'text-orange-600' },
            { key: 'ready', label: 'Ready', count: stats.ready, color: 'text-emerald-600' },
            { key: 'served', label: 'Served', count: stats.served, color: 'text-violet-600' },
          ].map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                setFilter(s.key)
                setColumnPages((p) => ({ ...p, [s.key]: 1 }))
              }}
              className="flex items-center gap-1.5 rounded-md border border-gray-100 bg-gray-50 px-2.5 py-1 text-xs font-medium hover:bg-gray-100"
            >
              <span className="text-gray-500">{s.label}</span>
              <span className={cn('font-bold tabular-nums', s.color)}>{s.count}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="mt-2 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Order # or table…"
              className="h-9 border-gray-200 bg-gray-50 pl-8 text-sm"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary" className="shrink-0">
            Search
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={refreshAll}
            disabled={isFetching}
          >
            <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
          </Button>
        </form>

        <div className="mt-2 flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {KITCHEN_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setFilter(f.value)
                setListPage(1)
                setColumnPages({ placed: 1, preparing: 1, ready: 1, served: 1 })
              }}
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition',
                filter === f.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Board / list */}
      {isBoardView ? (
        <div className="flex min-h-0 flex-1 gap-2 overflow-x-auto p-2 sm:gap-3 sm:p-3">
          {visibleColumns.map((col, colIndex) => {
            const query = columnQueries[colIndex]
            const orders = query.data?.data || []
            const pagination = query.data?.pagination || { page: 1, totalPages: 1, total: 0 }
            const isLoading = query.isLoading

            return (
              <div
                key={col.key}
                className={cn(
                  'flex w-[min(100%,280px)] shrink-0 flex-col rounded-lg border border-gray-200 bg-gray-100/80',
                  'border-t-[3px]',
                  col.accent,
                )}
              >
                <div className="flex items-center justify-between px-2.5 py-2">
                  <div className="flex items-center gap-2">
                    <span className={cn('size-2 rounded-full', col.dot)} />
                    <h2 className="text-xs font-bold tracking-wide text-gray-800 uppercase">
                      {col.label}
                    </h2>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset',
                      col.badge,
                    )}
                  >
                    {pagination.total}
                  </span>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="size-6 animate-spin text-gray-400" />
                    </div>
                  ) : !orders.length ? (
                    <p className="py-6 text-center text-xs text-gray-400">No orders</p>
                  ) : (
                    orders.map((order) => (
                      <KitchenOrderCard
                        key={order.orderId}
                        order={order}
                        action={col.action}
                        isUpdating={updatingId === order.orderId}
                        onOpen={setSelectedOrder}
                        onAction={handleAction}
                      />
                    ))
                  )}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-200 px-2 py-1.5">
                    <button
                      type="button"
                      disabled={columnPages[col.key] <= 1}
                      onClick={() =>
                        setColumnPages((p) => ({ ...p, [col.key]: p[col.key] - 1 }))
                      }
                      className="text-[10px] font-medium text-gray-600 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <span className="text-[10px] text-gray-400">
                      {columnPages[col.key]}/{pagination.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={columnPages[col.key] >= pagination.totalPages}
                      onClick={() =>
                        setColumnPages((p) => ({ ...p, [col.key]: p[col.key] + 1 }))
                      }
                      className="text-[10px] font-medium text-gray-600 disabled:opacity-40"
                    >
                      More
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {listQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-8 animate-spin text-gray-400" />
            </div>
          ) : !listQuery.data?.data?.length ? (
            <p className="py-16 text-center text-sm text-gray-400">No orders found</p>
          ) : (
            <div className="mx-auto max-w-2xl space-y-2">
              {listQuery.data.data.map((order) => (
                <button
                  key={order.orderId}
                  type="button"
                  onClick={() => setSelectedOrder(order)}
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left shadow-sm hover:border-gray-300"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">
                      Table {order.table?.tableNumber} · {formatOrderTime(order.createdAt)} ·{' '}
                      {order.items.reduce((s, i) => s + i.quantity, 0)} items
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold">{formatINR(order.total)}</span>
                  <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-[10px] capitalize">
                    {order.orderStatus}
                  </span>
                </button>
              ))}
            </div>
          )}

          {listQuery.data?.pagination?.totalPages > 1 && (
            <div className="mx-auto mt-4 flex max-w-2xl items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                disabled={listPage <= 1}
                onClick={() => setListPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-gray-500">
                Page {listPage} of {listQuery.data.pagination.totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={listPage >= listQuery.data.pagination.totalPages}
                onClick={() => setListPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      <KitchenOrderDrawer
        order={selectedOrder}
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        action={drawerAction}
        isUpdating={updatingId === selectedOrder?.orderId}
        onAction={handleAction}
      />
    </div>
  )
}

export default KitchenDashboard
