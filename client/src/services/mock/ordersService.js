const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const statuses = ['pending', 'preparing', 'completed', 'cancelled']

let orders = Array.from({ length: 24 }, (_, i) => ({
  id: `ORD-${1042 - i}`,
  table: `T-${String((i % 8) + 1).padStart(2, '0')}`,
  items: [
    { name: 'Margherita Pizza', qty: 1, price: 15 },
    { name: 'Iced Latte', qty: 2, price: 5.5 },
  ],
  total: 26 + i * 3.5,
  status: statuses[i % statuses.length],
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
}))

export const ordersService = {
  async list({ search = '', status = 'all', page = 1, pageSize = 10 } = {}) {
    await delay()
    let filtered = [...orders]
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (o) => o.id.toLowerCase().includes(q) || o.table.toLowerCase().includes(q),
      )
    }
    if (status !== 'all') filtered = filtered.filter((o) => o.status === status)
    const total = filtered.length
    const start = (page - 1) * pageSize
    return { data: filtered.slice(start, start + pageSize), total, page, pageSize }
  },
  async getById(id) {
    await delay()
    return orders.find((o) => o.id === id)
  },
  async updateStatus(id, status) {
    await delay()
    orders = orders.map((o) => (o.id === id ? { ...o, status } : o))
    return orders.find((o) => o.id === id)
  },
}
