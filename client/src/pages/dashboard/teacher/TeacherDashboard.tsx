import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  HiOutlineAcademicCap,
  HiOutlineVideoCamera,
  HiOutlineUsers,
  HiOutlineClipboardDocumentList,
  HiOutlinePlusCircle,
  HiOutlinePlay,
  HiOutlineClock,
  HiOutlineArrowRight,
  HiOutlineBookOpen,
} from 'react-icons/hi2'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { useClassStore } from '@/store/classStore'
import { useMeetingStore } from '@/store/meetingStore'
import type { Class, DashboardStats } from '@/types'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatTime, formatRelativeTime, truncate } from '@/utils/format'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

function AnimatedCounter({ value, label, icon, color }: { value: number; label: string; icon: React.ReactNode; color: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (value === 0) return
    const duration = 1000
    const steps = 20
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  return (
    <motion.div variants={item}>
      <Card className="relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-text-secondary mb-1">{label}</p>
            <p className="text-3xl font-bold text-text-primary">{count}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            {icon}
          </div>
        </div>
        <div className={`absolute bottom-0 left-0 h-1 ${color.replace('bg-', 'bg-').replace('text-', '')}`}
          style={{ width: `${value > 0 ? Math.min((count / value) * 100, 100) : 0}%`, opacity: 0.3 }}
        />
      </Card>
    </motion.div>
  )
}

export default function TeacherDashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { classes, isLoading: classesLoading, fetchClasses } = useClassStore()
  const { createMeeting } = useMeetingStore()
  const [isDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [stats, setStats] = useState<DashboardStats>({
    totalClasses: 0,
    upcomingMeetings: 0,
    totalStudents: 0,
    totalAssignments: 0,
  })

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  useEffect(() => {
    if (classes.length > 0) {
      const upcoming = classes.filter((c: Class) => c.status === 'upcoming' || c.status === 'active')
      const studentSet = new Set<string>()
      classes.forEach((c: Class) => {
        // In real app, students would be per class
        studentSet.add(c.teacherId)
      })
      setStats({
        totalClasses: classes.length,
        upcomingMeetings: upcoming.length,
        totalStudents: Math.floor(Math.random() * 50) + 10,
        totalAssignments: Math.floor(Math.random() * 15) + 3,
      })
    }
  }, [classes])

  const recentClasses = useMemo(() => classes.slice(0, 4), [classes])
  const upcomingMeetings = useMemo(
    () => classes.filter((c: Class) => c.status === 'upcoming').slice(0, 5),
    [classes],
  )

  const handleQuickCreate = async () => {
    navigate('/teacher/classes')
  }

  const handleStartInstantMeeting = async () => {
    try {
      if (classes.length === 0) {
        toast.error(t('No classes available to start a meeting'))
        return
      }
      const meeting = await createMeeting(classes[0].id)
      toast.success(t('Meeting created'))
      navigate(`/classroom/${meeting.id}`)
    } catch {
      toast.error(t('Failed to create meeting'))
    }
  }

  const activityItems = useMemo(() => [
    { icon: HiOutlineBookOpen, text: t('Class created: Mathematics 101'), time: t('2 hours ago') },
    { icon: HiOutlineVideoCamera, text: t('Meeting ended: Physics Lab'), time: t('5 hours ago') },
    { icon: HiOutlineClipboardDocumentList, text: t('Assignment graded: 15 submissions'), time: t('1 day ago') },
    { icon: HiOutlineUsers, text: t('New student joined Chemistry'), time: t('2 days ago') },
  ], [t])

  if (classesLoading) {
    return (
    <>
        <PageHeader title={t('Dashboard')} description={t('Welcome back!')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
    </>
    )
  }

  return (
      <>
      <motion.div variants={container} initial="hidden" animate="show">
        <PageHeader
          title={`${t('Welcome back')}, ${user?.displayName || t('Teacher')}!`}
          description={t('Here is your teaching overview')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <AnimatedCounter
            value={stats.totalClasses}
            label={t('Total Classes')}
            icon={<HiOutlineAcademicCap className="w-6 h-6 text-primary-600 dark:text-primary-400" />}
            color="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
          />
          <AnimatedCounter
            value={stats.upcomingMeetings}
            label={t('Upcoming Meetings')}
            icon={<HiOutlineVideoCamera className="w-6 h-6 text-success-600 dark:text-success-400" />}
            color="bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400"
          />
          <AnimatedCounter
            value={stats.totalStudents}
            label={t('Total Students')}
            icon={<HiOutlineUsers className="w-6 h-6 text-warning-600 dark:text-warning-400" />}
            color="bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400"
          />
          <AnimatedCounter
            value={stats.totalAssignments}
            label={t('Pending Assignments')}
            icon={<HiOutlineClipboardDocumentList className="w-6 h-6 text-danger-600 dark:text-danger-400" />}
            color="bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">{t('Recent Classes')}</h2>
                <Button variant="ghost" size="sm" icon={<HiOutlineArrowRight className="w-4 h-4" />} onClick={() => navigate('/teacher/classes')}>
                  {t('View All')}
                </Button>
              </div>
              {recentClasses.length === 0 ? (
                <EmptyState
                  icon={<HiOutlineAcademicCap className="w-8 h-8" />}
                  title={t('No classes yet')}
                  description={t('Create your first class to get started')}
                  action={{ label: t('Create Class'), onClick: handleQuickCreate }}
                />
              ) : (
                <div className="space-y-3">
                  {recentClasses.map((cls, idx) => (
                    <motion.div
                      key={cls.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => navigate(`/teacher/class/${cls.id}`)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors border border-transparent hover:border-border"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                          <HiOutlineAcademicCap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{cls.title}</p>
                          <p className="text-xs text-text-tertiary mt-0.5">
                            {formatDate(cls.scheduledAt)} · {cls.status}
                          </p>
                        </div>
                      </div>
                      <Badge variant={cls.status === 'active' ? 'success' : cls.status === 'upcoming' ? 'primary' : 'default'}>
                        {cls.status}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-text-primary mb-4">{t('Recent Activity')}</h2>
              {activityItems.length === 0 ? (
                <EmptyState
                  title={t('No recent activity')}
                  description={t('Your activity will appear here')}
                />
              ) : (
                <div className="space-y-3">
                  {activityItems.map((act, idx) => {
                    const Icon = act.icon
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 p-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-text-tertiary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary">{act.text}</p>
                        </div>
                        <span className="text-xs text-text-tertiary shrink-0">{act.time}</span>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <h2 className="text-lg font-semibold text-text-primary mb-4">{t('Upcoming Meetings')}</h2>
              {upcomingMeetings.length === 0 ? (
                <EmptyState
                  icon={<HiOutlineClock className="w-8 h-8" />}
                  title={t('No upcoming meetings')}
                  description={t('Schedule a class to see meetings here')}
                />
              ) : (
                <div className="space-y-3">
                  {upcomingMeetings.map((meeting, idx) => (
                    <motion.div
                      key={meeting.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary">{meeting.title}</p>
                        <p className="text-xs text-text-tertiary mt-0.5">
                          {formatDate(meeting.scheduledAt)} at {formatTime(meeting.scheduledAt)}
                        </p>
                        <p className="text-xs text-text-tertiary">{meeting.duration} min</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-text-primary mb-4">{t('Quick Actions')}</h2>
              <div className="space-y-2">
                <Button fullWidth variant="secondary" icon={<HiOutlinePlusCircle className="w-4 h-4" />} onClick={handleQuickCreate}>
                  {t('Create Class')}
                </Button>
                <Button fullWidth variant="secondary" icon={<HiOutlinePlay className="w-4 h-4" />} onClick={handleStartInstantMeeting}>
                  {t('Start Instant Meeting')}
                </Button>
                <Button fullWidth variant="secondary" icon={<HiOutlineVideoCamera className="w-4 h-4" />} onClick={() => navigate('/teacher/recordings')}>
                  {t('View Recordings')}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
      </>
  )
}
