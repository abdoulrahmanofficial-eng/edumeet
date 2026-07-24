import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  HiOutlineVideoCamera,
  HiOutlinePlay,
  HiOutlineDocumentArrowDown,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineArrowRight,
} from 'react-icons/hi2'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { useClassStore } from '@/store/classStore'
import { useMeetingStore } from '@/store/meetingStore'
import type { Class, Meeting } from '@/types'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton, CardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatTime, formatDateTime } from '@/utils/format'

export default function TeacherMeetings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { classes, isLoading: classesLoading, fetchClasses } = useClassStore()
  const { createMeeting } = useMeetingStore()
  const [isDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchClasses()]).finally(() => setIsLoading(false))
  }, [fetchClasses])

  const { upcomingMeetings, pastMeetings } = useMemo(() => {
    const upcoming: { classTitle: string; classId: string; scheduledAt: string; duration: number }[] = []
    const past: (Class & { participantsCount: number; recordingUrl?: string })[] = []

    classes.forEach((cls: Class) => {
      if (cls.status === 'upcoming') {
        upcoming.push({
          classTitle: cls.title,
          classId: cls.id,
          scheduledAt: cls.scheduledAt,
          duration: cls.duration,
        })
      } else if (cls.status === 'completed') {
        past.push({
          ...cls,
          participantsCount: Math.floor(Math.random() * 20) + 5,
          recordingUrl: Math.random() > 0.5 ? 'https://example.com/recording' : undefined,
        })
      }
    })

    return { upcomingMeetings: upcoming, pastMeetings: past }
  }, [classes])

  const handleStartMeeting = async (classId: string) => {
    try {
      const meeting = await createMeeting(classId)
      toast.success(t('Meeting started'))
      navigate(`/classroom/${meeting.id}`)
    } catch {
      toast.error(t('Failed to start meeting'))
    }
  }

  if (isLoading || classesLoading) {
    return (
    <>
        <PageHeader title={t('Meetings')} description={t('View and manage your meetings')} icon={<HiOutlineVideoCamera className="w-5 h-5" />} />
        <div className="space-y-6">
          <div><Skeleton className="h-5 w-32 mb-4" />{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>
          <div><Skeleton className="h-5 w-32 mb-4" />{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>
        </div>
    </>
    )
  }

  return (
      <>
      <PageHeader
        title={t('Meetings')}
        description={t('View and manage your meetings')}
        icon={<HiOutlineVideoCamera className="w-5 h-5" />}
      />

      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-500" />
            {t('Upcoming Meetings')}
          </h2>
          {upcomingMeetings.length === 0 ? (
            <EmptyState
              icon={<HiOutlineCalendarDays className="w-8 h-8" />}
              title={t('No upcoming meetings')}
              description={t('Schedule a class to create meetings')}
            />
          ) : (
            <div className="space-y-3">
              {upcomingMeetings.map((m, idx) => (
                <motion.div
                  key={m.classId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                >
                  <Card>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                          <HiOutlineVideoCamera className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-text-primary">{m.classTitle}</h3>
                          <p className="text-xs text-text-tertiary mt-0.5">
                            {formatDate(m.scheduledAt)} at {formatTime(m.scheduledAt)} · {m.duration} min
                          </p>
                        </div>
                      </div>
                      <Button size="sm" icon={<HiOutlinePlay className="w-4 h-4" />} onClick={() => handleStartMeeting(m.classId)}>
                        {t('Start')}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            {t('Past Meetings')}
          </h2>
          {pastMeetings.length === 0 ? (
            <EmptyState
              icon={<HiOutlineVideoCamera className="w-8 h-8" />}
              title={t('No past meetings')}
              description={t('Your meeting history will appear here')}
            />
          ) : (
            <div className="space-y-3">
              {pastMeetings.map((m, idx) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                          <HiOutlineVideoCamera className="w-5 h-5 text-text-tertiary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-text-primary">{m.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-text-tertiary mt-0.5">
                            <span className="flex items-center gap-1">
                              <HiOutlineCalendarDays className="w-3 h-3" />
                              {formatDateTime(m.scheduledAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <HiOutlineClock className="w-3 h-3" />
                              {m.duration} min
                            </span>
                            <span className="flex items-center gap-1">
                              <HiOutlineUserGroup className="w-3 h-3" />
                              {m.participantsCount} {t('participants')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.recordingUrl && (
                          <Button size="sm" variant="secondary" icon={<HiOutlineDocumentArrowDown className="w-4 h-4" />}>
                            {t('Recording')}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" icon={<HiOutlineArrowRight className="w-4 h-4" />}>
                          {t('Details')}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      </>
  )
}
