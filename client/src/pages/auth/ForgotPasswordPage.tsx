import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { HiOutlineEnvelope, HiArrowLeft, HiOutlineCheckCircle } from 'react-icons/hi2'
import { cn } from '@/utils/cn'
import { authService } from '@/services/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) {
      setError(t('auth.requiredField'))
      return false
    }
    if (!emailRegex.test(email)) {
      setError(t('auth.invalidEmail'))
      return false
    }
    setError(undefined)
    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      await authService.forgotPassword(email)
      setIsSent(true)
    } catch {
      toast.error(t('errors.general'))
    } finally {
      setIsLoading(false)
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
          {t('auth.forgotPassword')}
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

      <AnimatePresence mode="wait">
        {isSent ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center py-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            >
              <HiOutlineCheckCircle className="w-16 h-16 text-success-500 mb-4" />
            </motion.div>
            <p className="text-center text-text-secondary text-sm leading-relaxed">
              If an account exists with that email, we've sent a password reset link.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label={t('auth.email')}
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(undefined) }}
                error={error}
                icon={<HiOutlineEnvelope className="w-4 h-4" />}
                placeholder="you@example.com"
                autoComplete="email"
                dir="ltr"
                required
              />

              <Button type="submit" fullWidth loading={isLoading}>
                {t('auth.sendResetLink')}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <HiArrowLeft className={cn('w-4 h-4', isRTL ? 'rotate-180' : '')} />
          {t('auth.backToLogin')}
        </Link>
      </div>
    </motion.div>
  )
}


