import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
} from 'lucide-react'
import { taskStatusMap, priorityMap, formatDate } from '@/lib/utils'

async function getDashboardData(userId: string) {
  const [
    totalTasks,
    myTasks,
    completedTasks,
    overdueTasks,
    recentTasks,
    supervisedTasks,
  ] = await Promise.all([
    prisma.task.count({
      where: { deletedAt: null },
    }),
    prisma.task.count({
      where: {
        deletedAt: null,
        OR: [
          { creatorId: userId },
          { assigneeId: userId },
          { supervisorId: userId },
        ],
      },
    }),
    prisma.task.count({
      where: {
        deletedAt: null,
        status: 'completed',
      },
    }),
    prisma.task.count({
      where: {
        deletedAt: null,
        endDate: { lt: new Date() },
        status: { notIn: ['completed', 'cancelled'] },
      },
    }),
    prisma.task.findMany({
      where: {
        deletedAt: null,
        OR: [
          { creatorId: userId },
          { assigneeId: userId },
          { supervisorId: userId },
        ],
      },
      include: {
        creator: { select: { nickname: true, username: true } },
        assignee: { select: { nickname: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.task.count({
      where: {
        deletedAt: null,
        isSupervised: true,
        status: { notIn: ['completed', 'cancelled'] },
      },
    }),
  ])

  return {
    totalTasks,
    myTasks,
    completedTasks,
    overdueTasks,
    recentTasks,
    supervisedTasks,
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return <div>请先登录</div>
  }

  const data = await getDashboardData(session.user.id)
  const completionRate = data.totalTasks > 0 
    ? Math.round((data.completedTasks / data.totalTasks) * 100) 
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">欢迎回来，{session.user.name}</h1>
          <p className="text-gray-500 mt-1">这里是您的任务概览</p>
        </div>
        <Link href="/dashboard/tasks/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <ListTodo className="w-4 h-4 mr-2" />
            创建任务
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              我的任务
            </CardTitle>
            <ListTodo className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.myTasks}</div>
            <p className="text-xs text-gray-500 mt-1">参与的任务总数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              已完成
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.completedTasks}</div>
            <p className="text-xs text-gray-500 mt-1">
              完成率 {completionRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              督办任务
            </CardTitle>
            <Clock className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.supervisedTasks}</div>
            <p className="text-xs text-gray-500 mt-1">正在督办的任务</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              超时任务
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.overdueTasks}</div>
            <p className="text-xs text-red-500 mt-1">需要处理</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              统计概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">任务总数</span>
                <span className="font-semibold">{data.totalTasks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">完成率</span>
                <span className="font-semibold">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              快捷操作
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/tasks?status=in_progress">
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2 text-blue-600" />
                  进行中的任务
                </Button>
              </Link>
              <Link href="/dashboard/tasks?status=pending">
                <Button variant="outline" className="w-full justify-start">
                  <ListTodo className="w-4 h-4 mr-2 text-yellow-600" />
                  待接受任务
                </Button>
              </Link>
              <Link href="/dashboard/tasks?isSupervised=true">
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
                  督办任务
                </Button>
              </Link>
              <Link href="/dashboard/statistics">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                  查看统计
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最近任务</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentTasks.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                暂无任务，创建一个开始吧
              </p>
            ) : (
              data.recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {task.taskNo}
                      </span>
                      <span className="font-medium">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        className={taskStatusMap[task.status]?.color || ''}
                      >
                        {taskStatusMap[task.status]?.label || task.status}
                      </Badge>
                      <Badge
                        className={priorityMap[task.priority]?.color || ''}
                      >
                        {priorityMap[task.priority]?.label || task.priority}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        截止: {formatDate(task.endDate)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {task.assignee?.nickname || task.assignee?.username || '未分配'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(task.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
