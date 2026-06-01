const TIME_24H = /^([01]\d|2[0-3]):([0-5]\d)$/

export const isValidTime24h = (value) => TIME_24H.test(value)

export const parseTime24h = (value) => {
  if (!isValidTime24h(value)) return null
  const [hours, minutes] = value.split(':').map(Number)
  return { hours, minutes }
}

export const toTime24h = (hours12, minutes, period) => {
  let hours = Number(hours12) % 12
  if (period === 'PM') hours += 12
  if (period === 'AM' && Number(hours12) === 12) hours = 0
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export const to12hParts = (time24) => {
  const parsed = parseTime24h(time24)
  if (!parsed) return { hours12: '12', minutes: '00', period: 'AM' }
  const { hours, minutes } = parsed
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 || 12
  return {
    hours12: String(hours12),
    minutes: String(minutes).padStart(2, '0'),
    period,
  }
}

export const formatTime12h = (time24) => {
  const { hours12, minutes, period } = to12hParts(time24)
  return `${hours12}:${minutes} ${period}`
}

export const compareTimes = (fromTime, toTime) => {
  const from = parseTime24h(fromTime)
  const to = parseTime24h(toTime)
  if (!from || !to) return 0
  const fromMins = from.hours * 60 + from.minutes
  const toMins = to.hours * 60 + to.minutes
  if (fromMins < toMins) return -1
  if (fromMins > toMins) return 1
  return 0
}
