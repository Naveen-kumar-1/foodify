import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import OtpInput from '@/components/auth/OtpInput'
import { Button } from '@/components/ui/button'
import { AUTH_CONTENT, VALIDATION_CONTENT } from '@/constants/content'
import { useAuth } from '@/context/AuthContext'
import { useCountdown } from '@/hooks/useCountdown'
import { STORAGE_KEYS, storage } from '@/lib/storage'
import { validateOtp } from '@/lib/validation'
import { ROUTE_PATHS } from '@/routes/constants'
import { authService } from '@/services/authService'
import { getErrorMessage } from '@/services/api'

const OTP_LENGTH = 6

const parseExpiresAt = (locationState, storageKey) => {
  if (locationState?.otpExpiresAt) return new Date(locationState.otpExpiresAt).getTime()
  const stored = storage.getString(storageKey)
  if (stored) return Number(stored)
  return Date.now() + 300 * 1000
}

const VerifyOtp = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { persistSession } = useAuth()

  const email =
    location.state?.email || storage.getString(STORAGE_KEYS.SIGNUP_EMAIL) || ''

  const [otp, setOtp] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [otpExpiresAt, setOtpExpiresAt] = useState(() =>
    parseExpiresAt(location.state, STORAGE_KEYS.SIGNUP_OTP_EXPIRES_AT),
  )

  const otpRemaining = Math.max(0, Math.floor((otpExpiresAt - Date.now()) / 1000))
  const otpTimer = useCountdown(otpRemaining)
  const resendTimer = useCountdown(resendCooldown)

  const syncOtpStatus = useCallback(async () => {
    if (!email) return
    try {
      const statusData = await authService.getOtpStatus(email)
      if (statusData.otpExpiresIn > 0) {
        const expiresAt = Date.now() + statusData.otpExpiresIn * 1000
        setOtpExpiresAt(expiresAt)
        storage.setString(STORAGE_KEYS.SIGNUP_OTP_EXPIRES_AT, String(expiresAt))
      }
      if (!statusData.canResend && statusData.resendRetryAfter > 0) {
        setResendCooldown(statusData.resendRetryAfter)
        resendTimer.restart(statusData.resendRetryAfter)
      }
    } catch {
      // Non-blocking status sync
    }
  }, [email, resendTimer])

  useEffect(() => {
    if (!email) return
    syncOtpStatus()
  }, [email, syncOtpStatus])

  useEffect(() => {
    if (!otpTimer.isActive && otp.length === 0) {
      setStatus('expired')
    }
  }, [otpTimer.isActive, otp.length])

  const handleResend = async () => {
    if (!email) {
      toast.error(AUTH_CONTENT.emailNotFound)
      navigate(ROUTE_PATHS.SIGNUP)
      return
    }
    if (resendTimer.isActive || resendLoading) return

    setResendLoading(true)
    setError('')
    try {
      const data = await authService.resendOtp({ email })
      const expiresAt = data.otpExpiresAt
        ? new Date(data.otpExpiresAt).getTime()
        : Date.now() + (data.expiresIn || 300) * 1000

      setOtpExpiresAt(expiresAt)
      storage.setString(STORAGE_KEYS.SIGNUP_OTP_EXPIRES_AT, String(expiresAt))
      otpTimer.restart(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)))

      const cooldown = data.retryAfter || data.resendCooldown || 60
      setResendCooldown(cooldown)
      resendTimer.restart(cooldown)

      setOtp('')
      setStatus('resent')
      toast.success(data.message || AUTH_CONTENT.resendOtpSuccess)
    } catch (err) {
      const message = getErrorMessage(err)
      toast.error(message)
      const match = message.match(/(\d+)\s+seconds/)
      if (match) {
        const seconds = Number(match[1])
        setResendCooldown(seconds)
        resendTimer.restart(seconds)
      }
    } finally {
      setResendLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpError = validateOtp(otp, OTP_LENGTH)
    if (otpError) {
      setError(otpError)
      setStatus('error')
      return
    }
    if (!otpTimer.isActive) {
      setError(AUTH_CONTENT.otpExpired)
      setStatus('expired')
      return
    }
    if (!email) {
      toast.error(AUTH_CONTENT.emailNotFound)
      navigate(ROUTE_PATHS.SIGNUP)
      return
    }

    setVerifyLoading(true)
    setError('')
    setStatus('verifying')

    try {
      const verifyData = await authService.verifyEmail({ email, otp: otp.trim() })
      setStatus('success')

      const password = storage.getString(STORAGE_KEYS.SIGNUP_PASSWORD)
      if (!password) {
        toast.error(AUTH_CONTENT.sessionExpired)
        navigate(ROUTE_PATHS.SIGNUP)
        return
      }

      const authData = await authService.setPassword({
        verificationToken: verifyData.verificationToken,
        password,
      })

      storage.remove(STORAGE_KEYS.SIGNUP_EMAIL)
      storage.remove(STORAGE_KEYS.SIGNUP_PASSWORD)
      storage.remove(STORAGE_KEYS.SIGNUP_OTP_EXPIRES_AT)

      persistSession({
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        restaurant: authData.restaurant,
      })

      toast.success(AUTH_CONTENT.registrationComplete)
      navigate(ROUTE_PATHS.DASHBOARD, { replace: true })
    } catch (err) {
      setStatus('error')
      setError(getErrorMessage(err))
      toast.error(getErrorMessage(err))
    } finally {
      setVerifyLoading(false)
    }
  }

  const isOtpExpired = !otpTimer.isActive

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="size-6" />
        </div>
        <h1 className="text-xl font-semibold">{AUTH_CONTENT.otpTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {AUTH_CONTENT.otpDescription}{' '}
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      {status === 'success' && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" />
          {AUTH_CONTENT.verificationSuccess}
        </div>
      )}

      {status === 'resent' && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
          <CheckCircle2 className="size-4 shrink-0" />
          {AUTH_CONTENT.resendOtpSuccess}
        </div>
      )}

      {(status === 'error' || error) && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error || VALIDATION_CONTENT?.otpInvalid}
        </div>
      )}

      {isOtpExpired && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-800 dark:text-amber-300">
          <p className="font-medium">{AUTH_CONTENT.otpExpired}</p>
          <p className="mt-1 text-xs opacity-90">{AUTH_CONTENT.otpExpiredAction}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <OtpInput
            value={otp}
            onChange={(value) => {
              setOtp(value)
              setError('')
              if (status === 'error' || status === 'expired') setStatus('idle')
            }}
            disabled={verifyLoading || status === 'success'}
            hasError={Boolean(error)}
          />
          <p
            className={`text-center text-xs ${
              isOtpExpired ? 'font-medium text-destructive' : 'text-muted-foreground'
            }`}
          >
            {AUTH_CONTENT.otpExpiresIn}{' '}
            <span className="font-mono font-semibold tabular-nums">
              {isOtpExpired ? '00:00' : otpTimer.formatted}
            </span>
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={verifyLoading || isOtpExpired || otp.length !== OTP_LENGTH}
        >
          {verifyLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {AUTH_CONTENT.verifyLoading}
            </>
          ) : (
            AUTH_CONTENT.verifyButton
          )}
        </Button>
      </form>

      <div className="space-y-3 text-center">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={resendLoading || resendTimer.isActive}
          onClick={handleResend}
        >
          {resendLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {AUTH_CONTENT.resendOtpLoading}
            </>
          ) : resendTimer.isActive ? (
            `${AUTH_CONTENT.resendOtpCooldown} ${resendTimer.formatted}`
          ) : (
            AUTH_CONTENT.resendOtp
          )}
        </Button>
        <p className="text-sm text-muted-foreground">
          <Link to={ROUTE_PATHS.SIGNUP} className="text-primary hover:underline">
            {AUTH_CONTENT.backToSignup}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default VerifyOtp
