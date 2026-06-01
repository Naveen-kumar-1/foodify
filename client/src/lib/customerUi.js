export const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n ?? 0)

export const formatOrderTime = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const STATUS_STYLES = {
  placed: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', label: 'Placed' },
  confirmed: { dot: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700', label: 'Confirmed' },
  preparing: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', label: 'Preparing' },
  ready: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Ready' },
  served: { dot: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', label: 'Served' },
  completed: { dot: 'bg-gray-500', bg: 'bg-gray-100', text: 'text-gray-700', label: 'Completed' },
  cancelled: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelled' },
}

export const getStatusStyle = (status) =>
  STATUS_STYLES[status] || STATUS_STYLES.placed
