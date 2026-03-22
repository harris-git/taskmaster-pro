import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateTaskNo } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const keyword = searchParams.get('keyword') || ''
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''
    const category = searchParams.get('category') || ''
    const assigneeId = searchParams.get('assigneeId') || ''
    const creatorId = searchParams.get('creatorId') || ''
    const isSupervised = searchParams.get('isSupervised') || ''

    const where: any = {
      deletedAt: null,
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { taskNo: { contains: keyword } },
        { description: { contains: keyword } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = parseInt(priority)
    }

    if (category) {
      where.category = category
    }

    if (assigneeId) {
      where.assigneeId = assigneeId
    }

    if (creatorId) {
      where.creatorId = creatorId
    }

    if (isSupervised === 'true') {
      where.isSupervised = true
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.task.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        list: tasks,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    })
  } catch (error) {
    console.error('Get tasks error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
      priority = 2,
      category,
      tags,
      attachments,
      parentId,
      assigneeId,
      supervisorId,
      startDate,
      endDate,
      estimatedHours,
      feedbackCycle = 'none',
      feedbackCycleDays,
      isSupervised = false,
      superviseLevel,
      note,
    } = body

    if (!title) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '任务标题不能为空' } },
        { status: 400 }
      )
    }

    const task = await prisma.task.create({
      data: {
        taskNo: generateTaskNo(),
        title,
        description,
        priority,
        category,
        tags: tags ? JSON.stringify(tags) : null,
        attachments: attachments ? JSON.stringify(attachments) : null,
        parentId,
        creatorId: session.user.id,
        assigneeId,
        supervisorId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        estimatedHours,
        feedbackCycle,
        feedbackCycleDays,
        isSupervised,
        superviseLevel,
        status: assigneeId ? 'pending' : 'draft',
      },
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

    if (assigneeId) {
      await prisma.taskMember.create({
        data: {
          taskId: task.id,
          userId: assigneeId,
          role: 'assignee',
        },
      })
    }

    if (supervisorId) {
      await prisma.taskMember.create({
        data: {
          taskId: task.id,
          userId: supervisorId,
          role: 'supervisor',
        },
      })

      if (isSupervised) {
        await prisma.supervise.create({
          data: {
            taskId: task.id,
            supervisorId: supervisorId,
            priority: superviseLevel || 2,
            note,
          },
        })
      }
    }

    await prisma.log.create({
      data: {
        userId: session.user.id,
        username: session.user.name || session.user.username,
        action: 'CREATE',
        targetType: 'TASK',
        targetId: task.id,
        targetName: task.title,
        newValue: JSON.stringify(body),
      },
    })

    return NextResponse.json({
      success: true,
      data: task,
      message: '任务创建成功',
    })
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    )
  }
}
