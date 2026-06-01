export const KITCHEN_COLUMNS = [
  {
    key: 'placed',
    label: 'New Orders',
    accent: 'border-t-blue-500',
    badge: 'bg-blue-50 text-blue-700 ring-blue-200',
    dot: 'bg-blue-500',
    action: { next: 'preparing', label: 'Start' },
  },
  {
    key: 'preparing',
    label: 'Preparing',
    accent: 'border-t-orange-500',
    badge: 'bg-orange-50 text-orange-700 ring-orange-200',
    dot: 'bg-orange-500',
    action: { next: 'ready', label: 'Ready' },
  },
  {
    key: 'ready',
    label: 'Ready',
    accent: 'border-t-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
    action: { next: 'served', label: 'Served' },
  },
  {
    key: 'served',
    label: 'Served',
    accent: 'border-t-violet-500',
    badge: 'bg-violet-50 text-violet-700 ring-violet-200',
    dot: 'bg-violet-500',
    action: { next: 'completed', label: 'Complete' },
  },
]

export const KITCHEN_FILTERS = [
  { value: 'board', label: 'Live board' },
  { value: 'placed', label: 'New' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'served', label: 'Served' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]
