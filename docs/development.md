# TaskMaster Pro - 开发文档

## 1. 技术栈选择

### 1.1 后端技术栈

| 层级 | 技术选型 | 版本 | 选择理由 |
|------|----------|------|----------|
| 运行时 | Node.js | 20 LTS | 事件驱动适合IO密集型，生态丰富 |
| 框架 | NestJS | 10.x | 模块化架构，装饰器语法，TypeScript原生支持 |
| 语言 | TypeScript | 5.x | 类型安全，IDE支持好，维护成本低 |
| ORM | Prisma | 5.x | 类型安全的ORM，迁移方便，视觉化支持 |
| 数据库 | MySQL | 8.0 | 成熟稳定，事务支持好，团队熟悉度高 |
| 缓存 | Redis | 7.x | 高性能缓存，支持多种数据结构 |
| 消息队列 | Bull | 6.x | 基于Redis的任务队列，稳定可靠 |
| 认证 | Passport + JWT | - | 成熟的认证方案，社区支持好 |
| 验证 | class-validator | 0.14.x | DTO验证，与NestJS深度集成 |

### 1.2 前端技术栈

| 层级 | 技术选型 | 版本 | 选择理由 |
|------|----------|------|----------|
| 框架 | Vue 3 | 3.4+ | 组合式API，性能优秀，生态成熟 |
| 语言 | TypeScript | 5.x | 类型安全，开发体验好 |
| UI框架 | Element Plus | 2.x | 组件丰富，文档完善 |
| 状态管理 | Pinia | 2.x | Vue3官方推荐，轻量级 |
| 路由 | Vue Router | 4.x | Vue官方路由 |
| 构建工具 | Vite | 5.x | 快速启动，热更新快 |
| HTTP客户端 | Axios | 1.x | 功能完善，拦截器强大 |
| 图表 | ECharts | 5.x | 图表功能强大，可定制化 |
| 表格 | AG Grid | 31.x | 企业级表格，功能全面 |

### 1.3 运维技术栈

| 类别 | 技术选型 | 版本 | 选择理由 |
|------|----------|------|----------|
| 容器化 | Docker | 24.x | 环境一致，部署简单 |
| 容器编排 | Docker Compose | 2.x | 开发环境友好 |
| CI/CD | GitHub Actions | - | 集成度高，免费额度 |
| 反向代理 | Nginx | 1.25 | 高性能，稳定可靠 |
| PM2 | PM2 | 5.x | 进程管理，负载均衡 |

---

## 2. 项目架构设计

### 2.1 整体架构
```
┌─────────────────────────────────────────────────────────────────┐
│                           客户端层                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Web浏览器   │  │  移动端H5   │  │  第三方集成  │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          网关层                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      Nginx (反向代理)                    │    │
│  │  - SSL终端                                               │    │
│  │  - 静态资源服务                                           │    │
│  │  - 请求分发                                               │    │
│  │  - 限流熔断                                               │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         应用服务层                               │
│  ┌──────────────────┐      ┌──────────────────┐               │
│  │   后端 API 服务    │      │   前端 Web 服务    │               │
│  │   (NestJS:3000)   │      │   (Vite:5173)     │               │
│  └────────┬─────────┘      └────────┬─────────┘               │
└───────────┼─────────────────────────┼──────────────────────────┘
            │                         │
            ▼                         ▼
┌─────────────────────────┐  ┌─────────────────────────────────┐
│        数据层            │  │          缓存层                  │
│  ┌─────────────────┐    │  │  ┌─────────────────┐            │
│  │  MySQL 主库     │    │  │  │  Redis 缓存     │            │
│  │  (读/写)        │    │  │  │  - 会话存储      │            │
│  └─────────────────┘    │  │  │  - Token黑名单   │            │
│  ┌─────────────────┐    │  │  │  - 热点数据      │            │
│  │  MySQL 从库     │    │  │  │  - 任务队列      │            │
│  │  (读)           │    │  │  └─────────────────┘            │
│  └─────────────────┘    │  │                                  │
└─────────────────────────┘  └─────────────────────────────────┘
```

