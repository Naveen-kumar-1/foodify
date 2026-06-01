import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { CUSTOMER_CONTENT } from '@/constants/customerContent'
import { useCustomerSession } from '@/context/CustomerSessionContext'

const InfoCard = ({ icon: Icon, title, children }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
    <div className="mb-2 flex items-center gap-2 text-gray-900">
      <Icon className="size-4 text-gray-500" />
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
    <div className="text-sm leading-relaxed text-gray-600">{children}</div>
  </div>
)

const RestaurantInfoTab = () => {
  const { scanData } = useCustomerSession()
  const restaurant = scanData?.restaurant

  if (!restaurant) return null

  const logoUrl = restaurant.logoUrl || restaurant.logo
  const addressLines = [
    restaurant.address,
    [restaurant.city, restaurant.state].filter(Boolean).join(', '),
    restaurant.postalCode ? `India - ${restaurant.postalCode}` : '',
  ].filter(Boolean)

  const handleCall = () => {
    if (!restaurant.phone) return
    window.location.href = `tel:${restaurant.phone.replace(/\s/g, '')}`
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50 p-6 text-center shadow-sm">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="mx-auto size-20 rounded-2xl border border-gray-100 object-cover shadow-sm"
          />
        ) : (
          <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-gray-900 text-2xl font-bold text-white">
            {restaurant.name?.charAt(0)}
          </div>
        )}
        <h2 className="mt-4 text-xl font-bold text-gray-900">{restaurant.name}</h2>
        {restaurant.slogan && (
          <p className="mt-1 text-sm italic text-gray-500">&ldquo;{restaurant.slogan}&rdquo;</p>
        )}
      </div>

      {restaurant.description && (
        <InfoCard icon={MapPin} title={CUSTOMER_CONTENT.aboutDescription}>
          <p>{restaurant.description}</p>
        </InfoCard>
      )}

      {restaurant.phone && (
        <InfoCard icon={Phone} title={CUSTOMER_CONTENT.aboutPhone}>
          <p className="font-medium text-gray-900">{restaurant.phone}</p>
          <button
            type="button"
            onClick={handleCall}
            className="mt-3 w-full rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            {CUSTOMER_CONTENT.callRestaurant}
          </button>
        </InfoCard>
      )}

      {restaurant.email && (
        <InfoCard icon={Mail} title={CUSTOMER_CONTENT.aboutEmail}>
          <a href={`mailto:${restaurant.email}`} className="font-medium text-gray-900 hover:underline">
            {restaurant.email}
          </a>
        </InfoCard>
      )}

      {addressLines.length > 0 && (
        <InfoCard icon={MapPin} title={CUSTOMER_CONTENT.aboutLocation}>
          {addressLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </InfoCard>
      )}

      {restaurant.timings && (
        <InfoCard icon={Clock} title={CUSTOMER_CONTENT.aboutHours}>
          <p className="whitespace-pre-line">{restaurant.timings}</p>
        </InfoCard>
      )}

      {(restaurant.gstNumber || restaurant.fssaiNumber) && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-4 text-xs text-gray-500">
          {restaurant.gstNumber && (
            <p>
              {CUSTOMER_CONTENT.gstLabel}: {restaurant.gstNumber}
            </p>
          )}
          {restaurant.fssaiNumber && (
            <p className="mt-1">
              {CUSTOMER_CONTENT.fssaiLabel}: {restaurant.fssaiNumber}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default RestaurantInfoTab
