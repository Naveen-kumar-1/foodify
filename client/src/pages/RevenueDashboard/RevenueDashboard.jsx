import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import AnalyticsCards from '@/components/AnalyticsCards/AnalyticsCards'
import PageHeader from '@/components/common/PageHeader'
import RevenueCards from '@/components/RevenueCards/RevenueCards'
import RevenueChart from '@/components/RevenueChart/RevenueChart'
import RevenueFilters from '@/components/RevenueFilters/RevenueFilters'
import TableRevenueTable from '@/components/TableRevenueTable/TableRevenueTable'
import RouteLoading from '@/components/routing/RouteLoading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRevenue } from '@/hooks/useRevenue'
import { formatINR, formatOrderTime } from '@/lib/customerUi'
import { formatCancellationDisplay } from '@/constants/cancellationReasons'
import { revenueService } from '@/services/revenueService'
import { getErrorMessage } from '@/services/api'

const RevenueDashboard = () => {
  const [range, setRange] = useState('30d')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [exporting, setExporting] = useState(false)

  const queryParams = useMemo(() => {
    if (range === 'custom') {
      return { range, startDate, endDate }
    }
    return { range }
  }, [range, startDate, endDate])

  const enabled = range !== 'custom' || (Boolean(startDate) && Boolean(endDate))

  const { data, isLoading, isError, error, refetch, isFetching } = useRevenue(queryParams, {
    enabled,
  })

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await revenueService.exportCsv(queryParams)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `foodify-revenue-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Revenue report exported')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setExporting(false)
    }
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Revenue" description="Revenue analytics and insights" />
        <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue"
        description="Track sales, orders, table performance, and trends"
      />

      <RevenueFilters
        range={range}
        onRangeChange={setRange}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onExport={handleExport}
        exporting={exporting}
      />

      {isLoading && !data ? (
        <RouteLoading />
      ) : (
        <>
          <RevenueCards overview={data?.overview} loading={isFetching && !data} />

          <AnalyticsCards
            orderAnalytics={data?.orderAnalytics}
            timeBased={data?.timeBased}
            loading={isFetching && !data}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueChart title="Daily revenue" data={data?.dailyRevenue || []} />
            <RevenueChart
              title="Daily orders"
              data={data?.dailyRevenue || []}
              valueKey="orders"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueChart title="Weekly revenue" data={data?.weeklyRevenue || []} />
            <RevenueChart
              title="Weekly orders"
              data={data?.weeklyRevenue || []}
              valueKey="orders"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly revenue & growth</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.monthlyRevenue || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No monthly data</p>
              ) : (
                data.monthlyRevenue.map((m) => (
                  <div
                    key={m.month}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <span className="font-medium">{m.label}</span>
                    <span>{formatINR(m.revenue)}</span>
                    <span className="text-sm text-muted-foreground">{m.orders} orders</span>
                    {m.growthPercent != null && (
                      <span
                        className={
                          m.growthPercent >= 0 ? 'text-emerald-600' : 'text-destructive'
                        }
                      >
                        {m.growthPercent >= 0 ? '+' : ''}
                        {m.growthPercent}% vs prev
                      </span>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueChart title="Revenue by hour" data={data?.timeBased?.byHour || []} />
            <RevenueChart
              title="Revenue by time slot"
              data={(data?.timeBased?.byTimeSlot || []).map((s) => ({
                label: s.slot,
                revenue: s.revenue,
                orders: s.orders,
              }))}
              labelKey="label"
            />
          </div>

          <TableRevenueTable tables={data?.tableAnalytics?.tables || []} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cancellation reasons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(data?.cancellationAnalytics?.breakdown || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No cancellations in this period</p>
              ) : (
                <ul className="space-y-2">
                  {data.cancellationAnalytics.breakdown.map((row) => (
                    <li
                      key={row.reason}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <span>{row.reason}</span>
                      <span className="font-semibold tabular-nums">{row.count}</span>
                    </li>
                  ))}
                </ul>
              )}
              {(data?.cancellationAnalytics?.recent || []).length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Recent cancellations
                  </p>
                  <ul className="space-y-2">
                    {data.cancellationAnalytics.recent.map((o) => (
                      <li
                        key={o.orderId}
                        className="rounded-lg border border-border px-3 py-2 text-sm"
                      >
                        <div className="flex justify-between font-medium">
                          <span>{o.orderNumber}</span>
                          <span>{formatINR(o.total)}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatCancellationDisplay(o)} · {o.cancelledBy} ·{' '}
                          {o.cancelledAt ? formatOrderTime(o.cancelledAt) : '—'}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <TableRevenueTable
              title="Top performing tables"
              tables={data?.tableAnalytics?.topPerforming || []}
            />
            <TableRevenueTable
              title="Most frequent tables"
              tables={data?.tableAnalytics?.mostFrequent || []}
            />
            <TableRevenueTable
              title="Highest spending tables"
              tables={data?.tableAnalytics?.highestSpending || []}
            />
          </div>
        </>
      )}

      <button type="button" className="sr-only" onClick={() => refetch()}>
        Refresh
      </button>
    </div>
  )
}

export default RevenueDashboard
