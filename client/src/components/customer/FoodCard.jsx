import { Minus, Plus } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { CUSTOMER_CONTENT } from '@/constants/customerContent'
import { formatINR } from '@/lib/customerUi'
import { cn } from '@/lib/utils'

const FoodCard = ({ food }) => {
  const { cart, addItem, updateQty } = useCart()
  const qty = cart[food.foodId]?.quantity || 0
  const unavailable = food.isActive === false

  return (
    <article
      className={cn(
        'flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md',
        unavailable && 'opacity-60',
      )}
    >
      <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-2xl">
        🍽️
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900">{food.foodName}</h3>
            {food.description && (
              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-500">
                {food.description}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-gray-900">{formatINR(food.price)}</p>
            {food.gstPercentage != null && (
              <p className="text-[10px] text-gray-400">
                + {food.gstPercentage}% {CUSTOMER_CONTENT.gstIncluded}
              </p>
            )}
          </div>
        </div>
        <div className="mt-auto flex items-center justify-end pt-2">
          {unavailable ? (
            <span className="text-xs font-medium text-gray-400">Unavailable</span>
          ) : qty === 0 ? (
            <button
              type="button"
              onClick={() => addItem(food)}
              className="rounded-lg border border-gray-900 px-4 py-1.5 text-xs font-bold tracking-wide text-gray-900 uppercase transition hover:bg-gray-900 hover:text-white"
            >
              {CUSTOMER_CONTENT.add}
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              <button
                type="button"
                onClick={() => updateQty(food.foodId, -1)}
                className="flex size-8 items-center justify-center rounded-md bg-white text-gray-700 shadow-sm"
                aria-label="Decrease"
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-[1.25rem] text-center text-sm font-bold text-gray-900">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => updateQty(food.foodId, 1)}
                className="flex size-8 items-center justify-center rounded-md bg-gray-900 text-white"
                aria-label="Increase"
              >
                <Plus className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default FoodCard
