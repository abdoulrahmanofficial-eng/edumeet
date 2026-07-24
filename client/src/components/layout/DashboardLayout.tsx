import { useState, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import type { User } from '@/types'

interface DashboardLayoutProps {
  user: User | null
  isDark: boolean
  onToggleTheme: () => void
  children?: ReactNode
}

export function DashboardLayout({ user, isDark, onToggleTheme, children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'

  return (
    <div className={cn('flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950', isRTL && 'flex-row-reverse')}>
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <Navbar
          user={user}
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}
