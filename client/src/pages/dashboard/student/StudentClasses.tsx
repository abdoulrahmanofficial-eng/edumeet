import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  HiAcademicCap, HiCalendarDays, HiClock, HiUser,
  HiMagnifyingGlass, HiPlusCircle, HiArrowRightOnRectangle,
} from 'react-icons/hi2'
import { useClassStore } from '@/store/classStore'
import { classesService } from '@/services/classes'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { formatDate, formatTime } from '@/utils/format'
import { cn } from '@/utils/cn'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const cardItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const } },
}

export default function StudentClasses() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { classes, isLoading, error, fetchClasses } = useClassStore()

  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

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

  if (isLoading && classes.length === 0) {
    return (
      <div>
        <PageHeader title={t('classes.title')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error && classes.length === 0) {
    return (
      <div>
        <PageHeader title={t('classes.title')} />
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-danger-500 mb-4">{error}</p>
          <Button onClick={fetchClasses}>{t('common.retry')}</Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <PageHeader
        title={t('classes.title')}
        description={t('classes.enrolledStudents')}
        actions={
          <Button
            onClick={() => setJoinModalOpen(true)}
            icon={<HiPlusCircle className="w-4 h-4" />}
          >
            {t('classes.joinClass')}
          </Button>
        }
      />

      {classes.length === 0 ? (
        <EmptyState
          icon={<HiAcademicCap className="w-8 h-8" />}
          title="You haven't joined any classes yet"
          description="Use an invite code to join."
          action={{
            label: t('classes.joinClass'),
            onClick: () => setJoinModalOpen(true),
          }}
        />
      ) : (
        <motion.div
          variants={container}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {classes.map((c) => (
            <motion.div key={c.id} variants={cardItem}>
              <Card
                hover
                onClick={() => navigate(`/student/class/${c.id}`)}
                className="h-full flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                    <HiAcademicCap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <Badge
                    variant={
                      c.status === 'active'
                        ? 'success'
                        : c.status === 'upcoming'
                          ? 'primary'
                          : c.status === 'completed'
                            ? 'default'
                            : 'danger'
                    }
                  >
                    {c.status === 'active'
                      ? t('meetings.live')
                      : c.status === 'upcoming'
                        ? t('meetings.scheduled')
                        : c.status === 'completed'
                          ? t('meetings.ended')
                          : t('meetings.cancelled')}
                  </Badge>
                </div>

                <h3 className="text-base font-semibold text-text-primary mb-1 line-clamp-1">
                  {c.title}
                </h3>

                <p className="text-sm text-text-secondary mb-3 flex items-center gap-1.5">
                  <HiUser className="w-3.5 h-3.5" />
                  {c.teacherName}
                </p>

                <div className="mt-auto space-y-2">
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <HiCalendarDays className="w-3.5 h-3.5 shrink-0" />
                    <span>{formatDate(c.scheduledAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <HiClock className="w-3.5 h-3.5 shrink-0" />
                    <span>{formatTime(c.scheduledAt)} ({c.duration} min)</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal
        isOpen={joinModalOpen}
        onClose={() => { setJoinModalOpen(false); setInviteCode('') }}
        title={t('classes.joinWithCode')}
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
