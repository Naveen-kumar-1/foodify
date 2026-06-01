import { io } from 'socket.io-client'
import { SOCKET_URL } from '@/config/env'

const sockets = {
  customer: null,
  restaurant: null,
}

const refCounts = { customer: 0, restaurant: 0 }

const createSocket = () =>
  io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  })

export const getCustomerSocket = () => {
  if (!sockets.customer) sockets.customer = createSocket()
  return sockets.customer
}

export const getRestaurantSocket = () => {
  if (!sockets.restaurant) sockets.restaurant = createSocket()
  return sockets.restaurant
}

export const acquireCustomerSocket = () => {
  const socket = getCustomerSocket()
  refCounts.customer += 1
  if (!socket.connected) socket.connect()
  return socket
}

export const releaseCustomerSocket = () => {
  refCounts.customer = Math.max(0, refCounts.customer - 1)
  if (refCounts.customer === 0 && sockets.customer?.connected) {
    sockets.customer.disconnect()
  }
}

export const acquireRestaurantSocket = () => {
  const socket = getRestaurantSocket()
  refCounts.restaurant += 1
  if (!socket.connected) socket.connect()
  return socket
}

export const releaseRestaurantSocket = () => {
  refCounts.restaurant = Math.max(0, refCounts.restaurant - 1)
  if (refCounts.restaurant === 0 && sockets.restaurant?.connected) {
    sockets.restaurant.disconnect()
  }
}

/** @deprecated use acquireCustomerSocket */
export const acquireSocket = acquireCustomerSocket
/** @deprecated use releaseCustomerSocket */
export const releaseSocket = releaseCustomerSocket
export const getSocket = getCustomerSocket
