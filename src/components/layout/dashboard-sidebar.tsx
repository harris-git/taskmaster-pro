'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ListTodo,
  Users,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

const navigation = [
  { name: '仪表盘', href: '/dashboard', icon: LayoutDashboard },
  { name: '任务管理', href: '/dashboard/tasks', icon: ListTodo },
  { name: '用户管理', href: '/dashboard/users', icon: Users },
  { name: '部门管理', href: '/dashboard/departments', icon: Building2 },
  { name: '数据统计', href: '/dashboard/statistics', icon: BarChart3 },
  { name: '系统设置', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isAdmin = session?.user?.roles?.some((role) => role.code === 'admin')

  return (
    <div className="flex flex-col w-64 bg-white border-r">
      <div className="flex items-center h-16 px-4 border-b">
        <Shield className="w-8 h-8 text-blue-600 mr-2" />
        <span className="text-xl font-bold">TaskMaster Pro</span>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          if (item.name === '用户管理' || item.name === '部门管理' || item.name === '系统设置') {
            if (!isAdmin) return null
          }
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-medium">
              {session?.user?.name?.[0] || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {session?.user?.roles?.[0]?.name || '用户'}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          退出登录
        </button>
      </div>
    </div>
  )
}
