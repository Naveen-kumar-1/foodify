import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const CartContext = createContext(null)

const cartKey = (qrToken) => `foodify_cart_${qrToken}`

const readCart = (qrToken) => {
  try {
    const raw = localStorage.getItem(cartKey(qrToken))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const writeCart = (qrToken, cart) => {
  localStorage.setItem(cartKey(qrToken), JSON.stringify(cart))
}

export const CartProvider = ({ qrToken, children }) => {
  const [cart, setCart] = useState(() => readCart(qrToken))

  const persist = useCallback(
    (next) => {
      setCart(next)
      writeCart(qrToken, next)
    },
    [qrToken],
  )

  const addItem = useCallback(
    (food) => {
      persist({
        ...cart,
        [food.foodId]: {
          foodId: food.foodId,
          foodName: food.foodName,
          description: food.description,
          price: food.price,
          quantity: (cart[food.foodId]?.quantity || 0) + 1,
        },
      })
    },
    [cart, persist],
  )

  const updateQty = useCallback(
    (foodId, delta) => {
      const item = cart[foodId]
      if (!item) return
      const quantity = item.quantity + delta
      if (quantity <= 0) {
        const next = { ...cart }
        delete next[foodId]
        persist(next)
        return
      }
      persist({ ...cart, [foodId]: { ...item, quantity } })
    },
    [cart, persist],
  )

  const removeItem = useCallback(
    (foodId) => {
      const next = { ...cart }
      delete next[foodId]
      persist(next)
    },
    [cart, persist],
  )

  const clearCart = useCallback(() => persist({}), [persist])

  const items = useMemo(() => Object.values(cart), [cart])
  const itemCount = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.quantity, 0),
    [items],
  )

  const value = useMemo(
    () => ({
      cart,
      items,
      itemCount,
      subtotal,
      addItem,
      updateQty,
      removeItem,
      clearCart,
    }),
    [cart, items, itemCount, subtotal, addItem, updateQty, removeItem, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
