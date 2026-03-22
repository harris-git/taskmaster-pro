import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('请输入邮箱和密码')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            roles: {
              include: { role: true },
            },
            department: true,
          },
        })

        if (!user) {
          throw new Error('用户不存在')
        }

        if (user.deletedAt) {
          throw new Error('用户已被删除')
        }

        if (user.status === 0) {
          throw new Error('用户已被禁用')
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error('账户已被锁定，请稍后再试')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              loginAttempts: { increment: 1 },
              lockedUntil:
                user.loginAttempts >= 2
                  ? new Date(Date.now() + 15 * 60 * 1000)
                  : null,
            },
          })
          throw new Error('密码错误')
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: 0,
            lastLoginAt: new Date(),
          },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.nickname || user.username,
          username: user.username,
          avatar: user.avatar || undefined,
          roles: user.roles.map((ur) => ur.role),
          department: user.department,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user as any
      }
      return token
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = token.user as any
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
}
