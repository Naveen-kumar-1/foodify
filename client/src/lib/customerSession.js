import { uuidv4 } from '@/lib/uuid'
import { readCustomerContext, writeCustomerContext } from '@/lib/activeOrdersStorage'

const sessionIdKey = (qrToken) => `foodify_customer_session_${qrToken}`

export const getCustomerSessionId = (qrToken) => {
  const ctx = readCustomerContext(qrToken)
  if (ctx?.customerSessionId) return ctx.customerSessionId

  const key = sessionIdKey(qrToken)
  let id = localStorage.getItem(key)
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : uuidv4()
    localStorage.setItem(key, id)
  }
  return id
}

export const bindCustomerSession = (qrToken, scanPayload) => {
  const customerSessionId = getCustomerSessionId(qrToken)
  const ctx = {
    customerSessionId,
    qrToken,
    restaurantId: scanPayload.restaurant?.restaurantId,
    restaurantName: scanPayload.restaurant?.name,
    tableId: scanPayload.table?.tableId,
    tableName: scanPayload.table?.tableName,
    tableNumber: scanPayload.table?.tableNumber,
  }
  writeCustomerContext(qrToken, ctx)
  return ctx
}

export { readCustomerContext, writeCustomerContext } from '@/lib/activeOrdersStorage'
