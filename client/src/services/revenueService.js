import { api } from '@/services/api'

export const revenueService = {
  getAnalytics: (params) => api.get('/api/revenue/analytics', { params }).then((r) => r.data),

  exportCsv: async (params) => {
    const response = await api.get('/api/revenue/export', {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
