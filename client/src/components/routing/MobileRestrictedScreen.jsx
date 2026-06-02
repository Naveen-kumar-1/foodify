import { Link } from 'react-router-dom'
import { MonitorSmartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTE_PATHS } from '@/routes/constants'

const MobileRestrictedScreen = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-6 py-12">
    <div className="mx-auto flex max-w-md flex-col items-center text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <MonitorSmartphone className="size-10" strokeWidth={1.5} />
      </div>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        Desktop &amp; tablet only
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        This feature is available only on desktop and tablet devices. Please access it from a
        larger screen for the best experience.
      </p>
      <Button asChild variant="outline" className="mt-8">
        <Link to={ROUTE_PATHS.HOME}>Back to home</Link>
      </Button>
    </div>
  </div>
)

export default MobileRestrictedScreen
