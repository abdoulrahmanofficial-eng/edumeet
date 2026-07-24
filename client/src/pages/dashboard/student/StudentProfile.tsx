import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  HiUser, HiEnvelope, HiIdentification, HiBell,
  HiCamera, HiCheckCircle,
} from 'react-icons/hi2'
import { useAuthStore } from '@/store/authStore'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Switch } from '@/components/ui/Switch'
import { Spinner } from '@/components/ui/Spinner'
import { PageHeader } from '@/components/common/PageHeader'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'

export default function StudentProfile() {
  const { t } = useTranslation()
  const { user, isLoading, updateProfile } = useAuthStore()

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [email] = useState(user?.email || '')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [emailNotif, setEmailNotif] = useState(true)
  const [pushNotif, setPushNotif] = useState(true)

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      toast.error('Display name is required')
      return
    }
    setSaving(true)
    try {
      await updateProfile({ displayName: displayName.trim() })
      toast.success(t('profile.savedSuccess'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <PageHeader title={t('profile.title')} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="text-center">
            <div className="relative inline-block mb-4">
              <Avatar
                src={user.photoURL}
                name={user.displayName}
                size="xl"
                className="mx-auto"
              />
              <button
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors shadow-md"
                onClick={() => toast.success(t('profile.uploadAvatar'))}
              >
                <HiCamera className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-lg font-semibold text-text-primary">{user.displayName}</h2>
            <p className="text-sm text-text-secondary mt-0.5">{user.email}</p>
            <div className="mt-3">
              <Badge variant="primary">
                <HiIdentification className="w-3.5 h-3.5" />
                <span className="ml-1">Student ID: {user.uid.slice(0, 8).toUpperCase()}</span>
              </Badge>
            </div>
            <div className="mt-4 pt-4 border-t border-border text-xs text-text-tertiary">
              <p>{t('profile.memberSince', { date: formatDate(user.createdAt) })}</p>
              <p className="mt-1">{t('profile.role')}: {t('profile.student')}</p>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <HiUser className="w-4 h-4 text-primary-500" />
              {t('profile.personalInfo')}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('profile.fullName')}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  icon={<HiUser className="w-4 h-4" />}
                  required
                />
                <Input
                  label={t('profile.email')}
                  value={email}
                  disabled
                  icon={<HiEnvelope className="w-4 h-4" />}
                />
              </div>
              <Input
                label={t('profile.phone')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  {t('profile.bio')}
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-white dark:bg-gray-800/80 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" loading={saving} icon={<HiCheckCircle className="w-4 h-4" />}>
                  {t('profile.saveChanges')}
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <HiBell className="w-4 h-4 text-warning-500" />
              {t('settings.notifications')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">{t('settings.emailNotifications')}</p>
                  <p className="text-xs text-text-secondary">Receive updates via email</p>
                </div>
                <Switch checked={emailNotif} onChange={setEmailNotif} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">{t('settings.pushNotifications')}</p>
                  <p className="text-xs text-text-secondary">Receive push notifications</p>
                </div>
                <Switch checked={pushNotif} onChange={setPushNotif} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
