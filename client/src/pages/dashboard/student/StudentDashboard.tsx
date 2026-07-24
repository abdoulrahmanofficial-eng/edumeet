import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  HiAcademicCap, HiClipboardDocumentList, HiVideoCamera,
  HiCalendarDays, HiArrowRightOnRectangle, HiPlay,
  HiMegaphone, HiClock, HiPlusCircle, HiMagnifyingGlass,
} from 'react-icons/hi2'
import { useAuthStore } from '@/store/authStore'
import { useClassStore } from '@/store/classStore'
import { classesService } from '@/services/classes'
import { attendanceService } from '@/services/attendance'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { formatDate, formatTime, formatRelativeTime } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { Announcement, Attendance } from '@/types'

interface DashboardStats {
  upcomingClasses: number
  pendingAssignments: number
  attendanceRate: number
  recordedClasses: number
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const } },
}

export default function StudentDashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { classes, isLoading: classesLoading, fetchClasses } = useClassStore()

  const [stats, setStats] = useState<DashboardStats>({
    upcomingClasses: 0,
    pendingAssignments: 0,
    attendanceRate: 0,
    recordedClasses: 0,
  })
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await fetchClasses()
      const uc = classes.filter((c) => c.status === 'upcoming' || c.status === 'active').length
      setStats((prev) => ({ ...prev, upcomingClasses: uc }))

      try {
        const attendanceRecords = await attendanceService.getMyAttendance()
        const total = attendanceRecords.length
        const present = attendanceRecords.filter((a) => a.status === 'present').length
        const rate = total > 0 ? Math.round((present / total) * 100) : 0
        setStats((prev) => ({ ...prev, attendanceRate: rate }))
      } catch {
        // non-critical
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinClass = async (e: FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) {
      toast.error(t('classes.invalidCode'))
      return
    }
    setJoining(true)
    try {
      await classesService.joinClass(inviteCode.trim())
      toast.success(t('classes.joinedSuccess'))
      setJoinModalOpen(false)
      setInviteCode('')
      await fetchClasses()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('classes.invalidCode'))
    } finally {
      setJoining(false)
    }
  }

  const upcomingClasses = classes
    .filter((c) => c.status === 'upcoming' || c.status === 'active')
    .slice(0, 5)

  const statCards = [
    {
      label: t('dashboard.upcomingMeetings'),
      value: stats.upcomingClasses,
      icon: HiCalendarDays,
      color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20',
    },
    {
      label: t('dashboard.pendingAssignments'),
      value: stats.pendingAssignments,
      icon: HiClipboardDocumentList,
      color: 'text-warning-600 bg-warning-50 dark:bg-warning-900/20',
    },
    {
      label: t('dashboard.attendanceRate'),
      value: `${stats.attendanceRate}%`,
      icon: HiAcademicCap,
      color: 'text-success-600 bg-success-50 dark:bg-success-900/20',
    },
    {
      label: t('dashboard.recentRecordings'),
      value: stats.recordedClasses,
      icon: HiVideoCamera,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    },
  ]

  if (isLoading && classes.length === 0) {
    return (
      <div>
        <PageHeader title={t('dashboard.title')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader title={t('dashboard.title')} />
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-danger-500 mb-4">{error}</p>
          <Button onClick={loadDashboard}>{t('common.retry')}</Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <PageHeader
        title={t('dashboard.welcome', { name: user?.displayName || '' })}
        description={t('dashboard.subtitle')}
        actions={
          <Button
            onClick={() => setJoinModalOpen(true)}
            icon={<HiPlusCircle className="w-4 h-4" />}
          >
            {t('classes.joinClass')}
          </Button>
        }
      />

      <motion.div
        variants={item}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} hover className="flex items-center gap-4">
              <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', s.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-text-primary">{s.value}</p>
                <p className="text-xs text-text-secondary truncate">{s.label}</p>
              </div>
            </Card>
          )
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item}>
          <Card padding="none">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <HiClock className="w-4 h-4 text-primary-500" />
                {t('dashboard.todaySchedule')}
              </h2>
              {upcomingClasses.length > 0 && (
                <button
                  onClick={() => navigate('/student/classes')}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  {t('common.viewAll')}
                </button>
              )}
            </div>
            {upcomingClasses.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<HiCalendarDays className="w-8 h-8" />}
                  title={t('dashboard.noUpcomingMeetings')}
                  action={{ label: t('classes.joinClass'), onClick: () => setJoinModalOpen(true) }}
                />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {upcomingClasses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/student/class/${c.id}`)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                      <HiAcademicCap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{c.title}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {formatDate(c.scheduledAt)} at {formatTime(c.scheduledAt)}
                      </p>
                    </div>
                    <Badge variant={c.status === 'active' ? 'success' : 'primary'}>
                      {c.status === 'active' ? t('meetings.live') : t('meetings.scheduled')}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card padding="none">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <HiMegaphone className="w-4 h-4 text-warning-500" />
                {t('notifications')}
              </h2>
            </div>
            {announcements.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<HiMegaphone className="w-8 h-8" />}
                  title="No recent announcements"
                />
              </div>
            ) : (
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {announcements.map((a) => (
                  <div key={a.id} className="px-5 py-3.5">
                    <p className="text-sm font-medium text-text-primary">{a.title}</p>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">{a.content}</p>
                    <p className="text-xs text-text-tertiary mt-1">
                      {formatRelativeTime(a.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item} className="mt-6">
        <Card padding="none">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">
              {t('dashboard.quickActions')}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5">
            <button
              onClick={() => setJoinModalOpen(true)}
              className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                <HiArrowRightOnRectangle className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{t('classes.joinClass')}</p>
                <p className="text-xs text-text-secondary">{t('classes.joinWithCode')}</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/student/classes')}
              className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-success-50 dark:bg-success-900/20 flex items-center justify-center shrink-0">
                <HiCalendarDays className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{t('dashboard.viewAllClasses')}</p>
                <p className="text-xs text-text-secondary">{t('classes.schedule')}</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/student/recordings')}
              className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                <HiPlay className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{t('recordings.title')}</p>
                <p className="text-xs text-text-secondary">{t('dashboard.recentRecordings')}</p>
              </div>
            </button>
          </div>
        </Card>
      </motion.div>

      <Modal
        isOpen={joinModalOpen}
        onClose={() => { setJoinModalOpen(false); setInviteCode('') }}
        title={t('classes.joinClass')}
        size="sm"
      >
        <form onSubmit={handleJoinClass} className="space-y-4">
          <Input
            label={t('classes.classCode')}
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder={t('classes.enterClassCode')}
            icon={<HiMagnifyingGlass className="w-4 h-4" />}
            required
          />
          <Button type="submit" fullWidth loading={joining}>
            {t('classes.joinClass')}
          </Button>
        </form>
      </Modal>
    </motion.div>
  )
}