### 2.2 后端架构（分层设计）
```
src/
├── main.ts                 # 应用入口
├── app.module.ts           # 根模块
│
├── common/                 # 公共模块
│   ├── decorators/         # 自定义装饰器
│   │   ├── current-user.decorator.ts
│   │   ├── roles.decorator.ts
│   │   └── permissions.decorator.ts
│   ├── filters/            # 全局异常过滤器
│   │   ├── http-exception.filter.ts
│   │   └── transform.filter.ts
│   ├── guards/              # 路由守卫
│   │   ├── auth.guard.ts
│   │   ├── roles.guard.ts
│   │   └── throttler.guard.ts
│   ├── interceptors/        # 拦截器
│   │   ├── logging.interceptor.ts
│   │   └── transform.interceptor.ts
│   ├── pipes/               # 管道
│   │   └── validation.pipe.ts
│   └── utils/               # 工具函数
│       ├── crypto.ts
│       ├── date.ts
│       └── response.ts
│
├── config/                  # 配置模块
│   ├── config.module.ts
│   ├── config.service.ts
│   └── configuration.ts
│
├── modules/                 # 功能模块
│   ├── auth/               # 认证模块
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/     # Passport策略
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   └── dto/
│   │
│   ├── user/               # 用户模块
│   │   ├── user.module.ts
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   └── entities/
│   │
│   ├── task/               # 任务模块
│   │   ├── task.module.ts
│   │   ├── task.controller.ts
│   │   ├── task.service.ts
│   │   ├── dto/
│   │   └── entities/
│   │
│   ├── feedback/           # 反馈模块
│   │   ├── feedback.module.ts
│   │   ├── feedback.controller.ts
│   │   ├── feedback.service.ts
│   │   └── entities/
│   │
│   ├── supervise/          # 督办模块
│   │   ├── supervise.module.ts
│   │   ├── supervise.controller.ts
│   │   ├── supervise.service.ts
│   │   └── entities/
│   │
│   ├── department/         # 部门模块
│   │   ├── department.module.ts
│   │   ├── department.controller.ts
│   │   ├── department.service.ts
│   │   └── entities/
│   │
│   ├── statistics/         # 统计模块
│   │   ├── statistics.module.ts
│   │   ├── statistics.controller.ts
│   │   ├── statistics.service.ts
│   │   └── dto/
│   │
│   └── system/             # 系统模块
│       ├── system.module.ts
│       ├── system.controller.ts
│       ├── system.service.ts
│       └── entities/
│
└── tasks/                   # 定时任务
    ├── tasks.module.ts
    └── remind.task.ts
```

