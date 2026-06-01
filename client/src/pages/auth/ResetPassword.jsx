import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import PasswordInput from '@/components/forms/PasswordInput'
import RouteLoading from '@/components/routing/RouteLoading'
import { AUTH_CONTENT } from '@/constants/content'
import { useAuth } from '@/context/AuthContext'
import { validateConfirmPassword, validatePassword } from '@/lib/validation'
import { ROUTE_PATHS } from '@/routes/constants'
import { authService } from '@/services/authService'
import { getErrorMessage } from '@/services/api'

const ResetPassword = () => {
  const navigate = useNavigate()
  const { token: pathToken } = useParams()
  const { persistSession } = useAuth()
  const linkToken = pathToken ? decodeURIComponent(pathToken) : ''

  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(Boolean(linkToken))
  const [linkValid, setLinkValid] = useState(false)
  const [tokenError, setTokenError] = useState('')
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!linkToken) {
      setVerifying(false)
      setTokenError(AUTH_CONTENT.resetInvalidDefault)
      return
    }
    const verify = async () => {
      try {
        await authService.verifyResetToken(linkToken)
        setLinkValid(true)
        setTokenError('')
      } catch (err) {
        setLinkValid(false)
        setTokenError(getErrorMessage(err))
      } finally {
        setVerifying(false)
      }
    }
    verify()
  }, [linkToken])

  const validateForm = () => {
    const next = {
      password: validatePassword(form.password),
      confirmPassword: validateConfirmPassword(form.password, form.confirmPassword),
    }
    setErrors(next)
    return !Object.values(next).some(Boolean)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const data = await authService.resetPassword({
        resetToken: linkToken,
        newPassword: form.password,
      })

      persistSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        restaurant: data.restaurant,
      })
      toast.success(AUTH_CONTENT.resetSuccess)
      toast.success(AUTH_CONTENT.resetWelcomeBack)
      navigate(ROUTE_PATHS.DASHBOARD, { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (verifying) return <RouteLoading />

  if (!linkValid) {
    return (
      <div className="space-y-4 text-center">
        <AlertCircle className="mx-auto size-10 text-destructive" />
        <h1 className="text-lg font-semibold">{AUTH_CONTENT.resetInvalidTitle}</h1>
        <p className="text-sm text-muted-foreground">
          {tokenError || AUTH_CONTENT.resetInvalidDefault}
        </p>
        <Link
          to={ROUTE_PATHS.LOGIN}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {AUTH_CONTENT.backToLogin}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{AUTH_CONTENT.resetTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{AUTH_CONTENT.resetDescription}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="new-password">{AUTH_CONTENT.newPassword}</Label>
          <PasswordInput
            id="new-password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            disabled={loading}
            autoComplete="new-password"
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">{AUTH_CONTENT.confirmPassword}</Label>
          <PasswordInput
            id="confirm-password"
            value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            disabled={loading}
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword}</p>
          )}
        </div>
        <Button type="submit" size="lg" className="h-11 w-full" disabled={loading}>
          {loading ? AUTH_CONTENT.resetUpdating : AUTH_CONTENT.resetButton}
        </Button>
      </form>
    </div>
  )
}

export default ResetPassword
