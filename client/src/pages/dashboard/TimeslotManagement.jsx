import { useCallback, useEffect, useState } from 'react'
import { Clock, Loader2, Pencil, Plus, Power, Search, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '@/components/common/PageHeader'
import TimePicker from '@/components/timeslots/TimePicker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { COMMON_CONTENT, TIMESLOTS_CONTENT } from '@/constants/content'
import { useDebounce } from '@/hooks/useDebounce'
import { compareTimes, formatTime12h } from '@/lib/time'
import { timeSlotService } from '@/services/timeSlotService'
import { getErrorMessage } from '@/services/api'

const emptyForm = {
  slotName: '',
  fromTime: '07:00',
  toTime: '10:00',
  isActive: true,
}

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

const validateForm = (form) => {
  const errors = {}
  if (!form.slotName.trim()) errors.slotName = TIMESLOTS_CONTENT.validation.slotNameRequired
  if (!form.fromTime) errors.fromTime = TIMESLOTS_CONTENT.validation.fromTimeRequired
  if (!form.toTime) errors.toTime = TIMESLOTS_CONTENT.validation.toTimeRequired
  if (form.fromTime && form.toTime) {
    const cmp = compareTimes(form.fromTime, form.toTime)
    if (cmp === 0) errors.toTime = TIMESLOTS_CONTENT.validation.equalTimes
    if (cmp >= 0) errors.toTime = TIMESLOTS_CONTENT.validation.invalidRange
  }
  return errors
}

const TableSkeleton = () =>
  Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 6 }).map((__, j) => (
        <TableCell key={j}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  ))

