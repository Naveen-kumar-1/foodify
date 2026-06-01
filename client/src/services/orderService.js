import { api } from '@/services/api'

export const orderService = {
  scanMenu: (qrToken) => api.get(`/api/orders/public/scan/${qrToken}`).then((r) => r.data),

  previewOrder: (qrToken, payload) =>
    api.post(`/api/orders/public/preview/${qrToken}`, payload).then((r) => r.data),

  placeOrder: (qrToken, payload) =>
    api.post(`/api/orders/public/place/${qrToken}`, payload).then((r) => r.data),

  trackOrder: (orderId, sessionId) =>
    api.get(`/api/orders/public/track/${orderId}`, { params: { sessionId } }).then((r) => r.data),

  validateCoupon: (qrToken, payload) =>
    api.post(`/api/orders/public/coupon/${qrToken}`, payload).then((r) => r.data),

  getOrders: (params) => api.get('/api/orders', { params }).then((r) => r.data),

  getOrder: (orderId) => api.get(`/api/orders/${orderId}`).then((r) => r.data),

  getOrderStats: () => api.get('/api/orders/stats').then((r) => r.data),

  getKitchenBoard: (params) =>
    api.get('/api/orders/kitchen/board', { params }).then((r) => r.data),

  updateOrderStatus: (orderId, status) =>
    api.patch(`/api/orders/${orderId}/status`, { status }).then((r) => r.data),

  kitchenUpdateStatus: (orderId, status) =>
    api.patch(`/api/orders/kitchen/${orderId}/status`, { status }).then((r) => r.data),
}
