import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  isInProgressStatus,
  isOrderExpired,
  pruneExpiredOrders,
  readStoredOrders,
  updateStoredOrderStatus,
  upsertStoredOrder,
} from '@/lib/activeOrdersStorage'
import { bindCustomerSession, getCustomerSessionId } from '@/lib/customerSession'
import { notifyOrderStatusChange } from '@/lib/socket/orderStatusToasts'
import { useCustomerOrderSocket } from '@/hooks/useCustomerOrderSocket'
import { orderService } from '@/services/orderService'

const CustomerSessionContext = createContext(null)

export const CustomerSessionProvider = ({ qrToken, children }) => {
  const queryClient = useQueryClient()
  const [orders, setOrders] = useState(() => pruneExpiredOrders(readStoredOrders(qrToken)))

  const scanQuery = useQuery({
    queryKey: ['scanMenu', qrToken],
    queryFn: () => orderService.scanMenu(qrToken),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  const [session, setSession] = useState(null)

  useEffect(() => {
    if (scanQuery.data) {
      setSession(bindCustomerSession(qrToken, scanQuery.data))
    }
  }, [qrToken, scanQuery.data])

  const customerSessionId = session?.customerSessionId || getCustomerSessionId(qrToken)

  const syncOrders = useCallback((next) => {
    setOrders(pruneExpiredOrders(next))
  }, [])

  const registerOrder = useCallback(
    (order) => {
      const tableMeta = scanQuery.data?.table || {
        tableId: session?.tableId,
        tableNumber: session?.tableNumber,
        tableName: session?.tableName,
      }
      upsertStoredOrder(qrToken, order, tableMeta)
      syncOrders(readStoredOrders(qrToken))
    },
    [qrToken, session, scanQuery.data, syncOrders],
  )

  const patchOrder = useCallback(
    (orderId, patch) => {
      updateStoredOrderStatus(qrToken, orderId, patch)
      syncOrders(readStoredOrders(qrToken))
    },
    [qrToken, syncOrders],
  )

  const activeOrders = useMemo(
    () => orders.filter((o) => isInProgressStatus(o.orderStatus) && !isOrderExpired(o)),
    [orders],
  )

  const orderHistory = useMemo(
    () => orders.filter((o) => !isInProgressStatus(o.orderStatus) && !isOrderExpired(o)),
    [orders],
  )

  const primaryActiveOrder = activeOrders[0] || null

  const trackableOrderIds = useMemo(
    () =>
      orders
        .filter((o) => !isOrderExpired(o) && o.orderStatus !== 'cancelled')
        .map((o) => o.orderId),
    [orders],
  )

  const refreshOrderFromApi = useCallback(
    async (orderId) => {
      try {
        const data = await orderService.trackOrder(orderId, customerSessionId)
        if (data?.order) {
          registerOrder(data.order)
          return data.order
        }
      } catch {
        /* keep cached */
      }
      return null
    },
    [customerSessionId, registerOrder],
  )

  const handleSocketOrderUpdate = useCallback(
    (payload, previousStatus) => {
      registerOrder(payload)
      notifyOrderStatusChange(payload, previousStatus)
      queryClient.setQueryData(['trackOrder', payload.orderId, qrToken], { order: payload })
    },
    [registerOrder, queryClient, qrToken],
  )

  const fallbackFetchActive = useCallback(async () => {
    const targets = orders.filter(
      (o) => isInProgressStatus(o.orderStatus) && !isOrderExpired(o),
    )
    await Promise.all(targets.map((o) => refreshOrderFromApi(o.orderId)))
  }, [orders, refreshOrderFromApi])

  const { connectionState, isLive } = useCustomerOrderSocket({
    orderIds: trackableOrderIds,
    customerSessionId,
    enabled: Boolean(customerSessionId && trackableOrderIds.length),
    onOrderUpdate: handleSocketOrderUpdate,
    onOrderPlaced: handleSocketOrderUpdate,
    fallbackFetch: fallbackFetchActive,
  })

  useEffect(() => {
    syncOrders(readStoredOrders(qrToken))
  }, [qrToken, syncOrders])

  const value = useMemo(
    () => ({
      qrToken,
      session,
      scanData: scanQuery.data,
      scanLoading: scanQuery.isLoading,
      scanError: scanQuery.isError,
      orders,
      activeOrders,
      orderHistory,
      primaryActiveOrder,
      registerOrder,
      patchOrder,
      refreshOrderFromApi,
      connectionState,
      isLive,
    }),
    [
      qrToken,
      session,
      scanQuery.data,
      scanQuery.isLoading,
      scanQuery.isError,
      orders,
      activeOrders,
      orderHistory,
      primaryActiveOrder,
      registerOrder,
      patchOrder,
      refreshOrderFromApi,
      connectionState,
      isLive,
    ],
  )

  return (
    <CustomerSessionContext.Provider value={value}>{children}</CustomerSessionContext.Provider>
  )
}

export const useCustomerSession = () => {
  const ctx = useContext(CustomerSessionContext)
  if (!ctx) throw new Error('useCustomerSession must be used within CustomerSessionProvider')
  return ctx
}
