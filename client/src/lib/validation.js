import { VALIDATION_CONTENT } from '@/constants/content'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

export const validateEmail = (email) => {
  if (!email?.trim()) return VALIDATION_CONTENT.emailRequired
  if (!EMAIL_REGEX.test(email.trim())) return VALIDATION_CONTENT.emailInvalid
  return ''
}

export const validatePassword = (password) => {
  if (!password) return VALIDATION_CONTENT.passwordRequired
  if (!PASSWORD_REGEX.test(password)) return VALIDATION_CONTENT.passwordRules
  return ''
}

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return VALIDATION_CONTENT.confirmPasswordRequired
  if (password !== confirmPassword) return VALIDATION_CONTENT.passwordsMismatch
  return ''
}

export const validateRequired = (value, label = 'This field') => {
  if (!value?.trim()) return VALIDATION_CONTENT.required(label)
  return ''
}

export const validateOtp = (otp, length = 6) => {
  if (!otp || otp.length !== length) return VALIDATION_CONTENT.otpRequired
  return ''
}

export const validatePhone = (phone) => {
  if (!phone?.trim()) return ''
  if (!/^\+[1-9]\d{6,14}$/.test(phone.trim())) return VALIDATION_CONTENT.phoneInvalid
  return ''
}
