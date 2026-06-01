import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { COMMON_CONTENT, NOT_FOUND_CONTENT } from '@/constants/content'
import { ROUTE_PATHS } from '@/routes/constants'

const NotFound = () => {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-bold text-muted-foreground/30">404</p>
      <h1 className="mt-4 text-2xl font-semibold">{NOT_FOUND_CONTENT.title}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{NOT_FOUND_CONTENT.description}</p>
      <Button className="mt-6" asChild>
        <Link to={ROUTE_PATHS.HOME}>{COMMON_CONTENT.goHome}</Link>
      </Button>
    </section>
  )
}

export default NotFound
