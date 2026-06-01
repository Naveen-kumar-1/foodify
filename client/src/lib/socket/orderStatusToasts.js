import toast from 'react-hot-toast'
import { CUSTOMER_STATUS } from '@/constants/customerContent'

const STATUS_MESSAGES = {
  preparing: 'Your order is now being prepared.',
  ready: 'Your order is ready!',
  served: 'Your order has been served.',
  completed: 'Your order is complete. Thank you!',
  cancelled: 'Your order was cancelled.',
}

export const notifyOrderStatusChange = (order, previousStatus) => {
  if (!order?.orderStatus || order.orderStatus === previousStatus) return

  const message = STATUS_MESSAGES[order.orderStatus]
  if (!message) return

  const label = CUSTOMER_STATUS[order.orderStatus] || order.orderStatus
  toast.success(message, {
    id: `order-status-${order.orderId}-${order.orderStatus}`,
    duration: 4500,
    icon: '🔔',
  })
}
