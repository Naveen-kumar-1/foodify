import { useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { CUSTOMER_CONTENT } from '@/constants/customerContent'

const RefreshOrderButton = ({ onRefresh, className = '' }) => {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    try {
      await onRefresh?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 disabled:opacity-60 ${className}`}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <RefreshCw className="size-4" />
      )}
      {CUSTOMER_CONTENT.refreshStatus}
    </button>
  )
}

export default RefreshOrderButton
