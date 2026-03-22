# TaskMaster Pro - 数据库设计文档

## 1. 数据库设计概述

### 1.1 数据库选型
- **数据库**: MySQL 8.0
- **ORM框架**: Prisma 5.x
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci

### 1.2 命名规范
- 表名: snake_case，复数形式
- 字段名: snake_case
- 索引名: idx_<表名>_<列名>
- 外键名: fk_<表名>_<引用表名>

---

## 2. ER图描述

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   users     │       │ departments │       │   roles     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │───┐   │ id (PK)     │       │ id (PK)     │
│ username    │   │   │ name        │◄──────│ name        │
│ email       │   └──►│ parent_id   │       │ code        │
│ password    │       │ created_at  │       │ description │
│ phone       │       │ updated_at  │       │ created_at  │
│ status      │       └─────────────┘       └─────────────┘
│ created_at  │                                │
│ updated_at  │                                │
│ deleted_at  │       ┌─────────────┐         │
└──────┬──────┘       │ role_permissions │─────┘
       │              ├─────────────────┤
       │              │ id (PK)         │
       │              │ role_id (FK)    │
       │              │ permission_code │
       │              └─────────────────┘
       │                      │
       ▼                      │
┌─────────────┐              │
│ user_roles  │              │
├─────────────┤              │
│ id (PK)     │              │
│ user_id(FK) │──────────────┤
│ role_id(FK) │◄─────────────┘
│ created_at  │
└─────────────┘
       │
       ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   tasks     │       │  feedbacks   │       │  supervises │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │──────►│ id (PK)     │       │ id (PK)     │
│ task_no     │       │ task_id(FK) │       │ task_id(FK) │
│ title       │       │ user_id(FK) │       │ user_id(FK) │
│ description │       │ content     │       │ status      │
│ priority    │       │ progress    │       │ priority    │
│ status      │       │ attachments │       │ note        │
│ category    │       │ created_at  │       │ created_at  │
│ creator_id  │       └─────────────┘       │ updated_at  │
│ assignee_id │                                └─────────────┘
│ supervisor_ │
│ id         │
│ start_date │
│ end_date   │
│ feedback_  │              ┌─────────────┐
│ cycle      │
│ created_at │
│ updated_at │              │   logs      │
│ deleted_at │              ├─────────────┤
└─────────────┘              │ id (PK)     │
       │                     │ user_id(FK) │
       │                     │ action      │
       ▼                     │ target_type │
