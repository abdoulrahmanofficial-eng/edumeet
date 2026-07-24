import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import type { User } from '@/types'
import {
  HiOutlineSquares2X2,
  HiOutlineAcademicCap,
  HiOutlineVideoCamera,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineUser,
  HiOutlineCog6Tooth,
  HiXMark,
  HiBars3,
} from 'react-icons/hi2'

interface NavItem {
  labelKey: string
  path: string
  icon: typeof HiOutlineSquares2X2
  badge?: number
}

interface SidebarProps {
  user: User | null
  isOpen: boolean
  onToggle: () => void
}

const teacherNav: NavItem[] = [
  { labelKey: 'nav.dashboard', path: '/teacher/dashboard', icon: HiOutlineSquares2X2 },
  { labelKey: 'nav.classes', path: '/teacher/classes', icon: HiOutlineAcademicCap },
  { labelKey: 'nav.meetings', path: '/teacher/meetings', icon: HiOutlineVideoCamera },
  { labelKey: 'nav.schedule', path: '/teacher/schedule', icon: HiOutlineClock },
  { labelKey: 'nav.assignments', path: '/teacher/assignments', icon: HiOutlineDocumentText },
  { labelKey: 'nav.profile', path: '/teacher/profile', icon: HiOutlineUser },
  { labelKey: 'nav.settings', path: '/teacher/settings', icon: HiOutlineCog6Tooth },
]

const studentNav: NavItem[] = [
  { labelKey: 'nav.dashboard', path: '/student/dashboard', icon: HiOutlineSquares2X2 },
  { labelKey: 'nav.classes', path: '/student/classes', icon: HiOutlineAcademicCap },
  { labelKey: 'nav.meetings', path: '/student/meetings', icon: HiOutlineVideoCamera },
  { labelKey: 'nav.assignments', path: '/student/assignments', icon: HiOutlineDocumentText },
  { labelKey: 'nav.recordings', path: '/student/recordings', icon: HiOutlineVideoCamera },
  { labelKey: 'nav.profile', path: '/student/profile', icon: HiOutlineUser },
  { labelKey: 'nav.settings', path: '/student/settings', icon: HiOutlineCog6Tooth },
]

export function Sidebar({ user, isOpen, onToggle }: SidebarProps) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const isRTL = i18n.dir() === 'rtl'
  const navItems = user?.role === 'teacher' ? teacherNav : studentNav

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <HiOutlineVideoCamera className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-text-primary">EduMeet</span>
        </Link>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
        >
          <HiXMark className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onToggle()
              }}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'text-text-secondary hover:text-text-primary hover:bg-gray-100 dark:hover:bg-gray-800/50',
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{t(item.labelKey)}</span>
              {item.badge !== undefined && (
                <Badge size="sm" variant={isActive ? 'primary' : 'default'} className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      {user && (
        <div className="px-4 py-4 border-t border-border">
          <Link
            to={`/${user.role}/profile`}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
          >
            <Avatar src={user.photoURL} name={user.displayName} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user.displayName}
              </p>
              <p className="text-xs text-text-tertiary truncate">{user.email}</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  )

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-border shadow-lg',
          'transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto',
          'hidden lg:block',
          isRTL && 'left-auto right-0 lg:right-0 border-r-0 border-l',
        )}
      >
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
              className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: isRTL ? 300 : -300 }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? 300 : -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className={cn(
                'fixed inset-y-0 z-40 w-64 bg-white dark:bg-gray-900 shadow-2xl lg:hidden',
                isRTL ? 'right-0' : 'left-0',
              )}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
