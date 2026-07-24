import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  HiOutlineMegaphone,
  HiOutlinePlusCircle,
  HiOutlineAcademicCap,
  HiOutlineCalendarDays,
  HiOutlinePaperClip,
  HiOutlineTrash,
  HiOutlineEye,
} from 'react-icons/hi2'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { useClassStore } from '@/store/classStore'
import type { Announcement, Class } from '@/types'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatRelativeTime, formatDate } from '@/utils/format'

export default function TeacherAnnouncements() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { classes, fetchClasses } = useClassStore()
  const [isDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [announcements, setAnnouncements] = useState<(Announcement & { className: string })[]>([])

  const [formData, setFormData] = useState({
    classId: '',
    title: '',
    content: '',
    attachments: [] as string[],
  })

  useEffect(() => {
    Promise.all([fetchClasses()]).finally(() => setIsLoading(false))
  }, [fetchClasses])

  useEffect(() => {
    if (classes.length > 0 && announcements.length === 0) {
      const mockAnnouncements = classes.slice(0, 5).map((cls: Class, i) => ({
        id: `ann-${i}`,
        classId: cls.id,
        className: cls.title,
        teacherId: user?.uid || '',
        title: `Announcement: ${cls.title}`,
        content: `Important update for ${cls.title} class. Please review the materials and complete the assigned work before the next session.`,
        createdAt: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000).toISOString(),
        attachments: i % 3 === 0 ? ['syllabus.pdf'] : [],
      }))
      setAnnouncements(mockAnnouncements)
    }
  }, [classes, announcements.length, user])

  const classOptions = useMemo(
    () => classes.map((c: Class) => ({ value: c.id, label: c.title })),
    [classes],
  )

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.content || !formData.classId) {
      toast.error(t('Please fill in all required fields'))
      return
    }
    setCreating(true)
    try {
      const newAnnouncement: Announcement & { className: string } = {
        id: `ann-${Date.now()}`,
        classId: formData.classId,
        className: classes.find((c: Class) => c.id === formData.classId)?.title || '',
        teacherId: user?.uid || '',
        title: formData.title,
        content: formData.content,
        createdAt: new Date().toISOString(),
        attachments: formData.attachments,
      }
      setAnnouncements((prev) => [newAnnouncement, ...prev])
      toast.success(t('Announcement sent'))
      setShowCreateModal(false)
      setFormData({ classId: '', title: '', content: '', attachments: [] })
    } catch {
      toast.error(t('Failed to send announcement'))
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    toast.success(t('Announcement deleted'))
  }

  if (isLoading) {
    return (
    <>
        <PageHeader title={t('Announcements')} description={t('Send and manage announcements')} icon={<HiOutlineMegaphone className="w-5 h-5" />} />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <div className="flex items-start gap-3">
                <Skeleton variant="circular" className="w-10 h-10" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="w-1/3" />
                  <Skeleton className="w-full h-12" />
                </div>
              </div>
            </Card>
          ))}
        </div>
    </>
    )
  }

  return (
      <>
      <PageHeader
        title={t('Announcements')}
        description={t('Send and manage announcements')}
        icon={<HiOutlineMegaphone className="w-5 h-5" />}
        actions={
          <Button icon={<HiOutlinePlusCircle className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
            {t('Create Announcement')}
          </Button>
        }
      />

      {announcements.length === 0 ? (
        <EmptyState
          icon={<HiOutlineMegaphone className="w-8 h-8" />}
          title={t('No announcements yet')}
          description={t('Create your first announcement to communicate with your classes')}
          action={{ label: t('Create Announcement'), onClick: () => setShowCreateModal(true) }}
        />
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {announcements.map((ann, idx) => (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card>
                  <div className="flex items-start gap-3">
                    <Avatar name={user?.displayName} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-text-primary">{ann.title}</h3>
                        <Badge size="sm" variant="primary">
                          <HiOutlineAcademicCap className="w-3 h-3 mr-0.5" />
                          {ann.className}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap mb-2">
                        {ann.content}
                      </p>
                      {ann.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {ann.attachments.map((file, i) => (
                            <button
                              key={i}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs text-text-secondary hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            >
                              <HiOutlinePaperClip className="w-3 h-3" />
                              {file}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-text-tertiary">
                        <HiOutlineCalendarDays className="w-3 h-3" />
                        {formatRelativeTime(ann.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="ghost" icon={<HiOutlineEye className="w-4 h-4" />} />
                      <Button size="sm" variant="ghost" icon={<HiOutlineTrash className="w-4 h-4 text-danger-500" />}
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title={t('Create Announcement')} size="lg">
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <Select
            label={t('Class')}
            required
            options={classOptions}
            placeholder={t('Select a class')}
            value={formData.classId}
            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
          />
          <Input
            label={t('Title')}
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={t('Announcement title')}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary">{t('Content')}</label>
            <textarea
              rows={5}
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder={t('Write your announcement...')}
              className="w-full rounded-lg border border-border bg-white dark:bg-gray-800/80 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
              {t('Cancel')}
            </Button>
            <Button type="submit" loading={creating}>
              {t('Send Announcement')}
            </Button>
          </div>
        </form>
      </Modal>
      </>
  )
}
