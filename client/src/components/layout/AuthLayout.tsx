import { Outlet, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import { HiOutlineVideoCamera } from 'react-icons/hi2'

export function AuthLayout() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'

  const toggleLanguage = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar'
    i18n.changeLanguage(next)
    document.documentElement.dir = i18n.dir()
    document.documentElement.lang = next
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-primary-50/30 to-gray-50 dark:from-gray-950 dark:via-primary-950/20 dark:to-gray-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary-500/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary-500/10 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary-500/5 blur-3xl"
        />
      </div>

      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleLanguage}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors',
            'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-border',
            'text-text-secondary hover:text-text-primary',
          )}
        >
          {i18n.language === 'ar' ? 'English' : 'العربية'}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <HiOutlineVideoCamera className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-text-primary">EduMeet</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={cn(
            'bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50',
            'p-6 sm:p-8',
          )}
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  )
}
