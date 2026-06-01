import { ROUTE_LOADING_CONTENT } from '@/constants/content'

const RouteLoading = () => {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
      aria-label={ROUTE_LOADING_CONTENT.label}
    >
      <div className="size-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      <p className="text-sm text-muted-foreground">{ROUTE_LOADING_CONTENT.message}</p>
    </div>
  )
}

export default RouteLoading
