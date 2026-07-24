import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  HiOutlineCog6Tooth,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineLanguage,
  HiOutlineBell,
  HiOutlineVideoCamera,
  HiOutlineUserCircle,
} from 'react-icons/hi2'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'

export default function TeacherSettings() {
  const { t, i18n } = useTranslation()
  const { user } = useAuthStore()
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState({
    language: i18n.language || 'en',
    emailNotifications: true,
    defaultDuration: '60',
    cameraOnByDefault: false,
    micOnByDefault: true,
    autoRecordMeetings: false,
  })

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    document.documentElement.classList.toggle('dark', newDark)
    localStorage.setItem('theme', newDark ? 'dark' : 'light')
  }

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value
    setSettings({ ...settings, language: lang })
    i18n.changeLanguage(lang)
    localStorage.setItem('language', lang)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 600))
      toast.success(t('Settings saved'))
    } catch {
      toast.error(t('Failed to save settings'))
    } finally {
      setSaving(false)
    }
  }

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'ar', label: 'العربية' },
  ]

  const durationOptions = [
    { value: '15', label: '15 min' },
    { value: '30', label: '30 min' },
    { value: '45', label: '45 min' },
    { value: '60', label: '60 min' },
    { value: '90', label: '90 min' },
    { value: '120', label: '120 min' },
  ]

  return (
    <>
      <PageHeader
        title={t('Settings')}
        description={t('Customize your experience')}
        icon={<HiOutlineCog6Tooth className="w-5 h-5" />}
      />

      <div className="max-w-2xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <h2 className="text-base font-semibold text-text-primary mb-4">{t('Appearance')}</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {isDark ? (
                      <HiOutlineMoon className="w-4 h-4 text-text-primary" />
                    ) : (
                      <HiOutlineSun className="w-4 h-4 text-text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{t('Theme')}</p>
                    <p className="text-xs text-text-tertiary">{isDark ? t('Dark mode') : t('Light mode')}</p>
                  </div>
                </div>
                <Switch checked={isDark} onChange={toggleTheme} />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <h2 className="text-base font-semibold text-text-primary mb-4">{t('Language')}</h2>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                <HiOutlineLanguage className="w-4 h-4 text-text-primary" />
              </div>
              <Select
                options={languageOptions}
                value={settings.language}
                onChange={handleLanguageChange}
                className="flex-1"
              />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <HiOutlineBell className="w-4 h-4" />
              {t('Notifications')}
            </h2>
            <div className="space-y-4">
              <Switch
                checked={settings.emailNotifications}
                onChange={(v) => setSettings({ ...settings, emailNotifications: v })}
                label={t('Email notifications')}
              />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <HiOutlineVideoCamera className="w-4 h-4" />
              {t('Meeting Defaults')}
            </h2>
            <div className="space-y-4">
              <Select
                label={t('Default Duration')}
                options={durationOptions}
                value={settings.defaultDuration}
                onChange={(e) => setSettings({ ...settings, defaultDuration: e.target.value })}
              />
              <Switch
                checked={settings.cameraOnByDefault}
                onChange={(v) => setSettings({ ...settings, cameraOnByDefault: v })}
                label={t('Camera on by default')}
              />
              <Switch
                checked={settings.micOnByDefault}
                onChange={(v) => setSettings({ ...settings, micOnByDefault: v })}
                label={t('Microphone on by default')}
              />
              <Switch
                checked={settings.autoRecordMeetings}
                onChange={(v) => setSettings({ ...settings, autoRecordMeetings: v })}
                label={t('Auto-record meetings')}
              />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <HiOutlineUserCircle className="w-4 h-4" />
              {t('Account')}
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-text-tertiary">{t('Email')}</span>
                <span className="text-text-primary">{user?.email || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-text-tertiary">{t('Role')}</span>
                <span className="text-text-primary font-medium">
                  {user?.role === 'teacher' ? t('Teacher') : t('Student')}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-text-tertiary">{t('Member since')}</span>
                <span className="text-text-primary">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} loading={saving}>
            {t('Save All Settings')}
          </Button>
        </div>
      </div>
    </>
  )
}