### 2.3 前端架构（Vue3 + Pinia）
```
web/
├── public/                 # 静态资源
│   └── favicon.ico
│
├── src/
│   ├── main.ts            # 入口文件
│   ├── App.vue            # 根组件
│   │
│   ├── api/               # API层
│   │   ├── index.ts       # axios实例配置
│   │   ├── modules/       # API模块
│   │   │   ├── auth.ts
│   │   │   ├── user.ts
│   │   │   ├── task.ts
│   │   │   ├── feedback.ts
│   │   │   └── statistics.ts
│   │   └── types/         # API类型定义
│   │
│   ├── assets/            # 资源文件
│   │   ├── images/
│   │   ├── styles/
│   │   │   ├── variables.scss
│   │   │   ├── mixins.scss
│   │   │   └── global.scss
│   │   └── icons/
│   │
│   ├── components/        # 公共组件
│   │   ├── common/
│   │   │   ├── AppHeader.vue
│   │   │   ├── AppSidebar.vue
│   │   │   ├── AppFooter.vue
│   │   │   └── PageContainer.vue
│   │   ├── form/
│   │   │   ├── FormItem.vue
│   │   │   └── FormDrawer.vue
│   │   └── table/
│   │       ├── DataTable.vue
│   │       └── TableColumn.vue
│   │
│   ├── composables/       # 组合式函数
│   │   ├── usePagination.ts
│   │   ├── useLoading.ts
│   │   └── useMessage.ts
│   │
│   ├── directives/        # 指令
│   │   ├── permission.ts
│   │   └── loading.ts
│   │
│   ├── layouts/           # 布局组件
│   │   ├── DefaultLayout.vue
│   │   ├── BlankLayout.vue
│   │   └── FullscreenLayout.vue
│   │
│   ├── router/            # 路由
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── task.ts
│   │   │   ├── system.ts
│   │   │   └── index.ts
│   │   └── guards/
│   │       ├── auth.ts
│   │       └── permission.ts
│   │
│   ├── stores/            # Pinia状态管理
│   │   ├── index.ts
│   │   ├── user.ts
│   │   ├── task.ts
│   │   ├── permission.ts
│   │   └── settings.ts
│   │
│   ├── types/             # 类型定义
│   │   ├── api.d.ts
│   │   ├── store.d.ts
│   │   └── global.d.ts
│   │
│   ├── utils/             # 工具函数
│   │   ├── storage.ts
│   │   ├── date.ts
│   │   ├── validate.ts
│   │   └── index.ts
│   │
│   └── views/             # 页面视图
│       ├── auth/
│       │   ├── Login.vue
│       │   └── Register.vue
│       ├── dashboard/
│       │   └── Index.vue
│       ├── task/
│       │   ├── List.vue
│       │   ├── Detail.vue
│       │   └── Create.vue
│       ├── feedback/
│       │   └── Index.vue
│       ├── supervise/
│       │   └── Index.vue
│       ├── statistics/
│       │   └── Index.vue
│       └── system/
│           ├── user/
│           │   ├── List.vue
│           │   └── Edit.vue
│           └── department/
│               ├── List.vue
│               └── Edit.vue
│
├── .env                   # 环境变量
├── .env.development       # 开发环境变量
├── .env.production        # 生产环境变量
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. 开发环境搭建

### 3.1 环境要求

| 软件 | 版本 | 说明 |
|------|------|------|
| Node.js | 20.x LTS | 后端运行时 |
| npm | 10.x | 包管理器 |
| MySQL | 8.0 | 数据库 |
| Redis | 7.x | 缓存 |
| Git | 2.x | 版本控制 |
| VS Code | Latest | 推荐IDE |

### 3.2 开发环境安装步骤

#### 3.2.1 克隆项目
```bash
git clone https://github.com/your-org/taskmaster-pro.git
cd taskmaster-pro
```

#### 3.2.2 安装后端依赖
```bash
cd server
npm install
```

#### 3.2.3 安装前端依赖
```bash
cd ../web
npm install
```

#### 3.2.4 配置环境变量
```bash
# server/.env
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://user:password@localhost:3306/taskmaster
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=2h
REFRESH_TOKEN_EXPIRES_IN=7d

# web/.env.development
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_TITLE=TaskMaster Pro
```

#### 3.2.5 启动开发服务
```bash
# 终端1: 启动后端
cd server
npm run start:dev

# 终端2: 启动前端
cd web
npm run dev
```

### 3.3 Docker 环境快速启动
```bash
# 一键启动所有服务（开发环境）
docker-compose -f docker-compose.dev.yml up -d

# 查看服务状态
docker-compose -f docker-compose.dev.yml ps

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f
```

---

## 4. 目录结构说明

### 4.1 项目根目录
```
taskmaster-pro/
├── server/                 # 后端项目
├── web/                    # 前端项目
├── docs/                   # 文档目录
├── scripts/                # 脚本目录
├── docker/                 # Docker配置
├── docker-compose.yml      # 生产环境编排
├── docker-compose.dev.yml  # 开发环境编排
├── .gitignore
├── README.md
└── package.json           # 根目录npm配置
```

### 4.2 后端目录结构
```
server/
├── src/
│   ├── main.ts            # 应用入口
│   ├── app.module.ts      # 根模块
│   ├── common/            # 公共模块
│   ├── config/            # 配置模块
│   ├── modules/           # 功能模块
│   └── tasks/             # 定时任务
├── prisma/
│   ├── schema.prisma      # 数据库Schema
│   ├── migrations/        # 迁移文件
│   └── seed.ts            # 种子数据
├── test/                   # 测试文件
├── .env                    # 环境变量
├── .env.example            # 环境变量示例
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
└── package.json
```

### 4.3 前端目录结构
```
web/
├── public/                 # 静态资源
├── src/                    # 源代码
├── .env                    # 环境变量
├── .env.development        # 开发环境变量
├── .env.production         # 生产环境变量
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 5. 开发规范

### 5.1 代码规范

