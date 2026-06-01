const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

let slots = [
  { id: '1', label: 'Breakfast', startTime: '08:00', endTime: '11:00', enabled: true },
  { id: '2', label: 'Lunch', startTime: '12:00', endTime: '15:00', enabled: true },
  { id: '3', label: 'Dinner', startTime: '18:00', endTime: '22:00', enabled: true },
  { id: '4', label: 'Late Night', startTime: '22:00', endTime: '23:30', enabled: false },
]

export const timeslotsService = {
  async list() {
    await delay()
    return [...slots]
  },
  async create(payload) {
    await delay()
    const slot = { id: String(Date.now()), enabled: true, ...payload }
    slots = [...slots, slot]
    return slot
  },
  async update(id, payload) {
    await delay()
    slots = slots.map((s) => (s.id === id ? { ...s, ...payload } : s))
    return slots.find((s) => s.id === id)
  },
  async remove(id) {
    await delay()
    slots = slots.filter((s) => s.id !== id)
  },
}
