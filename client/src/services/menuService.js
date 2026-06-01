import { api } from '@/services/api'

export const menuService = {
  createMenuItem: (payload) => api.post('/api/menu', payload).then((r) => r.data),

  getMenuItems: (params) => api.get('/api/menu', { params }).then((r) => r.data),

  getMenuStats: () => api.get('/api/menu/stats').then((r) => r.data),

  getMenuItem: (foodId) => api.get(`/api/menu/${foodId}`).then((r) => r.data),

  updateMenuItem: (foodId, payload) =>
    api.put(`/api/menu/${foodId}`, payload).then((r) => r.data),

  deleteMenuItem: (foodId) => api.delete(`/api/menu/${foodId}`).then((r) => r.data),

  toggleMenuItemStatus: (foodId, isActive) =>
    api.patch(`/api/menu/${foodId}/status`, { isActive }).then((r) => r.data),

  getPublicMenu: (restaurantId) =>
    api.get(`/api/menu/public/${restaurantId}`).then((r) => r.data),
}
