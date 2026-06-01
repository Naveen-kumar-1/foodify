import { api } from '@/services/api'
import { API_BASE_URL } from '@/config/env'
import { STORAGE_KEYS, storage } from '@/lib/storage'

const downloadBlob = async (path, filename) => {
  const token = storage.getString(STORAGE_KEYS.ACCESS_TOKEN)
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('Download failed')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const tableService = {
  createTable: (payload) => api.post('/api/tables', payload).then((r) => r.data),
  createTablesBulk: (payload) => api.post('/api/tables/bulk', payload).then((r) => r.data),
  getTables: () => api.get('/api/tables').then((r) => r.data),
  updateTable: (tableId, payload) => api.put(`/api/tables/${tableId}`, payload).then((r) => r.data),
  regenerateQr: (tableId) => api.post(`/api/tables/${tableId}/regenerate-qr`).then((r) => r.data),
  deleteTable: (tableId) => api.delete(`/api/tables/${tableId}`).then((r) => r.data),
  bulkAction: (payload) => api.post('/api/tables/bulk-action', payload).then((r) => r.data),
  downloadQrZip: () => downloadBlob('/api/tables/export/zip', 'foodify-qr-codes.zip'),
  downloadQrPdf: () => downloadBlob('/api/tables/export/pdf', 'foodify-qr-codes.pdf'),
}