#### 5.1.1 TypeScript规范
```typescript
// 使用 interface 定义对象类型
interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

// 使用 type 定义联合类型或别名
type UserRole = 'admin' | 'user' | 'guest';
type Status = 'pending' | 'completed';

// 使用 enum 定义常量枚举
enum TaskStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

// 导出单一职责
export { User, UserRole, TaskStatus };

// 使用 PascalCase 命名类和接口
class UserService {
  // ...
}

// 使用 camelCase 命名变量和函数
const userName = '张三';
function getUserById(id: string) {
  // ...
}
```

#### 5.1.2 NestJS规范
```typescript
// 模块命名: xxx.module.ts
// 控制器命名: xxx.controller.ts
// 服务命名: xxx.service.ts
// DTO命名: xxx.dto.ts, xxx-request.dto.ts, xxx-response.dto.ts
// 实体命名: xxx.entity.ts

// DTO示例
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['urgent', 'high', 'medium', 'low'])
  priority: string;
}

// Service示例
@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create(createTaskDto);
    return this.taskRepository.save(task);
  }
}
```

#### 5.1.3 Vue3规范
```typescript
// 组件文件名: PascalCase.vue
// 组合式函数: useXxx.ts
// Store文件名: xxx.ts

// Props定义
interface Props {
  title: string;
  count?: number;
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
});

// Emits定义
const emit = defineEmits<{
  (e: 'update', value: number): void;
  (e: 'delete'): void;
}>();

// Composables示例
export function usePagination(total: Ref<number>) {
  const page = ref(1);
  const pageSize = ref(20);
  
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value));
  
  const nextPage = () => {
    if (page.value < totalPages.value) {
      page.value++;
    }
  };
  
  return {
    page,
    pageSize,
    totalPages,
    nextPage,
  };
}
```

### 5.2 Git规范

#### 5.2.1 分支命名
```
feature/xxx          # 新功能
fix/xxx              # Bug修复
refactor/xxx         # 重构
docs/xxx             # 文档更新
test/xxx              # 测试相关
chore/xxx             # 构建/工具相关
hotfix/xxx            # 紧急修复
```

#### 5.2.2 Commit规范
```
<type>(<scope>): <subject>

# type: feat, fix, docs, style, refactor, test, chore
# scope: 模块名称，如 auth, task, user
# subject: 简短描述

# 示例
feat(auth): add JWT refresh token support
fix(task): resolve task status update issue
docs(readme): update installation guide
```

#### 5.2.3 PR规范
```markdown
## 描述
[简要描述修改内容和目的]

## 更改类型
- [ ] 新功能 (feat)
- [ ] Bug修复 (fix)
- [ ] 文档更新 (docs)
- [ ] 代码重构 (refactor)
- [ ] 性能优化 (perf)
- [ ] 测试相关 (test)

## 测试情况
- [ ] 已通过单元测试
- [ ] 已通过集成测试
- [ ] 已手动测试

## 截图/录屏
[如有UI变更，请提供截图]
```

### 5.3 API规范

#### 5.3.1 RESTful风格
```
GET     /api/v1/tasks           # 获取任务列表
GET     /api/v1/tasks/:id       # 获取任务详情
POST    /api/v1/tasks           # 创建任务
PUT     /api/v1/tasks/:id       # 更新任务
DELETE  /api/v1/tasks/:id       # 删除任务
PATCH   /api/v1/tasks/:id/status  # 更新任务状态
```

#### 5.3.2 响应格式
```json
{
  "success": true,
  "data": {
    "id": "xxx",
    "title": "任务标题"
  },
  "message": "操作成功",
  "timestamp": "2026-03-22T10:00:00Z"
}
```

#### 5.3.3 错误响应
```json
{
  "success": false,
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "任务不存在",
    "details": {}
  },
  "timestamp": "2026-03-22T10:00:00Z"
}
```

### 5.4 数据库规范

#### 5.4.1 命名规范
- 表名: snake_case，复数形式 (如: users, task_items)
- 列名: snake_case (如: user_id, created_at)
- 索引名: idx_<表名>_<列名> (如: idx_users_email)
- 外键名: fk_<表名>_<引用表名> (如: fk_tasks_user_id)

