import { lazy, Suspense } from 'react'
import { Outlet, Route } from 'react-router-dom'
import PageWrapper from '@/components/routing/PageWrapper'
import RouteLoading from '@/components/routing/RouteLoading'
import { ProtectedRoute, PublicRoute } from '@/guards'
import { layouts } from '@/layouts'

const lazyComponentCache = new Map()

const getLazyComponent = (importFn) => {
  if (!lazyComponentCache.has(importFn)) {
    lazyComponentCache.set(importFn, lazy(importFn))
  }
  return lazyComponentCache.get(importFn)
}

const LazyPage = ({ importFn, title }) => {
  const Component = getLazyComponent(importFn)
  return (
    <PageWrapper title={title}>
      <Suspense fallback={<RouteLoading />}>
        <Component />
      </Suspense>
    </PageWrapper>
  )
}

const wrapWithGuards = (route, element) => {
  if (route.protected) return <ProtectedRoute>{element}</ProtectedRoute>
  if (route.guestOnly) return <PublicRoute>{element}</PublicRoute>
  return element
}

const createBranchElement = (route) => {
  if (route.layout) {
    const Layout = layouts[route.layout]
    if (!Layout) throw new Error(`Unknown layout key: "${route.layout}"`)
    return wrapWithGuards(
      route,
      <Layout>
        <Outlet />
      </Layout>,
    )
  }
  if (route.protected || route.guestOnly) return wrapWithGuards(route, <Outlet />)
  return <Outlet />
}

const createPageElement = (route) => {
  if (!route.page) throw new Error('Route with no children must define a page import')
  return wrapWithGuards(
    route,
    <LazyPage importFn={route.page} title={route.meta?.title} />,
  )
}

const getRouteKey = (route, index) => {
  if (route.path) return route.path
  if (route.index) return `index-${index}`
  return `layout-branch-${index}`
}

/** @param {import('@/routes/config').RouteConfig[]} routes */
export const renderRouteTree = (routes) =>
  routes
    .map((route, index) => {
      const key = getRouteKey(route, index)

      if (route.children?.length) {
        return (
          <Route
            key={key}
            path={route.path}
            index={route.index}
            element={createBranchElement(route)}
          >
            {renderRouteTree(route.children)}
          </Route>
        )
      }

      if (route.page) {
        return (
          <Route
            key={key}
            path={route.path}
            index={route.index}
            element={createPageElement(route)}
          />
        )
      }

      return null
    })
    .filter(Boolean)
