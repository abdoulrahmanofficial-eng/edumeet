import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  HiOutlineUsers,
  HiOutlineClipboardDocumentList,
  HiOutlineMegaphone,
  HiOutlineVideoCamera,
  HiOutlinePlay,
  HiOutlinePlusCircle,
  HiOutlineLink,
  HiOutlineDocumentArrowDown,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineAcademicCap,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowLeft,
} from 'react-icons/hi2'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { useClassStore } from '@/store/classStore'
import { useMeetingStore } from '@/store/meetingStore'
import type { Class, User, Assignment, Announcement, Submission } from '@/types'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton, CardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatTime, formatDateTime, formatRelativeTime } from '@/utils/format'

const tabs = [
  { id: 'students', label: 'Students', icon: <HiOutlineUsers className="w-4 h-4" /> },
  { id: 'assignments', label: 'Assignments', icon: <HiOutlineClipboardDocumentList className="w-4 h-4" /> },
  { id: 'announcements', label: 'Announcements', icon: <HiOutlineMegaphone className="w-4 h-4" /> },
  { id: 'recordings', label: 'Recordings', icon: <HiOutlineVideoCamera className="w-4 h-4" /> },
]

export default function TeacherClassDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { currentClass, students, isLoading, fetchClass, fetchStudents, updateClass } = useClassStore()
  const { createMeeting } = useMeetingStore()
  const [isDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [activeTab, setActiveTab] = useState('students')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showCreateAssignment, setShowCreateAssignment] = useState(false)
  const [showAnnouncement, setShowAnnouncement] = useState(false)

  const [assignmentForm, setAssignmentForm] = useState({ title: '', description: '', dueDate: '' })
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' })

  // Mock data
  const [assignments] = useState<Assignment[]>([])
  const [announcements] = useState<Announcement[]>([])
  const [recordings] = useState<{ id: string; title: string; date: string; duration: number }[]>([])

  useEffect(() => {
    if (id) {
      fetchClass(id)
      fetchStudents(id)
    }
  }, [id, fetchClass, fetchStudents])

  const handleStartMeeting = async () => {
    if (!id) return
    try {
      const meeting = await createMeeting(id)
      toast.success(t('Meeting started'))
      navigate(`/classroom/${meeting.id}`)
    } catch {
      toast.error(t('Failed to start meeting'))
    }
  }

  const handleCopyInvite = () => {
    if (!currentClass?.inviteCode) return
    navigator.clipboard.writeText(currentClass.inviteCode)
    toast.success(t('Invite code copied'))
  }

  const handleCopyLink = () => {
    if (!currentClass?.inviteCode) return
    const link = `${window.location.origin}/join/${currentClass.inviteCode}`
    navigator.clipboard.writeText(link)
    toast.success(t('Invite link copied'))
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(t('Assignment created'))
    setShowCreateAssignment(false)
    setAssignmentForm({ title: '', description: '', dueDate: '' })
  }

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(t('Announcement sent'))
    setShowAnnouncement(false)
    setAnnouncementForm({ title: '', content: '' })
  }

  if (isLoading || !currentClass) {
    return (
    <>
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-72 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><CardSkeleton /></div>
          <div><CardSkeleton /></div>
        </div>
    </>
    )
  }

  const studentColumns = [
    {
      key: 'name',
      label: t('Student'),
      render: (student: User) => (
        <div className="flex items-center gap-3">
          <Avatar src={student.photoURL} name={student.displayName} size="sm" />
          <div>
            <p className="text-sm font-medium text-text-primary">{student.displayName}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', label: t('Email'), render: (s: User) => <span className="text-sm text-text-secondary">{s.email}</span> },
    { key: 'createdAt', label: t('Joined'), render: (s: User) => <span className="text-sm text-text-secondary">{formatDate(s.createdAt)}</span> },
    {
      key: 'attendance',
      label: t('Attendance'),
      render: () => {
        const rate = Math.floor(Math.random() * 40) + 60
        return (
          <Badge variant={rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'danger'}>
            {rate}%
          </Badge>
        )
      },
    },
    {
      key: 'actions',
      label: '',
      render: () => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" icon={<HiOutlineEye className="w-4 h-4" />} />
        </div>
      ),
    },
  ]

  return (
      <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" icon={<HiOutlineArrowLeft className="w-4 h-4" />} onClick={() => navigate('/teacher/classes')}>
            {t('Back')}
          </Button>
        </div>

        <Card className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-text-primary">{currentClass.title}</h1>
                <Badge variant={currentClass.status === 'active' ? 'success' : currentClass.status === 'upcoming' ? 'primary' : 'default'}>
                  {currentClass.status}
                </Badge>
              </div>
              <p className="text-sm text-text-secondary mb-2">{currentClass.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-text-tertiary">
                <span className="flex items-center gap-1">
                  <HiOutlineAcademicCap className="w-3.5 h-3.5" />
                  {currentClass.teacherName}
                </span>
                <span className="flex items-center gap-1">
                  <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                  {formatDate(currentClass.scheduledAt)}
                </span>
                <span className="flex items-center gap-1">
                  <HiOutlineClock className="w-3.5 h-3.5" />
                  {currentClass.duration} min
                </span>
                <span className="flex items-center gap-1">
                  <HiOutlineUsers className="w-3.5 h-3.5" />
                  {students.length}/{currentClass.maxStudents} {t('students')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" icon={<HiOutlinePlay className="w-4 h-4" />} onClick={handleStartMeeting}>
                {t('Start Meeting')}
              </Button>
              <Button size="sm" variant="secondary" icon={<HiOutlineClipboardDocumentList className="w-4 h-4" />}
                onClick={() => setShowCreateAssignment(true)}
              >
                {t('Assignment')}
              </Button>
              <Button size="sm" variant="secondary" icon={<HiOutlineMegaphone className="w-4 h-4" />}
                onClick={() => setShowAnnouncement(true)}
              >
                {t('Announce')}
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card padding="none">
              <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="px-5 pt-2" />

              <div className="p-5">
                {activeTab === 'students' && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-text-primary">
                        {t('{{count}} Students', { count: students.length })}
                      </h3>
                      <Button size="sm" variant="secondary" icon={<HiOutlinePlusCircle className="w-4 h-4" />}
                        onClick={() => setShowInviteModal(true)}
                      >
                        {t('Invite')}
                      </Button>
                    </div>
                    {students.length === 0 ? (
                      <EmptyState
                        icon={<HiOutlineUsers className="w-8 h-8" />}
                        title={t('No students yet')}
                        description={t('Invite students using the invite code')}
                        action={{ label: t('Invite Students'), onClick: () => setShowInviteModal(true) }}
                      />
                    ) : (
                      <DataTable columns={studentColumns} data={students} />
                    )}
                  </>
                )}

                {activeTab === 'assignments' && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-text-primary">{t('Assignments')}</h3>
                      <Button size="sm" variant="secondary" icon={<HiOutlinePlusCircle className="w-4 h-4" />}
                        onClick={() => setShowCreateAssignment(true)}
                      >
                        {t('Create')}
                      </Button>
                    </div>
                    {assignments.length === 0 ? (
                      <EmptyState
                        icon={<HiOutlineClipboardDocumentList className="w-8 h-8" />}
                        title={t('No assignments yet')}
                        description={t('Create your first assignment')}
                        action={{ label: t('Create Assignment'), onClick: () => setShowCreateAssignment(true) }}
                      />
                    ) : (
                      <div className="space-y-2">
                        {assignments.map((a) => (
                          <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div>
                              <p className="text-sm font-medium text-text-primary">{a.title}</p>
                              <p className="text-xs text-text-tertiary">{t('Due')}: {formatDate(a.dueDate)}</p>
                            </div>
                            <Badge>0 {t('submissions')}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'announcements' && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-text-primary">{t('Announcements')}</h3>
                      <Button size="sm" variant="secondary" icon={<HiOutlinePlusCircle className="w-4 h-4" />}
                        onClick={() => setShowAnnouncement(true)}
                      >
                        {t('Create')}
                      </Button>
                    </div>
                    {announcements.length === 0 ? (
                      <EmptyState
                        icon={<HiOutlineMegaphone className="w-8 h-8" />}
                        title={t('No announcements yet')}
                        description={t('Send your first announcement')}
                        action={{ label: t('Send Announcement'), onClick: () => setShowAnnouncement(true) }}
                      />
                    ) : (
                      <div className="space-y-4">
                        {announcements.map((a) => (
                          <Card key={a.id}>
                            <h4 className="text-sm font-semibold text-text-primary mb-1">{a.title}</h4>
                            <p className="text-sm text-text-secondary">{a.content}</p>
                            <p className="text-xs text-text-tertiary mt-2">{formatRelativeTime(a.createdAt)}</p>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'recordings' && (
                  <>
                    <h3 className="text-sm font-medium text-text-primary mb-4">{t('Recordings')}</h3>
                    {recordings.length === 0 ? (
                      <EmptyState
                        icon={<HiOutlineVideoCamera className="w-8 h-8" />}
                        title={t('No recordings yet')}
                        description={t('Recordings will appear after meetings end')}
                      />
                    ) : (
                      <div className="space-y-2">
                        {recordings.map((r) => (
                          <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div>
                              <p className="text-sm font-medium text-text-primary">{r.title}</p>
                              <p className="text-xs text-text-tertiary">{formatDate(r.date)} · {r.duration}min</p>
                            </div>
                            <Button size="sm" variant="secondary" icon={<HiOutlineDocumentArrowDown className="w-4 h-4" />}>
                              {t('Download')}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <h3 className="text-sm font-semibold text-text-primary mb-3">{t('Quick Actions')}</h3>
              <div className="space-y-2">
                <Button fullWidth size="sm" variant="secondary" icon={<HiOutlinePlay className="w-4 h-4" />} onClick={handleStartMeeting}>
                  {t('Start Meeting')}
                </Button>
                <Button fullWidth size="sm" variant="secondary" icon={<HiOutlineClipboardDocumentList className="w-4 h-4" />}
                  onClick={() => setShowCreateAssignment(true)}
                >
                  {t('Create Assignment')}
                </Button>
                <Button fullWidth size="sm" variant="secondary" icon={<HiOutlineMegaphone className="w-4 h-4" />}
                  onClick={() => setShowAnnouncement(true)}
                >
                  {t('Send Announcement')}
                </Button>
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-text-primary mb-3">{t('Invite Students')}</h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                  <p className="text-xs text-text-tertiary mb-1">{t('Invite Code')}</p>
                  <p className="text-lg font-mono font-bold text-primary-600 dark:text-primary-400 tracking-wider">
                    {currentClass.inviteCode}
                  </p>
                </div>
                <Button fullWidth size="sm" variant="secondary" icon={<HiOutlineLink className="w-4 h-4" />} onClick={handleCopyInvite}>
                  {t('Copy Code')}
                </Button>
                <Button fullWidth size="sm" variant="secondary" icon={<HiOutlineLink className="w-4 h-4" />} onClick={handleCopyLink}>
                  {t('Copy Join Link')}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>

      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title={t('Invite Students')}>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-center">
            <p className="text-xs text-text-tertiary mb-1">{t('Share this code with your students')}</p>
            <p className="text-2xl font-mono font-bold text-primary-600 dark:text-primary-400 tracking-wider">
              {currentClass.inviteCode}
            </p>
          </div>
          <div className="flex gap-2">
            <Button fullWidth variant="secondary" icon={<HiOutlineLink className="w-4 h-4" />} onClick={handleCopyInvite}>
              {t('Copy Code')}
            </Button>
            <Button fullWidth variant="secondary" icon={<HiOutlineLink className="w-4 h-4" />} onClick={handleCopyLink}>
              {t('Copy Link')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCreateAssignment} onClose={() => setShowCreateAssignment(false)} title={t('Create Assignment')}>
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <Input label={t('Title')} required value={assignmentForm.title}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary">{t('Description')}</label>
            <textarea rows={4} value={assignmentForm.description}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
              className="w-full rounded-lg border border-border bg-white dark:bg-gray-800/80 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none"
            />
          </div>
          <Input label={t('Due Date')} type="datetime-local" required value={assignmentForm.dueDate}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setShowCreateAssignment(false)}>{t('Cancel')}</Button>
            <Button type="submit">{t('Create')}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showAnnouncement} onClose={() => setShowAnnouncement(false)} title={t('Send Announcement')}>
        <form onSubmit={handleSendAnnouncement} className="space-y-4">
          <Input label={t('Title')} required value={announcementForm.title}
            onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary">{t('Content')}</label>
            <textarea rows={5} required value={announcementForm.content}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
              className="w-full rounded-lg border border-border bg-white dark:bg-gray-800/80 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setShowAnnouncement(false)}>{t('Cancel')}</Button>
            <Button type="submit">{t('Send')}</Button>
          </div>
        </form>
      </Modal>
      </>
  )
}
