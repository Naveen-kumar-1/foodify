import { cn } from '@/lib/utils'

const Card = ({ className, ...props }) => (
  <div className={cn('rounded-xl border border-border bg-card text-card-foreground shadow-sm', className)} {...props} />
)

const CardHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col gap-1.5 p-6 pb-0', className)} {...props} />
)

const CardTitle = ({ className, ...props }) => (
  <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
)

const CardDescription = ({ className, ...props }) => (
  <p className={cn('text-sm text-muted-foreground', className)} {...props} />
)

const CardContent = ({ className, ...props }) => (
  <div className={cn('p-6', className)} {...props} />
)

export { Card, CardHeader, CardTitle, CardDescription, CardContent }
