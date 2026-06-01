import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { ImagePlus, Trash2 } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import RestaurantLogo from '@/components/common/RestaurantLogo'
import { PROFILE_CONTENT, SETTINGS_CONTENT } from '@/constants/content'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PasswordInput from '@/components/forms/PasswordInput'
import RouteLoading from '@/components/routing/RouteLoading'
import { useAuth } from '@/context/AuthContext'
import {
  validateConfirmPassword,
  validatePassword,
  validatePhone,
  validateRequired,
} from '@/lib/validation'
import { AUTH_CONTENT } from '@/constants/content'
import { restaurantService } from '@/services/restaurantService'
import { authService } from '@/services/authService'
import { getErrorMessage } from '@/services/api'

const MAX_LOGO_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const Profile = () => {
  const { restaurant, refreshProfile } = useAuth()
  const [forgotLoading, setForgotLoading] = useState(false)
  const fileRef = useRef(null)
  const [fetching, setFetching] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState('')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    description: '',
    timings: '',
    slogan: '',
    gstNumber: '',
    fssaiNumber: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [passwordErrors, setPasswordErrors] = useState({})

  const displayLogo = logoPreview || restaurant?.logoUrl || restaurant?.logo || ''

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await restaurantService.getProfile()
        setForm({
          name: profile.name || '',
          phone: profile.phone || '',
          address: profile.address || profile.location || '',
          city: profile.city || '',
          state: profile.state || '',
          postalCode: profile.postalCode || '',
          description: profile.description || '',
          timings: profile.timings || '',
          slogan: profile.slogan || '',
          gstNumber: profile.gstNumber || '',
          fssaiNumber: profile.fssaiNumber || '',
        })
        setLogoPreview(profile.logoUrl || profile.logo || '')
      } catch (err) {
        if (restaurant) {
          setForm({
            name: restaurant.name || '',
            phone: restaurant.phone || '',
            address: restaurant.address || restaurant.location || '',
            city: restaurant.city || '',
            state: restaurant.state || '',
            postalCode: restaurant.postalCode || '',
            description: restaurant.description || '',
            timings: restaurant.timings || '',
            slogan: restaurant.slogan || '',
            gstNumber: restaurant.gstNumber || '',
            fssaiNumber: restaurant.fssaiNumber || '',
          })
          setLogoPreview(restaurant.logoUrl || restaurant.logo || '')
        }
        toast.error(getErrorMessage(err))
      } finally {
        setFetching(false)
      }
    }
    load()
  }, [restaurant])

  const handleLogoSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Please upload JPG, PNG, or WEBP')
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error('Logo must be under 5 MB')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setLogoPreview(previewUrl)
    setLogoUploading(true)
    try {
      const data = await restaurantService.uploadLogo(file)
      await refreshProfile()
      setLogoPreview(data.restaurant?.logoUrl || data.restaurant?.logo || previewUrl)
      toast.success('Logo uploaded')
    } catch (err) {
      setLogoPreview(restaurant?.logoUrl || restaurant?.logo || '')
      toast.error(getErrorMessage(err))
    } finally {
      setLogoUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleRemoveLogo = async () => {
    setLogoUploading(true)
    try {
      await restaurantService.deleteLogo()
      await refreshProfile()
      setLogoPreview('')
      toast.success('Logo removed')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLogoUploading(false)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    const next = {
      name: validateRequired(form.name, 'Restaurant name'),
      phone: validatePhone(form.phone),
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return

    setSaving(true)
    try {
      const data = await restaurantService.updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        location: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        description: form.description.trim(),
        timings: form.timings.trim(),
        slogan: form.slogan.trim(),
        gstNumber: form.gstNumber.trim(),
        fssaiNumber: form.fssaiNumber.trim(),
      })
      await refreshProfile()
      toast.success(data.message || PROFILE_CONTENT.saved)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    const next = {
      currentPassword: validateRequired(passwordForm.currentPassword, 'Current password'),
      newPassword: validatePassword(passwordForm.newPassword),
      confirmPassword: validateConfirmPassword(
        passwordForm.newPassword,
        passwordForm.confirmPassword,
      ),
    }
    setPasswordErrors(next)
    if (Object.values(next).some(Boolean)) return

    setPasswordLoading(true)
    try {
      const data = await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success(data.message || PROFILE_CONTENT.passwordChanged)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setPasswordLoading(false)
    }
  }

  if (fetching) return <RouteLoading />

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={PROFILE_CONTENT.title} description={PROFILE_CONTENT.description} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{PROFILE_CONTENT.branding}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <RestaurantLogo name={form.name} logoUrl={displayLogo} size="lg" />
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleLogoSelect}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={logoUploading}
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus className="size-4" />
              {logoUploading ? 'Uploading…' : 'Upload logo'}
            </Button>
            {displayLogo && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={logoUploading}
                onClick={handleRemoveLogo}
              >
                <Trash2 className="size-4" />
                {PROFILE_CONTENT.removeLogo}
              </Button>
            )}
          </div>
          <p className="w-full text-xs text-muted-foreground sm:w-auto">{PROFILE_CONTENT.logoHint}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{PROFILE_CONTENT.restaurantInfo}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Email</Label>
              <Input value={restaurant?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Restaurant name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Timings</Label>
              <Input
                value={form.timings}
                onChange={(e) => setForm((f) => ({ ...f, timings: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Slogan</Label>
              <Input
                value={form.slogan}
                onChange={(e) => setForm((f) => ({ ...f, slogan: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>FSSAI number (optional)</Label>
              <Input
                value={form.fssaiNumber}
                onChange={(e) => setForm((f) => ({ ...f, fssaiNumber: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" size="lg" className="h-11" disabled={saving}>
                {saving ? PROFILE_CONTENT.saving : PROFILE_CONTENT.save}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{PROFILE_CONTENT.passwordSecurity}</CardTitle>
          <button
            type="button"
            disabled={forgotLoading || !restaurant?.email}
            onClick={async () => {
              if (!restaurant?.email) return
              setForgotLoading(true)
              try {
                const data = await authService.forgotPassword({ email: restaurant.email })
                toast.success(data.message || AUTH_CONTENT.forgotSuccessMessage)
              } catch (err) {
                toast.error(getErrorMessage(err))
              } finally {
                setForgotLoading(false)
              }
            }}
            className="text-sm font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline disabled:opacity-50"
          >
            {forgotLoading ? AUTH_CONTENT.forgotLoading : PROFILE_CONTENT.forgotPassword}
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4">
            <div className="space-y-2">
              <Label>{PROFILE_CONTENT.currentPassword}</Label>
              <PasswordInput
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))
                }
              />
              {passwordErrors.currentPassword && (
                <p className="text-xs text-destructive">{passwordErrors.currentPassword}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{PROFILE_CONTENT.newPassword}</Label>
              <PasswordInput
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
              />
              {passwordErrors.newPassword && (
                <p className="text-xs text-destructive">{passwordErrors.newPassword}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{PROFILE_CONTENT.confirmPassword}</Label>
              <PasswordInput
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))
                }
              />
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-destructive">{passwordErrors.confirmPassword}</p>
              )}
            </div>
            <Button type="submit" size="lg" className="h-11 w-full sm:w-auto" disabled={passwordLoading}>
              {passwordLoading ? SETTINGS_CONTENT.updating : PROFILE_CONTENT.updatePassword}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Profile
