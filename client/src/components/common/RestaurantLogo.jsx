import { cn } from '@/lib/utils'

const RestaurantLogo = ({ name, logoUrl, size = 'md', className }) => {
  const sizes = {
    sm: 'size-8 text-xs',
    md: 'size-11 text-sm',
    lg: 'size-14 text-base',
  }

  const url = logoUrl || ''

  if (url) {
    return (
      <img
        src={url}
        alt={name ? `${name} logo` : 'Restaurant logo'}
        className={cn('rounded-lg border border-border object-cover', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground',
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {(name || 'R').charAt(0).toUpperCase()}
    </div>
  )
}

export default RestaurantLogo
