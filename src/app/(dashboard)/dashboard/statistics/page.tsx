import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { taskStatusMap, priorityMap } from '@/lib/utils'
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BarChart3,
  PieChart,
} from 'lucide-react'

async function getStatistics(userId: string) {
  const [
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    overdueTasks,
    supervisedTasks,
    statusDistribution,
    priorityDistribution,
    recentCompletions,
  ] = await Promise.all([
    prisma.task.count({ where: { deletedAt: null } }),
    prisma.task.count({
      where: { deletedAt: null, status: 'completed' },
    }),
    prisma.task.count({
      where: { deletedAt: null, status: 'in_progress' },
    }),
    prisma.task.count({
      where: { deletedAt: null, status: 'pending' },
    }),
    prisma.task.count({
      where: {
        deletedAt: null,
        endDate: { lt: new Date() },
        status: { notIn: ['completed', 'cancelled'] },
      },
    }),
    prisma.task.count({
      where: {
        deletedAt: null,
        isSupervised: true,
        status: { notIn: ['completed', 'cancelled'] },
      },
    }),
    prisma.task.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: true,
    }),
    prisma.task.groupBy({
      by: ['priority'],
      where: { deletedAt: null },
      _count: true,
    }),
    prisma.task.findMany({
      where: { deletedAt: null, status: 'completed' },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        creator: { select: { nickname: true, username: true } },
        assignee: { select: { nickname: true, username: true } },
      },
    }),
  ])

  const completionRate = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0

  const onTimeRate = completedTasks > 0 
    ? Math.round(((completedTasks - overdueTasks) / completedTasks) * 100)
    : 100

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    overdueTasks,
    supervisedTasks,
    statusDistribution,
    priorityDistribution,
    recentCompletions,
    completionRate,
    onTimeRate,
  }
}

export default async function StatisticsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return <div>请先登录</div>
  }

  const stats = await getStatistics(session.user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">数据统计</h1>
        <p className="text-gray-500 mt-1">任务数据分析</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              任务总数
            </CardTitle>
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-gray-500 mt-1">所有任务</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              完成率
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.completedTasks}/{stats.totalTasks} 完成任务
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              准时率
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.onTimeRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.overdueTasks} 个超时任务
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
            <div className="text-3xl font-bold">{stats.supervisedTasks}</div>
            <p className="text-xs text-gray-500 mt-1">正在督办中</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-blue-600" />
              状态分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.statusDistribution.map((item) => {
                const percentage = stats.totalTasks > 0 
                  ? Math.round((item._count / stats.totalTasks) * 100) 
                  : 0
                return (
                  <div key={item.status}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">
                        {taskStatusMap[item.status]?.label || item.status}
                      </span>
                      <span className="text-sm font-medium">
                        {item._count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              优先级分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((priority) => {
                const item = stats.priorityDistribution.find(
                  (p) => p.priority === priority
                )
                const count = item?._count || 0
                const percentage = stats.totalTasks > 0 
                  ? Math.round((count / stats.totalTasks) * 100) 
                  : 0
                return (
                  <div key={priority}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">
                        {priorityMap[priority]?.label || priority}
                      </span>
                      <span className="text-sm font-medium">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          priorityMap[priority]?.color || 'bg-gray-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最近完成</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentCompletions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">暂无已完成任务</p>
          ) : (
            <div className="space-y-4">
              {stats.recentCompletions.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{task.taskNo}</span>
                      <span className="font-medium">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-green-100 text-green-800">
                        {taskStatusMap[task.status]?.label}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        执行人: {task.assignee?.nickname || task.assignee?.username || '-'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      完成时间: {task.actualEndDate ? new Date(task.actualEndDate).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
