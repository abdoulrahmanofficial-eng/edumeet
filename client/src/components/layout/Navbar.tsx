import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Dropdown } from '@/components/ui/Dropdown'
import { Tooltip } from '@/components/ui/Tooltip'
import type { User } from '@/types'
import {
  HiBars3,
  HiBell,
  HiSun,
  HiMoon,
  HiOutlineUser,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiLanguage,
} from 'react-icons/hi2'

interface NavbarProps {
  user: User | null
  unreadNotifications?: number
  isDark: boolean
  onToggleTheme: () => void
  onToggleSidebar: () => void
}

export function Navbar({
  user,
  unreadNotifications = 0,
  isDark,
  onToggleTheme,
  onToggleSidebar,
}: NavbarProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isRTL = i18n.dir() === 'rtl'

  const toggleLanguage = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar'
    i18n.changeLanguage(next)
    document.documentElement.dir = i18n.dir()
    document.documentElement.lang = next
  }

  const userMenuItems = [
    {
      label: t('nav.profile'),
      icon: HiOutlineUser,
      onClick: () => navigate(`/${user?.role}/profile`),
    },
    {
      label: t('nav.settings'),
      icon: HiOutlineCog6Tooth,
      onClick: () => navigate(`/${user?.role}/settings`),
    },
    {
      label: t('auth.logout'),
      icon: HiOutlineArrowRightOnRectangle,
      variant: 'danger' as const,
      onClick: () => {
        navigate('/login')
      },
    },
  ]

  return (
    <header
      className={cn(
        'sticky top-0 z-20 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-border',
      )}
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden"
          >
            <HiBars3 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip content={isDark ? t('nav.lightMode') : t('nav.darkMode')} position="bottom">
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isDark ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
            </button>
          </Tooltip>

          <Tooltip content={i18n.language === 'ar' ? 'English' : 'العربية'} position="bottom">
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-semibold"
            >
              {i18n.language === 'ar' ? 'EN' : 'AR'}
            </button>
          </Tooltip>

          <Tooltip content={t('nav.notifications')} position="bottom">
            <button className="relative p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <HiBell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <Badge
                  variant="danger"
                  size="sm"
                  className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 flex items-center justify-center p-0"
                >
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </Badge>
              )}
            </button>
          </Tooltip>

          {user && (
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Avatar src={user.photoURL} name={user.displayName} size="sm" />
                  <span className="hidden sm:block text-sm font-medium text-text-primary max-w-[120px] truncate">
                    {user.displayName}
                  </span>
                </button>
              }
              items={userMenuItems}
              align={isRTL ? 'left' : 'right'}
            />
          )}
        </div>
      </div>
    </header>
  )
}
