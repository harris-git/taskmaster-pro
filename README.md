# TaskMaster Pro

高效的任务管理与督办系统

## 功能特性

- **任务管理**: 创建、编辑、删除、分配任务
- **任务分派**: 支持任务分配给指定执行人
- **反馈机制**: 执行人可提交任务进度反馈
- **督办功能**: 支持对重要任务进行督办
- **用户认证**: 完整的用户认证和权限管理
- **仪表盘**: 数据可视化和统计概览
- **部门管理**: 组织架构管理
- **系统设置**: 个人设置和系统配置

## 技术栈

- **前端**: Next.js 14 + React 18 + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **后端**: Next.js API Routes
- **数据库**: Prisma ORM + SQLite (开发) / PostgreSQL (生产)
- **认证**: NextAuth.js

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 创建数据库并同步 Schema
npx prisma db push

# 初始化数据（可选）
npx tsx prisma/seed.ts
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 测试账号

- 管理员: admin@taskmaster.com / admin123
- 普通用户: demo@taskmaster.com / admin123

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 认证相关页面
│   ├── (dashboard)/       # 仪表盘相关页面
│   └── api/               # API 路由
├── components/             # React 组件
│   ├── ui/               # shadcn/ui 组件
│   └── layout/           # 布局组件
├── hooks/                 # 自定义 Hooks
├── lib/                   # 工具函数和配置
└── types/                 # TypeScript 类型定义
```

## 主要命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 生产
npm run start

# 数据库
npx prisma studio          # 数据库可视化
npx prisma db push         # 同步 Schema
npx tsx prisma/seed.ts    # 初始化数据
```

## 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量：
   - `DATABASE_URL`: PostgreSQL 连接字符串
   - `NEXTAUTH_SECRET`: 随机密钥
   - `NEXTAUTH_URL`: 你的域名

## License

MIT
