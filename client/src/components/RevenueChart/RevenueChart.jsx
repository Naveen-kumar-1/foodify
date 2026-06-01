import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatINR } from '@/lib/customerUi'

const RevenueChart = ({ title, data = [], valueKey = 'revenue', labelKey = 'label' }) => {
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No data for this period</p>
        ) : (
          <div className="flex h-48 items-end gap-1 overflow-x-auto pb-1">
            {data.map((item) => (
              <div
                key={item[labelKey] || item.date || item.month}
                className="flex min-w-[2.5rem] flex-1 flex-col items-center gap-1"
                title={`${item[labelKey]}: ${formatINR(item[valueKey])}`}
              >
                <div
                  className="w-full min-w-[1.25rem] rounded-t bg-primary/80"
                  style={{
                    height: `${((item[valueKey] || 0) / max) * 100}%`,
                    minHeight: item[valueKey] ? 4 : 0,
                  }}
                />
                <span className="max-w-full truncate text-[10px] text-muted-foreground">
                  {item[labelKey]}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RevenueChart
