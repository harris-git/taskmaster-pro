# TaskMaster Pro - API接口文档

## 1. 接口概述

### 1.1 基本信息
- **基础URL**: `http://api.taskmaster-pro.com/api/v1`
- **协议**: HTTPS
- **数据格式**: JSON
- **字符编码**: UTF-8

### 1.2 通用请求头
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer <access_token>
X-Request-ID: <uuid>  (可选，用于链路追踪)
X-Time-Zone: Asia/Shanghai  (可选)
```

### 1.3 通用响应格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2026-03-22T10:00:00Z"
}
```

### 1.4 错误响应格式
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  },
  "timestamp": "2026-03-22T10:00:00Z"
}
```

### 1.5 HTTP状态码
| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 资源创建成功 |
| 204 | 请求成功，无返回内容 |
| 400 | 请求参数错误 |
| 401 | 未认证或Token无效 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 422 | 验证错误 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

---

## 2. 认证接口

### 2.1 用户登录
```
POST /auth/login
```

**请求参数:**
```json
{
  "login": "user@example.com",
  "password": "Password123",
  "remember": true
}
```
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| login | string | 是 | 用户名/邮箱/手机号 |
| password | string | 是 | 密码 |
| remember | boolean | 否 | 记住登录状态（默认false） |

**成功响应:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 7200,
    "tokenType": "Bearer",
    "user": {
      "id": "uuid",
      "username": "john",
      "email": "user@example.com",
      "nickname": "John Doe",
      "avatar": "https://...",
      "roles": ["user"]
    }
  },
  "message": "登录成功"
}
```

### 2.2 用户注册
```
POST /auth/register
```

**请求参数:**
```json
{
  "username": "john_doe",
  "email": "user@example.com",
  "phone": "13800138000",
  "password": "Password123",
  "confirmPassword": "Password123",
  "captcha": "abc123"
}
```
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名（6-20位字母数字） |
| email | string | 是 | 邮箱地址 |
| phone | string | 否 | 手机号（11位） |
| password | string | 是 | 密码（8-20位，含大小写和数字） |
| confirmPassword | string | 是 | 确认密码 |
| captcha | string | 否 | 验证码 |

**成功响应:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "john_doe",
    "email": "user@example.com"
  },
  "message": "注册成功，请登录"
}
```

### 2.3 刷新Token
```
POST /auth/refresh
```

**请求参数:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**成功响应:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 7200
  },
  "message": "Token已刷新"
}
```

### 2.4 登出
```
POST /auth/logout
```

**请求头:** `Authorization: Bearer <access_token>`

**成功响应:**
```json
{
  "success": true,
  "message": "登出成功"
}
```

### 2.5 忘记密码
```
POST /auth/forgot-password
```

**请求参数:**
```json
{
  "email": "user@example.com",
  "captcha": "abc123"
}
```

**成功响应:**
```json
{
  "success": true,
  "message": "重置链接已发送到邮箱"
}
```

### 2.6 重置密码
```
POST /auth/reset-password
```

