import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } },
        { status: 401 }
      )
    }

    if (!session.user.roles?.some((role) => role.code === 'admin')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '无权限访问' } },
        { status: 403 }
      )
    }

    const departments = await prisma.department.findMany({
      where: { status: 1 },
      include: {
        parent: {
          select: { id: true, name: true },
        },
        children: {
          where: { status: 1 },
          select: { id: true, name: true, code: true },
        },
        users: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    const formattedDepartments = departments.map((dept) => ({
      ...dept,
      userCount: dept.users.length,
      users: undefined,
    }))

    return NextResponse.json({
      success: true,
      data: formattedDepartments,
    })
  } catch (error) {
    console.error('Get departments error:', error)
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

    if (!session.user.roles?.some((role) => role.code === 'admin')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '无权限创建部门' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, code, parentId, leaderId, description, sortOrder } = body

    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '部门名称和编码不能为空' } },
        { status: 400 }
      )
    }

    const existing = await prisma.department.findUnique({
      where: { code },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: '部门编码已存在' } },
        { status: 409 }
      )
    }

    const department = await prisma.department.create({
      data: {
        name,
        code,
        parentId,
        leaderId,
        description,
        sortOrder: sortOrder || 0,
      },
    })

    return NextResponse.json({
      success: true,
      data: department,
      message: '部门创建成功',
    })
  } catch (error) {
    console.error('Create department error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    )
  }
}