┌─────────────┐              │ target_id   │
│task_members │              │ details     │
├─────────────┤              │ ip_address  │
│ id (PK)     │              │ user_agent  │
│ task_id(FK) │              │ created_at  │
│ user_id(FK) │              └─────────────┘
│ role        │
│ created_at  │
└─────────────┘
```

---

## 3. 表结构定义

### 3.1 用户表 (users)

```sql
CREATE TABLE `users` (
  `id` CHAR(36) NOT NULL COMMENT '用户ID (UUID)',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `email` VARCHAR(100) NOT NULL COMMENT '邮箱',
  `phone` VARCHAR(20) NULL COMMENT '手机号',
  `password` VARCHAR(255) NOT NULL COMMENT '密码 (bcrypt加密)',
  `nickname` VARCHAR(100) NULL COMMENT '昵称',
  `avatar` VARCHAR(500) NULL COMMENT '头像URL',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常, 2-锁定',
  `department_id` CHAR(36) NULL COMMENT '部门ID',
  `last_login_at` DATETIME NULL COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(50) NULL COMMENT '最后登录IP',
  `login_attempts` TINYINT NOT NULL DEFAULT 0 COMMENT '连续登录失败次数',
  `locked_until` DATETIME NULL COMMENT '账户锁定截止时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME NULL COMMENT '删除时间 (软删除)',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  UNIQUE KEY `uk_phone` (`phone`),
  KEY `idx_department_id` (`department_id`),
  KEY `idx_status` (`status`),
  KEY `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
```

### 3.2 部门表 (departments)

```sql
CREATE TABLE `departments` (
  `id` CHAR(36) NOT NULL COMMENT '部门ID (UUID)',
  `name` VARCHAR(100) NOT NULL COMMENT '部门名称',
  `code` VARCHAR(50) NOT NULL COMMENT '部门编码',
  `parent_id` CHAR(36) NULL COMMENT '父部门ID',
  `leader_id` CHAR(36) NULL COMMENT '部门负责人ID',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `description` VARCHAR(500) NULL COMMENT '部门描述',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_departments_parent` FOREIGN KEY (`parent_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门表';
```

### 3.3 角色表 (roles)

```sql
CREATE TABLE `roles` (
  `id` CHAR(36) NOT NULL COMMENT '角色ID (UUID)',
  `name` VARCHAR(50) NOT NULL COMMENT '角色名称',
  `code` VARCHAR(50) NOT NULL COMMENT '角色代码',
  `description` VARCHAR(200) NULL COMMENT '角色描述',
  `type` TINYINT NOT NULL DEFAULT 1 COMMENT '类型: 1-系统角色, 2-自定义角色',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- 初始化数据
INSERT INTO `roles` (`id`, `name`, `code`, `description`, `type`, `status`) VALUES
('1', '系统管理员', 'admin', '系统最高权限', 1, 1),
('2', '部门主管', 'dept_manager', '管理部门事务', 1, 1),
('3', '项目经理', 'project_manager', '管理项目任务', 1, 1),
('4', '普通用户', 'user', '基本功能权限', 1, 1),
('5', '访客', 'guest', '只读权限', 1, 1);
```

### 3.4 角色权限表 (role_permissions)

```sql
CREATE TABLE `role_permissions` (
  `id` CHAR(36) NOT NULL COMMENT '主键ID (UUID)',
  `role_id` CHAR(36) NOT NULL COMMENT '角色ID',
  `permission_code` VARCHAR(100) NOT NULL COMMENT '权限代码',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`, `permission_code`),
  KEY `idx_permission_code` (`permission_code`),
  CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限表';

-- 权限代码说明
-- user:read, user:write
-- task:create, task:read, task:update, task:delete, task:assign
-- supervise:read, supervise:manage
-- report:view, report:export
-- system:config, system:log
```

### 3.5 用户角色表 (user_roles)

```sql
CREATE TABLE `user_roles` (
  `id` CHAR(36) NOT NULL COMMENT '主键ID (UUID)',
  `user_id` CHAR(36) NOT NULL COMMENT '用户ID',
  `role_id` CHAR(36) NOT NULL COMMENT '角色ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role_id` (`role_id`),
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色表';
```

### 3.6 任务表 (tasks)

```sql
CREATE TABLE `tasks` (
  `id` CHAR(36) NOT NULL COMMENT '任务ID (UUID)',
  `task_no` VARCHAR(30) NOT NULL COMMENT '任务编号',
  `title` VARCHAR(200) NOT NULL COMMENT '任务标题',
  `description` TEXT NULL COMMENT '任务描述',
  `priority` TINYINT NOT NULL DEFAULT 2 COMMENT '优先级: 1-紧急, 2-高, 3-中, 4-低',
  `status` VARCHAR(20) NOT NULL DEFAULT 'draft' COMMENT '状态: draft/pending/accepted/in_progress/pending_review/completed/cancelled',
  `category` VARCHAR(50) NULL COMMENT '任务分类',
  `tags` JSON NULL COMMENT '标签列表',
  `attachments` JSON NULL COMMENT '附件列表',
  `parent_id` CHAR(36) NULL COMMENT '父任务ID',
  `root_id` CHAR(36) NULL COMMENT '根任务ID',
  `level` INT NOT NULL DEFAULT 0 COMMENT '任务层级',
  
  `creator_id` CHAR(36) NOT NULL COMMENT '创建者ID',
  `assignee_id` CHAR(36) NULL COMMENT '当前执行人ID',
  `supervisor_id` CHAR(36) NULL COMMENT '督办人ID',
  
  `start_date` DATE NULL COMMENT '开始日期',
  `end_date` DATE NULL COMMENT '截止日期',
  `actual_end_date` DATE NULL COMMENT '实际完成日期',
  `estimated_hours` DECIMAL(10,2) NULL COMMENT '预计工时(小时)',
  `actual_hours` DECIMAL(10,2) NULL COMMENT '实际工时(小时)',
  
  `feedback_cycle` VARCHAR(20) NOT NULL DEFAULT 'none' COMMENT '反馈周期: daily/weekly/custom/none',
  `feedback_cycle_days` INT NULL COMMENT '自定义反馈周期(天)',
  `last_feedback_at` DATETIME NULL COMMENT '上次反馈时间',
  `next_feedback_at` DATETIME NULL COMMENT '下次反馈时间',
  
  `progress` TINYINT NOT NULL DEFAULT 0 COMMENT '完成进度 0-100',
  `completion_summary` TEXT NULL COMMENT '完成总结',
  
  `is_supervised` TINYINT NOT NULL DEFAULT 0 COMMENT '是否督办任务',
  `supervise_level` TINYINT NULL COMMENT '督办级别',
  
  `reject_reason` VARCHAR(500) NULL COMMENT '拒绝原因',
  `cancel_reason` VARCHAR(500) NULL COMMENT '取消原因',
  
  `version` INT NOT NULL DEFAULT 1 COMMENT '版本号 (乐观锁)',
  
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME NULL COMMENT '删除时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_task_no` (`task_no`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`),
  KEY `idx_creator_id` (`creator_id`),
  KEY `idx_assignee_id` (`assignee_id`),
  KEY `idx_supervisor_id` (`supervisor_id`),
  KEY `idx_category` (`category`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_end_date` (`end_date`),
  KEY `idx_is_supervised` (`is_supervised`),
  KEY `idx_deleted_at` (`deleted_at`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_tasks_creator` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_tasks_assignee` FOREIGN KEY (`assignee_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tasks_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tasks_parent` FOREIGN KEY (`parent_id`) REFERENCES `tasks` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务表';
```

### 3.7 任务成员表 (task_members)

```sql
CREATE TABLE `task_members` (
  `id` CHAR(36) NOT NULL COMMENT '主键ID (UUID)',
  `task_id` CHAR(36) NOT NULL COMMENT '任务ID',
  `user_id` CHAR(36) NOT NULL COMMENT '用户ID',
  `role` VARCHAR(20) NOT NULL DEFAULT 'member' COMMENT '角色: creator/assignee/supervisor/collaborator',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_task_user` (`task_id`, `user_id`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_task_members_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_task_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务成员表';
```

### 3.8 任务反馈表 (feedbacks)

```sql
CREATE TABLE `feedbacks` (
  `id` CHAR(36) NOT NULL COMMENT '反馈ID (UUID)',
  `task_id` CHAR(36) NOT NULL COMMENT '任务ID',
  `user_id` CHAR(36) NOT NULL COMMENT '反馈人ID',
  `content` TEXT NOT NULL COMMENT '反馈内容',
  `progress` TINYINT NOT NULL DEFAULT 0 COMMENT '当前进度 0-100',
  `attachments` JSON NULL COMMENT '附件列表',
  `parent_id` CHAR(36) NULL COMMENT '父反馈ID (回复)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME NULL COMMENT '删除时间',
  
  PRIMARY KEY (`id`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_feedbacks_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_feedbacks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务反馈表';
```

### 3.9 督办记录表 (supervises)

```sql
CREATE TABLE `supervises` (
  `id` CHAR(36) NOT NULL COMMENT '督办ID (UUID)',
  `task_id` CHAR(36) NOT NULL COMMENT '任务ID',
  `supervisor_id` CHAR(36) NOT NULL COMMENT '督办人ID',
  `status` VARCHAR(20) NOT NULL DEFAULT 'supervising' COMMENT '状态: supervising/warning/overdue/resolved/closed',
  `priority` TINYINT NULL COMMENT '督办优先级',
  `note` TEXT NULL COMMENT '督办备注',
  `action` VARCHAR(50) NULL COMMENT '处理动作',
  `action_reason` TEXT NULL COMMENT '处理原因',
  `action_at` DATETIME NULL COMMENT '处理时间',
  `resolved_at` DATETIME NULL COMMENT '解决时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_supervisor_id` (`supervisor_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_supervises_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_supervises_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='督办记录表';
```

### 3.10 操作日志表 (logs)

```sql
CREATE TABLE `logs` (
  `id` CHAR(36) NOT NULL COMMENT '日志ID (UUID)',
  `user_id` CHAR(36) NULL COMMENT '操作用户ID',
  `username` VARCHAR(50) NULL COMMENT '操作用户名',
  `action` VARCHAR(50) NOT NULL COMMENT '操作类型',
  `target_type` VARCHAR(50) NOT NULL COMMENT '操作对象类型',
  `target_id` CHAR(36) NULL COMMENT '操作对象ID',
  `target_name` VARCHAR(200) NULL COMMENT '操作对象名称',
  `details` JSON NULL COMMENT '操作详情',
  `old_value` JSON NULL COMMENT '修改前值',
  `new_value` JSON NULL COMMENT '修改后值',
  `ip_address` VARCHAR(50) NULL COMMENT 'IP地址',
  `user_agent` VARCHAR(500) NULL COMMENT 'User-Agent',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_target_type` (`target_type`),
  KEY `idx_target_id` (`target_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';
```

### 3.11 系统配置表 (system_configs)

```sql
CREATE TABLE `system_configs` (
  `id` CHAR(36) NOT NULL COMMENT '配置ID (UUID)',
  `key` VARCHAR(100) NOT NULL COMMENT '配置键',
  `value` TEXT NULL COMMENT '配置值',
  `type` VARCHAR(20) NOT NULL DEFAULT 'string' COMMENT '类型: string/number/boolean/json',
  `name` VARCHAR(100) NULL COMMENT '配置名称',
  `description` VARCHAR(500) NULL COMMENT '配置描述',
  `group` VARCHAR(50) NULL COMMENT '配置分组',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `editable` TINYINT NOT NULL DEFAULT 1 COMMENT '是否可编辑',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_key` (`key`),
  KEY `idx_group` (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 初始化配置
INSERT INTO `system_configs` (`id`, `key`, `value`, `type`, `name`, `group`, `sort_order`) VALUES
('1', 'task_no_prefix', 'TASK', 'string', '任务编号前缀', 'task', 1),
('2', 'default_feedback_cycle', 'weekly', 'string', '默认反馈周期', 'task', 2),
('3', 'feedback_reminder_time', '10:00', 'string', '反馈提醒时间', 'task', 3),
('4', 'overdue_warning_hours', '24', 'number', '超时预警提前时间(小时)', 'task', 4),
('5', 'password_min_length', '8', 'number', '密码最小长度', 'security', 1),
('6', 'password_require_uppercase', '1', 'boolean', '密码必须包含大写字母', 'security', 2),
('7', 'password_require_lowercase', '1', 'boolean', '密码必须包含小写字母', 'security', 3),
('8', 'password_require_number', '1', 'boolean', '密码必须包含数字', 'security', 4),
('9', 'login_max_attempts', '3', 'number', '登录最大失败次数', 'security', 5),
('10', 'login_lock_duration', '15', 'number', '登录锁定时长(分钟)', 'security', 6);
```

### 3.12 刷新令牌表 (refresh_tokens)

```sql
CREATE TABLE `refresh_tokens` (
  `id` CHAR(36) NOT NULL COMMENT '令牌ID (UUID)',
  `user_id` CHAR(36) NOT NULL COMMENT '用户ID',
  `token` VARCHAR(255) NOT NULL COMMENT '刷新令牌',
  `device_info` VARCHAR(500) NULL COMMENT '设备信息',
  `ip_address` VARCHAR(50) NULL COMMENT 'IP地址',
  `expires_at` DATETIME NOT NULL COMMENT '过期时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `revoked_at` DATETIME NULL COMMENT '撤销时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_token` (`token`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='刷新令牌表';
```

---

## 4. 索引设计

### 4.1 主键索引
所有表均使用 UUID 作为主键，PRIMARY KEY 索引。

### 4.2 唯一索引
| 表名 | 索引名 | 字段 | 说明 |
|------|--------|------|------|
| users | uk_username | username | 用户名唯一 |
| users | uk_email | email | 邮箱唯一 |
| users | uk_phone | phone | 手机号唯一 |
| departments | uk_code | code | 部门编码唯一 |
| roles | uk_code | code | 角色代码唯一 |
| tasks | uk_task_no | task_no | 任务编号唯一 |
| system_configs | uk_key | key | 配置键唯一 |

### 4.3 普通索引
| 表名 | 索引名 | 字段 | 说明 |
|------|--------|------|------|
| users | idx_department_id | department_id | 按部门查询 |
| users | idx_status | status | 按状态筛选 |
| users | idx_deleted_at | deleted_at | 软删除查询 |
| tasks | idx_status | status | 按状态筛选 |
| tasks | idx_priority | priority | 按优先级筛选 |
| tasks | idx_creator_id | creator_id | 创建者查询 |
| tasks | idx_assignee_id | assignee_id | 执行人查询 |
| tasks | idx_end_date | end_date | 截止日期查询 |
| tasks | idx_is_supervised | is_supervised | 督办任务筛选 |
| tasks | idx_created_at | created_at | 时间范围查询 |
| feedbacks | idx_task_id | task_id | 任务反馈查询 |
| feedbacks | idx_created_at | created_at | 时间查询 |
| logs | idx_created_at | created_at | 日志查询 |
| logs | idx_user_id | user_id | 用户操作查询 |

### 4.4 联合索引
| 表名 | 索引名 | 字段 | 说明 |
|------|--------|------|------|
| user_roles | uk_user_role | user_id, role_id | 用户角色唯一 |
| task_members | uk_task_user | task_id, user_id | 任务成员唯一 |
| role_permissions | uk_role_permission | role_id, permission_code | 角色权限唯一 |
| tasks | idx_assignee_status | assignee_id, status | 执行人任务状态查询 |
| tasks | idx_creator_status | creator_id, status | 创建人任务状态查询 |

---

## 5. 关系说明

### 5.1 ER关系图

```
                    1:N
┌─────────┐ ───────────────► ┌─────────────┐
│  users  │                  │   tasks     │
│ 用户表  │ ◄─────────────── │   任务表     │
└─────────┘      N:1         └─────────────┘
    │                │              │
    │ 1:N            │              │
    ▼                ▼              │
┌─────────┐     ┌──────────┐       │
│ logs    │     │ feedbacks│ 1:N   │
│ 日志表  │     │  反馈表   │◄──────┘
└─────────┘     └──────────┘
                            1:N
                        ┌──────────┐
                        │ supervises│
                        │  督办表   │
                        └──────────┘

┌─────────┐ 1:N ┌────────────┐ N:1 ┌─────────┐
│ roles   │────►│user_roles  │◄────│  users  │
│ 角色表  │     │ 用户角色表  │     │ 用户表  │
└─────────┘     └────────────┘     └─────────┘
     │
     │ 1:N
     ▼
┌────────────────────┐
│ role_permissions   │
│   角色权限表        │
└────────────────────┘

┌─────────────┐ 1:N ┌─────────────┐
│ departments │────►│   users     │
│   部门表    │     │   用户表     │
└─────────────┘     └─────────────┘
     │ 1:N (自关联)
     ▼
┌─────────────┐
│ departments │
│   部门表    │
└─────────────┘
```

### 5.2 关系详解

#### 5.2.1 用户-角色 (多对多)
- 一个用户可以拥有多个角色
- 一个角色可以分配给多个用户
- 通过 `user_roles` 中间表维护

#### 5.2.2 任务-用户 (多对多)
- 任务有多个角色: 创建者、执行人、督办人、协作者
- 用户可以参与多个任务
- 通过 `task_members` 表维护完整关系
- `tasks` 表直接存储 creator_id, assignee_id, supervisor_id

#### 5.2.3 任务-子任务 (自关联)
- 一个任务可以有多个子任务
- 子任务只能有一个父任务
- `parent_id` 指向父任务
- `root_id` 指向根任务（顶级任务）
- `level` 记录层级深度

#### 5.2.4 部门-用户 (一对多)
- 一个部门可以有多个用户
- 一个用户只能属于一个部门
- `users.department_id` 外键指向 `departments.id`

#### 5.2.5 部门-子部门 (自关联)
- 一个部门可以有多个子部门
- 子部门只能有一个父部门
- `parent_id` 指向父部门

---

## 6. Prisma Schema

```prisma
// server/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  username      String    @unique
  email         String    @unique
  phone         String?   @unique
  password      String
  nickname      String?
  avatar        String?
  status        Int       @default(1)
  departmentId  String?
  lastLoginAt   DateTime?
  lastLoginIp   String?
  loginAttempts Int       @default(0)
  lockedUntil   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  department    Department? @relation(fields: [departmentId], references: [id])
  roles         UserRole[]
  createdTasks  Task[]      @relation("TaskCreator")
  assignedTasks Task[]      @relation("TaskAssignee")
  supervisedTasks Task[]   @relation("TaskSupervisor")
  taskMembers   TaskMember[]
  feedbacks     Feedback[]
  superviseRecords Supervise[]
  refreshTokens RefreshToken[]
  logs          Log[]

  @@index([departmentId])
  @@index([status])
  @@index([deletedAt])
}

model Department {
  id          String   @id @default(uuid())
  name        String
  code        String   @unique
  parentId    String?
  leaderId    String?
  sortOrder   Int      @default(0)
  description String?
  status      Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  parent      Department?  @relation("DepartmentHierarchy", fields: [parentId], references: [id])
  children    Department[] @relation("DepartmentHierarchy")
  users       User[]
}

model Role {
  id          String   @id @default(uuid())
  name        String
  code        String   @unique
  description String?
  type        Int      @default(1)
  status      Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  permissions RolePermission[]
  userRoles   UserRole[]
}

model RolePermission {
  id              String   @id @default(uuid())
  roleId          String
  permissionCode  String
  createdAt       DateTime @default(now())

  role            Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionCode])
  @@index([permissionCode])
}

model UserRole {
  id        String   @id @default(uuid())
  userId    String
  roleId    String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@index([userId])
  @@index([roleId])
}

model Task {
  id              String    @id @default(uuid())
  taskNo          String    @unique
  title           String
  description     String?   @db.Text
  priority        Int       @default(2)
  status          String    @default("draft")
  category        String?
  tags            Json?
  attachments     Json?
  parentId        String?
  rootId          String?
  level           Int       @default(0)

  creatorId       String
  assigneeId      String?
  supervisorId    String?
  
  startDate       DateTime?
  endDate         DateTime?
  actualEndDate   DateTime?
  estimatedHours  Decimal?  @db.Decimal(10,2)
  actualHours     Decimal?  @db.Decimal(10,2)
  
  feedbackCycle   String    @default("none")
  feedbackCycleDays Int?
  lastFeedbackAt  DateTime?
  nextFeedbackAt  DateTime?
  
  progress        Int       @default(0)
  completionSummary String? @db.Text
  
  isSupervised    Boolean   @default(false)
  superviseLevel  Int?
  
  rejectReason    String?
  cancelReason    String?
  
  version         Int       @default(1)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  creator         User      @relation("TaskCreator", fields: [creatorId], references: [id])
  assignee        User?     @relation("TaskAssignee", fields: [assigneeId], references: [id])
  supervisor      User?     @relation("TaskSupervisor", fields: [supervisorId], references: [id])
  parent          Task?     @relation("TaskParent", fields: [parentId], references: [id])
  children        Task[]    @relation("TaskParent")
  members         TaskMember[]
  feedbacks       Feedback[]
  superviseRecord Supervise?

  @@index([status])
  @@index([priority])
  @@index([creatorId])
  @@index([assigneeId])
  @@index([supervisorId])
  @@index([category])
  @@index([parentId])
  @@index([endDate])
  @@index([isSupervised])
  @@index([deletedAt])
  @@index([createdAt])
}

model TaskMember {
  id        String   @id @default(uuid())
  taskId    String
  userId    String
  role      String   @default("member")
  createdAt DateTime @default(now())

  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([taskId, userId])
  @@index([taskId])
  @@index([userId])
}

model Feedback {
  id          String    @id @default(uuid())
  taskId      String
  userId      String
  content     String    @db.Text
  progress    Int       @default(0)
  attachments Json?
  parentId    String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  task        Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id])
  parent      Feedback? @relation("FeedbackParent", fields: [parentId], references: [id])
  replies     Feedback[] @relation("FeedbackParent")

  @@index([taskId])
  @@index([userId])
  @@index([parentId])
  @@index([createdAt])
}

model Supervise {
  id            String    @id @default(uuid())
  taskId        String    @unique
  supervisorId  String
  status        String    @default("supervising")
  priority      Int?
  note          String?   @db.Text
  action        String?
  actionReason  String?   @db.Text
  actionAt      DateTime?
  resolvedAt    DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  task          Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  supervisor    User      @relation(fields: [supervisorId], references: [id])

  @@index([supervisorId])
  @@index([status])
}

model Log {
  id          String   @id @default(uuid())
  userId      String?
  username    String?
  action      String
  targetType  String
  targetId    String?
  targetName  String?
  details     Json?
  oldValue    Json?
  newValue    Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  user        User?    @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([action])
  @@index([targetType])
  @@index([targetId])
  @@index([createdAt])
}

model SystemConfig {
  id          String   @id @default(uuid())
  key         String   @unique
  value       String?  @db.Text
  type        String   @default("string")
  name        String?
  description String?
  group       String?
  sortOrder   Int      @default(0)
  editable    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([group])
}

model RefreshToken {
  id        String    @id @default(uuid())
  userId    String
  token     String    @unique
  deviceInfo String?
  ipAddress String?
  expiresAt DateTime
  createdAt DateTime  @default(now())
  revokedAt DateTime?

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}
```

---

## 7. 数据库维护

### 7.1 备份策略
```bash
# 全量备份（每日凌晨3点）
mysqldump -u root -p --single-transaction --routines --triggers taskmaster > backup_$(date +%Y%m%d).sql

# 增量备份（每小时）
mysqldump -u root -p --single-transaction --routines --triggers --flush-logs taskmaster > incremental_$(date +%Y%m%d_%H).sql
```

### 7.2 数据清理
```sql
-- 清理30天前的操作日志
DELETE FROM logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 清理90天前的会话记录
DELETE FROM refresh_tokens WHERE expires_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- 清理已删除任务的关联数据（软删除后30天）
DELETE FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

### 7.3 性能优化
```sql
-- 定期分析表统计信息
ANALYZE TABLE users;
ANALYZE TABLE tasks;
ANALYZE TABLE feedbacks;

-- 定期优化表
OPTIMIZE TABLE users;
OPTIMIZE TABLE tasks;
OPTIMIZE TABLE feedbacks;
```