**请求参数:**
```json
{
  "token": "xxx",
  "password": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

---

## 3. 用户相关接口

### 3.1 获取当前用户信息
```
GET /users/me
```

**请求头:** `Authorization: Bearer <access_token>`

**成功响应:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "john_doe",
    "email": "user@example.com",
    "phone": "13800138000",
    "nickname": "John Doe",
    "avatar": "https://...",
    "status": 1,
    "department": {
      "id": "uuid",
      "name": "技术部"
    },
    "roles": [
      {
        "id": "uuid",
        "name": "普通用户",
        "code": "user"
      }
    ],
    "permissions": ["task:read", "task:create", "task:update"],
    "lastLoginAt": "2026-03-22T10:00:00Z",
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

### 3.2 更新当前用户信息
```
PUT /users/me
```

**请求参数:**
```json
{
  "nickname": "John Doe",
  "phone": "13800138000",
  "avatar": "https://..."
}
```

### 3.3 修改密码
```
PUT /users/me/password
```

**请求参数:**
```json
{
  "oldPassword": "OldPassword123",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

### 3.4 获取用户列表
```
GET /users
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码（默认1） |
| pageSize | int | 否 | 每页数量（默认20） |
| keyword | string | 否 | 搜索关键词 |
| status | int | 否 | 状态筛选 |
| departmentId | string | 否 | 部门筛选 |
| roleId | string | 否 | 角色筛选 |

**成功响应:**
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": "uuid",
        "username": "john_doe",
        "email": "user@example.com",
        "nickname": "John Doe",
        "avatar": "https://...",
        "status": 1,
        "department": {
          "id": "uuid",
          "name": "技术部"
        },
        "roles": [{"name": "普通用户"}],
        "createdAt": "2026-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 3.5 获取用户详情
```
GET /users/:id
```

### 3.6 创建用户
```
POST /users
```

**请求参数:**
```json
{
  "username": "new_user",
  "email": "new@example.com",
  "phone": "13900139000",
  "password": "Password123",
  "nickname": "New User",
  "departmentId": "uuid",
  "roleIds": ["uuid1", "uuid2"]
}
```

### 3.7 更新用户
```
PUT /users/:id
```

### 3.8 删除用户
```
DELETE /users/:id
```

### 3.9 启用/禁用用户
```
PATCH /users/:id/status
```

**请求参数:**
```json
{
  "status": 0
}
```

---

## 4. 任务相关接口

### 4.1 获取任务列表
```
GET /tasks
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码（默认1） |
| pageSize | int | 否 | 每页数量（默认20） |
| keyword | string | 否 | 搜索关键词 |
| status | string | 否 | 状态筛选（逗号分隔） |
| priority | int | 否 | 优先级筛选 |
| category | string | 否 | 分类筛选 |
| assigneeId | string | 否 | 执行人筛选 |
| creatorId | string | 否 | 创建人筛选 |
| startDate | string | 否 | 开始日期筛选 |
| endDate | string | 否 | 截止日期筛选 |
| isSupervised | boolean | 否 | 仅督办任务 |
| tags | string | 否 | 标签筛选（逗号分隔） |
| sort | string | 否 | 排序字段 |
| order | string | 否 | 排序方向（asc/desc） |

**成功响应:**
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": "uuid",
        "taskNo": "TASK-20260322-001",
        "title": "完成用户模块开发",
        "priority": 2,
        "status": "in_progress",
        "category": "开发",
        "tags": ["前端", "重要"],
        "progress": 50,
        "creator": {
          "id": "uuid",
          "username": "john",
          "nickname": "John"
        },
        "assignee": {
          "id": "uuid",
          "username": "jane",
          "nickname": "Jane"
        },
        "startDate": "2026-03-20",
        "endDate": "2026-03-25",
        "feedbackCycle": "daily",
        "isSupervised": true,
        "createdAt": "2026-03-20T10:00:00Z",
        "updatedAt": "2026-03-22T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 4.2 获取任务详情
```
GET /tasks/:id
```

**成功响应:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "taskNo": "TASK-20260322-001",
    "title": "完成用户模块开发",
    "description": "详细描述...",
    "priority": 2,
    "priorityText": "高",
    "status": "in_progress",
    "statusText": "进行中",
    "category": "开发",
    "tags": ["前端", "重要"],
    "attachments": [
      {
        "name": "设计稿.png",
        "url": "https://...",
        "size": 1024000
      }
    ],
    "parentId": null,
    "level": 0,
    "childCount": 2,
    
    "creator": {
      "id": "uuid",
      "username": "john",
      "nickname": "John"
    },
    "assignee": {
      "id": "uuid",
      "username": "jane",
      "nickname": "Jane"
    },
    "supervisor": {
      "id": "uuid",
      "username": "manager",
      "nickname": "Manager"
    },
    
    "startDate": "2026-03-20",
    "endDate": "2026-03-25",
    "actualEndDate": null,
    "estimatedHours": 40,
    "actualHours": null,
    
    "feedbackCycle": "daily",
    "feedbackCycleText": "每日反馈",
    "lastFeedbackAt": "2026-03-22T09:00:00Z",
    "nextFeedbackAt": "2026-03-23T09:00:00Z",
    
    "progress": 50,
    "completionSummary": null,
    
    "isSupervised": true,
    "superviseLevel": 1,
    "superviseStatus": "supervising",
    
    "rejectReason": null,
    "cancelReason": null,
    
    "members": [
      {
        "userId": "uuid",
        "username": "jane",
        "role": "assignee"
      },
      {
        "userId": "uuid",
        "username": "helper",
        "role": "collaborator"
      }
    ],
    
    "feedbacks": [
      {
        "id": "uuid",
        "content": "今日进度汇报...",
        "progress": 50,
        "user": {"id": "uuid", "nickname": "Jane"},
        "createdAt": "2026-03-22T09:00:00Z"
      }
    ],
    
    "version": 1,
    "createdAt": "2026-03-20T10:00:00Z",
    "updatedAt": "2026-03-22T10:00:00Z"
  }
}
```

### 4.3 创建任务
```
POST /tasks
```

**请求参数:**
```json
{
  "title": "完成用户模块开发",
  "description": "详细描述...",
  "priority": 2,
  "category": "开发",
  "tags": ["前端", "重要"],
  "attachments": [
    {"name": "设计稿.png", "url": "https://...", "size": 1024000}
  ],
  "parentId": null,
  
  "assigneeId": "uuid",
  "supervisorId": "uuid",
  
  "startDate": "2026-03-20",
  "endDate": "2026-03-25",
  "estimatedHours": 40,
  
  "feedbackCycle": "daily",
  "feedbackCycleDays": null,
  
  "isSupervised": true,
  "superviseLevel": 1,
  "note": "督办备注"
}
```

### 4.4 更新任务
```
PUT /tasks/:id
```

**请求参数:** 同创建任务，可部分更新

### 4.5 删除任务
```
DELETE /tasks/:id
```

**说明:** 仅创建者可删除，删除后状态变为 cancelled

### 4.6 更新任务状态
```
PATCH /tasks/:id/status
```

**请求参数:**
```json
{
  "status": "in_progress",
  "reason": "开始执行"
}
```

**状态流转:**
| 当前状态 | 可转换状态 |
|---------|-----------|
| draft | pending, cancelled |
| pending | accepted, cancelled |
| accepted | in_progress, cancelled |
| in_progress | pending_review, in_progress, cancelled |
| pending_review | completed, in_progress |
| completed | draft（重新打开）|

### 4.7 分派任务
```
POST /tasks/:id/assign
```

**请求参数:**
```json
{
  "assigneeId": "uuid",
  "endDate": "2026-03-25",
  "note": "请在本周五前完成"
}
```

### 4.8 接受/拒绝任务
```
POST /tasks/:id/accept
```

或

```
POST /tasks/:id/reject
```

**拒绝时请求参数:**
```json
{
  "reason": "任务冲突，无法按期完成"
}
```

### 4.9 转交任务
```
POST /tasks/:id/transfer
```

**请求参数:**
```json
{
  "targetUserId": "uuid",
  "reason": "工作调整"
}
```

### 4.10 完成任务
```
POST /tasks/:id/complete
```

**请求参数:**
```json
{
  "completionSummary": "已完成所有功能开发",
  "actualHours": 38,
  "attachments": []
}
```

### 4.11 获取任务甘特图数据
```
GET /tasks/gantt
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 是 | 开始日期 |
| endDate | string | 是 | 结束日期 |
| assigneeId | string | 否 | 执行人筛选 |

