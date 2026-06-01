const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

export const dashboardService = {
  async getAnalytics(range = '7d') {
    await delay()
    const multiplier = range === 'today' ? 1 : range === '30d' ? 4 : 2
    return {
      summary: {
        todaySales: 12450 * multiplier,
        totalOrders: 86 * multiplier,
        pendingOrders: 12,
        completedOrders: 74 * multiplier,
      },
      salesChart: {
        daily: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => ({
          label,
          sales: randomBetween(800, 3200) * multiplier,
        })),
        weekly: ['W1', 'W2', 'W3', 'W4'].map((label) => ({
          label,
          sales: randomBetween(5000, 12000) * multiplier,
        })),
        monthly: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((label) => ({
          label,
          sales: randomBetween(20000, 45000) * multiplier,
        })),
      },
      recentOrders: [
        { id: 'ORD-1042', table: 'T-03', total: 48.5, status: 'pending', time: '12 min ago' },
        { id: 'ORD-1041', table: 'T-07', total: 92.0, status: 'preparing', time: '25 min ago' },
        { id: 'ORD-1040', table: 'T-01', total: 36.75, status: 'completed', time: '1 hr ago' },
        { id: 'ORD-1039', table: 'T-05', total: 128.0, status: 'completed', time: '2 hr ago' },
      ],
      topItems: [
        { name: 'Margherita Pizza', orders: 42, revenue: 630 },
        { name: 'Classic Burger', orders: 38, revenue: 456 },
        { name: 'Pasta Alfredo', orders: 31, revenue: 403 },
        { name: 'Caesar Salad', orders: 24, revenue: 216 },
      ],
      statusBreakdown: [
        { status: 'pending', count: 12, color: 'hsl(var(--chart-4))' },
        { status: 'preparing', count: 8, color: 'hsl(var(--chart-2))' },
        { status: 'completed', count: 56, color: 'hsl(var(--chart-1))' },
        { status: 'cancelled', count: 3, color: 'hsl(var(--chart-5))' },
      ],
    }
  },
}
