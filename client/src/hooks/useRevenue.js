import { useQuery } from '@tanstack/react-query'
import { revenueService } from '@/services/revenueService'

export const useRevenue = (params, options = {}) => {
  const { enabled = true, ...queryOptions } = options

  return useQuery({
    queryKey: ['revenueAnalytics', params],
    queryFn: () => revenueService.getAnalytics(params),
    enabled,
    staleTime: 60_000,
    ...queryOptions,
  })
}