---

## 5. 反馈相关接口

### 5.1 获取反馈列表
```
GET /tasks/:taskId/feedbacks
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |

### 5.2 提交反馈
```
POST /tasks/:taskId/feedbacks
```

**请求参数:**
```json
{
  "content": "今日进度：已完成用户登录功能开发",
  "progress": 60,
  "attachments": [
    {"name": "截图.png", "url": "https://...", "size": 500000}
  ]
}
```

### 5.3 回复反馈
```
POST /feedbacks/:id/reply
```

**请求参数:**
```json
{
  "content": "收到，请继续加油"
}
```

### 5.4 更新反馈
```
PUT /feedbacks/:id
```

### 5.5 获取待反馈任务
```
GET /feedbacks/pending
```

**说明:** 获取需要提交反馈的任务列表

---

## 6. 督办相关接口

### 6.1 获取督办任务列表
```
GET /supervises
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 督办状态 |
| priority | int | 否 | 优先级 |
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |

### 6.2 创建督办记录
```
POST /tasks/:id/supervise
```

**请求参数:**
```json
{
  "supervisorId": "uuid",
  "priority": 1,
  "note": "重要任务，需重点关注"
}
```

### 6.3 处理督办
```
POST /supervises/:id/handle
```

**请求参数:**
```json
{
  "action": "extend",
  "reason": "需求变更，延期一周",
  "newEndDate": "2026-04-01"
}
```

**处理动作:**
| action | 说明 |
|--------|------|
| extend | 延期处理 |
| transfer | 转交执行人 |
| close | 关闭任务 |
| continue | 继续督办 |

### 6.4 获取超时任务
```
GET /supervises/overdue
```

---

## 7. 统计相关接口

### 7.1 获取任务统计概览
```
GET /statistics/overview
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

**成功响应:**
```json
{
  "success": true,
  "data": {
    "totalTasks": 1000,
    "completedTasks": 800,
    "inProgressTasks": 150,
    "pendingTasks": 50,
    "completionRate": 80.0,
    "onTimeRate": 95.0,
    "averageDuration": 3.5,
    "statusDistribution": [
      {"status": "completed", "count": 800},
      {"status": "in_progress", "count": 150},
      {"status": "pending", "count": 50}
    ],
    "priorityDistribution": [
      {"priority": 1, "count": 50},
      {"priority": 2, "count": 200},
      {"priority": 3, "count": 500},
      {"priority": 4, "count": 250}
    ]
  }
}
```

### 7.2 获取任务趋势
```
GET /statistics/trend
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 趋势类型: daily/weekly/monthly |
| startDate | string | 是 | 开始日期 |
| endDate | string | 是 | 结束日期 |

### 7.3 获取工作量统计
```
GET /statistics/workload
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| groupBy | string | 否 | 分组维度: user/department |

### 7.4 获取个人统计
```
GET /statistics/personal
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userId | string | 否 | 用户ID（默认当前用户） |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