const TimeslotManagement = () => {
  const [slots, setSlots] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState(null)
  const [deletingSlot, setDeletingSlot] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  const debouncedSearch = useDebounce(search)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await timeSlotService.getTimeSlots({
        page,
        limit,
        search: debouncedSearch,
        status,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      setSlots(res.data)
      setPagination(res.pagination)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, status])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditingSlot(null)
    setForm(emptyForm)
    setFormErrors({})
    setFormOpen(true)
  }

  const openEdit = (slot) => {
    setEditingSlot(slot)
    setForm({
      slotName: slot.slotName,
      fromTime: slot.fromTime,
      toTime: slot.toTime,
      isActive: slot.isActive,
    })
    setFormErrors({})
    setFormOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const errors = validateForm(form)
    setFormErrors(errors)
    if (Object.keys(errors).length) return

    setSaving(true)
    try {
      const payload = {
        slotName: form.slotName.trim(),
        fromTime: form.fromTime,
        toTime: form.toTime,
        ...(editingSlot ? { isActive: form.isActive } : {}),
      }

      if (editingSlot) {
        await timeSlotService.updateTimeSlot(editingSlot.slotId, payload)
        toast.success(TIMESLOTS_CONTENT.updated)
      } else {
        await timeSlotService.createTimeSlot(payload)
        toast.success(TIMESLOTS_CONTENT.created)
      }
      setFormOpen(false)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingSlot) return
    setDeleting(true)
    try {
      await timeSlotService.deleteTimeSlot(deletingSlot.slotId)
      toast.success(TIMESLOTS_CONTENT.deleted)
      setDeleteOpen(false)
      setDeletingSlot(null)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const handleToggle = async (slot) => {
    setTogglingId(slot.slotId)
    try {
      await timeSlotService.toggleTimeSlotStatus(slot.slotId, !slot.isActive)
      toast.success(TIMESLOTS_CONTENT.statusToggled)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setTogglingId(null)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setPage(1)
  }

  const hasFilters = search || status !== 'all'
  const isEmpty = !loading && slots.length === 0 && !hasFilters
  const noResults = !loading && slots.length === 0 && hasFilters

  return (
    <div>
      <PageHeader
        title={TIMESLOTS_CONTENT.title}
        description={TIMESLOTS_CONTENT.description}
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            {TIMESLOTS_CONTENT.add}
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={TIMESLOTS_CONTENT.searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'all', label: TIMESLOTS_CONTENT.all },
            { key: 'active', label: TIMESLOTS_CONTENT.filterActive },
            { key: 'inactive', label: TIMESLOTS_CONTENT.filterInactive },
          ].map(({ key, label }) => (
            <Button
              key={key}
              size="sm"
              variant={status === key ? 'default' : 'outline'}
              onClick={() => {
                setStatus(key)
                setPage(1)
              }}
            >
              {label}
            </Button>
          ))}
          {hasFilters && (
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              {TIMESLOTS_CONTENT.clearFilters}
            </Button>
          )}
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Clock className="size-7" />
          </div>
          <h3 className="text-lg font-semibold">{TIMESLOTS_CONTENT.emptyTitle}</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {TIMESLOTS_CONTENT.emptyDescription}
          </p>
          <Button className="mt-6" onClick={openCreate}>
            <Plus className="size-4" />
            {TIMESLOTS_CONTENT.emptyCta}
          </Button>
        </div>
      ) : noResults ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/10 px-6 py-16 text-center">
          <h3 className="text-lg font-semibold">{TIMESLOTS_CONTENT.noResultsTitle}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{TIMESLOTS_CONTENT.noResultsDescription}</p>
          <Button className="mt-4" variant="outline" onClick={clearFilters}>
            {TIMESLOTS_CONTENT.clearFilters}
          </Button>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{TIMESLOTS_CONTENT.slotName}</TableHead>
                <TableHead>{TIMESLOTS_CONTENT.fromTime}</TableHead>
                <TableHead>{TIMESLOTS_CONTENT.toTime}</TableHead>
                <TableHead>{TIMESLOTS_CONTENT.status}</TableHead>
                <TableHead>{TIMESLOTS_CONTENT.createdDate}</TableHead>
                <TableHead className="text-right">{TIMESLOTS_CONTENT.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton />
              ) : (
                slots.map((slot) => (
                  <TableRow key={slot.slotId}>
                    <TableCell className="font-medium">{slot.slotName}</TableCell>
                    <TableCell>{formatTime12h(slot.fromTime)}</TableCell>
                    <TableCell>{formatTime12h(slot.toTime)}</TableCell>
                    <TableCell>
                      <Badge variant={slot.isActive ? 'success' : 'secondary'}>
                        {slot.isActive ? TIMESLOTS_CONTENT.active : TIMESLOTS_CONTENT.inactive}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(slot.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={togglingId === slot.slotId}
                          onClick={() => handleToggle(slot)}
                        >
                          {togglingId === slot.slotId ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Power className="size-3.5" />
                          )}
                          <span className="hidden sm:inline">
                            {slot.isActive ? TIMESLOTS_CONTENT.disable : TIMESLOTS_CONTENT.enable}
                          </span>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(slot)}>
                          <Pencil className="size-3.5" />
                          <span className="hidden sm:inline">{COMMON_CONTENT.edit}</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setDeletingSlot(slot)
                            setDeleteOpen(true)
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {TIMESLOTS_CONTENT.pagination.showing}{' '}
              <span className="font-medium text-foreground">
                {slots.length ? (pagination.page - 1) * pagination.limit + 1 : 0}–
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              {TIMESLOTS_CONTENT.pagination.of}{' '}
              <span className="font-medium text-foreground">{pagination.total}</span>{' '}
              {TIMESLOTS_CONTENT.pagination.records}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                {TIMESLOTS_CONTENT.pagination.rowsPerPage}
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value))
                    setPage(1)
                  }}
                  className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                {COMMON_CONTENT.previous}
              </Button>
              <span className="text-sm text-muted-foreground">
                {TIMESLOTS_CONTENT.pagination.page} {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pagination.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                {COMMON_CONTENT.next}
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent onClose={() => setFormOpen(false)}>
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>
                {editingSlot ? TIMESLOTS_CONTENT.edit : TIMESLOTS_CONTENT.add}
              </DialogTitle>
              <DialogDescription>{TIMESLOTS_CONTENT.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slotName">{TIMESLOTS_CONTENT.slotName}</Label>
                <Input
                  id="slotName"
                  placeholder={TIMESLOTS_CONTENT.slotNamePlaceholder}
                  value={form.slotName}
                  onChange={(e) => setForm((f) => ({ ...f, slotName: e.target.value }))}
                />
                {formErrors.slotName && (
                  <p className="text-xs text-destructive">{formErrors.slotName}</p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TimePicker
                  label={TIMESLOTS_CONTENT.fromTime}
                  value={form.fromTime}
                  onChange={(fromTime) => setForm((f) => ({ ...f, fromTime }))}
                  error={formErrors.fromTime}
                />
                <TimePicker
                  label={TIMESLOTS_CONTENT.toTime}
                  value={form.toTime}
                  onChange={(toTime) => setForm((f) => ({ ...f, toTime }))}
                  error={formErrors.toTime}
                />
              </div>
              {editingSlot && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="rounded border-input"
                  />
                  {TIMESLOTS_CONTENT.active}
                </label>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                {COMMON_CONTENT.cancel}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {TIMESLOTS_CONTENT.saving}
                  </>
                ) : (
                  TIMESLOTS_CONTENT.save
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent onClose={() => setDeleteOpen(false)}>
          <DialogHeader>
            <DialogTitle>{TIMESLOTS_CONTENT.deleteTitle}</DialogTitle>
            <DialogDescription>{TIMESLOTS_CONTENT.deleteDescription}</DialogDescription>
          </DialogHeader>
          {deletingSlot && (
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm font-medium">
              {deletingSlot.slotName} ({formatTime12h(deletingSlot.fromTime)} –{' '}
              {formatTime12h(deletingSlot.toTime)})
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              {COMMON_CONTENT.cancel}
            </Button>
            <Button type="button" variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {TIMESLOTS_CONTENT.deleting}
                </>
              ) : (
                TIMESLOTS_CONTENT.deleteConfirm
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TimeslotManagement
