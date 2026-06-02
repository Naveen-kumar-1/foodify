import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import { STORAGE_KEYS, storage } from '@/lib/storage'
import { authService } from '@/services/authService'
import { restaurantService } from '@/services/restaurantService'

const AuthContext = createContext(null)

const readRestaurant = () => storage.get(STORAGE_KEYS.RESTAURANT)

const isTokenValid = (token) => {
  if (!token) return false
  try {
    const decoded = jwtDecode(token)
    if (!decoded.exp) return true
    return decoded.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export const AuthProvider = ({ children }) => {
  const [restaurant, setRestaurant] = useState(readRestaurant)
  const [accessToken, setAccessToken] = useState(
    () => storage.getString(STORAGE_KEYS.ACCESS_TOKEN) || null,
  )
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  const isAuthenticated = Boolean(accessToken && isTokenValid(accessToken) && restaurant)

  const persistSession = useCallback(({ accessToken: token, refreshToken, restaurant: data }) => {
    if (token) {
      storage.setString(STORAGE_KEYS.ACCESS_TOKEN, token)
      setAccessToken(token)
    }
    if (refreshToken) storage.setString(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
    if (data) {
      storage.set(STORAGE_KEYS.RESTAURANT, data)
      setRestaurant(data)
    }
  }, [])

  const clearSession = useCallback(() => {
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN)
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN)
    storage.remove(STORAGE_KEYS.RESTAURANT)
    setAccessToken(null)
    setRestaurant(null)
  }, [])

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  const refreshProfile = useCallback(async () => {
    const profile = await restaurantService.getProfile()
    storage.set(STORAGE_KEYS.RESTAURANT, profile)
    setRestaurant(profile)
    return profile
  }, [])

  useEffect(() => {
    const bootstrap = async () => {
      const token = storage.getString(STORAGE_KEYS.ACCESS_TOKEN)
      const refreshToken = storage.getString(STORAGE_KEYS.REFRESH_TOKEN)

      // If access token is missing/expired but we have a refresh token, try to refresh silently.
      if (!token || !isTokenValid(token)) {
        if (refreshToken) {
          try {
            const data = await authService.refreshToken({ refreshToken })
            persistSession({
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              restaurant: data.restaurant,
            })
          } catch {
            clearSession()
            setIsBootstrapping(false)
            return
          }
        } else {
          clearSession()
          setIsBootstrapping(false)
          return
        }
      }
      try {
        const profile = await restaurantService.getProfile()
        setRestaurant(profile)
        setAccessToken(storage.getString(STORAGE_KEYS.ACCESS_TOKEN))
      } catch {
        clearSession()
      } finally {
        setIsBootstrapping(false)
      }
    }
    bootstrap()
  }, [clearSession, persistSession])

  useEffect(() => {
    const onUnauthorized = () => clearSession()
    window.addEventListener('foodify:unauthorized', onUnauthorized)
    return () => window.removeEventListener('foodify:unauthorized', onUnauthorized)
  }, [clearSession])

  const value = useMemo(
    () => ({
      restaurant,
      user: restaurant,
      accessToken,
      isAuthenticated,
      isBootstrapping,
      persistSession,
      clearSession,
      logout,
      refreshProfile,
      setRestaurant,
    }),
    [
      restaurant,
      accessToken,
      isAuthenticated,
      isBootstrapping,
      persistSession,
      clearSession,
      logout,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
