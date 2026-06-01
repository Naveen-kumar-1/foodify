import { useCallback, useEffect, useRef, useState } from 'react'
import {
  acquireCustomerSocket,
  getCustomerSocket,
  releaseCustomerSocket,
} from '@/lib/socket/socketClient'
import { SOCKET_EVENTS, FALLBACK_POLL_MS } from '@/lib/socket/constants'

/**
 * Subscribes to order rooms for live updates. Falls back to slow poll when disconnected.
 */
export const useCustomerOrderSocket = ({
  orderIds = [],
  customerSessionId,
  onOrderUpdate,
  onOrderPlaced,
  enabled = true,
  fallbackFetch,
}) => {
  const [connectionState, setConnectionState] = useState('disconnected')
  const joinedRef = useRef(new Set())
  const statusRef = useRef(new Map())
  const handlersRef = useRef({ onOrderUpdate, onOrderPlaced, fallbackFetch })
  handlersRef.current = { onOrderUpdate, onOrderPlaced, fallbackFetch }

  const joinOrders = useCallback(
    (socket) => {
      if (!customerSessionId || !orderIds.length) return

      const activeIds = new Set(orderIds)

      orderIds.forEach((orderId) => {
        if (joinedRef.current.has(orderId)) return
        socket.emit('join-order', { orderId, customerSessionId }, (res) => {
          if (res?.ok) joinedRef.current.add(orderId)
        })
      })

      ;[...joinedRef.current].forEach((id) => {
        if (!activeIds.has(id)) {
          socket.emit('leave-order', { orderId: id })
          joinedRef.current.delete(id)
        }
      })
    },
    [orderIds, customerSessionId],
  )

  useEffect(() => {
    if (!enabled || !customerSessionId) {
      setConnectionState('disconnected')
      return undefined
    }

    const socket = acquireCustomerSocket()

    const onConnect = () => {
      setConnectionState('connected')
      joinOrders(socket)
    }
    const onDisconnect = () => setConnectionState('reconnecting')
    const onReconnect = () => {
      setConnectionState('connected')
      joinedRef.current.clear()
      joinOrders(socket)
    }

    const onStatusUpdated = (payload) => {
      const prev = statusRef.current.get(payload.orderId)
      statusRef.current.set(payload.orderId, payload.orderStatus)
      handlersRef.current.onOrderUpdate?.(payload, prev)
    }

    const onPlaced = (payload) => {
      handlersRef.current.onOrderPlaced?.(payload)
      handlersRef.current.onOrderUpdate?.(payload, null)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('reconnect', onReconnect)
    socket.on(SOCKET_EVENTS.ORDER_STATUS_UPDATED, onStatusUpdated)
    socket.on(SOCKET_EVENTS.ORDER_PLACED, onPlaced)

    if (socket.connected) onConnect()
    else socket.connect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('reconnect', onReconnect)
      socket.off(SOCKET_EVENTS.ORDER_STATUS_UPDATED, onStatusUpdated)
      socket.off(SOCKET_EVENTS.ORDER_PLACED, onPlaced)
      ;[...joinedRef.current].forEach((orderId) => socket.emit('leave-order', { orderId }))
      joinedRef.current.clear()
      releaseCustomerSocket()
    }
  }, [enabled, customerSessionId, joinOrders])

  useEffect(() => {
    if (!enabled || !customerSessionId) return
    const socket = getCustomerSocket()
    if (socket.connected) joinOrders(socket)
  }, [orderIds, enabled, customerSessionId, joinOrders])

  useEffect(() => {
    if (!enabled || connectionState === 'connected' || !fallbackFetch) return undefined
    if (!orderIds.length) return undefined

    fallbackFetch()
    const id = setInterval(() => fallbackFetch(), FALLBACK_POLL_MS)
    return () => clearInterval(id)
  }, [enabled, connectionState, orderIds, fallbackFetch])

  return { connectionState, isLive: connectionState === 'connected' }
}
