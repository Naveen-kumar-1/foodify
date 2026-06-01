import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Minus, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ActiveOrderSection from '@/components/customer/ActiveOrderSection'
import CustomerHeader from '@/components/customer/CustomerHeader'
import OrderHistorySection from '@/components/customer/OrderHistorySection'
import { CUSTOMER_CONTENT } from '@/constants/customerContent'
import { useCart } from '@/context/CartContext'
import { useCustomerSession } from '@/context/CustomerSessionContext'
import { useDebounce } from '@/hooks/useDebounce'
import { getCustomerSessionId } from '@/lib/customerSession'
import { formatINR } from '@/lib/customerUi'
import { orderService } from '@/services/orderService'
import { getErrorMessage } from '@/services/api'

const buildPreviewPayload = (qrToken, items, couponCode, notes) => ({
  customerSessionId: getCustomerSessionId(qrToken),
  items: items.map((i) => ({ foodId: i.foodId, quantity: i.quantity })),
  couponCode: couponCode || null,
  paymentMethod: 'pay_later',
  notes: notes || '',
})

const CartPage = () => {
  const { qrToken } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { items, updateQty, removeItem, clearCart } = useCart()
  const { registerOrder } = useCustomerSession()
  const [coupon, setCoupon] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState('')
  const [paymentMethod] = useState('pay_later')
  const [notes, setNotes] = useState('')
  const orderSubmittedRef = useRef(false)

  const cartSignature = useMemo(
    () => JSON.stringify(items.map((i) => ({ id: i.foodId, q: i.quantity }))),
    [items],
  )
  const debouncedCartSignature = useDebounce(cartSignature, 500)

  const previewQuery = useQuery({
    queryKey: ['orderPreview', qrToken, debouncedCartSignature, appliedCoupon],
    queryFn: () =>
      orderService.previewOrder(
        qrToken,
        buildPreviewPayload(qrToken, items, appliedCoupon, notes),
      ),
    enabled: items.length > 0 && Boolean(debouncedCartSignature),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const summary = previewQuery.data

  const applyCoupon = useMutation({
    mutationFn: async () => {
      const subtotal = summary?.subtotal
      if (!subtotal) {
        const preview = await orderService.previewOrder(
          qrToken,
          buildPreviewPayload(qrToken, items, null, notes),
        )
        return orderService.validateCoupon(qrToken, { code: coupon, subtotal: preview.subtotal })
      }
      return orderService.validateCoupon(qrToken, { code: coupon, subtotal })
    },
    onSuccess: (data) => {
      setAppliedCoupon(data.code)
      toast.success(data.message)
      queryClient.invalidateQueries({ queryKey: ['orderPreview', qrToken] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const placeOrder = useMutation({
    mutationFn: () => {
      if (orderSubmittedRef.current) {
        return Promise.reject(new Error('Order already submitted'))
      }
      orderSubmittedRef.current = true
      return orderService.placeOrder(
        qrToken,
        buildPreviewPayload(qrToken, items, appliedCoupon, notes),
      )
    },
    onSuccess: (data) => {
      registerOrder(data.order)
      clearCart()
      navigate(`/order/${qrToken}/success/${data.order.orderId}`, {
        state: { order: data.order },
        replace: true,
      })
    },
    onError: (err) => {
      orderSubmittedRef.current = false
      toast.error(getErrorMessage(err))
    },
  })

  if (!items.length) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <CustomerHeader title={CUSTOMER_CONTENT.cart} />
        <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
          <ActiveOrderSection />
          <OrderHistorySection />
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-gray-600">{CUSTOMER_CONTENT.emptyCart}</p>
            <Link
              to={`/order/${qrToken}`}
              className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white"
            >
              {CUSTOMER_CONTENT.browseMenu}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isPlacing = placeOrder.isPending || orderSubmittedRef.current

  return (
    <div className="min-h-screen bg-gray-50 pb-44">
      <CustomerHeader title={CUSTOMER_CONTENT.cart} />

      <div className="mx-auto max-w-lg space-y-6 px-4 py-4">
        <ActiveOrderSection />
        <OrderHistorySection />

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.foodId}
              className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
            >
              <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-xl">
                🍽️
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">{item.foodName}</h3>
                  <p className="shrink-0 text-sm font-bold text-gray-900">
                    {previewQuery.isLoading ? '…' : formatINR(item.price * item.quantity)}
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  {formatINR(item.price)} × {item.quantity}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                    <button
                      type="button"
                      onClick={() => updateQty(item.foodId, -1)}
                      className="p-2"
                      disabled={isPlacing}
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="min-w-[1rem] text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.foodId, 1)}
                      className="p-2"
                      disabled={isPlacing}
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.foodId)}
                    className="p-2 text-gray-400 hover:text-red-500"
                    disabled={isPlacing}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex gap-2">
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder={CUSTOMER_CONTENT.couponPlaceholder}
              className="h-10 flex-1 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
              disabled={isPlacing}
            />
            <button
              type="button"
              disabled={applyCoupon.isPending || !coupon || isPlacing}
              onClick={() => applyCoupon.mutate()}
              className="rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {CUSTOMER_CONTENT.applyCoupon}
            </button>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-sm">
          {previewQuery.isFetching && !summary ? (
            <p className="text-center text-gray-500">Calculating totals…</p>
          ) : summary ? (
            <>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">{CUSTOMER_CONTENT.subtotal}</span>
                <span>{formatINR(summary.subtotal)}</span>
              </div>
              {summary.discount > 0 && (
                <div className="flex justify-between py-1 text-emerald-600">
                  <span>{CUSTOMER_CONTENT.discount}</span>
                  <span>-{formatINR(summary.discount)}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-gray-600">{CUSTOMER_CONTENT.taxes}</span>
                <span>{formatINR(summary.tax)}</span>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500">Unable to load totals</p>
          )}
        </div>

        <div className="space-y-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">{CUSTOMER_CONTENT.paymentMethod}</p>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="font-medium text-gray-900">{CUSTOMER_CONTENT.payLater}</p>
            <p className="text-xs text-gray-500">{CUSTOMER_CONTENT.payLaterDesc}</p>
          </div>
        </div>
      </div>

      <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-100 bg-white p-4 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="mx-auto max-w-lg">
          <div className="mb-3 flex justify-between text-sm">
            <span className="text-gray-600">{CUSTOMER_CONTENT.grandTotal}</span>
            <span className="text-lg font-bold text-gray-900">
              {summary ? formatINR(summary.total) : '—'}
            </span>
          </div>
          <button
            type="button"
            disabled={isPlacing || !summary || previewQuery.isFetching}
            onClick={() => placeOrder.mutate()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3.5 text-base font-semibold text-white disabled:opacity-70"
          >
            {isPlacing ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                {CUSTOMER_CONTENT.placingOrder}
              </>
            ) : (
              CUSTOMER_CONTENT.placeOrder
            )}
          </button>
          <Link
            to={`/order/${qrToken}`}
            className="mt-2 flex items-center justify-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="size-4" />
            {CUSTOMER_CONTENT.continueShopping}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CartPage
