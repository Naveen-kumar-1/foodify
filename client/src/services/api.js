import axios from 'axios'
import { API_BASE_URL } from '@/config/env'
import { STORAGE_KEYS, storage } from '@/lib/storage'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = storage.getString(STORAGE_KEYS.ACCESS_TOKEN)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.'

    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      message = 'Cannot reach the server. Make sure the API is running (port 3000) and restart the dev server.'
    }

    if (error.response?.status === 401) {
      const hadToken = storage.getString(STORAGE_KEYS.ACCESS_TOKEN)
      if (hadToken) {
        storage.remove(STORAGE_KEYS.ACCESS_TOKEN)
        storage.remove(STORAGE_KEYS.REFRESH_TOKEN)
        storage.remove(STORAGE_KEYS.RESTAURANT)
        window.dispatchEvent(new CustomEvent('foodify:unauthorized'))
      }
    }

    return Promise.reject(new Error(message))
  },
)

export const getErrorMessage = (error) =>
  error?.message || 'Something went wrong. Please try again.'
