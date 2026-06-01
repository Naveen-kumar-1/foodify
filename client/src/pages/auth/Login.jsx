import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PasswordInput from '@/components/forms/PasswordInput'
import { AUTH_CONTENT } from '@/constants/content'
import { useAuth } from '@/context/AuthContext'
import { STORAGE_KEYS, storage } from '@/lib/storage'
import { validateEmail, validateRequired } from '@/lib/validation'
import { ROUTE_PATHS } from '@/routes/constants'
import { authService } from '@/services/authService'
import { getErrorMessage } from '@/services/api'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { persistSession } = useAuth()
  const [loading, setLoading] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [form, setForm] = useState({
    email: storage.getString(STORAGE_KEYS.REMEMBER_EMAIL) || '',
    password: '',
    remember: Boolean(storage.getString(STORAGE_KEYS.REMEMBER_EMAIL)),
  })
  const [errors, setErrors] = useState({})

  const redirectTo = location.state?.from?.pathname || ROUTE_PATHS.DASHBOARD

  const validate = () => {
    const next = {
      email: validateEmail(form.email),
      password: validateRequired(form.password, 'Password'),
    }
    setErrors(next)
    return !Object.values(next).some(Boolean)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const data = await authService.login({
        email: form.email.trim(),
        password: form.password,
      })
      if (form.remember) {
        storage.setString(STORAGE_KEYS.REMEMBER_EMAIL, form.email.trim())
      } else {
        storage.remove(STORAGE_KEYS.REMEMBER_EMAIL)
      }
      persistSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        restaurant: data.restaurant,
      })
      toast.success(data.message || 'Login successful')
      navigate(redirectTo, { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    const emailError = validateEmail(form.email)
    if (emailError) {
      setErrors((prev) => ({ ...prev, email: emailError }))
      toast.error(AUTH_CONTENT.forgotEmailRequired)
      return
    }

    setForgotLoading(true)
    setErrors((prev) => ({ ...prev, email: '' }))
    try {
      const data = await authService.forgotPassword({ email: form.email.trim() })
      setResetEmailSent(true)
      toast.success(data.message || AUTH_CONTENT.forgotSuccessMessage)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setForgotLoading(false)
    }
  }

  if (resetEmailSent) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        <h1 className="text-xl font-semibold">{AUTH_CONTENT.forgotSuccessTitle}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {AUTH_CONTENT.forgotSuccessMessage}
        </p>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 w-full"
          onClick={() => setResetEmailSent(false)}
        >
          {AUTH_CONTENT.backToLogin}
        </Button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">{AUTH_CONTENT.loginTitle}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{AUTH_CONTENT.loginDescription}</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            disabled={loading || forgotLoading}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading || forgotLoading}
              className="text-sm font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline disabled:opacity-50"
            >
              {forgotLoading ? AUTH_CONTENT.forgotLoading : AUTH_CONTENT.forgotPassword}
            </button>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            disabled={loading || forgotLoading}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>
        <div className="flex items-center text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={(e) => setForm((f) => ({ ...f, remember: e.target.checked }))}
              className="rounded border-input"
              disabled={loading || forgotLoading}
            />
            {AUTH_CONTENT.rememberMe}
          </label>
        </div>
        <Button type="submit" size="lg" className="h-11 w-full" disabled={loading || forgotLoading}>
          {loading ? AUTH_CONTENT.loginLoading : AUTH_CONTENT.loginButton}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {AUTH_CONTENT.noAccount}{' '}
        <Link to={ROUTE_PATHS.SIGNUP} className="font-medium text-primary hover:underline">
          {AUTH_CONTENT.signupLink}
        </Link>
      </p>
    </div>
  )
}

export default Login
