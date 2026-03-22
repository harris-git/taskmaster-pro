import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      avatar?: string
      roles: Array<{
        id: string
        name: string
        code: string
      }>
      department?: {
        id: string
        name: string
        code: string
      } | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    username: string
    avatar?: string
    roles: Array<{
      id: string
      name: string
      code: string
    }>
    department?: {
      id: string
      name: string
      code: string
    } | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user: {
      id: string
      username: string
      email: string
      name: string
      avatar?: string
      roles: Array<{
        id: string
        name: string
        code: string
      }>
      department?: {
        id: string
        name: string
        code: string
      } | null
    }
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginatedResponse<T> {
  list: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface TaskFilters {
  keyword?: string
  status?: string
  priority?: number
  category?: string
  assigneeId?: string
  creatorId?: string
  startDate?: string
  endDate?: string
  isSupervised?: boolean
  tags?: string
}

export interface UserFilters {
  keyword?: string
  status?: number
  departmentId?: string
  roleId?: string
}
