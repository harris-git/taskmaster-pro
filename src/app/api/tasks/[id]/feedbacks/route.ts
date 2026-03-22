import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
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
    const { content, progress = 0, attachments } = body

    if (!content) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '反馈内容不能为空' } },
        { status: 400 }
      )
    }

    const feedback = await prisma.feedback.create({
      data: {
        taskId: params.id,
        userId: session.user.id,
        content,
        progress,
        attachments: attachments ? JSON.stringify(attachments) : null,
      },
      include: {
        user: {
          select: { id: true, nickname: true, username: true, avatar: true },
        },
      },
    })

    if (progress !== task.progress) {
      await prisma.task.update({
        where: { id: params.id },
        data: {
          progress,
          lastFeedbackAt: new Date(),
        },
      })
    }

    await prisma.log.create({
      data: {
        userId: session.user.id,
        username: session.user.name || session.user.username,
        action: 'CREATE',
        targetType: 'FEEDBACK',
        targetId: feedback.id,
        targetName: `任务反馈: ${task.title}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: feedback,
      message: '反馈提交成功',
    })
  } catch (error) {
    console.error('Create feedback error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    )
  }
}

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

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where: {
          taskId: params.id,
          deletedAt: null,
          parentId: null,
        },
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
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.feedback.count({
        where: {
          taskId: params.id,
          deletedAt: null,
          parentId: null,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        list: feedbacks,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    })
  } catch (error) {
    console.error('Get feedbacks error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    )
  }
}
