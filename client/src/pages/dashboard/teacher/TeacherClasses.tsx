import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  HiOutlinePlusCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineAcademicCap,
  HiOutlineUsers,
  HiOutlineCalendarDays,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlinePlay,
  HiOutlineEye,
  HiOutlineSquares2X2,
  HiOutlineListBullet,
} from 'react-icons/hi2'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { useClassStore } from '@/store/classStore'
import { useMeetingStore } from '@/store/meetingStore'
import type { Class } from '@/types'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton, CardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatTime, truncate } from '@/utils/format'

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function TeacherClasses() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { classes, isLoading, fetchClasses, createClass, deleteClass } = useClassStore()
  const [isDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    duration: '60',
    maxStudents: '30',
    recurring: false,
  })

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  const filteredClasses = useMemo(() => {
    return classes.filter((cls: Class) => {
      const matchesSearch = cls.title.toLowerCase().includes(search.toLowerCase()) ||
        cls.description.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || cls.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [classes, search, statusFilter])

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.scheduledAt) {
      toast.error(t('Please fill in all required fields'))
      return
    }
    setCreating(true)
    try {
      await createClass({
        title: formData.title,
        description: formData.description,
        teacherId: user?.uid || '',
        teacherName: user?.displayName || '',
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        duration: parseInt(formData.duration),
        recurring: formData.recurring,
        status: 'upcoming',
        maxStudents: parseInt(formData.maxStudents),
      })
      toast.success(t('Class created successfully'))
      setShowCreateModal(false)
      setFormData({ title: '', description: '', scheduledAt: '', duration: '60', maxStudents: '30', recurring: false })
    } catch {
      toast.error(t('Failed to create class'))
    } finally {
      setCreating(false)
    }
  }

  const { createMeeting } = useMeetingStore()

  const handleDeleteClass = async (id: string, title: string) => {
    if (!window.confirm(t(`Delete "${title}"? This action cannot be undone.`))) return
    try {
      await deleteClass(id)
      toast.success(t('Class deleted'))
    } catch {
      toast.error(t('Failed to delete class'))
    }
  }

  const handleStartClassMeeting = async (classId: string) => {
    try {
      const meeting = await createMeeting(classId)
      toast.success(t('Meeting started'))
      navigate(`/classroom/${meeting.id}`)
    } catch {
      toast.error(t('Failed to start meeting'))
    }
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success' as const
      case 'upcoming': return 'primary' as const
      case 'completed': return 'default' as const
      case 'cancelled': return 'danger' as const
      default: return 'default' as const
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  }

  const cardItem = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <>
      <PageHeader
        title={t('My Classes')}
        description={t('Manage your classes and schedules')}
        icon={<HiOutlineAcademicCap className="w-5 h-5" />}
        actions={
          <Button icon={<HiOutlinePlusCircle className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
            {t('Create Class')}
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder={t('Search classes...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-white dark:bg-gray-800/80 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          />
        </div>
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-40"
        />
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'text-text-tertiary hover:text-text-primary'} transition-colors`}
          >
            <HiOutlineSquares2X2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'text-text-tertiary hover:text-text-primary'} transition-colors`}
          >
            <HiOutlineListBullet className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <div className="flex items-center gap-4">
                  <Skeleton variant="rectangular" className="w-12 h-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-1/3" />
                    <Skeleton className="w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : filteredClasses.length === 0 ? (
        <EmptyState
          icon={<HiOutlineAcademicCap className="w-8 h-8" />}
          title={search || statusFilter !== 'all' ? t('No matching classes') : t('No classes yet')}
          description={search || statusFilter !== 'all' ? t('Try adjusting your search or filter') : t('Create your first class to get started')}
          action={search || statusFilter !== 'all' ? undefined : { label: t('Create Class'), onClick: () => setShowCreateModal(true) }}
        />
      ) : viewMode === 'grid' ? (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredClasses.map((cls: Class) => (
              <motion.div key={cls.id} variants={cardItem} layout exit={{ opacity: 0, scale: 0.9 }}>
                <Card hover padding="none" className="h-full flex flex-col">
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                        <HiOutlineAcademicCap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <Badge variant={statusVariant(cls.status)}>{cls.status}</Badge>
                    </div>
                    <h3 className="text-base font-semibold text-text-primary mb-1">{cls.title}</h3>
                    <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                      {truncate(cls.description, 80)}
                    </p>
                    <div className="space-y-1.5 text-xs text-text-tertiary">
                      <div className="flex items-center gap-1.5">
                        <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                        {formatDate(cls.scheduledAt)} at {formatTime(cls.scheduledAt)} · {cls.duration}min
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HiOutlineUsers className="w-3.5 h-3.5" />
                        {t('{{count}} students', { count: cls.maxStudents })}
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-3 border-t border-border flex items-center gap-1">
                    <Button size="sm" variant="ghost" icon={<HiOutlineEye className="w-4 h-4" />} onClick={() => navigate(`/teacher/class/${cls.id}`)}>
                      {t('View')}
                    </Button>
                    <Button size="sm" variant="ghost" icon={<HiOutlinePencilSquare className="w-4 h-4" />}>
                      {t('Edit')}
                    </Button>
                    {cls.status !== 'completed' && (
                      <Button size="sm" variant="ghost" icon={<HiOutlinePlay className="w-4 h-4 text-success-500" />} onClick={() => handleStartClassMeeting(cls.id)}>
                        {t('Start')}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" icon={<HiOutlineTrash className="w-4 h-4 text-danger-500" />}
                      onClick={() => handleDeleteClass(cls.id, cls.title)}
                      className="ml-auto"
                    />
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filteredClasses.map((cls: Class) => (
            <motion.div key={cls.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <Card hover onClick={() => navigate(`/teacher/class/${cls.id}`)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                    <HiOutlineAcademicCap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold text-text-primary">{cls.title}</h3>
                      <Badge size="sm" variant={statusVariant(cls.status)}>{cls.status}</Badge>
                    </div>
                    <p className="text-xs text-text-tertiary">
                      {formatDate(cls.scheduledAt)} · {cls.duration}min · {cls.maxStudents} {t('students')}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title={t('Create Class')} size="lg">
        <form onSubmit={handleCreateClass} className="space-y-4">
          <Input
            label={t('Class Title')}
            required
            placeholder={t('e.g. Mathematics 101')}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary">{t('Description')}</label>
            <textarea
              rows={3}
              placeholder={t('Describe your class...')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-border bg-white dark:bg-gray-800/80 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('Date & Time')}
              type="datetime-local"
              required
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
            />
            <Input
              label={t('Duration (minutes)')}
              type="number"
              min={15}
              max={480}
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('Max Students')}
              type="number"
              min={1}
              max={500}
              value={formData.maxStudents}
              onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
            />
            <label className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                checked={formData.recurring}
                onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-text-primary">{t('Recurring class')}</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
              {t('Cancel')}
            </Button>
            <Button type="submit" loading={creating}>
              {t('Create Class')}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