#### 5.4.2 主键规范
- 使用 UUID 作为主键
- 格式: CUID 或 UUID v4

#### 5.4.3 时间字段
```sql
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
deleted_at DATETIME NULL  -- 软删除
```

---

## 6. 部署流程

### 6.1 生产环境部署

#### 6.1.1 服务器要求
| 配置 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 2核 | 4核 |
| 内存 | 4GB | 8GB |
| 硬盘 | 50GB SSD | 100GB SSD |
| 带宽 | 5Mbps | 10Mbps |

#### 6.1.2 部署步骤
```bash
# 1. 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com | bash
docker-compose --version

# 2. 创建部署目录
sudo mkdir -p /opt/taskmaster-pro
cd /opt/taskmaster-pro

# 3. 拉取代码
git clone https://github.com/your-org/taskmaster-pro.git .

# 4. 配置环境变量
cp .env.example .env
vim .env  # 修改生产环境配置

# 5. 构建并启动
docker-compose -f docker-compose.yml up -d --build

# 6. 检查服务状态
docker-compose ps

# 7. 查看日志
docker-compose logs -f
```

#### 6.1.3 Nginx配置
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # 前端静态资源
    location / {
        root /var/www/taskmaster-pro/web/dist;
        try_files $uri $uri/ /index.html;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
    
    # API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 上传文件大小限制
    client_max_body_size 50m;
}
```

### 6.2 CI/CD流程

#### 6.2.1 GitHub Actions配置
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: |
          cd server && npm ci
          cd ../web && npm ci
      - name: Run tests
        run: |
          cd server && npm run test
          cd ../web && npm run test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: docker-compose build
      
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/taskmaster-pro
            docker-compose pull
            docker-compose up -d
```

### 6.3 备份策略

#### 6.3.1 数据库备份
```bash
# 每日凌晨3点执行备份
0 3 * * * docker exec mysql mysqldump -u root -p$DB_PASSWORD taskmaster > /backup/taskmaster_$(date +\%Y\%m\%d).sql

# 保留最近30天备份
0 0 * * * find /backup -name "taskmaster_*.sql" -mtime +30 -delete
```

#### 6.3.2 文件备份
```bash
# 备份上传文件
0 3 * * * tar -czf /backup/uploads_$(date +\%Y\%m\%d).tar.gz /data/uploads

# 备份Nginx配置
0 3 * * * cp /etc/nginx/nginx.conf /backup/nginx.conf.$(date +\%Y\%m\%d)
```

---

## 7. 附录

### 7.1 常用命令

#### 后端命令
```bash
# 开发
npm run start:dev        # 开发模式启动
npm run build            # 生产构建
npm run start:prod       # 生产模式启动

# 测试
npm run test             # 单元测试
npm run test:watch       # 监听模式测试
npm run test:cov         # 测试覆盖率

# 代码质量
npm run lint             # ESLint检查
npm run format           # Prettier格式化

# 数据库
npx prisma migrate dev   # 执行迁移
npx prisma db push       # 同步数据库结构
npx prisma db seed       # 种子数据
npx prisma studio        # 打开数据库可视化工具
```

#### 前端命令
```bash
# 开发
npm run dev              # 开发模式启动
npm run build            # 生产构建
npm run preview          # 预览构建结果

# 代码质量
npm run lint             # ESLint检查
npm run format           # Prettier格式化
npm run type-check       # TypeScript类型检查
```

### 7.2 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| NODE_ENV | 运行环境 | development/production |
| PORT | 服务端口 | 3000 |
| DATABASE_URL | 数据库连接URL | mysql://user:pass@host:3306/db |
| REDIS_URL | Redis连接URL | redis://localhost:6379 |
| JWT_SECRET | JWT密钥 | (随机字符串) |
| JWT_EXPIRES_IN | Token有效期 | 2h |
| REFRESH_TOKEN_EXPIRES_IN | RefreshToken有效期 | 7d |

### 7.3 常见问题

**Q: 如何重置数据库？**
```bash
cd server
npx prisma migrate reset
```

**Q: 如何查看日志？**
```bash
# Docker环境
docker-compose logs -f server

# 本地环境
npm run start:dev
```

**Q: 如何添加新模块？**
```bash
cd server
npx nest g resource module-name
```
