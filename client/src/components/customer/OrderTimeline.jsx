import { Check } from 'lucide-react'
import { CUSTOMER_STATUS } from '@/constants/customerContent'
import { getStatusStyle } from '@/lib/customerUi'
import { cn } from '@/lib/utils'

const STEPS = ['placed', 'confirmed', 'preparing', 'ready', 'served', 'completed']

const OrderTimeline = ({ currentStatus }) => {
  const currentIndex = STEPS.indexOf(currentStatus)

  if (currentStatus === 'cancelled') {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-center">
        <p className="text-sm font-semibold text-red-700">{CUSTOMER_STATUS.cancelled}</p>
        <p className="mt-1 text-xs text-red-600">This order was cancelled.</p>
      </div>
    )
  }

  return (
    <ol className="relative">
      {STEPS.map((step, index) => {
        const done = index <= currentIndex
        const active = index === currentIndex
        const style = getStatusStyle(step)

        return (
          <li key={step} className="relative flex gap-4 pb-10 last:pb-0">
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'absolute left-4 top-8 h-[calc(100%-1rem)] w-px -translate-x-1/2',
                  done ? 'bg-gray-300' : 'bg-gray-200',
                )}
                aria-hidden
              />
            )}
            <div
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300',
                done ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-400',
                active && 'ring-4 ring-gray-100',
              )}
            >
              {done ? <Check className="size-4" strokeWidth={2.5} /> : null}
            </div>
            <div className="flex-1 pt-0.5">
              <p
                className={cn(
                  'font-medium transition-colors',
                  done ? 'text-gray-900' : 'text-gray-400',
                )}
              >
                {CUSTOMER_STATUS[step]}
              </p>
              {active && (
                <span
                  className={cn(
                    'mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-medium',
                    style.bg,
                    style.text,
                  )}
                >
                  Current step
                </span>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default OrderTimeline
