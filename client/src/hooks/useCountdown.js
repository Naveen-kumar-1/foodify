import { useCallback, useEffect, useState } from 'react'

export const useCountdown = (initialSeconds = 0) => {
  const [seconds, setSeconds] = useState(Math.max(0, initialSeconds))

  useEffect(() => {
    setSeconds(Math.max(0, initialSeconds))
  }, [initialSeconds])

  useEffect(() => {
    if (seconds <= 0) return undefined
    const timer = setInterval(() => {
      setSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [seconds])

  const restart = useCallback((value) => {
    setSeconds(Math.max(0, value))
  }, [])

  return {
    seconds,
    isActive: seconds > 0,
    formatted: formatCountdown(seconds),
    restart,
  }
}

export const formatCountdown = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
