const safeParse = (raw) => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const storage = {
  get(key) {
    const raw = localStorage.getItem(key)
    return raw ? safeParse(raw) : null
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
  },
  remove(key) {
    localStorage.removeItem(key)
  },
  getString(key) {
    return localStorage.getItem(key)
  },
  setString(key, value) {
    localStorage.setItem(key, value)
  },
}

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'foodify_access_token',
  REFRESH_TOKEN: 'foodify_refresh_token',
  RESTAURANT: 'foodify_restaurant',
  REMEMBER_EMAIL: 'foodify_remember_email',
  SIGNUP_EMAIL: 'foodify_signup_email',
  SIGNUP_PASSWORD: 'foodify_signup_password',
  SIGNUP_OTP_EXPIRES_AT: 'foodify_signup_otp_expires_at',
  RESET_OTP_EXPIRES_AT: 'foodify_reset_otp_expires_at',
  VERIFICATION_TOKEN: 'foodify_verification_token',
  RESET_EMAIL: 'foodify_reset_email',
  RESET_TOKEN: 'foodify_reset_token',
}
