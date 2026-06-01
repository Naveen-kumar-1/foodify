import { api } from '@/services/api'

export const authService = {
  signup: (payload) => api.post('/auth/signup', payload).then((r) => r.data),
  resendOtp: (payload) => api.post('/auth/resend-otp', payload).then((r) => r.data),
  getOtpStatus: (email) =>
    api.get('/auth/otp-status', { params: { email } }).then((r) => r.data),
  verifyEmail: (payload) => api.post('/auth/verify-email', payload).then((r) => r.data),
  setPassword: (payload) => api.post('/auth/set-password', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  forgotPassword: (payload) =>
    api.post('/auth/forgot-password', payload).then((r) => r.data),
  verifyResetToken: (token) =>
    api.get('/auth/verify-reset-token', { params: { token } }).then((r) => r.data),
  resendResetOtp: (payload) => api.post('/auth/resend-reset-otp', payload).then((r) => r.data),
  verifyResetOtp: (payload) => api.post('/auth/verify-reset-otp', payload).then((r) => r.data),
  resetPassword: (payload) => api.post('/auth/reset-password', payload).then((r) => r.data),
  changePassword: (payload) => api.post('/auth/change-password', payload).then((r) => r.data),
}
