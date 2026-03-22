import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
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
      include: {
        creator: {
          select: { id: true, nickname: true, username: true, avatar: true },
        },
        assignee: {
          select: { id: true, nickname: true, username: true, avatar: true },
        },
        supervisor: {
          select: { id: true, nickname: true, username: true, avatar: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, nickname: true, username: true, avatar: true },
            },
          },
        },
        feedbacks: {
          where: { deletedAt: null, parentId: null },
          include: {
            user: {
              select: { id: true, nickname: true, username: true, avatar: true },
            },
            replies: {
              include: {
                user: {
                  select: { id: true, nickname: true, username: true, avatar: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        superviseRecord: true,
        parent: {
          select: { id: true, title: true, taskNo: true },
        },
        children: {
          where: { deletedAt: null },
          select: { id: true, title: true, taskNo: true, status: true, progress: true },
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '任务不存在' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: task,
    })
  } catch (error) {
    console.error('Get task error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const body = await request.json()
    const {
      title,
      description,
      priority,
      category,
      tags,
      attachments,
      assigneeId,
      supervisorId,
      startDate,
      endDate,
      estimatedHours,
      feedbackCycle,
      feedbackCycleDays,
      isSupervised,
      superviseLevel,
      note,
    } = body

    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
    })

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '任务不存在' } },
        { status: 404 }
      )
    }

    if (existingTask.creatorId !== session.user.id && 
        !session.user.roles?.some((r) => r.code === 'admin')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '无权限修改此任务' } },
        { status: 403 }
      )
    }

    const updateData: any = {
      updatedAt: new Date(),
      version: { increment: 1 },
    }

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (priority !== undefined) updateData.priority = priority
    if (category !== undefined) updateData.category = category
    if (tags !== undefined) updateData.tags = tags ? JSON.stringify(tags) : null
    if (attachments !== undefined) updateData.attachments = attachments ? JSON.stringify(attachments) : null
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours
    if (feedbackCycle !== undefined) updateData.feedbackCycle = feedbackCycle
    if (feedbackCycleDays !== undefined) updateData.feedbackCycleDays = feedbackCycleDays

    if (assigneeId !== undefined && assigneeId !== existingTask.assigneeId) {
      updateData.assigneeId = assigneeId
      if (assigneeId && existingTask.status === 'draft') {
        updateData.status = 'pending'
      }

      await prisma.taskMember.upsert({
        where: {
          taskId_userId: { taskId: params.id, userId: assigneeId },
        },
        update: { role: 'assignee' },
        create: {
          taskId: params.id,
          userId: assigneeId,
          role: 'assignee',
        },
      })
    }

    if (supervisorId !== undefined && supervisorId !== existingTask.supervisorId) {
      updateData.supervisorId = supervisorId

      if (supervisorId) {
        await prisma.taskMember.upsert({
          where: {
            taskId_userId: { taskId: params.id, userId: supervisorId },
          },
          update: { role: 'supervisor' },
          create: {
            taskId: params.id,
            userId: supervisorId,
            role: 'supervisor',
          },
        })
      }
    }

    if (isSupervised !== undefined) {
      updateData.isSupervised = isSupervised
      if (isSupervised && supervisorId) {
        await prisma.supervise.upsert({
          where: { taskId: params.id },
          update: {
            priority: superviseLevel || 2,
            note,
          },
          create: {
            taskId: params.id,
            supervisorId: supervisorId,
            priority: superviseLevel || 2,
            note,
          },
        })
      }
    }

    const task = await prisma.task.update({
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

    await prisma.log.create({
      data: {
        userId: session.user.id,
        username: session.user.name || session.user.username,
        action: 'UPDATE',
        targetType: 'TASK',
        targetId: task.id,
        targetName: task.title,
        oldValue: JSON.stringify(existingTask),
        newValue: JSON.stringify(body),
      },
    })

    return NextResponse.json({
      success: true,
      data: task,
      message: '任务更新成功',
    })
  } catch (error) {
    console.error('Update task error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    if (task.creatorId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '只有创建者可以删除任务' } },
        { status: 403 }
      )
    }

    await prisma.task.update({
      where: { id: params.id },
      data: {
        status: 'cancelled',
        deletedAt: new Date(),
      },
    })

    await prisma.log.create({
      data: {
        userId: session.user.id,
        username: session.user.name || session.user.username,
        action: 'DELETE',
        targetType: 'TASK',
        targetId: task.id,
        targetName: task.title,
      },
    })

    return NextResponse.json({
      success: true,
      message: '任务删除成功',
    })
  } catch (error) {
    console.error('Delete task error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    )
  }
}
