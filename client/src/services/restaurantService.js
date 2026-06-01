import { api } from '@/services/api'

export const restaurantService = {
  getProfile: () => api.get('/restaurant/profile').then((r) => r.data),
  updateProfile: (payload) => api.put('/restaurant/profile', payload).then((r) => r.data),
  uploadLogo: (file) => {
    const form = new FormData()
    form.append('logo', file)
    return api
      .post('/restaurant/profile/logo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
  deleteLogo: () => api.delete('/restaurant/profile/logo').then((r) => r.data),
}
