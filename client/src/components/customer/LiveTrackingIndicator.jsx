import { cn } from '@/lib/utils'

const STATE_CONFIG = {
  connected: {
    label: '● Live Tracking Active',
    className: 'bg-emerald-50 text-emerald-700',
    dotClass: 'bg-emerald-500 animate-pulse',
  },
  reconnecting: {
    label: 'Reconnecting…',
    className: 'bg-amber-50 text-amber-700',
    dotClass: 'bg-amber-500',
  },
  disconnected: {
    label: 'Disconnected',
    className: 'bg-gray-100 text-gray-600',
    dotClass: 'bg-gray-400',
  },
}

const LiveTrackingIndicator = ({ connectionState, className, showWhenIdle = false }) => {
  const state = STATE_CONFIG[connectionState] || STATE_CONFIG.disconnected

  if (!showWhenIdle && connectionState === 'disconnected') return null

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
        state.className,
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span className={cn('size-2 rounded-full', state.dotClass)} aria-hidden />
      {state.label}
    </div>
  )
}

export default LiveTrackingIndicator
