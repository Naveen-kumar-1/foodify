import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { COMMON_CONTENT, LANDING_CONTENT } from '@/constants/content'
import { ROUTE_PATHS } from '@/routes/constants'

const Landing = () => {
  return (
    <div className="flex flex-1 flex-col">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_55%)]" />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:py-24 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              {LANDING_CONTENT.badge}
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              {LANDING_CONTENT.heroTitle}{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {LANDING_CONTENT.heroHighlight}
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              {LANDING_CONTENT.heroDescription}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to={ROUTE_PATHS.LOGIN}>{LANDING_CONTENT.ctaLogin}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to={ROUTE_PATHS.SIGNUP}>{LANDING_CONTENT.ctaSignup}</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-6 shadow-xl">
            <div className="grid grid-cols-2 gap-4">
              {LANDING_CONTENT.features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border/60 bg-background/80 p-4"
                >
                  <p className="text-sm font-medium">{feature.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/20 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-semibold md:text-3xl">
            {LANDING_CONTENT.featuresTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            {LANDING_CONTENT.featuresDescription}
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {LANDING_CONTENT.features.map((feature) => (
              <Card key={feature.title} className="transition-all hover:-translate-y-1 hover:shadow-md">
                <CardContent className="p-6">
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-semibold md:text-3xl">{LANDING_CONTENT.ctaSectionTitle}</h2>
          <p className="mt-3 text-muted-foreground">{LANDING_CONTENT.ctaSectionDescription}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to={ROUTE_PATHS.SIGNUP}>{LANDING_CONTENT.ctaGetStarted}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to={ROUTE_PATHS.LOGIN}>{LANDING_CONTENT.ctaLoginDashboard}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Landing
