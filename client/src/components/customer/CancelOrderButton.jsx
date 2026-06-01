import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import CancelOrderModal from '@/components/orders/CancelOrderModal'
import { CUSTOMER_CONTENT } from '@/constants/customerContent'
import { useCustomerSession } from '@/context/CustomerSessionContext'
import { getCustomerSessionId } from '@/lib/customerSession'
import { canCustomerCancel } from '@/lib/orderCancel'
import { orderService } from '@/services/orderService'
import { getErrorMessage } from '@/services/api'

const CancelOrderButton = ({ order, className = '', variant = 'outline' }) => {
  const { customerSessionId: ctxSessionId, qrToken, session, registerOrder } = useCustomerSession()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!order || !canCustomerCancel(order.orderStatus)) return null

  const resolveSessionId = () =>
    ctxSessionId || session?.customerSessionId || getCustomerSessionId(qrToken)

  const handleConfirm = async ({ cancellationReason, customReason }) => {
    const sessionId = resolveSessionId()
    if (!sessionId) {
      toast.error(CUSTOMER_CONTENT.sessionExpired)
      return
    }

    setLoading(true)
    try {
      const data = await orderService.customerCancelOrder(order.orderId, {
        sessionId,
        cancellationReason,
        customReason,
      })
      registerOrder(data.order)
      toast.success(CUSTOMER_CONTENT.cancelSuccess)
      setOpen(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        className={className}
        onClick={() => setOpen(true)}
        disabled={loading}
      >
        {loading ? CUSTOMER_CONTENT.cancelling : CUSTOMER_CONTENT.cancelOrder}
      </Button>
      <CancelOrderModal
        open={open}
        onOpenChange={setOpen}
        actor="customer"
        loading={loading}
        onConfirm={handleConfirm}
      />
    </>
  )
}

export default CancelOrderButton
