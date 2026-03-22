'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ListTodo,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { taskStatusMap, priorityMap, formatDate } from '@/lib/utils'
import type { Task, User } from '@prisma/client'

interface TaskWithRelations extends Task {
  creator: { nickname: string | null; username: string }
  assignee: { nickname: string | null; username: string } | null
  supervisor: { nickname: string | null; username: string } | null
}

interface TaskListResponse {
  list: TaskWithRelations[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export default function TasksContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [tasks, setTasks] = useState<TaskWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  })
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    status: searchParams.get('status') || 'all',
    priority: searchParams.get('priority') || 'all',
  })

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', pagination.page.toString())
      params.set('pageSize', pagination.pageSize.toString())
      if (filters.keyword) params.set('keyword', filters.keyword)
      if (filters.status !== 'all') params.set('status', filters.status)
      if (filters.priority !== 'all') params.set('priority', filters.priority)

      const res = await fetch(`/api/tasks?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setTasks(data.data.list)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [pagination.page, filters])

  const handleDelete = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) return

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.success) {
        fetchTasks()
      } else {
        alert(data.error?.message || '删除失败')
      }
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">任务管理</h1>
          <p className="text-gray-500 mt-1">管理所有任务</p>
        </div>
        <Link href="/dashboard/tasks/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            创建任务
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>任务列表</CardTitle>
              <CardDescription>
                共 {pagination.total} 个任务
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索任务..."
                  className="pl-10 w-64"
                  value={filters.keyword}
                  onChange={(e) =>
                    setFilters({ ...filters, keyword: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setPagination({ ...pagination, page: 1 })
                      fetchTasks()
                    }
                  }}
                />
              </div>
              <Select
                value={filters.status}
                onValueChange={(value) => {
                  setFilters({ ...filters, status: value })
                  setPagination({ ...pagination, page: 1 })
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="pending">待接受</SelectItem>
                  <SelectItem value="in_progress">进行中</SelectItem>
                  <SelectItem value="pending_review">待审核</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.priority}
                onValueChange={(value) => {
                  setFilters({ ...filters, priority: value })
                  setPagination({ ...pagination, page: 1 })
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="优先级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部优先级</SelectItem>
                  <SelectItem value="1">紧急</SelectItem>
                  <SelectItem value="2">高</SelectItem>
                  <SelectItem value="3">中</SelectItem>
                  <SelectItem value="4">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">加载中...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <ListTodo className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">暂无任务</p>
              <Link href="/dashboard/tasks/new">
                <Button variant="outline" className="mt-4">
                  创建第一个任务
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>任务编号</TableHead>
                    <TableHead>任务标题</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>优先级</TableHead>
                    <TableHead>执行人</TableHead>
                    <TableHead>截止日期</TableHead>
                    <TableHead>进度</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="text-sm text-gray-500">
                        {task.taskNo}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/tasks/${task.id}`}
                          className="font-medium hover:text-blue-600"
                        >
                          {task.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={taskStatusMap[task.status]?.color || ''}
                        >
                          {taskStatusMap[task.status]?.label || task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={priorityMap[task.priority]?.color || ''}
                        >
                          {priorityMap[task.priority]?.label || task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {task.assignee?.nickname || task.assignee?.username || (
                          <span className="text-gray-400">未分配</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(task.endDate)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                          <span className="text-sm">{task.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/tasks/${task.id}`}
                                className="flex items-center"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                查看
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/tasks/${task.id}/edit`}
                                className="flex items-center"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                编辑
                              </Link>
                            </DropdownMenuItem>
                            {task.creatorId === session?.user?.id && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(task.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                删除
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    显示 {(pagination.page - 1) * pagination.pageSize + 1} 到{' '}
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)}{' '}
                    条，共 {pagination.total} 条
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() =>
                        setPagination({ ...pagination, page: pagination.page - 1 })
                      }
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() =>
                        setPagination({ ...pagination, page: pagination.page + 1 })
                      }
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
