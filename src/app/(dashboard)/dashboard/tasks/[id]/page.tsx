'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { taskStatusMap, priorityMap, feedbackCycleMap, formatDate, formatDateTime } from '@/lib/utils'
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  User,
  Users,
  MessageSquare,
  Send,
  Calendar,
  AlertTriangle,
} from 'lucide-react'

interface Task {
  id: string
  taskNo: string
  title: string
  description: string | null
  priority: number
  status: string
  category: string | null
  tags: string | null
  progress: number
  startDate: string | null
  endDate: string | null
  actualEndDate: string | null
  estimatedHours: number | null
  actualHours: number | null
  feedbackCycle: string
  lastFeedbackAt: string | null
  nextFeedbackAt: string | null
  isSupervised: boolean
  superviseLevel: number | null
  rejectReason: string | null
  cancelReason: string | null
  creator: { id: string; nickname: string | null; username: string }
  assignee: { id: string; nickname: string | null; username: string } | null
  supervisor: { id: string; nickname: string | null; username: string } | null
  members: Array<{
    id: string
    role: string
    user: { id: string; nickname: string | null; username: string }
  }>
  feedbacks: Array<{
    id: string
    content: string
    progress: number
    createdAt: string
    user: { id: string; nickname: string | null; username: string; avatar: string | null }
  }>
  superviseRecord: {
    id: string
    status: string
    priority: number
    note: string | null
    createdAt: string
  } | null
  children: Array<{
    id: string
    title: string
    taskNo: string
    status: string
    progress: number
  }>
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedbackContent, setFeedbackContent] = useState('')
  const [feedbackProgress, setFeedbackProgress] = useState('0')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchTask()
  }, [params.id])

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${params.id}`)
      const data = await res.json()

      if (data.success) {
        setTask(data.data)
        setFeedbackProgress(data.data.progress.toString())
      } else {
        toast({
          title: '获取失败',
          description: data.error?.message || '任务不存在',
          variant: 'destructive',
        })
        router.push('/dashboard/tasks')
      }
    } catch (error) {
      toast({
        title: '获取失败',
        description: '请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: '更新成功',
          description: '任务状态已更新',
        })
        fetchTask()
      } else {
        toast({
          title: '更新失败',
          description: data.error?.message || '请稍后重试',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '更新失败',
        description: '请稍后重试',
        variant: 'destructive',
      })
    }
  }

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackContent.trim()) {
      toast({
        title: '请输入反馈内容',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/tasks/${params.id}/feedbacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: feedbackContent,
          progress: parseInt(feedbackProgress),
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: '提交成功',
          description: '反馈已提交',
        })
        setFeedbackContent('')
        fetchTask()
      } else {
        toast({
          title: '提交失败',
          description: data.error?.message || '请稍后重试',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '提交失败',
        description: '请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!task) {
    return null
  }

  const isCreator = session?.user?.id === task.creator.id
  const isAssignee = session?.user?.id === task.assignee?.id

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/tasks">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{task.taskNo}</span>
              <Badge className={taskStatusMap[task.status]?.color}>
                {taskStatusMap[task.status]?.label}
              </Badge>
              <Badge className={priorityMap[task.priority]?.color}>
                {priorityMap[task.priority]?.label}
              </Badge>
              {task.isSupervised && (
                <Badge className="bg-orange-100 text-orange-800">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  督办
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold mt-1">{task.title}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          {isCreator && (
            <>
              <Link href={`/dashboard/tasks/${params.id}/edit`}>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  编辑
                </Button>
              </Link>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (confirm('确定要删除这个任务吗？')) {
                    const res = await fetch(`/api/tasks/${params.id}`, {
                      method: 'DELETE',
                    })
                    const data = await res.json()
                    if (data.success) {
                      router.push('/dashboard/tasks')
                    }
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                删除
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>任务详情</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">描述</h3>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {task.description || '暂无描述'}
                </p>
              </div>

              {task.category && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">分类</h3>
                  <Badge variant="outline">{task.category}</Badge>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">进度</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-medium">{task.progress}%</span>
                </div>
              </div>

              {task.children && task.children.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">子任务</h3>
                  <div className="space-y-2">
                    {task.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              child.status === 'completed'
                                ? 'text-green-600'
                                : 'text-gray-400'
                            }`}
                          />
                          <span className="text-sm">{child.title}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {child.progress}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                反馈记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(isCreator || isAssignee) && (
                <form onSubmit={handleSubmitFeedback} className="mb-6 space-y-4">
                  <Textarea
                    placeholder="请输入反馈内容..."
                    value={feedbackContent}
                    onChange={(e) => setFeedbackContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="text-sm">当前进度:</label>
                      <Select
                        value={feedbackProgress}
                        onValueChange={setFeedbackProgress}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(
                            (value) => (
                              <SelectItem key={value} value={value.toString()}>
                                {value}%
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" disabled={submitting}>
                      <Send className="w-4 h-4 mr-2" />
                      {submitting ? '提交中...' : '提交反馈'}
                    </Button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {task.feedbacks.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">暂无反馈记录</p>
                ) : (
                  task.feedbacks.map((feedback) => (
                    <div key={feedback.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 text-sm font-medium">
                              {feedback.user.nickname?.[0] ||
                                feedback.user.username[0]}
                            </span>
                          </div>
                          <span className="font-medium">
                            {feedback.user.nickname || feedback.user.username}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <Badge variant="outline">{feedback.progress}%</Badge>
                          <span>{formatDateTime(feedback.createdAt)}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap ml-10">
                        {feedback.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>状态操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">
                  更新状态
                </label>
                <Select
                  value={task.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="pending">待接受</SelectItem>
                    <SelectItem value="in_progress">进行中</SelectItem>
                    <SelectItem value="pending_review">待审核</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isAssignee && task.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusChange('in_progress')}
                  >
                    接受任务
                  </Button>
                </div>
              )}

              {isAssignee && task.status === 'in_progress' && (
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => handleStatusChange('pending_review')}
                >
                  申请完成
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>任务信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">创建者</p>
                  <p className="font-medium">
                    {task.creator.nickname || task.creator.username}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">执行人</p>
                  <p className="font-medium">
                    {task.assignee?.nickname || task.assignee?.username || '未分配'}
                  </p>
                </div>
              </div>

              {task.supervisor && (
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">督办人</p>
                    <p className="font-medium">
                      {task.supervisor.nickname || task.supervisor.username}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">时间安排</p>
                  <p className="font-medium">
                    {formatDate(task.startDate)} - {formatDate(task.endDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">反馈周期</p>
                  <p className="font-medium">
                    {feedbackCycleMap[task.feedbackCycle]?.label}
                  </p>
                </div>
              </div>

              {task.estimatedHours && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">预计工时</p>
                    <p className="font-medium">{task.estimatedHours} 小时</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>成员</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {task.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-medium">
                        {member.user.nickname?.[0] || member.user.username[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.user.nickname || member.user.username}
                      </p>
                      <p className="text-xs text-gray-500">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
