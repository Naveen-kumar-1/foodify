import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Download,
  FileArchive,
  FileText,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import { QR_CONTENT } from '@/constants/content'
import { useAuth } from '@/context/AuthContext'
import { printAllQrCodes } from '@/lib/qrPrint'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import RouteLoading from '@/components/routing/RouteLoading'
import { tableService } from '@/services/tableService'
import { getErrorMessage } from '@/services/api'
import { cn } from '@/lib/utils'

const buildBulkPreview = (count, prefix, start) => {
  const n = Number(count) || 0
  const s = Number(start) || 1
  const p = (prefix || 'Table').trim()
  return Array.from({ length: Math.min(n, 200) }, (_, i) => ({
    tableName: `${p} ${s + i}`.trim(),
    tableNumber: String(s + i),
  }))
}

const QrCodeManagement = () => {
  const { restaurant } = useAuth()
  const queryClient = useQueryClient()
  const restaurantName = restaurant?.name || 'Restaurant'
  const logoUrl = restaurant?.logoUrl || restaurant?.logo || ''

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('number')
  const [selected, setSelected] = useState(() => new Set())
  const [exporting, setExporting] = useState(null)

  const [quickName, setQuickName] = useState('')
  const [quickNumber, setQuickNumber] = useState('')

  const [bulkCount, setBulkCount] = useState('10')
  const [bulkPrefix, setBulkPrefix] = useState('Table')
  const [bulkStart, setBulkStart] = useState('1')
  const [bulkPreviewOpen, setBulkPreviewOpen] = useState(false)

  const [viewTable, setViewTable] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tableService.getTables(),
  })

  const tables = data?.data || []

  const stats = useMemo(
    () => ({
      total: tables.length,
      active: tables.filter((t) => t.isActive).length,
      disabled: tables.filter((t) => !t.isActive).length,
      qr: tables.length,
    }),
    [tables],
  )

  const filteredTables = useMemo(() => {
    let list = [...tables]
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (t) =>
          t.tableName?.toLowerCase().includes(q) ||
          String(t.tableNumber).toLowerCase().includes(q),
      )
    }
    if (statusFilter === 'active') list = list.filter((t) => t.isActive)
    if (statusFilter === 'disabled') list = list.filter((t) => !t.isActive)

    list.sort((a, b) => {
      if (sortBy === 'number') {
        return String(a.tableNumber).localeCompare(String(b.tableNumber), undefined, {
          numeric: true,
        })
      }
      const da = new Date(a.createdAt).getTime()
      const db = new Date(b.createdAt).getTime()
      return sortBy === 'oldest' ? da - db : db - da
    })
    return list
  }, [tables, search, statusFilter, sortBy])

  const bulkPreviewList = useMemo(
    () => buildBulkPreview(bulkCount, bulkPrefix, bulkStart),
    [bulkCount, bulkPrefix, bulkStart],
  )

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tables'] })

  const createMutation = useMutation({
    mutationFn: (payload) => tableService.createTable(payload),
    onSuccess: () => {
      toast.success(QR_CONTENT.generated)
      setQuickName('')
      setQuickNumber('')
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const bulkMutation = useMutation({
    mutationFn: (payload) => tableService.createTablesBulk(payload),
    onSuccess: (res) => {
      toast.success(res.message || QR_CONTENT.bulkSuccess)
      setBulkPreviewOpen(false)
      setSelected(new Set())
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const bulkActionMutation = useMutation({
    mutationFn: (payload) => tableService.bulkAction(payload),
    onSuccess: (res) => {
      toast.success(res.message)
      setSelected(new Set())
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const regenerateMutation = useMutation({
    mutationFn: (tableId) => tableService.regenerateQr(tableId),
    onSuccess: () => {
      toast.success(QR_CONTENT.regenerated)
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ tableId, isActive }) => tableService.updateTable(tableId, { isActive }),
    onSuccess: () => invalidate(),
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (tableId) => tableService.deleteTable(tableId),
    onSuccess: () => {
      toast.success(QR_CONTENT.removed)
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const handleQuickCreate = (e) => {
    e.preventDefault()
    const num = quickNumber.trim()
    if (!num) return
    createMutation.mutate({
      tableName: quickName.trim() || `Table ${num}`,
      tableNumber: num,
    })
  }

  const handleBulkConfirm = () => {
    const count = Number(bulkCount)
    if (!count || count < 1) return
    bulkMutation.mutate({
      count,
      namingPattern: bulkPrefix.trim() || 'Table',
      startingNumber: Number(bulkStart) || 1,
    })
  }

  const toggleSelect = (tableId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(tableId)) next.delete(tableId)
      else next.add(tableId)
      return next
    })
  }

  const selectAllVisible = () => {
    setSelected(new Set(filteredTables.map((t) => t.tableId)))
  }

  const selectedTables = tables.filter((t) => selected.has(t.tableId))

  const runBulkAction = (action) => {
    if (!selected.size) return
    const label =
      action === 'delete' ? 'delete' : action === 'disable' ? 'disable' : 'enable'
    if (!window.confirm(`${label} ${selected.size} table(s)?`)) return
    bulkActionMutation.mutate({ tableIds: [...selected], action })
  }

  const downloadPng = (table) => {
    const link = document.createElement('a')
    link.href = table.qrImageUrl
    link.download = `table-${table.tableNumber}.png`
    link.target = '_blank'
    link.click()
  }

  const printTable = (table) => {
    printAllQrCodes({ restaurantName, logoUrl, tables: [table] })
  }

  const handlePrintAll = () => {
    const list = selected.size ? selectedTables : tables
    if (!list.length) return
    printAllQrCodes({ restaurantName, logoUrl, tables: list })
  }

  const handleDownloadZip = async () => {
    setExporting('zip')
    try {
      await tableService.downloadQrZip()
      toast.success('ZIP downloaded')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setExporting(null)
    }
  }

  const handleDownloadPdf = async () => {
    setExporting('pdf')
    try {
      await tableService.downloadQrPdf()
      toast.success('PDF downloaded')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setExporting(null)
    }
  }

  if (isLoading) return <RouteLoading />

  return (
    <div className="space-y-6">
      <PageHeader title={QR_CONTENT.title} description={QR_CONTENT.description} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={QR_CONTENT.totalTables} value={stats.total} />
        <StatCard title={QR_CONTENT.activeTables} value={stats.active} />
        <StatCard title={QR_CONTENT.disabledTables} value={stats.disabled} />
        <StatCard title={QR_CONTENT.totalQr} value={stats.qr} />
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-2 p-4">
          <Button size="sm" onClick={() => document.getElementById('quick-create')?.scrollIntoView({ behavior: 'smooth' })}>
            <Plus className="size-4" />
            {QR_CONTENT.quickCreate}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setBulkPreviewOpen(true)}>
            <Plus className="size-4" />
            {QR_CONTENT.bulkTitle}
          </Button>
          <Button size="sm" variant="outline" disabled={!tables.length || exporting} onClick={handleDownloadZip}>
            <FileArchive className="size-4" />
            {exporting === 'zip' ? '…' : QR_CONTENT.downloadZip}
          </Button>
          <Button size="sm" variant="outline" disabled={!tables.length || exporting} onClick={handleDownloadPdf}>
            <FileText className="size-4" />
            {exporting === 'pdf' ? '…' : QR_CONTENT.downloadPdf}
          </Button>
          <Button size="sm" variant="outline" disabled={!tables.length} onClick={handlePrintAll}>
            <Printer className="size-4" />
            {QR_CONTENT.printAll}
          </Button>
        </CardContent>
      </Card>

      <Card id="quick-create">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{QR_CONTENT.quickCreate}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleQuickCreate} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px] flex-1 space-y-1">
              <Label className="text-xs">{QR_CONTENT.tableName}</Label>
              <Input
                placeholder="Table 5"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
              />
            </div>
            <div className="w-28 space-y-1">
              <Label className="text-xs">{QR_CONTENT.tableNumber}</Label>
              <Input
                placeholder="5"
                value={quickNumber}
                onChange={(e) => setQuickNumber(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? '…' : QR_CONTENT.generate}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={QR_CONTENT.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: QR_CONTENT.filterAll },
            { key: 'active', label: QR_CONTENT.filterActive },
            { key: 'disabled', label: QR_CONTENT.filterDisabled },
          ].map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={statusFilter === f.key ? 'default' : 'outline'}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="number">{QR_CONTENT.sortNumber}</option>
            <option value="latest">{QR_CONTENT.sortLatest}</option>
            <option value="oldest">{QR_CONTENT.sortOldest}</option>
          </select>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
          <span className="font-medium">
            {selected.size} {QR_CONTENT.selected}
          </span>
          <Button size="sm" variant="outline" onClick={handlePrintAll}>
            <Printer className="size-3.5" />
            {QR_CONTENT.downloadSelected}
          </Button>
          <Button size="sm" variant="outline" onClick={() => runBulkAction('disable')}>
            {QR_CONTENT.disableSelected}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => runBulkAction('delete')}>
            <Trash2 className="size-3.5" />
            {QR_CONTENT.deleteSelected}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            {QR_CONTENT.clearSelection}
          </Button>
        </div>
      )}

      <div className="flex gap-2 text-sm">
        <Button type="button" size="sm" variant="ghost" onClick={selectAllVisible}>
          {QR_CONTENT.selectAll}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filteredTables.map((table) => {
          const isSelected = selected.has(table.tableId)
          return (
            <Card
              key={table.tableId}
              className={cn(
                'overflow-hidden transition-shadow',
                !table.isActive && 'opacity-60',
                isSelected && 'ring-2 ring-primary',
              )}
            >
              <CardContent className="p-3">
                <div className="mb-2 flex items-start justify-between gap-1">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(table.tableId)}
                      className="rounded border-input"
                    />
                    <span className="text-sm font-semibold">Table {table.tableNumber}</span>
                  </label>
                  <Badge variant={table.isActive ? 'success' : 'secondary'} className="text-[10px]">
                    {table.isActive ? 'Active' : 'Off'}
                  </Badge>
                </div>
                <p className="mb-2 truncate text-xs text-muted-foreground">{table.tableName}</p>
                {table.qrImageUrl && (
                  <button
                    type="button"
                    onClick={() => setViewTable(table)}
                    className="mx-auto block"
                  >
                    <img
                      src={table.qrImageUrl}
                      alt=""
                      className="mx-auto size-28 rounded-md border border-border object-contain"
                    />
                  </button>
                )}
                <div className="mt-3 grid grid-cols-2 gap-1">
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setViewTable(table)}>
                    {QR_CONTENT.view}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => downloadPng(table)}>
                    <Download className="size-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => printTable(table)}>
                    <Printer className="size-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs"
                    disabled={regenerateMutation.isPending}
                    onClick={() => regenerateMutation.mutate(table.tableId)}
                  >
                    <RefreshCw className="size-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="col-span-2 h-8 text-xs"
                    onClick={() =>
                      toggleMutation.mutate({
                        tableId: table.tableId,
                        isActive: !table.isActive,
                      })
                    }
                  >
                    {table.isActive ? QR_CONTENT.disable : QR_CONTENT.enable}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="col-span-2 h-8 text-xs text-destructive"
                    onClick={() => {
                      if (window.confirm('Delete this table?')) {
                        deleteMutation.mutate(table.tableId)
                      }
                    }}
                  >
                    <Trash2 className="size-3" />
                    {QR_CONTENT.delete}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!filteredTables.length && (
        <p className="py-16 text-center text-muted-foreground">
          {tables.length ? 'No tables match your filters.' : 'Create your first table to generate a QR code.'}
        </p>
      )}

      <Dialog open={bulkPreviewOpen} onOpenChange={setBulkPreviewOpen}>
        <DialogContent onClose={() => setBulkPreviewOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle>{QR_CONTENT.bulkTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">{QR_CONTENT.count}</Label>
              <Input type="number" min={1} max={200} value={bulkCount} onChange={(e) => setBulkCount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{QR_CONTENT.prefix}</Label>
              <Input value={bulkPrefix} onChange={(e) => setBulkPrefix(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{QR_CONTENT.startNumber}</Label>
              <Input type="number" min={1} value={bulkStart} onChange={(e) => setBulkStart(e.target.value)} />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3 text-sm">
            {bulkPreviewList.slice(0, 20).map((row) => (
              <p key={row.tableNumber}>
                {row.tableName} · #{row.tableNumber}
              </p>
            ))}
            {bulkPreviewList.length > 20 && (
              <p className="mt-2 text-muted-foreground">+ {bulkPreviewList.length - 20} more…</p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setBulkPreviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkConfirm} disabled={bulkMutation.isPending}>
              {bulkMutation.isPending ? '…' : QR_CONTENT.bulkConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewTable)} onOpenChange={(open) => !open && setViewTable(null)}>
        <DialogContent onClose={() => setViewTable(null)} className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>
              {viewTable?.tableName} · Table {viewTable?.tableNumber}
            </DialogTitle>
          </DialogHeader>
          {viewTable?.qrImageUrl && (
            <img src={viewTable.qrImageUrl} alt="" className="mx-auto size-56 rounded-lg border" />
          )}
          <p className="break-all text-xs text-muted-foreground">{viewTable?.qrUrl}</p>
          <DialogFooter className="flex-wrap justify-center gap-2">
            <Button size="sm" variant="outline" onClick={() => viewTable && downloadPng(viewTable)}>
              {QR_CONTENT.download}
            </Button>
            <Button size="sm" onClick={() => viewTable && printTable(viewTable)}>
              {QR_CONTENT.print}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default QrCodeManagement
