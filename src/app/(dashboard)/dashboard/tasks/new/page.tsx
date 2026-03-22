'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  username: string
  nickname: string | null
}

export default function NewTaskPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: '2',
    category: '',
    assigneeId: '',
    supervisorId: '',
    startDate: '',
    endDate: '',
    estimatedHours: '',
    feedbackCycle: 'none',
    feedbackCycleDays: '',
    isSupervised: false,
    superviseLevel: '2',
    note: '',
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users?pageSize=100')
      const data = await res.json()
      if (data.success) {
        setUsers(data.data.list)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          priority: parseInt(formData.priority),
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
          feedbackCycleDays: formData.feedbackCycleDays ? parseInt(formData.feedbackCycleDays) : null,
          superviseLevel: parseInt(formData.superviseLevel),
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: '创建成功',
          description: '任务已创建',
        })
        router.push('/dashboard/tasks')
      } else {
        toast({
          title: '创建失败',
          description: data.error?.message || '请稍后重试',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '创建失败',
        description: '请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">创建任务</h1>
          <p className="text-gray-500 mt-1">填写任务信息</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">任务标题 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入任务标题"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">任务描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入任务详细描述"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">优先级</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">紧急</SelectItem>
                    <SelectItem value="2">高</SelectItem>
                    <SelectItem value="3">中</SelectItem>
                    <SelectItem value="4">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">任务分类</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="如：开发、设计、测试"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>分派信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assigneeId">执行人</Label>
                <Select
                  value={formData.assigneeId}
                  onValueChange={(value) => setFormData({ ...formData, assigneeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择执行人" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.nickname || user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supervisorId">督办人</Label>
                <Select
                  value={formData.supervisorId}
                  onValueChange={(value) => setFormData({ ...formData, supervisorId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择督办人" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.nickname || user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>时间安排</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">开始日期</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">截止日期</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedHours">预计工时(小时)</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  min="0"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>反馈设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="feedbackCycle">反馈周期</Label>
                <Select
                  value={formData.feedbackCycle}
                  onValueChange={(value) => setFormData({ ...formData, feedbackCycle: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无需反馈</SelectItem>
                    <SelectItem value="daily">每日</SelectItem>
                    <SelectItem value="weekly">每周</SelectItem>
                    <SelectItem value="custom">自定义</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.feedbackCycle === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="feedbackCycleDays">自定义天数</Label>
                  <Input
                    id="feedbackCycleDays"
                    type="number"
                    min="1"
                    value={formData.feedbackCycleDays}
                    onChange={(e) => setFormData({ ...formData, feedbackCycleDays: e.target.value })}
                    placeholder="天数"
                  />
                </div>
              )}
            </div>

            {formData.supervisorId && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-4">
                  <Label className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isSupervised}
                      onChange={(e) => setFormData({ ...formData, isSupervised: e.target.checked })}
                      className="mr-2"
                    />
                    启用督办
                  </Label>
                </div>

                {formData.isSupervised && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="superviseLevel">督办优先级</Label>
                      <Select
                        value={formData.superviseLevel}
                        onValueChange={(value) => setFormData({ ...formData, superviseLevel: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">紧急督办</SelectItem>
                          <SelectItem value="2">一般督办</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="note">督办备注</Label>
                      <Input
                        id="note"
                        value={formData.note}
                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        placeholder="督办说明"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Link href="/dashboard/tasks">
            <Button variant="outline" type="button">
              取消
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            {loading ? '创建中...' : '创建任务'}
          </Button>
        </div>
      </form>
    </div>
  )
}
