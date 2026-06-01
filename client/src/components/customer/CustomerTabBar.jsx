import { cn } from '@/lib/utils'
import { CUSTOMER_CONTENT } from '@/constants/customerContent'

const TABS = [
  { id: 'menu', label: CUSTOMER_CONTENT.tabMenu },
  { id: 'orders', label: CUSTOMER_CONTENT.tabOrders },
  { id: 'about', label: CUSTOMER_CONTENT.tabAbout },
]

const CustomerTabBar = ({ activeTab, onChange }) => (
  <nav className="sticky top-[57px] z-30 border-b border-gray-100 bg-white/95 backdrop-blur-md">
    <div className="mx-auto flex max-w-lg">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex-1 border-b-2 py-3 text-center text-sm font-medium transition',
            activeTab === tab.id
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-800',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  </nav>
)

export default CustomerTabBar
