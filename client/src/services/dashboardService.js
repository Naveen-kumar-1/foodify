import { api } from '@/services/api'

export const dashboardService = {
  getAnalytics: (params) => api.get('/api/dashboard/analytics', { params }).then((r) => r.data),
}
