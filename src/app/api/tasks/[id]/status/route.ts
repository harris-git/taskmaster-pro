import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const validTransitions: Record<string, string[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['accepted', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['pending_review', 'in_progress', 'cancelled'],
  pending_review: ['completed', 'in_progress'],
  completed: ['draft'],
  cancelled: [],
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      )
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '任务不存在' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { status, reason } = body

    if (!status) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '状态不能为空' } },
        { status: 400 }
      )
    }

    const allowedTransitions = validTransitions[task.status] || []
    if (!allowedTransitions.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TRANSITION',
            message: `无法从 ${task.status} 转换到 ${status}`,
          },
        },
        { status: 422 }
      )
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
      version: { increment: 1 },
    }

    if (status === 'completed') {
      updateData.actualEndDate = new Date()
      updateData.progress = 100
    }

    if (status === 'cancelled') {
      updateData.cancelReason = reason || null
    }

    if (status === 'in_progress' && task.status === 'pending') {
      updateData.acceptedAt = new Date()
    }

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        creator: {
          select: { nickname: true, username: true },
        },
        assignee: {
          select: { nickname: true, username: true },
        },
        supervisor: {
          select: { nickname: true, username: true },
        },
      },
    })

    if (status === 'completed') {
      await prisma.supervise.updateMany({
        where: { taskId: params.id },
        data: {
          status: 'resolved',
          resolvedAt: new Date(),
        },
      })
    }

    await prisma.log.create({
      data: {
        userId: session.user.id,
        username: session.user.name || session.user.username,
        action: 'UPDATE_STATUS',
        targetType: 'TASK',
        targetId: task.id,
        targetName: task.title,
        oldValue: JSON.stringify({ status: task.status }),
        newValue: JSON.stringify({ status }),
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: '状态更新成功',
    })
  } catch (error) {
    console.error('Update task status error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    )
  }
}
