import { Routes } from 'react-router-dom'
import { routeConfig } from '@/routes/config'
import { renderRouteTree } from '@/routes/RouteRenderer'

const AppRoutes = () => {
  return <Routes>{renderRouteTree(routeConfig)}</Routes>
}

export default AppRoutes
