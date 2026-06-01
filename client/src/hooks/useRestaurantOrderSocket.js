import { useEffect, useRef } from 'react'
import { acquireRestaurantSocket, releaseRestaurantSocket } from '@/lib/socket/socketClient'
import { SOCKET_EVENTS } from '@/lib/socket/constants'
import { STORAGE_KEYS, storage } from '@/lib/storage'

/**
 * Kitchen / admin: join restaurant room for live order events.
 */
export const useRestaurantOrderSocket = ({ enabled = true, onOrderEvent }) => {
  const handlerRef = useRef(onOrderEvent)
  handlerRef.current = onOrderEvent

  useEffect(() => {
    if (!enabled) return undefined

    const token = storage.getString(STORAGE_KEYS.ACCESS_TOKEN)
    if (!token) return undefined

    const socket = acquireRestaurantSocket()

    const onConnect = () => {
      socket.emit('join-restaurant', { token }, (res) => {
        if (!res?.ok) console.warn('[Socket] Restaurant join failed:', res?.message)
      })
    }

    const handleEvent = (payload) => {
      handlerRef.current?.(payload)
    }

    socket.on('connect', onConnect)
    socket.on(SOCKET_EVENTS.ORDER_PLACED, handleEvent)
    socket.on(SOCKET_EVENTS.ORDER_STATUS_UPDATED, handleEvent)

    if (socket.connected) onConnect()
    else socket.connect()

    return () => {
      socket.off('connect', onConnect)
      socket.off(SOCKET_EVENTS.ORDER_PLACED, handleEvent)
      socket.off(SOCKET_EVENTS.ORDER_STATUS_UPDATED, handleEvent)
      releaseRestaurantSocket()
    }
  }, [enabled])
}
