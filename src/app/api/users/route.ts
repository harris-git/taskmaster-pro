import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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
    const departmentId = searchParams.get('departmentId') || ''

    const where: any = {
      deletedAt: null,
    }

    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { email: { contains: keyword } },
        { nickname: { contains: keyword } },
      ]
    }

    if (status) {
      where.status = parseInt(status)
    }

    if (departmentId) {
      where.departmentId = departmentId
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          nickname: true,
          avatar: true,
          status: true,
          department: {
            select: { id: true, name: true, code: true },
          },
          roles: {
            include: {
              role: {
                select: { id: true, name: true, code: true },
              },
            },
          },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ])

    const formattedUsers = users.map((user) => ({
      ...user,
      roles: user.roles.map((ur) => ur.role),
    }))

    return NextResponse.json({
      success: true,
      data: {
        list: formattedUsers,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    })
  } catch (error) {
    console.error('Get users error:', error)
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
        { success: false, error: { code: 'FORBIDDEN', message: '无权限创建用户' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      username,
      email,
      phone,
      password,
      nickname,
      departmentId,
      roleIds,
    } = body

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '用户名、邮箱和密码不能为空' } },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
          ...(phone ? [{ phone }] : []),
        ],
        deletedAt: null,
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: '用户名或邮箱已存在' } },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        email,
        phone,
        password: hashedPassword,
        nickname,
        departmentId,
      },
    })

    if (roleIds && roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: roleIds.map((roleId: string) => ({
          userId: user.id,
          roleId,
        })),
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      message: '用户创建成功',
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    )
  }
}
