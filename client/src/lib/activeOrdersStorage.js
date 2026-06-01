const ORDERS_KEY = (qrToken) => `foodify_orders_${qrToken}`
const SESSION_KEY = (qrToken) => `foodify_customer_ctx_${qrToken}`

export const ORDER_TTL_MS = 2 * 60 * 60 * 1000 // 2 hours

const now = () => Date.now()

export const buildOrderRecord = (order, tableMeta = {}) => ({
  orderId: order.orderId,
  orderNumber: order.orderNumber,
  restaurantId: order.restaurantId,
  tableId: order.tableId || tableMeta.tableId,
  tableNumber: order.table?.tableNumber ?? tableMeta.tableNumber,
  tableName: order.table?.tableName ?? tableMeta.tableName,
  orderStatus: order.orderStatus,
  total: order.total,
  paymentMethod: order.paymentMethod,
  createdAt: order.createdAt || new Date().toISOString(),
  expiresAt: new Date(now() + ORDER_TTL_MS).toISOString(),
})

export const isOrderExpired = (record) => new Date(record.expiresAt).getTime() <= now()

export const isInProgressStatus = (status) =>
  ['placed', 'preparing', 'ready', 'served'].includes(status)

export const readStoredOrders = (qrToken) => {
  try {
    const raw = localStorage.getItem(ORDERS_KEY(qrToken))
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export const pruneExpiredOrders = (orders) => orders.filter((o) => !isOrderExpired(o))

export const writeStoredOrders = (qrToken, orders) => {
  localStorage.setItem(ORDERS_KEY(qrToken), JSON.stringify(orders))
}

export const upsertStoredOrder = (qrToken, order, tableMeta) => {
  const record = buildOrderRecord(order, tableMeta)
  const orders = pruneExpiredOrders(readStoredOrders(qrToken))
  const idx = orders.findIndex((o) => o.orderId === record.orderId)
  if (idx >= 0) {
    const prev = orders[idx]
    orders[idx] = {
      ...prev,
      ...record,
      tableNumber: record.tableNumber ?? prev.tableNumber,
      tableName: record.tableName ?? prev.tableName,
      tableId: record.tableId ?? prev.tableId,
    }
  } else {
    orders.unshift(record)
  }
  writeStoredOrders(qrToken, orders)
  return orders[idx >= 0 ? idx : 0]
}

export const updateStoredOrderStatus = (qrToken, orderId, patch) => {
  const orders = readStoredOrders(qrToken)
  const idx = orders.findIndex((o) => o.orderId === orderId)
  if (idx < 0) return orders
  orders[idx] = { ...orders[idx], ...patch }
  writeStoredOrders(qrToken, pruneExpiredOrders(orders))
  return orders[idx]
}

export const readCustomerContext = (qrToken) => {
  try {
    const raw = localStorage.getItem(SESSION_KEY(qrToken))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const writeCustomerContext = (qrToken, ctx) => {
  localStorage.setItem(
    SESSION_KEY(qrToken),
    JSON.stringify({ ...ctx, qrToken, updatedAt: new Date().toISOString() }),
  )
}