### 7.5 获取超时任务统计
```
GET /statistics/overdue
```

### 7.6 导出统计数据
```
GET /statistics/export
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 导出类型: overview/workload/overdue |
| format | string | 否 | 导出格式: excel/pdf（默认excel） |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

---

## 8. 部门相关接口

### 8.1 获取部门树
```
GET /departments/tree
```

**成功响应:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "总公司",
      "code": "HQ",
      "children": [
        {
          "id": "uuid",
          "name": "技术部",
          "code": "TECH",
          "children": []
        }
      ]
    }
  ]
}
```

### 8.2 获取部门列表
```
GET /departments
```

### 8.3 获取部门详情
```
GET /departments/:id
```

### 8.4 创建部门
```
POST /departments
```

**请求参数:**
```json
{
  "name": "技术部",
  "code": "TECH",
  "parentId": "uuid",
  "leaderId": "uuid",
  "description": "技术研发部门",
  "sortOrder": 1
}
```

### 8.5 更新部门
```
PUT /departments/:id
```

### 8.6 删除部门
```
DELETE /departments/:id
```

---

## 9. 系统相关接口

### 9.1 获取系统配置
```
GET /system/configs
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| group | string | 否 | 配置分组 |

### 9.2 更新系统配置
```
PUT /system/configs
```

**请求参数:**
```json
{
  "configs": {
    "feedback_reminder_time": "10:00",
    "overdue_warning_hours": 24
  }
}
```

### 9.3 获取操作日志
```
GET /system/logs
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |
| userId | string | 否 | 用户筛选 |
| action | string | 否 | 操作类型筛选 |
| targetType | string | 否 | 对象类型筛选 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

### 9.4 获取角色列表
```
GET /roles
```

### 9.5 获取角色详情
```
GET /roles/:id
```

### 9.6 创建角色
```
POST /roles
```

**请求参数:**
```json
{
  "name": "自定义角色",
  "code": "custom_role",
  "description": "描述",
  "permissionCodes": ["task:read", "task:create"]
}
```

### 9.7 更新角色
```
PUT /roles/:id
```

### 9.8 删除角色
```
DELETE /roles/:id
```

### 9.9 分配用户角色
```
POST /users/:userId/roles
```

**请求参数:**
```json
{
  "roleIds": ["uuid1", "uuid2"]
}
```

---

## 10. 错误码说明

| 错误码 | HTTP状态 | 说明 |
|--------|----------|------|
| VALIDATION_ERROR | 400 | 请求参数验证失败 |
| INVALID_CREDENTIALS | 401 | 认证信息无效 |
| TOKEN_EXPIRED | 401 | Token已过期 |
| TOKEN_INVALID | 401 | Token格式错误 |
| PERMISSION_DENIED | 403 | 无权限访问 |
| RESOURCE_NOT_FOUND | 404 | 资源不存在 |
| RESOURCE_CONFLICT | 409 | 资源冲突 |
| TASK_STATUS_INVALID | 422 | 任务状态流转无效 |
| USERNAME_EXISTS | 409 | 用户名已存在 |
| EMAIL_EXISTS | 409 | 邮箱已存在 |
| RATE_LIMIT_EXCEEDED | 429 | 请求过于频繁 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

---

## 11. 附录

### 11.1 任务状态说明
| 状态值 | 显示文本 | 说明 |
|--------|----------|------|
| draft | 草稿 | 任务创建但未发布 |
| pending | 待接受 | 已分派，等待执行人接受 |
| accepted | 已接受 | 执行人已接受任务 |
| in_progress | 进行中 | 正在执行 |
| pending_review | 待审核 | 已完成，等待审核 |
| completed | 已完成 | 任务已完成 |
| cancelled | 已取消 | 任务被取消 |

### 11.2 优先级说明
| 优先级值 | 显示文本 | 说明 |
|----------|----------|------|
| 1 | 紧急 | 需立即处理 |
| 2 | 高 | 需尽快处理 |
| 3 | 中 | 正常优先级 |
| 4 | 低 | 可延后处理 |

### 11.3 反馈周期说明
| 周期值 | 显示文本 | 说明 |
|--------|----------|------|
| daily | 每日 | 每天提交反馈 |
| weekly | 每周 | 每周一提交反馈 |
| custom | 自定义 | 每N天提交一次 |
| none | 无需反馈 | 不需要反馈 |

### 11.4 督办状态说明
| 状态值 | 显示文本 | 说明 |
|--------|----------|------|
| supervising | 督办中 | 正常督办 |
| warning | 即将超时 | 24小时内将超时 |
| overdue | 已超时 | 已超过截止日期 |
| resolved | 已解决 | 督办问题已解决 |
| closed | 已关闭 | 督办已关闭 |
