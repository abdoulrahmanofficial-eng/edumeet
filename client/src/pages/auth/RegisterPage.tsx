import { useState, useMemo, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { HiOutlineUser, HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeSlash, HiAcademicCap, HiOutlinePresentationChartBar, HiOutlineClipboardDocumentCheck } from 'react-icons/hi2'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { cn } from '@/utils/cn'

function getPasswordStrength(pw: string): { score: number; label: string; variant: 'danger' | 'warning' | 'success' } {
  let score = 0
  if (pw.length >= 8) score += 25
  if (/[a-z]/.test(pw)) score += 15
  if (/[A-Z]/.test(pw)) score += 20
  if (/\d/.test(pw)) score += 20
  if (/[^a-zA-Z0-9]/.test(pw)) score += 20

  if (score < 30) return { score, label: 'Weak', variant: 'danger' }
  if (score < 60) return { score, label: 'Medium', variant: 'warning' }
  return { score: Math.min(score, 100), label: 'Strong', variant: 'success' }
}

const roles = [
  {
    value: 'teacher' as const,
    icon: HiOutlinePresentationChartBar,
    titleKey: 'auth.teacher',
  },
  {
    value: 'student' as const,
    icon: HiAcademicCap,
    titleKey: 'auth.student',
  },
]

export default function RegisterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { register, isLoading } = useAuthStore()
  const isRTL = i18n.dir() === 'rtl'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'teacher' | 'student'>('student')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!fullName.trim()) newErrors.fullName = t('auth.requiredField')
    if (!email.trim()) newErrors.email = t('auth.requiredField')
    else if (!emailRegex.test(email)) newErrors.email = t('auth.invalidEmail')
    if (!password) newErrors.password = t('auth.requiredField')
    else if (password.length < 8) newErrors.password = t('auth.passwordRequirements')
    if (!confirmPassword) newErrors.confirmPassword = t('auth.requiredField')
    else if (password !== confirmPassword) newErrors.confirmPassword = t('auth.passwordsDoNotMatch')
    if (!agreeTerms) newErrors.terms = t('auth.agreeTerms')

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await register(email, password, fullName.trim(), role)
      toast.success(t('auth.checkInbox'))
      navigate('/login', {
        replace: true,
        state: { message: t('auth.resetSent') },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : t('errors.general')
      toast.error(message)
    }
  }

  const clearError = (field: string) => setErrors((p) => { const n = { ...p }; delete n[field]; return n })

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
          {t('auth.createAccount')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
          className="text-text-secondary text-sm mt-1"
        >
          {t('auth.joinPlatform')}
        </motion.p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label={t('auth.fullName')}
          value={fullName}
          onChange={(e) => { setFullName(e.target.value); clearError('fullName') }}
          error={errors.fullName}
          icon={<HiOutlineUser className="w-4 h-4" />}
          placeholder={isRTL ? 'الاسم الكامل' : 'John Doe'}
          autoComplete="name"
          required
        />

        <Input
          label={t('auth.email')}
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); clearError('email') }}
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
              onChange={(e) => { setPassword(e.target.value); clearError('password') }}
              error={errors.password}
              icon={<HiOutlineLockClosed className="w-4 h-4" />}
              placeholder="••••••••"
              autoComplete="new-password"
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

        {password && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <ProgressBar value={passwordStrength.score} variant={passwordStrength.variant} size="sm" className="flex-1" />
              <span className={cn(
                'text-xs font-medium ltr:ml-2 rtl:mr-2 min-w-[52px] text-right',
                passwordStrength.variant === 'danger' && 'text-danger-500',
                passwordStrength.variant === 'warning' && 'text-warning-500',
                passwordStrength.variant === 'success' && 'text-success-500',
              )}>
                {passwordStrength.label}
              </span>
            </div>
            <p className="text-xs text-text-tertiary">{t('auth.passwordRequirements')}</p>
          </div>
        )}

        <div className="relative">
          <div>
            <Input
              label={t('auth.confirmPassword')}
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword') }}
              error={errors.confirmPassword}
              icon={<HiOutlineLockClosed className="w-4 h-4" />}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute top-[38px] ltr:right-3 rtl:left-3 text-text-tertiary hover:text-text-secondary transition-colors"
            tabIndex={-1}
          >
            {showConfirm ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-secondary mb-1">
            {t('auth.selectRole')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {roles.map((r) => {
              const Icon = r.icon
              const selected = role === r.value
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => { setRole(r.value); clearError('role') }}
                  className={cn(
                    'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                    selected
                      ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 shadow-sm'
                      : 'border-border bg-white/50 dark:bg-gray-800/50 hover:border-primary-300 hover:bg-primary-50/30 dark:hover:bg-primary-900/10',
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                    selected ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600' : 'bg-gray-100 dark:bg-gray-700 text-text-tertiary',
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    'text-sm font-medium',
                    selected ? 'text-primary-700 dark:text-primary-300' : 'text-text-secondary',
                  )}>
                    {t(r.titleKey)}
                  </span>
                  {selected && (
                    <motion.div
                      layoutId="role-indicator"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center"
                    >
                      <HiOutlineClipboardDocumentCheck className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </button>
              )
            })}
          </div>
          {errors.role && <p className="text-xs text-danger-500 mt-1">{errors.role}</p>}
        </div>

        <div>
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => { setAgreeTerms(e.target.checked); clearError('terms') }}
              className="mt-0.5 w-4 h-4 rounded border-border text-primary-600 focus:ring-primary-500/30 focus:ring-2 cursor-pointer shrink-0"
            />
            <span className="text-sm text-text-secondary leading-relaxed">
              {t('auth.agreeTerms')}
            </span>
          </label>
          {errors.terms && <p className="text-xs text-danger-500 mt-1">{errors.terms}</p>}
        </div>

        <Button type="submit" fullWidth loading={isLoading}>
          {t('auth.signUp')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
          {t('auth.signIn')}
        </Link>
      </p>
    </motion.div>
  )
}
