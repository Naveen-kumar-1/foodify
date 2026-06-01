import { api } from '@/services/api'

export const timeSlotService = {
  createTimeSlot: (payload) =>
    api.post('/api/timeslots', payload).then((r) => r.data),

  getTimeSlots: (params) =>
    api.get('/api/timeslots', { params }).then((r) => r.data),

  getTimeSlot: (slotId) =>
    api.get(`/api/timeslots/${slotId}`).then((r) => r.data),

  updateTimeSlot: (slotId, payload) =>
    api.put(`/api/timeslots/${slotId}`, payload).then((r) => r.data),

  deleteTimeSlot: (slotId) =>
    api.delete(`/api/timeslots/${slotId}`).then((r) => r.data),

  toggleTimeSlotStatus: (slotId, isActive) =>
    api.patch(`/api/timeslots/${slotId}/status`, { isActive }).then((r) => r.data),
}
