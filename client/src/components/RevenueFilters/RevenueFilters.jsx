import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'custom', label: 'Custom range' },
]

const RevenueFilters = ({
  range,
  onRangeChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onExport,
  exporting,
}) => (
  <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
    <div className="flex flex-wrap gap-2">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onRangeChange(opt.value)}
          className={cn(
            'rounded-full px-3 py-1.5 text-sm font-medium transition',
            range === opt.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
    {range === 'custom' && (
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Start date</label>
          <Input type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">End date</label>
          <Input type="date" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} />
        </div>
      </div>
    )}
    <div className="flex justify-end">
      <Button type="button" variant="outline" onClick={onExport} disabled={exporting}>
        {exporting ? 'Exporting...' : 'Export CSV'}
      </Button>
    </div>
  </div>
)

export default RevenueFilters
