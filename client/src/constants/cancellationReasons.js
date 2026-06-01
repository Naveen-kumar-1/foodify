export const OTHER_REASON = 'Other'

export const CUSTOMER_CANCELLATION_REASONS = [
  'Ordered by mistake',
  'Want to change items',
  'Waiting time is too long',
  'Duplicate order',
  'No longer needed',
  OTHER_REASON,
]

export const STAFF_CANCELLATION_REASONS = [
  'Item unavailable',
  'Out of stock',
  'Kitchen issue',
  'Restaurant closed',
  'Unable to fulfill order',
  'Duplicate order',
  OTHER_REASON,
]

export const formatCancellationDisplay = (order) => {
  if (!order) return '—'
  if (order.cancellationReason === OTHER_REASON && order.customReason) {
    return order.customReason
  }
  return order.cancellationReason || order.customReason || '—'
}
