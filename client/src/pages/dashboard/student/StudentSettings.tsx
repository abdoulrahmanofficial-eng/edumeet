import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  HiSun, HiMoon, HiComputerDesktop, HiLanguage,
  HiBell, HiBellAlert, HiEnvelope, HiChatBubbleLeftRight,
} from 'react-icons/hi2'
import { useTheme } from '@/contexts/ThemeContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { PageHeader } from '@/components/common/PageHeader'
import { cn } from '@/utils/cn'

type ThemeMode = 'light' | 'dark' | 'system'
type Lang = 'en' | 'ar'

const themeOptions: { value: ThemeMode; icon: typeof HiSun; labelKey: string }[] = [
  { value: 'light', icon: HiSun, labelKey: 'settings.light' },
  { value: 'dark', icon: HiMoon, labelKey: 'settings.dark' },
  { value: 'system', icon: HiComputerDesktop, labelKey: 'settings.system' },
]

export default function StudentSettings() {
  const { t, i18n } = useTranslation()
  const { isDark, toggleTheme } = useTheme()

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') return 'dark'
    if (saved === 'light') return 'light'
    return 'system'
  })
  const [currentLang, setCurrentLang] = useState<Lang>(i18n.language?.startsWith('ar') ? 'ar' : 'en')
  const [emailNotif, setEmailNotif] = useState(true)
  const [pushNotif, setPushNotif] = useState(true)
  const [meetingReminders, setMeetingReminders] = useState(true)
  const [assignmentReminders, setAssignmentReminders] = useState(true)
  const [classUpdates, setClassUpdates] = useState(true)

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode)
    if (mode === 'dark') {
      if (!isDark) toggleTheme()
    } else if (mode === 'light') {
      if (isDark) toggleTheme()
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (isDark !== prefersDark) toggleTheme()
    }
    localStorage.setItem('theme', mode)
    toast.success(t('settings.settingsSaved'))
  }

  const handleLangChange = (lang: Lang) => {
    setCurrentLang(lang)
    i18n.changeLanguage(lang)
    localStorage.setItem('i18nextLng', lang)
    toast.success(t('settings.settingsSaved'))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <PageHeader title={t('settings.title')} />

      <div className="space-y-6 max-w-2xl">
        <Card>
          <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
            <HiSun className="w-4 h-4 text-warning-500" />
            {t('settings.appearance')}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((opt) => {
              const Icon = opt.icon
              const active = themeMode === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => handleThemeChange(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                    active
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-border hover:border-primary-300 bg-white dark:bg-gray-800/50',
                  )}
                >
                  <Icon className={cn('w-6 h-6', active ? 'text-primary-600' : 'text-text-tertiary')} />
                  <span
                    className={cn(
                      'text-sm font-medium',
                      active ? 'text-primary-700 dark:text-primary-300' : 'text-text-secondary',
                    )}
                  >
                    {t(opt.labelKey)}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
            <HiLanguage className="w-4 h-4 text-primary-500" />
            {t('settings.language')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: 'en' as Lang, label: t('settings.english') },
              { value: 'ar' as Lang, label: t('settings.arabic') },
            ]).map((opt) => {
              const active = currentLang === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => handleLangChange(opt.value)}
                  className={cn(
                    'flex items-center justify-center p-3 rounded-xl border-2 transition-all duration-200',
                    active
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-border hover:border-primary-300 bg-white dark:bg-gray-800/50',
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-medium',
                      active ? 'text-primary-700 dark:text-primary-300' : 'text-text-secondary',
                    )}
                  >
                    {opt.label}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
            <HiBell className="w-4 h-4 text-warning-500" />
            {t('settings.notifications')}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HiEnvelope className="w-4 h-4 text-text-tertiary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{t('settings.emailNotifications')}</p>
                </div>
              </div>
              <Switch checked={emailNotif} onChange={setEmailNotif} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HiBellAlert className="w-4 h-4 text-text-tertiary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{t('settings.pushNotifications')}</p>
                </div>
              </div>
              <Switch checked={pushNotif} onChange={setPushNotif} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HiBell className="w-4 h-4 text-text-tertiary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{t('settings.meetingReminders')}</p>
                </div>
              </div>
              <Switch checked={meetingReminders} onChange={setMeetingReminders} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HiChatBubbleLeftRight className="w-4 h-4 text-text-tertiary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{t('settings.assignmentReminders')}</p>
                </div>
              </div>
              <Switch checked={assignmentReminders} onChange={setAssignmentReminders} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HiBell className="w-4 h-4 text-text-tertiary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{t('settings.classUpdates')}</p>
                </div>
              </div>
              <Switch checked={classUpdates} onChange={setClassUpdates} />
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  )
}
