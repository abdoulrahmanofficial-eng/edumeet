import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeSlash, HiArrowRightOnRectangle } from 'react-icons/hi2'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const isRTL = i18n.dir() === 'rtl'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberedEmail'))
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  useEffect(() => {
    const saved = localStorage.getItem('rememberedEmail')
    if (saved) setEmail(saved)
  }, [])

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email.trim()) {
      newErrors.email = t('auth.requiredField')
    } else if (!emailRegex.test(email)) {
      newErrors.email = t('auth.invalidEmail')
    }

    if (!password) {
      newErrors.password = t('auth.requiredField')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      const user = await login(email, password)
      toast.success(t('auth.welcomeBack'))
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }
      const target = user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'
      navigate(target, { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : t('errors.invalidCredentials')
      toast.error(message)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="text-center mb-6">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold text-text-primary"
        >
          {t('auth.welcomeBack')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
          className="text-text-secondary text-sm mt-1"
        >
          {t('auth.welcomeMessage')}
        </motion.p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label={t('auth.email')}
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })) }}
          error={errors.email}
          icon={<HiOutlineEnvelope className="w-4 h-4" />}
          placeholder="you@example.com"
          autoComplete="email"
          dir="ltr"
          required
        />

        <div className="relative">
          <div>
            <Input
              label={t('auth.password')}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })) }}
              error={errors.password}
              icon={<HiOutlineLockClosed className="w-4 h-4" />}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-[38px] ltr:right-3 rtl:left-3 text-text-tertiary hover:text-text-secondary transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary-600 focus:ring-primary-500/30 focus:ring-2 cursor-pointer"
            />
            <span className="text-sm text-text-secondary">{t('auth.rememberMe')}</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <Button type="submit" fullWidth loading={isLoading} icon={<HiArrowRightOnRectangle className="w-4 h-4" />}>
          {t('auth.signIn')}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white/80 dark:bg-gray-800/80 px-2 text-text-tertiary">{t('auth.orContinueWith')}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => toast.error('Google login coming soon')}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700/80 transition-colors text-sm font-medium text-text-secondary hover:text-text-primary"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        {t('auth.google')}
      </button>

      <p className="mt-6 text-center text-sm text-text-secondary">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
          {t('auth.signUp')}
        </Link>
      </p>
    </motion.div>
  )
}
