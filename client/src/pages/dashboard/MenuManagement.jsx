import { useCallback, useEffect, useState } from 'react'
import {
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '@/components/common/PageHeader'
import MenuStatsCards from '@/components/menu/MenuStatsCards'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { COMMON_CONTENT } from '@/constants/content'
import { GST_OPTIONS, MENU_CONTENT } from '@/constants/menuContent'
import { useDebounce } from '@/hooks/useDebounce'
import { formatTime12h } from '@/lib/time'
import { menuService } from '@/services/menuService'
import { timeSlotService } from '@/services/timeSlotService'
import { getErrorMessage } from '@/services/api'

const emptyForm = {
  foodName: '',
  description: '',
  price: '',
  gstPercentage: '5',
  isTimeSlotBased: false,
  timeSlotId: '',
  isActive: true,
}

const formatPrice = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)

const validateForm = (form) => {
  const errors = {}
  if (!form.foodName.trim()) errors.foodName = MENU_CONTENT.validation.nameRequired
  const price = Number(form.price)
  if (!form.price || !Number.isFinite(price) || price <= 0) {
    errors.price = MENU_CONTENT.validation.priceInvalid
  }
  if (form.isTimeSlotBased && !form.timeSlotId) {
    errors.timeSlotId = MENU_CONTENT.validation.timeSlotRequired
  }
  if (!GST_OPTIONS.includes(Number(form.gstPercentage))) {
    errors.gstPercentage = MENU_CONTENT.validation.gstRequired
  }
  return errors
}

const MenuCardSkeleton = () =>
  Array.from({ length: 6 }).map((_, i) => (
    <Card key={i}>
      <CardContent className="p-5">
        <Skeleton className="mb-3 h-5 w-2/3" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-8 w-24" />
      </CardContent>
    </Card>
  ))

