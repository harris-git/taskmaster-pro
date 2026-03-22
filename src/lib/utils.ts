import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const taskStatusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  pending: { label: '待接受', color: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: '已接受', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: '进行中', color: 'bg-blue-500 text-white' },
  pending_review: { label: '待审核', color: 'bg-purple-100 text-purple-800' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-800' },
}

export const priorityMap: Record<number, { label: string; color: string }> = {
  1: { label: '紧急', color: 'bg-red-500 text-white' },
  2: { label: '高', color: 'bg-orange-500 text-white' },
  3: { label: '中', color: 'bg-yellow-500 text-white' },
  4: { label: '低', color: 'bg-gray-500 text-white' },
}

export const feedbackCycleMap: Record<string, { label: string }> = {
  daily: { label: '每日' },
  weekly: { label: '每周' },
  custom: { label: '自定义' },
  none: { label: '无需反馈' },
}

export function generateTaskNo(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  return `TASK-${year}${month}${day}-${random}`
}
