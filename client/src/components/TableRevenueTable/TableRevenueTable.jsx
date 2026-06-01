import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatINR, formatOrderTime } from '@/lib/customerUi'

const TableRevenueTable = ({ tables = [], title = 'Table performance' }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 font-medium">Table</th>
            <th className="pb-2 font-medium">Orders</th>
            <th className="pb-2 font-medium">Revenue</th>
            <th className="pb-2 font-medium">Avg bill</th>
            <th className="pb-2 font-medium">Last order</th>
          </tr>
        </thead>
        <tbody>
          {tables.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-8 text-center text-muted-foreground">
                No table data for this period
              </td>
            </tr>
          ) : (
            tables.map((row) => (
              <tr key={row.tableId} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 font-medium">
                  #{row.tableNumber} {row.tableName}
                </td>
                <td className="py-2.5">{row.totalOrders}</td>
                <td className="py-2.5">{formatINR(row.totalRevenue)}</td>
                <td className="py-2.5">{formatINR(row.averageBillValue)}</td>
                <td className="py-2.5 text-muted-foreground">
                  {row.lastOrderTime ? formatOrderTime(row.lastOrderTime) : '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </CardContent>
  </Card>
)

export default TableRevenueTable
