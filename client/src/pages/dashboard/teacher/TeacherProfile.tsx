import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  HiOutlineUserCircle,
  HiOutlineCamera,
  HiOutlineEnvelope,
  HiOutlineIdentification,
  HiOutlineKey,
  HiOutlineBell,
} from 'react-icons/hi2'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Switch } from '@/components/ui/Switch'
import { Spinner } from '@/components/ui/Spinner'

export default function TeacherProfile() {
  const { t } = useTranslation()
  const { user, updateProfile } = useAuthStore()
  const [isDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [bio, setBio] = useState('Experienced educator passionate about interactive learning.')
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    assignmentReminders: true,
    newStudentJoined: true,
    meetingReminders: false,
  })

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    newPassword: '',
    confirm: '',
  })

  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName)
  }, [user])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('Image must be less than 5MB'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile({ displayName, photoURL: avatarPreview || user?.photoURL || '' })
      toast.success(t('Profile updated'))
    } catch {
      toast.error(t('Failed to update profile'))
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirm) {
      toast.error(t('Passwords do not match'))
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error(t('Password must be at least 6 characters'))
      return
    }
    toast.success(t('Password changed'))
    setPasswordForm({ current: '', newPassword: '', confirm: '' })
  }

  return (
    <>
      <PageHeader
        title={t('Profile')}
        description={t('Manage your profile and preferences')}
        icon={<HiOutlineUserCircle className="w-5 h-5" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSaveProfile}
          >
            <Card>
              <h2 className="text-base font-semibold text-text-primary mb-4">{t('Personal Information')}</h2>

              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <Avatar
                    src={avatarPreview || user?.photoURL}
                    name={user?.displayName}
                    size="xl"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-md hover:bg-primary-700 transition-colors"
                  >
                    <HiOutlineCamera className="w-3.5 h-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{user?.displayName}</p>
                  <p className="text-xs text-text-tertiary">{t('Click the camera icon to change photo')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label={t('Display Name')}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  icon={<HiOutlineIdentification className="w-4 h-4" />}
                />
                <Input
                  label={t('Email')}
                  value={user?.email || ''}
                  readOnly
                  icon={<HiOutlineEnvelope className="w-4 h-4" />}
                />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">{t('Bio')}</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white dark:bg-gray-800/80 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none"
                    placeholder={t('Tell us about yourself...')}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button type="submit" loading={saving}>{t('Save Changes')}</Button>
              </div>
            </Card>
          </motion.form>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleChangePassword}
          >
            <Card>
              <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                <HiOutlineKey className="w-4 h-4" />
                {t('Change Password')}
              </h2>
              <div className="space-y-4">
                <Input
                  label={t('Current Password')}
                  type="password"
                  required
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('New Password')}
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                  <Input
                    label={t('Confirm New Password')}
                    type="password"
                    required
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button type="submit" variant="secondary">{t('Update Password')}</Button>
              </div>
            </Card>
          </motion.form>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                <HiOutlineBell className="w-4 h-4" />
                {t('Notification Preferences')}
              </h2>
              <div className="space-y-4">
                <Switch
                  checked={notifications.emailAlerts}
                  onChange={(v) => setNotifications({ ...notifications, emailAlerts: v })}
                  label={t('Email alerts')}
                />
                <Switch
                  checked={notifications.assignmentReminders}
                  onChange={(v) => setNotifications({ ...notifications, assignmentReminders: v })}
                  label={t('Assignment reminders')}
                />
                <Switch
                  checked={notifications.newStudentJoined}
                  onChange={(v) => setNotifications({ ...notifications, newStudentJoined: v })}
                  label={t('New student joined')}
                />
                <Switch
                  checked={notifications.meetingReminders}
                  onChange={(v) => setNotifications({ ...notifications, meetingReminders: v })}
                  label={t('Meeting reminders')}
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
              <h2 className="text-base font-semibold text-text-primary mb-4">{t('Account Info')}</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-tertiary">{t('Role')}</span>
                  <span className="text-text-primary font-medium">{t('Teacher')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">{t('Email')}</span>
                  <span className="text-text-primary">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">{t('Member since')}</span>
                  <span className="text-text-primary">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  )
}