const MenuManagement = () => {
  const [foods, setFoods] = useState([])
  const [stats, setStats] = useState(null)
  const [timeSlots, setTimeSlots] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [sort, setSort] = useState('latest')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(12)

  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingFood, setEditingFood] = useState(null)
  const [deletingFood, setDeletingFood] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  const debouncedSearch = useDebounce(search)

  const loadTimeSlots = useCallback(async () => {
    try {
      const res = await timeSlotService.getTimeSlots({
        page: 1,
        limit: 100,
        status: 'active',
      })
      setTimeSlots(res.data)
    } catch {
      setTimeSlots([])
    }
  }, [])

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await menuService.getMenuStats()
      setStats(res.stats)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const loadFoods = useCallback(async () => {
    setLoading(true)
    try {
      const res = await menuService.getMenuItems({
        page,
        limit,
        search: debouncedSearch,
        status,
        type,
        sort,
      })
      setFoods(res.data)
      setPagination(res.pagination)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, status, type, sort])

  useEffect(() => {
    loadTimeSlots()
    loadStats()
  }, [loadTimeSlots, loadStats])

  useEffect(() => {
    loadFoods()
  }, [loadFoods])

  const openCreate = () => {
    setEditingFood(null)
    setForm(emptyForm)
    setFormErrors({})
    setFormOpen(true)
  }

  const openEdit = (food) => {
    setEditingFood(food)
    setForm({
      foodName: food.foodName,
      description: food.description || '',
      price: String(food.price),
      gstPercentage: String(food.gstPercentage ?? 5),
      isTimeSlotBased: food.isTimeSlotBased,
      timeSlotId: food.timeSlotId || '',
      isActive: food.isActive,
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
        foodName: form.foodName.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        gstPercentage: Number(form.gstPercentage),
        isTimeSlotBased: form.isTimeSlotBased,
        timeSlotId: form.isTimeSlotBased ? form.timeSlotId : null,
        ...(editingFood ? { isActive: form.isActive } : {}),
      }

      if (editingFood) {
        const res = await menuService.updateMenuItem(editingFood.foodId, payload)
        setFoods((prev) =>
          prev.map((f) => (f.foodId === editingFood.foodId ? res.food : f)),
        )
        toast.success(MENU_CONTENT.updated)
      } else {
        await menuService.createMenuItem(payload)
        toast.success(MENU_CONTENT.created)
        setPage(1)
      }
      setFormOpen(false)
      loadFoods()
      loadStats()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (food) => {
    setTogglingId(food.foodId)
    try {
      const res = await menuService.toggleMenuItemStatus(food.foodId, !food.isActive)
      setFoods((prev) => prev.map((f) => (f.foodId === food.foodId ? res.food : f)))
      toast.success(MENU_CONTENT.statusToggled)
      loadStats()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deletingFood) return
    setDeleting(true)
    try {
      await menuService.deleteMenuItem(deletingFood.foodId)
      setFoods((prev) => prev.filter((f) => f.foodId !== deletingFood.foodId))
      toast.success(MENU_CONTENT.deleted)
      setDeleteOpen(false)
      setDeletingFood(null)
      loadStats()
      loadFoods()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setType('all')
    setSort('latest')
    setPage(1)
  }

  const hasFilters = search || status !== 'all' || type !== 'all' || sort !== 'latest'
  const isEmpty = !loading && foods.length === 0 && !hasFilters
  const noResults = !loading && foods.length === 0 && hasFilters

  return (
    <div>
      <PageHeader
        title={MENU_CONTENT.title}
        description={MENU_CONTENT.description}
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            {MENU_CONTENT.addFood}
          </Button>
        }
      />

      <MenuStatsCards stats={stats} loading={statsLoading} />

      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={MENU_CONTENT.searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'all', label: MENU_CONTENT.filterAll },
            { key: 'active', label: MENU_CONTENT.filterActive },
            { key: 'inactive', label: MENU_CONTENT.filterInactive },
            { key: 'time-slot', label: MENU_CONTENT.filterTimeSlot },
            { key: 'all-day', label: MENU_CONTENT.filterAllDay },
          ].map(({ key, label }) => {
            const isStatus = ['all', 'active', 'inactive'].includes(key)
            const isType = ['time-slot', 'all-day'].includes(key)
            const active =
              key === 'all'
                ? status === 'all' && type === 'all'
                : isStatus
                  ? status === key
                  : type === key
            return (
              <Button
                key={key}
                size="sm"
                variant={active ? 'default' : 'outline'}
                onClick={() => {
                  if (key === 'all') {
                    setStatus('all')
                    setType('all')
                  } else if (isStatus) {
                    setStatus(key)
                  } else {
                    setType(key)
                  }
                  setPage(1)
                }}
              >
                {label}
              </Button>
            )
          })}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value)
              setPage(1)
            }}
            className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
          >
            <option value="latest">{MENU_CONTENT.sortLatest}</option>
            <option value="oldest">{MENU_CONTENT.sortOldest}</option>
            <option value="price-asc">{MENU_CONTENT.sortPriceLow}</option>
            <option value="price-desc">{MENU_CONTENT.sortPriceHigh}</option>
            <option value="name-az">{MENU_CONTENT.sortName}</option>
          </select>
          {hasFilters && (
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              {MENU_CONTENT.clearFilters}
            </Button>
          )}
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UtensilsCrossed className="size-7" />
          </div>
          <h3 className="text-lg font-semibold">{MENU_CONTENT.emptyTitle}</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {MENU_CONTENT.emptyDescription}
          </p>
          <Button className="mt-6" onClick={openCreate}>
            <Plus className="size-4" />
            {MENU_CONTENT.emptyCta}
          </Button>
        </div>
      ) : noResults ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/10 px-6 py-16 text-center">
          <h3 className="text-lg font-semibold">{MENU_CONTENT.noResultsTitle}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{MENU_CONTENT.noResultsDescription}</p>
          <Button className="mt-4" variant="outline" onClick={clearFilters}>
            {MENU_CONTENT.clearFilters}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <MenuCardSkeleton />
            ) : (
              foods.map((food) => (
                <Card
                  key={food.foodId}
                  className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <CardContent className="p-0">
                    <div className="border-b border-border bg-gradient-to-br from-primary/5 to-transparent px-5 py-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold tracking-tight">{food.foodName}</h3>
                          {food.description && (
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {food.description}
                            </p>
                          )}
                        </div>
                        <p className="shrink-0 text-lg font-bold text-primary">
                          {formatPrice(food.price)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3 px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">GST {food.gstPercentage ?? 5}%</Badge>
                        <Badge variant={food.isTimeSlotBased ? 'secondary' : 'success'}>
                          {food.isTimeSlotBased
                            ? MENU_CONTENT.typeTimeSlot
                            : MENU_CONTENT.typeAllDay}
                        </Badge>
                        <Badge variant={food.isActive ? 'success' : 'outline'}>
                          {food.isActive ? MENU_CONTENT.active : MENU_CONTENT.inactive}
                        </Badge>
                      </div>
                      {food.isTimeSlotBased && food.timeSlot && (
                        <p className="text-xs text-muted-foreground">
                          {food.timeSlot.slotName} · {formatTime12h(food.timeSlot.fromTime)} –{' '}
                          {formatTime12h(food.timeSlot.toTime)}
                        </p>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={togglingId === food.foodId}
                          onClick={() => handleToggle(food)}
                        >
                          {togglingId === food.foodId ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : food.isActive ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(food)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setDeletingFood(food)
                            setDeleteOpen(true)
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {MENU_CONTENT.pagination.showing}{' '}
              <span className="font-medium text-foreground">
                {foods.length ? (pagination.page - 1) * pagination.limit + 1 : 0}–
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              {MENU_CONTENT.pagination.of}{' '}
              <span className="font-medium text-foreground">{pagination.total}</span>{' '}
              {MENU_CONTENT.pagination.records}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                {MENU_CONTENT.pagination.rowsPerPage}
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value))
                    setPage(1)
                  }}
                  className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                >
                  {[6, 12, 24, 48].map((n) => (
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
                {MENU_CONTENT.pagination.page} {pagination.page} / {pagination.totalPages}
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
        <DialogContent onClose={() => setFormOpen(false)} className="max-w-lg">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>
                {editingFood ? MENU_CONTENT.editFood : MENU_CONTENT.addFood}
              </DialogTitle>
              <DialogDescription>{MENU_CONTENT.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{MENU_CONTENT.foodName}</Label>
                <Input
                  placeholder={MENU_CONTENT.foodNamePlaceholder}
                  value={form.foodName}
                  onChange={(e) => setForm((f) => ({ ...f, foodName: e.target.value }))}
                />
                {formErrors.foodName && (
                  <p className="text-xs text-destructive">{formErrors.foodName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{MENU_CONTENT.price}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={MENU_CONTENT.pricePlaceholder}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
                {formErrors.price && (
                  <p className="text-xs text-destructive">{formErrors.price}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{MENU_CONTENT.gstPercentage}</Label>
                <select
                  value={form.gstPercentage}
                  onChange={(e) => setForm((f) => ({ ...f, gstPercentage: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {GST_OPTIONS.map((rate) => (
                    <option key={rate} value={String(rate)}>
                      {rate}%
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">{MENU_CONTENT.gstHint}</p>
                {formErrors.gstPercentage && (
                  <p className="text-xs text-destructive">{formErrors.gstPercentage}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{MENU_CONTENT.description}</Label>
                <Input
                  placeholder={MENU_CONTENT.descriptionPlaceholder}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{MENU_CONTENT.foodType}</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                      !form.isTimeSlotBased
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="foodType"
                      checked={!form.isTimeSlotBased}
                      onChange={() =>
                        setForm((f) => ({
                          ...f,
                          isTimeSlotBased: false,
                          timeSlotId: '',
                        }))
                      }
                    />
                    {MENU_CONTENT.allDay}
                  </label>
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                      form.isTimeSlotBased
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="foodType"
                      checked={form.isTimeSlotBased}
                      onChange={() => setForm((f) => ({ ...f, isTimeSlotBased: true }))}
                    />
                    {MENU_CONTENT.timeSlotBased}
                  </label>
                </div>
              </div>
              {form.isTimeSlotBased && (
                <div className="space-y-2">
                  <Label>{MENU_CONTENT.timeSlot}</Label>
                  {timeSlots.length === 0 ? (
                    <p className="text-xs text-amber-600">{MENU_CONTENT.noTimeSlots}</p>
                  ) : (
                    <select
                      value={form.timeSlotId}
                      onChange={(e) => setForm((f) => ({ ...f, timeSlotId: e.target.value }))}
                      className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                    >
                      <option value="">{MENU_CONTENT.selectTimeSlot}</option>
                      {timeSlots.map((slot) => (
                        <option key={slot.slotId} value={slot.slotId}>
                          {slot.slotName} ({formatTime12h(slot.fromTime)} –{' '}
                          {formatTime12h(slot.toTime)})
                        </option>
                      ))}
                    </select>
                  )}
                  {formErrors.timeSlotId && (
                    <p className="text-xs text-destructive">{formErrors.timeSlotId}</p>
                  )}
                </div>
              )}
              {editingFood && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="rounded border-input"
                  />
                  {MENU_CONTENT.active}
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
                    {MENU_CONTENT.saving}
                  </>
                ) : (
                  MENU_CONTENT.save
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent onClose={() => setDeleteOpen(false)}>
          <DialogHeader>
            <DialogTitle>{MENU_CONTENT.deleteTitle}</DialogTitle>
            <DialogDescription>{MENU_CONTENT.deleteDescription}</DialogDescription>
          </DialogHeader>
          {deletingFood && (
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm font-medium">
              {deletingFood.foodName} · {formatPrice(deletingFood.price)}
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
                  {MENU_CONTENT.deleting}
                </>
              ) : (
                MENU_CONTENT.deleteConfirm
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MenuManagement
