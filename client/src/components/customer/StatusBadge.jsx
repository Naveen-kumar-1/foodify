import { CUSTOMER_STATUS } from '@/constants/customerContent'
import { getStatusStyle } from '@/lib/customerUi'
import { cn } from '@/lib/utils'

const StatusBadge = ({ status, className, pulse = false }) => {
  const style = getStatusStyle(status)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        style.bg,
        style.text,
        className,
      )}
    >
      <span
        className={cn('size-2 rounded-full', style.dot, pulse && 'animate-pulse')}
        aria-hidden
      />
      {CUSTOMER_STATUS[status] || style.label}
    </span>
  )
}

export default StatusBadge
