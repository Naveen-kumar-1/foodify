import { useEffect, useRef, useState } from 'react'
import ActiveOrderSection from '@/components/customer/ActiveOrderSection'
import CustomerHeader from '@/components/customer/CustomerHeader'
import CustomerTabBar from '@/components/customer/CustomerTabBar'
import FoodCard from '@/components/customer/FoodCard'
import OrderHistorySection from '@/components/customer/OrderHistorySection'
import RestaurantInfoTab from '@/components/customer/RestaurantInfoTab'
import RouteLoading from '@/components/routing/RouteLoading'
import { useCustomerSession } from '@/context/CustomerSessionContext'
import { cn } from '@/lib/utils'

const slugify = (name) => name.toLowerCase().replace(/\s+/g, '-')

const CustomerOrderPage = () => {
  const { scanData, scanLoading, scanError } = useCustomerSession()
  const [activeTab, setActiveTab] = useState('menu')
  const [activeCategory, setActiveCategory] = useState('')
  const sectionRefs = useRef({})

  const categories = scanData?.categories || []

  useEffect(() => {
    if (categories.length && !activeCategory) {
      setActiveCategory(categories[0].category)
    }
  }, [categories, activeCategory])

  const scrollToCategory = (category) => {
    setActiveCategory(category)
    const el = sectionRefs.current[slugify(category)]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (scanLoading) return <RouteLoading />
  if (scanError || !scanData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-center">
        <p className="text-gray-600">Invalid or expired QR code. Please scan again.</p>
      </div>
    )
  }

  return (
    <div className="pb-36">
      <CustomerHeader />
      <CustomerTabBar activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'menu' && categories.length > 1 && (
        <nav className="sticky top-[105px] z-20 border-b border-gray-100 bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-lg gap-2 overflow-x-auto px-4 py-2 scrollbar-none">
            {categories.map((group) => (
              <button
                key={group.category}
                type="button"
                onClick={() => scrollToCategory(group.category)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition',
                  activeCategory === group.category
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                {group.category}
              </button>
            ))}
          </div>
        </nav>
      )}

      <main className="mx-auto max-w-lg px-4 py-5">
        {activeTab === 'menu' && (
          <div className="space-y-8">
            {categories.map((group) => (
              <section
                key={group.category}
                ref={(el) => {
                  sectionRefs.current[slugify(group.category)] = el
                }}
                className="scroll-mt-36"
              >
                <h2 className="mb-3 text-base font-bold text-gray-900">{group.category}</h2>
                <div className="space-y-3">
                  {group.items.map((food) => (
                    <FoodCard key={food.foodId} food={food} />
                  ))}
                </div>
              </section>
            ))}
            {!categories.length && (
              <p className="py-12 text-center text-sm text-gray-500">
                No items available right now. Please check back during the next service window.
              </p>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-8">
            <ActiveOrderSection />
            <OrderHistorySection />
          </div>
        )}

        {activeTab === 'about' && <RestaurantInfoTab />}
      </main>
    </div>
  )
}

export default CustomerOrderPage
