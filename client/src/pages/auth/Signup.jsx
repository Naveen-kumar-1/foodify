import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PasswordInput from '@/components/forms/PasswordInput'
import { AUTH_CONTENT } from '@/constants/content'
import { STORAGE_KEYS, storage } from '@/lib/storage'
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateRequired,
} from '@/lib/validation'
import { ROUTE_PATHS } from '@/routes/constants'
import { authService } from '@/services/authService'
import { getErrorMessage } from '@/services/api'

const Signup = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const next = {
      name: validateRequired(form.name, AUTH_CONTENT.restaurantName),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirmPassword: validateConfirmPassword(form.password, form.confirmPassword),
    }
    setErrors(next)
    return !Object.values(next).some(Boolean)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const email = form.email.trim()
      const data = await authService.signup({ name: form.name.trim(), email })
      storage.setString(STORAGE_KEYS.SIGNUP_EMAIL, email)
      storage.setString(STORAGE_KEYS.SIGNUP_PASSWORD, form.password)
      if (data.otpExpiresAt) {
        storage.setString(STORAGE_KEYS.SIGNUP_OTP_EXPIRES_AT, String(new Date(data.otpExpiresAt).getTime()))
      }
      toast.success(data.message)
      navigate(ROUTE_PATHS.VERIFY_OTP, {
        state: {
          email,
          otpExpiresAt: data.otpExpiresAt,
          expiresIn: data.expiresIn,
        },
      })
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">{AUTH_CONTENT.signupTitle}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{AUTH_CONTENT.signupDescription}</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{AUTH_CONTENT.restaurantName}</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{AUTH_CONTENT.confirmPassword}</Label>
          <PasswordInput
            id="confirmPassword"
            value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? AUTH_CONTENT.signupLoading : AUTH_CONTENT.signupButton}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {AUTH_CONTENT.hasAccount}{' '}
        <Link to={ROUTE_PATHS.LOGIN} className="font-medium text-primary hover:underline">
          {AUTH_CONTENT.loginLink}
        </Link>
      </p>
    </div>
  )
}

export default Signup
